"""
Email-авторизация мессенджера Друг.
POST / action=send_code   — отправить 6-значный код на email
POST / action=verify_code — проверить код (возвращает purpose: register/login + temp_token)
POST / action=register    — завершить регистрацию (username, password, display_name, organization, department)
POST / action=login       — войти по username + password
POST / action=reset       — сменить пароль (temp_token + новый пароль)
GET  /                    — проверить сессию по X-Session-Id
"""
import json
import os
import random
import secrets
import re
import smtplib
import hashlib
import hmac
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def t(table: str) -> str:
    return f"{SCHEMA}.{table}"


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}:{h.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, h = stored.split(":", 1)
        h2 = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
        return hmac.compare_digest(h, h2.hex())
    except Exception:
        return False


def make_initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return name[:2].upper() if name else "??"


def send_email(to: str, subject: str, body: str) -> bool:
    smtp_host = os.environ.get("SMTP_HOST", "")
    smtp_port = int(os.environ.get("SMTP_PORT", "465"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASSWORD", "")

    if not smtp_host or not smtp_user or not smtp_pass:
        print(f"[DEV] Email to {to}: {subject}")
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = to
    msg.attach(MIMEText(body, "html", "utf-8"))

    try:
        if smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as srv:
                srv.login(smtp_user, smtp_pass)
                srv.sendmail(smtp_user, [to], msg.as_string())
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as srv:
                srv.starttls()
                srv.login(smtp_user, smtp_pass)
                srv.sendmail(smtp_user, [to], msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
        return False


def email_body(code: str, purpose: str) -> str:
    if purpose == "register":
        title = "Подтверждение регистрации"
        text = "Для завершения регистрации введите код:"
    elif purpose == "reset":
        title = "Восстановление пароля"
        text = "Для сброса пароля введите код:"
    else:
        title = "Код подтверждения"
        text = "Ваш код для входа:"

    return f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d1421;color:#e2e8f0;border-radius:12px">
      <h2 style="color:#4a9eff;margin:0 0 16px">{title}</h2>
      <p style="color:#a0aec0;margin:0 0 24px">{text}</p>
      <div style="background:#1a2332;border-radius:8px;padding:24px;text-align:center;letter-spacing:12px;font-size:36px;font-weight:bold;color:#4a9eff">{code}</div>
      <p style="color:#718096;font-size:13px;margin:24px 0 0">Код действителен 10 минут. Не передавайте его никому.</p>
    </div>
    """


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    session_id = headers.get("x-session-id") or headers.get("X-Session-Id")

    # GET — проверка сессии
    if method == "GET":
        if not session_id:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "no_session"})}
        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                f"""SELECT u.id, u.username, u.display_name, u.position,
                          u.department, u.email, u.avatar_initials, u.online,
                          u.organization, u.avatar_url
                   FROM {t('sessions')} s JOIN {t('users')} u ON u.id = s.user_id
                   WHERE s.token = %s AND s.expires_at > NOW()""",
                (session_id,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_session"})}
            user = {
                "id": row[0], "username": row[1], "display_name": row[2],
                "position": row[3], "department": row[4], "email": row[5],
                "avatar_initials": row[6], "online": row[7],
                "organization": row[8], "avatar_url": row[9],
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}
        finally:
            conn.close()

    if method != "POST":
        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    # ── send_code ──────────────────────────────────────────────────────────
    if action == "send_code":
        email = body.get("email", "").strip().lower()
        if not email or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "invalid_email"})}

        conn = get_conn()
        try:
            cur = conn.cursor()

            cur.execute(
                f"SELECT COUNT(*) FROM {t('email_codes')} WHERE email = %s AND created_at > NOW() - INTERVAL '60 seconds'",
                (email,)
            )
            if cur.fetchone()[0] > 0:
                return {"statusCode": 429, "headers": CORS, "body": json.dumps({"error": "too_many_requests", "message": "Подождите 60 секунд перед повторной отправкой"})}

            cur.execute(f"SELECT id FROM {t('users')} WHERE email = %s", (email,))
            existing = cur.fetchone()
            purpose = "login" if existing else "register"

            code = str(random.randint(100000, 999999))
            cur.execute(
                f"INSERT INTO {t('email_codes')} (email, code, purpose, expires_at) VALUES (%s, %s, %s, NOW() + INTERVAL '10 minutes')",
                (email, code, purpose)
            )
            conn.commit()

            ok = send_email(email, "Ваш код Друг", email_body(code, purpose))
            if not ok:
                return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": "email_failed", "message": "Не удалось отправить письмо"})}

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "purpose": purpose,
                "email": email,
                "message": f"Код отправлен на {email}"
            })}
        finally:
            conn.close()

    # ── verify_code ────────────────────────────────────────────────────────
    if action == "verify_code":
        email = body.get("email", "").strip().lower()
        code = body.get("code", "").strip()

        if not email or not code:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "email_and_code_required"})}

        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                f"""SELECT id, purpose FROM {t('email_codes')}
                   WHERE email = %s AND code = %s AND used = false AND expires_at > NOW()
                   ORDER BY created_at DESC LIMIT 1""",
                (email, code)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_code", "message": "Неверный или устаревший код"})}

            code_id, purpose = row[0], row[1]
            cur.execute(f"UPDATE {t('email_codes')} SET used = true WHERE id = %s", (code_id,))
            conn.commit()

            temp_token = secrets.token_hex(32)
            cur.execute(
                f"INSERT INTO {t('email_codes')} (email, code, purpose, expires_at) VALUES (%s, %s, %s, NOW() + INTERVAL '15 minutes')",
                (email, temp_token, f"temp_{purpose}")
            )
            conn.commit()

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "purpose": purpose,
                "email": email,
                "temp_token": temp_token,
            })}
        finally:
            conn.close()

    # ── register ───────────────────────────────────────────────────────────
    if action == "register":
        email = body.get("email", "").strip().lower()
        temp_token = body.get("temp_token", "").strip()
        username = body.get("username", "").strip()
        password = body.get("password", "").strip()
        display_name = body.get("display_name", "").strip()
        organization = body.get("organization", "").strip()
        department = body.get("department", "").strip()

        if not all([email, temp_token, username, password, display_name]):
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "missing_fields"})}

        if len(password) < 6:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "password_too_short", "message": "Пароль должен быть не менее 6 символов"})}

        if not re.match(r"^[a-zA-Z0-9_]{3,30}$", username):
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "invalid_username", "message": "Никнейм: 3–30 символов, только латиница, цифры и _"})}

        conn = get_conn()
        try:
            cur = conn.cursor()

            cur.execute(
                f"""SELECT id FROM {t('email_codes')}
                   WHERE email = %s AND code = %s AND purpose = 'temp_register'
                   AND used = false AND expires_at > NOW()
                   ORDER BY created_at DESC LIMIT 1""",
                (email, temp_token)
            )
            if not cur.fetchone():
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_token"})}

            cur.execute(f"SELECT id FROM {t('users')} WHERE username = %s", (username,))
            if cur.fetchone():
                return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "username_taken", "message": "Этот никнейм уже занят"})}

            cur.execute(f"SELECT id FROM {t('users')} WHERE email = %s", (email,))
            if cur.fetchone():
                return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "email_taken", "message": "Этот email уже зарегистрирован"})}

            initials = make_initials(display_name)
            password_hash = hash_password(password)

            cur.execute(
                f"""INSERT INTO {t('users')} (username, display_name, password_hash, email, email_verified,
                                      avatar_initials, organization, department, online)
                   VALUES (%s, %s, %s, %s, true, %s, %s, %s, true) RETURNING id""",
                (username, display_name, password_hash, email, initials, organization or None, department or None)
            )
            user_id = cur.fetchone()[0]

            cur.execute(
                f"UPDATE {t('email_codes')} SET used = true WHERE email = %s AND code = %s",
                (email, temp_token)
            )

            token = secrets.token_hex(32)
            cur.execute(
                f"INSERT INTO {t('sessions')} (user_id, token, expires_at) VALUES (%s, %s, NOW() + INTERVAL '30 days')",
                (user_id, token)
            )
            conn.commit()

            user = {
                "id": user_id, "username": username, "display_name": display_name,
                "email": email, "avatar_initials": initials,
                "organization": organization, "department": department,
                "online": True, "avatar_url": None,
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"token": token, "user": user, "is_new": True})}
        finally:
            conn.close()

    # ── login ──────────────────────────────────────────────────────────────
    if action == "login":
        username = body.get("username", "").strip()
        password = body.get("password", "").strip()

        if not username or not password:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "missing_fields"})}

        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                f"""SELECT id, username, display_name, password_hash, email,
                          avatar_initials, organization, department, online, avatar_url
                   FROM {t('users')} WHERE username = %s""",
                (username,)
            )
            row = cur.fetchone()
            if not row or not verify_password(password, row[3]):
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_credentials", "message": "Неверный никнейм или пароль"})}

            user_id = row[0]
            cur.execute(f"UPDATE {t('users')} SET online = true, last_seen = NOW() WHERE id = %s", (user_id,))

            token = secrets.token_hex(32)
            cur.execute(
                f"INSERT INTO {t('sessions')} (user_id, token, expires_at) VALUES (%s, %s, NOW() + INTERVAL '30 days')",
                (user_id, token)
            )
            conn.commit()

            user = {
                "id": row[0], "username": row[1], "display_name": row[2],
                "email": row[4], "avatar_initials": row[5],
                "organization": row[6], "department": row[7],
                "online": True, "avatar_url": row[9],
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"token": token, "user": user})}
        finally:
            conn.close()

    # ── reset (смена пароля после email-кода) ──────────────────────────────
    if action == "reset":
        email = body.get("email", "").strip().lower()
        temp_token = body.get("temp_token", "").strip()
        new_password = body.get("password", "").strip()

        if not all([email, temp_token, new_password]):
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "missing_fields"})}

        if len(new_password) < 6:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "password_too_short", "message": "Пароль должен быть не менее 6 символов"})}

        conn = get_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                f"""SELECT id FROM {t('email_codes')}
                   WHERE email = %s AND code = %s AND purpose = 'temp_login'
                   AND used = false AND expires_at > NOW()
                   ORDER BY created_at DESC LIMIT 1""",
                (email, temp_token)
            )
            if not cur.fetchone():
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "invalid_token"})}

            cur.execute(f"SELECT id FROM {t('users')} WHERE email = %s", (email,))
            row = cur.fetchone()
            if not row:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "user_not_found"})}

            user_id = row[0]
            password_hash = hash_password(new_password)
            cur.execute(f"UPDATE {t('users')} SET password_hash = %s WHERE id = %s", (password_hash, user_id))
            cur.execute(
                f"UPDATE {t('email_codes')} SET used = true WHERE email = %s AND code = %s",
                (email, temp_token)
            )

            token = secrets.token_hex(32)
            cur.execute(
                f"INSERT INTO {t('sessions')} (user_id, token, expires_at) VALUES (%s, %s, NOW() + INTERVAL '30 days')",
                (user_id, token)
            )
            conn.commit()

            cur.execute(
                f"""SELECT id, username, display_name, email, avatar_initials,
                          organization, department, online, avatar_url FROM {t('users')} WHERE id = %s""",
                (user_id,)
            )
            r = cur.fetchone()
            user = {
                "id": r[0], "username": r[1], "display_name": r[2], "email": r[3],
                "avatar_initials": r[4], "organization": r[5], "department": r[6],
                "online": r[7], "avatar_url": r[8],
            }
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"token": token, "user": user})}
        finally:
            conn.close()

    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "unknown_action"})}
