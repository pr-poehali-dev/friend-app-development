"""
API чатов мессенджера Друг.
GET / — список чатов текущего пользователя
POST / — создать личный чат с пользователем
GET /contacts — список всех пользователей
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
        """SELECT u.id, u.username, u.display_name, u.avatar_initials
           FROM sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()""",
        (session_id,)
    )
    return cur.fetchone()


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

        user_id = user[0]

        # GET /contacts
        if method == "GET" and "contacts" in path:
            cur.execute(
                """SELECT id, username, display_name, position, department, phone, avatar_initials, online
                   FROM users WHERE id != %s ORDER BY display_name""",
                (user_id,)
            )
            rows = cur.fetchall()
            contacts = [
                {"id": r[0], "username": r[1], "display_name": r[2], "position": r[3],
                 "department": r[4], "phone": r[5], "avatar_initials": r[6], "online": r[7]}
                for r in rows
            ]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"contacts": contacts})}

        # GET / — список чатов
        if method == "GET":
            cur.execute(
                """SELECT c.id, c.type, c.name,
                          m.text, m.created_at, m.sender_id,
                          sender.display_name as sender_name
                   FROM chats c
                   JOIN chat_members cm ON cm.chat_id = c.id AND cm.user_id = %s
                   LEFT JOIN LATERAL (
                     SELECT text, created_at, sender_id FROM messages
                     WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1
                   ) m ON true
                   LEFT JOIN users sender ON sender.id = m.sender_id
                   ORDER BY COALESCE(m.created_at, c.created_at) DESC""",
                (user_id,)
            )
            chat_rows = cur.fetchall()

            chats = []
            for row in chat_rows:
                chat_id, chat_type, chat_name = row[0], row[1], row[2]
                last_text, last_time, last_sender_id, last_sender_name = row[3], row[4], row[5], row[6]

                # Для личных чатов — имя собеседника
                display_name = chat_name
                avatar = None
                other_online = False
                if chat_type == "personal":
                    cur.execute(
                        """SELECT u.display_name, u.avatar_initials, u.online
                           FROM chat_members cm JOIN users u ON u.id = cm.user_id
                           WHERE cm.chat_id = %s AND cm.user_id != %s LIMIT 1""",
                        (chat_id, user_id)
                    )
                    other = cur.fetchone()
                    if other:
                        display_name = other[0]
                        avatar = other[1]
                        other_online = other[2]
                else:
                    # Для группового — первые буквы слов названия
                    words = (chat_name or "ГЧ").split()
                    avatar = "".join(w[0].upper() for w in words[:2])

                # Кол-во непрочитанных (упрощённо — 0 для своих)
                chats.append({
                    "id": chat_id,
                    "type": chat_type,
                    "name": display_name,
                    "avatar": avatar or "??",
                    "online": other_online,
                    "last_message": last_text or "",
                    "last_time": last_time.strftime("%H:%M") if last_time else "",
                    "unread": 0,
                })

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"chats": chats})}

        # POST / — создать или найти личный чат
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            other_user_id = body.get("user_id")
            if not other_user_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id required"})}

            # Найти существующий личный чат между двумя пользователями
            cur.execute(
                """SELECT c.id FROM chats c
                   JOIN chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = %s
                   JOIN chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = %s
                   WHERE c.type = 'personal' LIMIT 1""",
                (user_id, other_user_id)
            )
            existing = cur.fetchone()
            if existing:
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"chat_id": existing[0]})}

            cur.execute("INSERT INTO chats (type) VALUES ('personal') RETURNING id")
            chat_id = cur.fetchone()[0]
            cur.execute("INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s), (%s, %s)",
                        (chat_id, user_id, chat_id, other_user_id))
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"chat_id": chat_id})}

    finally:
        conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "not_found"})}
