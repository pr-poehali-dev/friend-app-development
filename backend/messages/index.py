"""
API сообщений мессенджера Друг.
GET /?chat_id=X - сообщения чата
POST / - отправить сообщение
"""
import json
import os
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_by_session(cur, session_id):
    if not session_id:
        return None
    cur.execute(
        """SELECT u.id, u.display_name, u.avatar_initials
           FROM sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()""",
        (session_id,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
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

            # Проверить что пользователь член чата
            cur.execute(
                "SELECT 1 FROM chat_members WHERE chat_id = %s AND user_id = %s",
                (chat_id, user_id)
            )
            if not cur.fetchone():
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}

            cur.execute(
                """SELECT m.id, m.text, m.msg_type, m.file_name, m.file_size,
                          m.created_at, m.sender_id,
                          u.display_name, u.avatar_initials
                   FROM messages m JOIN users u ON u.id = m.sender_id
                   WHERE m.chat_id = %s
                   ORDER BY m.created_at ASC
                   LIMIT 100""",
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
                    "time": r[5].strftime("%H:%M"),
                    "sender_id": r[6],
                    "sender_name": r[7],
                    "sender_avatar": r[8],
                    "own": r[6] == user_id,
                }
                for r in rows
            ]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"messages": messages})}

        # POST — отправить сообщение
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            chat_id = body.get("chat_id")
            text = (body.get("text") or "").strip()

            if not chat_id or not text:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id and text required"})}

            # Проверить членство
            cur.execute(
                "SELECT 1 FROM chat_members WHERE chat_id = %s AND user_id = %s",
                (chat_id, user_id)
            )
            if not cur.fetchone():
                return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}

            cur.execute(
                """INSERT INTO messages (chat_id, sender_id, text, msg_type)
                   VALUES (%s, %s, %s, 'text') RETURNING id, created_at""",
                (chat_id, user_id, text)
            )
            row = cur.fetchone()
            conn.commit()

            message = {
                "id": row[0],
                "text": text,
                "type": "text",
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