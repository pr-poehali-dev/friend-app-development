"""
Авторизация пользователей мессенджера.
GET  /         — проверка сессии
POST /         — вход по username + password
POST /register — регистрация нового пользователя (с инвайт-кодом или без)
"""
import json
import os
import secrets
import psycopg2
from datetime import datetime, timezone

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def t(table):
    return f"{SCHEMA}.{table}"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def make_initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return name[:2].upper() if name else "??"


def create_session(cur, user_id: int) -> str:
    token = secrets.token_hex(32)
    cur.execute(
        f"INSERT INTO {t('sessions')} (user_id, token, expires_at) VALUES (%s, %s, NOW() + INTERVAL '30 days')",
        (user_id, token)
    )
    cur.execute(f"UPDATE {t('users')} SET online = true, last_seen = NOW() WHERE id = %s", (user_id,))
    return token


def handler(event: dict, context) -> dict:
    """Авторизация: вход, регистрация через инвайт, проверка сессии."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    headers = event.get("headers") or {}
    session_id = headers.get("x-session-id") or headers.get("X-Session-Id")

    # GET / — проверка сессии
    if method == "GET":
        if not session_id:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "no_session"})}
        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                f"""SELECT u.id, u.username, u.display_name, u.position, u.department,
                          u.phone, u.avatar_initials, u.online, u.role
                   FROM {t('sessions')} s
                   JOIN {t('users')} u ON u.id = s.user_id
                   WHERE s.token = %s AND s.expires_at > NOW()""",
                (session_id,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_session"})}
            user = {
                "id": row[0], "username": row[1], "display_name": row[2],
                "position": row[3], "department": row[4], "phone": row[5],
                "avatar_initials": row[6], "online": row[7], "role": row[8]
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}
        finally:
            conn.close()

    if method == "POST":
        body = json.loads(event.get("body") or "{}")

        # POST /register — регистрация нового пользователя
        if "register" in path:
            display_name = (body.get("display_name") or "").strip()
            username = (body.get("username") or "").strip().lower()
            password = (body.get("password") or "").strip()
            invite_code = (body.get("invite_code") or "").strip()

            if not display_name or not username or not password:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "Заполните имя, логин и пароль"})}
            if len(username) < 3:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "Логин минимум 3 символа"})}
            if len(password) < 4:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "Пароль минимум 4 символа"})}

            conn = get_conn()
            try:
                cur = conn.cursor()

                # Проверить уникальность username
                cur.execute(f"SELECT id FROM {t('users')} WHERE username = %s", (username,))
                if cur.fetchone():
                    return {"statusCode": 409, "headers": CORS,
                            "body": json.dumps({"error": "Логин уже занят, выберите другой"})}

                # Проверить инвайт (если передан)
                invite_creator_id = None
                if invite_code:
                    cur.execute(
                        f"""SELECT id, created_by FROM {t('invites')}
                           WHERE code = %s
                             AND (expires_at IS NULL OR expires_at > NOW())
                             AND (max_uses IS NULL OR used_count < max_uses)""",
                        (invite_code,)
                    )
                    inv = cur.fetchone()
                    if not inv:
                        return {"statusCode": 400, "headers": CORS,
                                "body": json.dumps({"error": "Инвайт-код недействителен или истёк"})}
                    invite_id, invite_creator_id = inv

                # Создать пользователя
                initials = make_initials(display_name)
                cur.execute(
                    f"""INSERT INTO {t('users')}
                           (username, display_name, password_hash, avatar_initials, role)
                        VALUES (%s, %s, %s, %s, 'user') RETURNING id""",
                    (username, display_name, password, initials)
                )
                new_user_id = cur.fetchone()[0]

                # Обновить счётчик инвайта
                if invite_code and invite_creator_id:
                    cur.execute(
                        f"UPDATE {t('invites')} SET used_count = used_count + 1 WHERE code = %s",
                        (invite_code,)
                    )

                # Добавить нового пользователя в контакты ВСЕМ существующим и наоборот
                cur.execute(f"SELECT id FROM {t('users')} WHERE id != %s", (new_user_id,))
                existing_ids = [r[0] for r in cur.fetchall()]
                for existing_id in existing_ids:
                    # новый видит существующего
                    cur.execute(
                        f"""INSERT INTO {t('external_contacts')}
                               (owner_id, display_name, avatar_initials, source, linked_user_id)
                            SELECT %s, display_name, avatar_initials, 'system', id
                            FROM {t('users')} WHERE id = %s
                            ON CONFLICT DO NOTHING""",
                        (new_user_id, existing_id)
                    )
                    # существующий видит нового
                    cur.execute(
                        f"""INSERT INTO {t('external_contacts')}
                               (owner_id, display_name, avatar_initials, source, linked_user_id)
                            SELECT %s, display_name, avatar_initials, 'system', id
                            FROM {t('users')} WHERE id = %s
                            ON CONFLICT DO NOTHING""",
                        (existing_id, new_user_id)
                    )

                # Создать сессию
                token = create_session(cur, new_user_id)
                conn.commit()

                user_data = {
                    "id": new_user_id, "username": username, "display_name": display_name,
                    "avatar_initials": initials, "online": True, "role": "user"
                }
                return {"statusCode": 200, "headers": CORS,
                        "body": json.dumps({"token": token, "user": user_data, "registered": True})}
            finally:
                conn.close()

        # POST / — вход
        username = body.get("username", "").strip().lower()
        password = body.get("password", "")

        if not username or not password:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "missing_fields"})}

        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                f"""SELECT id, display_name, password_hash, position, department,
                          phone, avatar_initials, role
                   FROM {t('users')} WHERE username = %s""",
                (username,)
            )
            row = cur.fetchone()
            if not row or row[2] != password:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_credentials"})}

            user_id = row[0]
            token = create_session(cur, user_id)
            conn.commit()

            user = {
                "id": user_id, "username": username, "display_name": row[1],
                "position": row[3], "department": row[4], "phone": row[5],
                "avatar_initials": row[6], "online": True, "role": row[7]
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"token": token, "user": user})}
        finally:
            conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}