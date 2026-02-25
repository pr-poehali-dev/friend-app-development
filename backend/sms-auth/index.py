"""
СМС-авторизация мессенджера Друг.
POST /send   — отправить код на телефон (login или register)
POST /verify — проверить код и войти / завершить регистрацию
GET  /       — проверить текущую сессию по X-Session-Id
"""
import json
import os
import random
import secrets
import re
import urllib.request
import urllib.parse
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("8") and len(digits) == 11:
        digits = "7" + digits[1:]
    if not digits.startswith("7"):
        digits = "7" + digits
    return "+" + digits


def send_sms(phone: str, code: str) -> bool:
    login = os.environ.get("SMSC_LOGIN", "")
    password = os.environ.get("SMSC_PASSWORD", "")
    if not login or not password:
        print(f"[DEV] SMS to {phone}: code={code} (SMSC credentials not set)")
        return True
    message = f"Ваш код Друг: {code}"
    params = urllib.parse.urlencode({
        "login": login,
        "psw": password,
        "phones": phone,
        "mes": message,
        "sender": "ddmaxisrs",
        "fmt": 3,
        "charset": "utf-8",
    })
    url = f"https://smsc.ru/sys/send.php?{params}"
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            raw = r.read().decode()
            resp = json.loads(raw)
            print(f"[SMS] phone={phone} smsc_response={resp}")
            if "error" in resp:
                print(f"[SMS ERROR] code={resp.get('error_code')} msg={resp.get('error')}")
                return False
            return True
    except Exception as e:
        print(f"[SMS EXCEPTION] {e}")
        return False


def get_user_by_session(cur, token):
    if not token:
        return None
    cur.execute(
        """SELECT u.id, u.username, u.display_name, u.position,
                  u.department, u.phone, u.avatar_initials, u.online
           FROM sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()""",
        (token,)
    )
    return cur.fetchone()


def make_initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return name[:2].upper() if name else "??"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    headers = event.get("headers") or {}
    session_id = headers.get("x-session-id") or headers.get("X-Session-Id")

    # GET — проверка сессии
    if method == "GET":
        if not session_id:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "no_session"})}
        conn = get_conn()
        try:
            cur = conn.cursor()
            row = get_user_by_session(cur, session_id)
            if not row:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_session"})}
            user = {
                "id": row[0], "username": row[1], "display_name": row[2],
                "position": row[3], "department": row[4], "phone": row[5],
                "avatar_initials": row[6], "online": row[7],
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}
        finally:
            conn.close()

    if method != "POST":
        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    # POST /send — отправить СМС-код
    if action == "send":
        raw_phone = body.get("phone", "").strip()
        if not raw_phone:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "phone_required"})}

        phone = normalize_phone(raw_phone)
        if len(re.sub(r"\D", "", phone)) < 11:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "invalid_phone"})}

        conn = get_conn()
        try:
            cur = conn.cursor()

            # Антиспам: не чаще 1 раза в 60 секунд
            cur.execute(
                "SELECT COUNT(*) FROM sms_codes WHERE phone = %s AND created_at > NOW() - INTERVAL '60 seconds'",
                (phone,)
            )
            if cur.fetchone()[0] > 0:
                return {"statusCode": 429, "headers": CORS, "body": json.dumps({"error": "too_many_requests", "message": "Подождите 60 секунд перед повторной отправкой"})}

            # Проверяем — пользователь существует?
            cur.execute("SELECT id FROM users WHERE phone = %s", (phone,))
            existing = cur.fetchone()
            purpose = "login" if existing else "register"

            code = str(random.randint(100000, 999999))
            cur.execute(
                "INSERT INTO sms_codes (phone, code, purpose, expires_at) VALUES (%s, %s, %s, NOW() + INTERVAL '10 minutes')",
                (phone, code, purpose)
            )
            conn.commit()

            ok = send_sms(phone, code)
            if not ok:
                return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": "sms_failed", "message": "Не удалось отправить СМС"})}

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "purpose": purpose,
                "phone": phone,
                "message": f"Код отправлен на {phone}"
            })}
        finally:
            conn.close()

    # POST /verify — проверить код
    if action == "verify":
        phone = normalize_phone(body.get("phone", "").strip())
        code = body.get("code", "").strip()
        display_name = body.get("display_name", "").strip()

        if not phone or not code:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "phone_and_code_required"})}

        conn = get_conn()
        try:
            cur = conn.cursor()

            # Найти активный код
            cur.execute(
                """SELECT id, purpose FROM sms_codes
                   WHERE phone = %s AND code = %s AND used = false AND expires_at > NOW()
                   ORDER BY created_at DESC LIMIT 1""",
                (phone, code)
            )
            code_row = cur.fetchone()
            if not code_row:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_code", "message": "Неверный или устаревший код"})}

            code_id, purpose = code_row[0], code_row[1]

            # Отметить код использованным
            cur.execute("UPDATE sms_codes SET used = true WHERE id = %s", (code_id,))

            # Найти или создать пользователя
            cur.execute("SELECT id FROM users WHERE phone = %s", (phone,))
            existing = cur.fetchone()

            if existing:
                user_id = existing[0]
                cur.execute("UPDATE users SET online = true, last_seen = NOW() WHERE id = %s", (user_id,))
            else:
                # Новый пользователь
                if not display_name:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "display_name_required"})}
                initials = make_initials(display_name)
                username = re.sub(r"\D", "", phone)[-10:]
                cur.execute(
                    """INSERT INTO users (username, display_name, password_hash, phone, avatar_initials, online, phone_verified)
                       VALUES (%s, %s, %s, %s, %s, true, true) RETURNING id""",
                    (username, display_name, secrets.token_hex(16), phone, initials)
                )
                user_id = cur.fetchone()[0]

            # Создать сессию
            token = secrets.token_hex(32)
            cur.execute(
                "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, NOW() + INTERVAL '30 days')",
                (user_id, token)
            )
            conn.commit()

            cur.execute(
                "SELECT id, username, display_name, position, department, phone, avatar_initials, online FROM users WHERE id = %s",
                (user_id,)
            )
            u = cur.fetchone()
            user = {
                "id": u[0], "username": u[1], "display_name": u[2],
                "position": u[3], "department": u[4], "phone": u[5],
                "avatar_initials": u[6], "online": u[7],
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"token": token, "user": user, "is_new": not existing})}
        finally:
            conn.close()

    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "unknown_action"})}