"""
Обновление профиля пользователя (имя, должность, отдел).
PATCH / — сохранить изменения
"""
import json
import os
import re
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def make_initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return name[:2].upper() if name else "??"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if event.get("httpMethod") != "PATCH":
        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}

    headers = event.get("headers") or {}
    session_token = headers.get("x-session-id") or headers.get("X-Session-Id")
    if not session_token:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}

    body = json.loads(event.get("body") or "{}")
    display_name = (body.get("display_name") or "").strip()
    position = (body.get("position") or "").strip()
    department = (body.get("department") or "").strip()

    if not display_name:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "display_name_required", "message": "Имя обязательно"})}

    if len(display_name.split()) < 2:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "full_name_required", "message": "Введите имя и фамилию"})}

    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()",
            (session_token,)
        )
        row = cur.fetchone()
        if not row:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_session"})}

        user_id = row[0]
        initials = make_initials(display_name)

        cur.execute(
            """UPDATE users SET display_name = %s, position = %s, department = %s, avatar_initials = %s
               WHERE id = %s
               RETURNING id, username, display_name, position, department, phone, avatar_initials, online""",
            (display_name, position or None, department or None, initials, user_id)
        )
        u = cur.fetchone()
        conn.commit()

        user = {
            "id": u[0], "username": u[1], "display_name": u[2],
            "position": u[3], "department": u[4], "phone": u[5],
            "avatar_initials": u[6], "online": u[7],
        }
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}
    finally:
        conn.close()
