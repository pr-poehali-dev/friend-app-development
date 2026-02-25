"""
Авторизация пользователей мессенджера Друг.
POST - вход по username + password
GET - проверка текущей сессии
"""
import json
import os
import secrets
import psycopg2
from datetime import datetime, timezone

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

# В памяти храним сессии (для прода — лучше Redis/БД, здесь простой вариант)
# Используем таблицу sessions в БД
def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
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
                """SELECT u.id, u.username, u.display_name, u.position, u.department,
                          u.phone, u.avatar_initials, u.online
                   FROM sessions s
                   JOIN users u ON u.id = s.user_id
                   WHERE s.token = %s AND s.expires_at > NOW()""",
                (session_id,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_session"})}
            user = {
                "id": row[0], "username": row[1], "display_name": row[2],
                "position": row[3], "department": row[4], "phone": row[5],
                "avatar_initials": row[6], "online": row[7]
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}
        finally:
            conn.close()

    # POST /login
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        username = body.get("username", "").strip().lower()
        password = body.get("password", "")

        if not username or not password:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "missing_fields"})}

        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT id, display_name, password_hash, position, department, phone, avatar_initials FROM users WHERE username = %s",
                (username,)
            )
            row = cur.fetchone()
            if not row or row[2] != password:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_credentials"})}

            user_id = row[0]
            token = secrets.token_hex(32)

            cur.execute(
                "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, NOW() + INTERVAL '30 days')",
                (user_id, token)
            )
            cur.execute("UPDATE users SET online = true, last_seen = NOW() WHERE id = %s", (user_id,))
            conn.commit()

            user = {
                "id": user_id, "username": username, "display_name": row[1],
                "position": row[3], "department": row[4], "phone": row[5],
                "avatar_initials": row[6], "online": True
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"token": token, "user": user})}
        finally:
            conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}