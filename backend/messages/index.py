"""
API сообщений мессенджера Друг.
GET  /?chat_id=X  — сообщения чата
POST /            — отправить текстовое сообщение
POST /upload      — загрузить файл в чат (base64)
"""
import json
import os
import base64
import mimetypes
import uuid
import boto3
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def t(table):
    return f"{SCHEMA}.{table}"


def get_user_by_session(cur, session_id):
    if not session_id:
        return None
    cur.execute(
        f"""SELECT u.id, u.display_name, u.avatar_initials
           FROM {t('sessions')} s JOIN {t('users')} u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()""",
        (session_id,)
    )
    return cur.fetchone()


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

        # GET — получить сообщения
        if method == "GET":
            params = event.get("queryStringParameters") or {}
            chat_id = params.get("chat_id")
            if not chat_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id required"})}

            cur.execute(
                f"SELECT 1 FROM {t('chat_members')} WHERE chat_id = %s AND user_id = %s",
                (chat_id, user_id)
            )
            if not cur.fetchone():
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}

            cur.execute(
                f"""SELECT m.id, m.text, m.msg_type, m.file_name, m.file_size, m.file_url,
                          m.created_at, m.sender_id,
                          u.display_name, u.avatar_initials
                   FROM {t('messages')} m JOIN {t('users')} u ON u.id = m.sender_id
                   WHERE m.chat_id = %s
                   ORDER BY m.created_at ASC
                   LIMIT 200""",
                (chat_id,)
            )
            rows = cur.fetchall()
            messages = [
                {
                    "id": r[0],
                    "text": r[1],
                    "type": r[2],
                    "file_name": r[3],
                    "file_size": r[4],
                    "file_url": r[5],
                    "time": r[6].strftime("%H:%M"),
                    "sender_id": r[7],
                    "sender_name": r[8],
                    "sender_avatar": r[9],
                    "own": r[7] == user_id,
                }
                for r in rows
            ]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"messages": messages})}

        if method == "POST":
            # POST /upload — отправить файл
            if "upload" in path:
                body = json.loads(event.get("body") or "{}")
                chat_id = body.get("chat_id")
                file_name = body.get("file_name", "file")
                file_data_b64 = body.get("file_data", "")

                if not chat_id or not file_data_b64:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id and file_data required"})}

                cur.execute(
                    f"SELECT 1 FROM {t('chat_members')} WHERE chat_id = %s AND user_id = %s",
                    (chat_id, user_id)
                )
                if not cur.fetchone():
                    return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}

                file_bytes = base64.b64decode(file_data_b64)
                size_str = fmt_size(len(file_bytes))
                ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "bin"
                mime = mimetypes.guess_type(file_name)[0] or "application/octet-stream"
                key = f"chat_files/{chat_id}/{uuid.uuid4().hex}.{ext}"

                s3 = boto3.client(
                    "s3",
                    endpoint_url="https://bucket.poehali.dev",
                    aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                    aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
                )
                s3.put_object(Bucket="files", Key=key, Body=file_bytes, ContentType=mime)
                file_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

                cur.execute(
                    f"""INSERT INTO {t('messages')} (chat_id, sender_id, text, msg_type, file_name, file_size, file_url)
                       VALUES (%s, %s, %s, 'file', %s, %s, %s) RETURNING id, created_at""",
                    (chat_id, user_id, "", file_name, size_str, file_url)
                )
                row = cur.fetchone()
                conn.commit()

                message = {
                    "id": row[0],
                    "text": "",
                    "type": "file",
                    "file_name": file_name,
                    "file_size": size_str,
                    "file_url": file_url,
                    "time": row[1].strftime("%H:%M"),
                    "sender_id": user_id,
                    "sender_name": user_name,
                    "sender_avatar": user_avatar,
                    "own": True,
                }
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"message": message})}

            # POST / — текстовое сообщение
            body = json.loads(event.get("body") or "{}")
            chat_id = body.get("chat_id")
            text = (body.get("text") or "").strip()

            if not chat_id or not text:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id and text required"})}

            cur.execute(
                f"SELECT 1 FROM {t('chat_members')} WHERE chat_id = %s AND user_id = %s",
                (chat_id, user_id)
            )
            if not cur.fetchone():
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}

            cur.execute(
                f"""INSERT INTO {t('messages')} (chat_id, sender_id, text, msg_type)
                   VALUES (%s, %s, %s, 'text') RETURNING id, created_at""",
                (chat_id, user_id, text)
            )
            row = cur.fetchone()
            conn.commit()

            message = {
                "id": row[0],
                "text": text,
                "type": "text",
                "file_name": None,
                "file_size": None,
                "file_url": None,
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
