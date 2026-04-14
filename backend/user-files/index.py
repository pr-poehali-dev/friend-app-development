"""
Хранилище файлов пользователя.
GET  /          — список файлов текущего пользователя
POST /delete    — удалить файл по id
POST /send-chat — разослать файл в выбранные чаты
POST /send-mail — разослать файл на email-адреса
"""
import json, os, smtplib, ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

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
        f"""SELECT u.id, u.display_name, u.email
           FROM {tbl('sessions')} s JOIN {tbl('users')} u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()""",
        (sid,)
    )
    return cur.fetchone()

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
        user_id, user_name, user_email = user

        # GET / — список файлов
        if method == "GET":
            cur.execute(
                f"""SELECT id, file_name, file_size, file_url, mime_type, created_at
                   FROM {tbl('user_files')}
                   WHERE user_id = %s
                   ORDER BY created_at DESC""",
                (user_id,)
            )
            rows = cur.fetchall()
            files = [{
                "id": r[0], "name": r[1], "size": r[2],
                "url": r[3], "mime": r[4],
                "date": r[5].strftime("%d.%m.%Y %H:%M"),
                "sender": user_name,
            } for r in rows]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"files": files})}

        if method == "POST":
            body = json.loads(event.get("body") or "{}")

            # POST /delete — удалить файл
            if "delete" in path:
                file_id = body.get("file_id")
                if not file_id:
                    return {"statusCode": 400, "headers": CORS,
                            "body": json.dumps({"error": "file_id required"})}
                cur.execute(
                    f"UPDATE {tbl('user_files')} SET file_url='' WHERE id=%s AND user_id=%s",
                    (file_id, user_id)
                )
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

            # POST /send-chat — разослать в чаты
            if "send-chat" in path:
                file_id  = body.get("file_id")
                chat_ids = body.get("chat_ids", [])
                if not file_id or not chat_ids:
                    return {"statusCode": 400, "headers": CORS,
                            "body": json.dumps({"error": "file_id and chat_ids required"})}

                cur.execute(
                    f"SELECT file_name, file_size, file_url FROM {tbl('user_files')} WHERE id=%s AND user_id=%s",
                    (file_id, user_id)
                )
                row = cur.fetchone()
                if not row:
                    return {"statusCode": 404, "headers": CORS,
                            "body": json.dumps({"error": "file not found"})}
                file_name, file_size, file_url = row

                sent = 0
                for cid in chat_ids:
                    cur.execute(
                        f"SELECT 1 FROM {tbl('chat_members')} WHERE chat_id=%s AND user_id=%s",
                        (cid, user_id)
                    )
                    if not cur.fetchone():
                        continue
                    cur.execute(
                        f"""INSERT INTO {tbl('messages')}
                               (chat_id, sender_id, text, msg_type, file_name, file_size, file_url)
                            VALUES (%s,%s,'','file',%s,%s,%s)""",
                        (cid, user_id, file_name, file_size, file_url)
                    )
                    sent += 1
                conn.commit()
                return {"statusCode": 200, "headers": CORS,
                        "body": json.dumps({"sent": sent})}

            # POST /send-mail — разослать по email
            if "send-mail" in path:
                file_id = body.get("file_id")
                emails  = body.get("emails", [])
                message = body.get("message", "")
                if not file_id or not emails:
                    return {"statusCode": 400, "headers": CORS,
                            "body": json.dumps({"error": "file_id and emails required"})}

                cur.execute(
                    f"SELECT file_name, file_url FROM {tbl('user_files')} WHERE id=%s AND user_id=%s",
                    (file_id, user_id)
                )
                row = cur.fetchone()
                if not row:
                    return {"statusCode": 404, "headers": CORS,
                            "body": json.dumps({"error": "file not found"})}
                file_name, file_url = row

                smtp_host = os.environ.get("SMTP_HOST", "smtp.yandex.ru")
                smtp_port = int(os.environ.get("SMTP_PORT", 465))
                smtp_user = os.environ["SMTP_USER"]
                smtp_pass = os.environ["SMTP_PASSWORD"]

                sent = 0
                ctx = ssl.create_default_context()
                with smtplib.SMTP_SSL(smtp_host, smtp_port, context=ctx) as srv:
                    srv.login(smtp_user, smtp_pass)
                    for to_email in emails:
                        to_email = to_email.strip()
                        if not to_email:
                            continue
                        msg = MIMEMultipart("alternative")
                        msg["Subject"] = f"Файл от {user_name}: {file_name}"
                        msg["From"]    = smtp_user
                        msg["To"]      = to_email
                        body_text = f"{message}\n\nСкачать файл: {file_url}" if message else f"Вам отправлен файл: {file_name}\n\nСкачать: {file_url}"
                        body_html = f"""<div style="font-family:sans-serif;max-width:520px">
<p>{message or f'Вам отправлен файл <b>{file_name}</b>'}</p>
<p><a href="{file_url}" style="background:#3b82f6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">Скачать файл</a></p>
<p style="color:#888;font-size:12px">Отправитель: {user_name}</p>
</div>"""
                        msg.attach(MIMEText(body_text, "plain"))
                        msg.attach(MIMEText(body_html, "html"))
                        srv.sendmail(smtp_user, to_email, msg.as_string())
                        sent += 1

                return {"statusCode": 200, "headers": CORS,
                        "body": json.dumps({"sent": sent})}

    finally:
        conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}
