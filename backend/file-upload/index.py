"""
Загрузка файлов — чанковая загрузка через base64.
POST /init    — инициализировать загрузку, получить upload_id
POST /chunk   — загрузить чанк (upload_id, chunk_index, data_b64, total_chunks)
POST /finish  — завершить загрузку, собрать файл и сохранить в S3
POST /store   — маленький файл (<= 512КБ) — быстрая загрузка в хранилище
POST /upload  — маленький файл <= 512КБ — быстрая загрузка в чат
"""
import json, os, uuid, mimetypes, base64
import boto3
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")
CHUNK_LIMIT = 700_000   # ~512KB base64 на чанк — безопасно для платформы

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def tbl(t):
    return f"{SCHEMA}.{t}"

def get_user(cur, sid):
    if not sid:
        return None
    cur.execute(
        f"""SELECT u.id, u.display_name, u.avatar_initials
           FROM {tbl('sessions')} s JOIN {tbl('users')} u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()""",
        (sid,)
    )
    return cur.fetchone()

def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

def fmt_size(n):
    if n < 1024: return f"{n} Б"
    if n < 1048576: return f"{n/1024:.1f} КБ"
    return f"{n/1048576:.1f} МБ"

def upload_bytes_to_s3(file_bytes, file_name, folder):
    ext  = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "bin"
    mime = mimetypes.guess_type(file_name)[0] or "application/octet-stream"
    key  = f"{folder}/{uuid.uuid4().hex}.{ext}"
    get_s3().put_object(Bucket="files", Key=key, Body=file_bytes, ContentType=mime)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return cdn_url, mime

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path   = event.get("path", "/")
    hdrs   = event.get("headers") or {}
    sid    = hdrs.get("x-session-id") or hdrs.get("X-Session-Id")

    conn = get_conn()
    try:
        cur = conn.cursor()
        user = get_user(cur, sid)
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}
        user_id, user_name, user_avatar = user

        if method != "POST":
            return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}

        raw_body = event.get("body") or "{}"
        # Платформа может передать base64-encoded body
        if event.get("isBase64Encoded"):
            raw_body = base64.b64decode(raw_body).decode("utf-8")
        body = json.loads(raw_body)

        # ── /init — начать чанковую загрузку ──────────────────────
        if "init" in path:
            file_name   = body.get("file_name", "file")
            file_size   = int(body.get("file_size", 0))
            context_key = body.get("context_key", "")  # "chat:{id}" или "store"

            upload_id = uuid.uuid4().hex
            # Сохраняем метаданные в БД
            cur.execute(
                f"""INSERT INTO {tbl('upload_sessions')}
                       (upload_id, user_id, file_name, file_size, context_key, chunks_received, total_chunks)
                    VALUES (%s,%s,%s,%s,%s,0,0) RETURNING upload_id""",
                (upload_id, user_id, file_name, file_size, context_key)
            )
            conn.commit()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"upload_id": upload_id})}

        # ── /chunk — принять чанк ─────────────────────────────────
        if "chunk" in path:
            upload_id   = body.get("upload_id")
            chunk_index = int(body.get("chunk_index", 0))
            total_chunks= int(body.get("total_chunks", 1))
            data_b64    = body.get("data", "")

            if not upload_id or not data_b64:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "upload_id and data required"})}

            # Проверить сессию загрузки
            cur.execute(
                f"SELECT id, file_name, context_key FROM {tbl('upload_sessions')} WHERE upload_id=%s AND user_id=%s",
                (upload_id, user_id)
            )
            sess = cur.fetchone()
            if not sess:
                return {"statusCode": 404, "headers": CORS,
                        "body": json.dumps({"error": "upload session not found"})}

            # Сохранить чанк в S3
            chunk_bytes = base64.b64decode(data_b64)
            chunk_key   = f"chunks/{upload_id}/{chunk_index:05d}"
            get_s3().put_object(Bucket="files", Key=chunk_key, Body=chunk_bytes)

            # Обновить счётчик
            cur.execute(
                f"""UPDATE {tbl('upload_sessions')}
                    SET chunks_received = chunks_received + 1, total_chunks = %s
                    WHERE upload_id = %s""",
                (total_chunks, upload_id)
            )
            conn.commit()
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"ok": True, "chunk": chunk_index})}

        # ── /finish — собрать чанки и сохранить ───────────────────
        if "finish" in path:
            upload_id = body.get("upload_id")
            if not upload_id:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "upload_id required"})}

            cur.execute(
                f"""SELECT sess_id, file_name, file_size, context_key, total_chunks
                   FROM {tbl('upload_sessions')} WHERE upload_id=%s AND user_id=%s""",
                (upload_id, user_id)
            )
            sess = cur.fetchone()
            if not sess:
                return {"statusCode": 404, "headers": CORS,
                        "body": json.dumps({"error": "upload session not found"})}
            _, file_name, file_size, context_key, total_chunks = sess

            # Собрать все чанки из S3
            s3 = get_s3()
            all_bytes = b""
            for i in range(total_chunks):
                chunk_key = f"chunks/{upload_id}/{i:05d}"
                resp = s3.get_object(Bucket="files", Key=chunk_key)
                all_bytes += resp["Body"].read()
                # Удалить чанк после использования
                s3.delete_object(Bucket="files", Key=chunk_key)

            # Загрузить итоговый файл
            if context_key.startswith("chat:"):
                chat_id = context_key.split(":")[1]
                cdn_url, _ = upload_bytes_to_s3(all_bytes, file_name, f"chat_files/{chat_id}")
                size_str   = fmt_size(len(all_bytes))
                cur.execute(
                    f"""INSERT INTO {tbl('messages')}
                           (chat_id, sender_id, text, msg_type, file_name, file_size, file_url)
                        VALUES (%s,%s,'','file',%s,%s,%s) RETURNING id, created_at""",
                    (chat_id, user_id, file_name, size_str, cdn_url)
                )
                row = cur.fetchone()
                # Удалить сессию
                cur.execute(f"UPDATE {tbl('upload_sessions')} SET done=true WHERE upload_id=%s", (upload_id,))
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"message": {
                    "id": row[0], "text": "", "type": "file",
                    "file_name": file_name, "file_size": size_str, "file_url": cdn_url,
                    "time": row[1].strftime("%H:%M"),
                    "sender_id": user_id, "sender_name": user_name,
                    "sender_avatar": user_avatar, "own": True,
                }})}
            else:  # store
                cdn_url, mime = upload_bytes_to_s3(all_bytes, file_name, f"user_files/{user_id}")
                size_str = fmt_size(len(all_bytes))
                cur.execute(
                    f"""INSERT INTO {tbl('user_files')}
                           (user_id, file_name, file_size, file_url, mime_type)
                        VALUES (%s,%s,%s,%s,%s) RETURNING id, created_at""",
                    (user_id, file_name, size_str, cdn_url, mime)
                )
                row = cur.fetchone()
                cur.execute(f"UPDATE {tbl('upload_sessions')} SET done=true WHERE upload_id=%s", (upload_id,))
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"file": {
                    "id": row[0], "name": file_name, "size": size_str,
                    "url": cdn_url, "mime": mime,
                    "date": row[1].strftime("%d.%m.%Y"),
                    "sender": user_name,
                }})}

        # ── /upload — быстрая загрузка файла в чат (до 500КБ) ─────
        if "upload" in path:
            chat_id       = body.get("chat_id")
            file_name     = body.get("file_name", "file")
            file_data_b64 = body.get("file_data", "")

            if not chat_id or not file_data_b64:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "chat_id and file_data required"})}

            file_bytes = base64.b64decode(file_data_b64)
            cur.execute(f"SELECT 1 FROM {tbl('chat_members')} WHERE chat_id=%s AND user_id=%s",
                        (chat_id, user_id))
            if not cur.fetchone():
                return {"statusCode": 403, "headers": CORS,
                        "body": json.dumps({"error": "forbidden"})}

            cdn_url, _ = upload_bytes_to_s3(file_bytes, file_name, f"chat_files/{chat_id}")
            size_str = fmt_size(len(file_bytes))
            cur.execute(
                f"""INSERT INTO {tbl('messages')}
                       (chat_id, sender_id, text, msg_type, file_name, file_size, file_url)
                    VALUES (%s,%s,'','file',%s,%s,%s) RETURNING id, created_at""",
                (chat_id, user_id, file_name, size_str, cdn_url)
            )
            row = cur.fetchone()
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"message": {
                "id": row[0], "text": "", "type": "file",
                "file_name": file_name, "file_size": size_str, "file_url": cdn_url,
                "time": row[1].strftime("%H:%M"),
                "sender_id": user_id, "sender_name": user_name,
                "sender_avatar": user_avatar, "own": True,
            }})}

        # ── /store — быстрая загрузка файла в хранилище (до 500КБ) ─
        if "store" in path:
            file_name     = body.get("file_name", "file")
            file_data_b64 = body.get("file_data", "")

            if not file_data_b64:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "file_data required"})}

            file_bytes = base64.b64decode(file_data_b64)
            cdn_url, mime = upload_bytes_to_s3(file_bytes, file_name, f"user_files/{user_id}")
            size_str = fmt_size(len(file_bytes))
            cur.execute(
                f"""INSERT INTO {tbl('user_files')}
                       (user_id, file_name, file_size, file_url, mime_type)
                    VALUES (%s,%s,%s,%s,%s) RETURNING id, created_at""",
                (user_id, file_name, size_str, cdn_url, mime)
            )
            row = cur.fetchone()
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"file": {
                "id": row[0], "name": file_name, "size": size_str,
                "url": cdn_url, "mime": mime,
                "date": row[1].strftime("%d.%m.%Y"),
                "sender": user_name,
            }})}

    finally:
        conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}
