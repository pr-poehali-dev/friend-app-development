"""
Загрузка файлов в чат через S3 presigned URL.
POST /presign  — получить presigned URL для прямой загрузки в S3
POST /confirm  — подтвердить загрузку и сохранить сообщение в БД
"""
import json
import os
import uuid
import mimetypes
import boto3
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
MAX_SIZE_BYTES = 50 * 1024 * 1024  # 50 МБ

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def tbl(table):
    return f"{SCHEMA}.{table}"


def get_user_by_session(cur, session_id):
    if not session_id:
        return None
    cur.execute(
        f"""SELECT u.id, u.display_name, u.avatar_initials
           FROM {tbl('sessions')} s JOIN {tbl('users')} u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()""",
        (session_id,)
    )
    return cur.fetchone()


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def fmt_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} Б"
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} КБ"
    return f"{size_bytes / 1024 / 1024:.1f} МБ"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    headers = event.get("headers") or {}
    session_id = headers.get("x-session-id") or headers.get("X-Session-Id")

    conn = get_conn()
    try:
        cur = conn.cursor()
        user = get_user_by_session(cur, session_id)
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}

        user_id, user_name, user_avatar = user[0], user[1], user[2]

        # POST /presign — выдать presigned URL для PUT в S3
        if method == "POST" and "presign" in path:
            body = json.loads(event.get("body") or "{}")
            chat_id = body.get("chat_id")
            file_name = body.get("file_name", "file")
            file_size = int(body.get("file_size", 0))
            file_type = body.get("file_type", "application/octet-stream")

            if not chat_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id required"})}

            if file_size > MAX_SIZE_BYTES:
                return {"statusCode": 413, "headers": CORS, "body": json.dumps({"error": "Файл слишком большой. Максимум 50 МБ."})}

            cur.execute(
                f"SELECT 1 FROM {tbl('chat_members')} WHERE chat_id = %s AND user_id = %s",
                (chat_id, user_id)
            )
            if not cur.fetchone():
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}

            ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "bin"
            mime = mimetypes.guess_type(file_name)[0] or file_type or "application/octet-stream"
            file_key = f"chat_files/{chat_id}/{uuid.uuid4().hex}.{ext}"

            s3 = get_s3()
            presigned_url = s3.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": "files",
                    "Key": file_key,
                    "ContentType": mime,
                },
                ExpiresIn=300,
            )
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"

            return {
                "statusCode": 200,
                "headers": CORS,
                "body": json.dumps({
                    "upload_url": presigned_url,
                    "cdn_url": cdn_url,
                    "file_key": file_key,
                    "mime": mime,
                }),
            }

        # POST /confirm — записать сообщение о загруженном файле
        if method == "POST" and "confirm" in path:
            body = json.loads(event.get("body") or "{}")
            chat_id = body.get("chat_id")
            file_name = body.get("file_name", "file")
            file_size = int(body.get("file_size", 0))
            cdn_url = body.get("cdn_url")

            if not chat_id or not cdn_url:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id and cdn_url required"})}

            cur.execute(
                f"SELECT 1 FROM {tbl('chat_members')} WHERE chat_id = %s AND user_id = %s",
                (chat_id, user_id)
            )
            if not cur.fetchone():
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}

            size_str = fmt_size(file_size)

            cur.execute(
                f"""INSERT INTO {tbl('messages')} (chat_id, sender_id, text, msg_type, file_name, file_size, file_url)
                   VALUES (%s, %s, '', 'file', %s, %s, %s) RETURNING id, created_at""",
                (chat_id, user_id, file_name, size_str, cdn_url)
            )
            row = cur.fetchone()
            conn.commit()

            message = {
                "id": row[0],
                "text": "",
                "type": "file",
                "file_name": file_name,
                "file_size": size_str,
                "file_url": cdn_url,
                "time": row[1].strftime("%H:%M"),
                "sender_id": user_id,
                "sender_name": user_name,
                "sender_avatar": user_avatar,
                "own": True,
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"message": message})}

    finally:
        conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}
