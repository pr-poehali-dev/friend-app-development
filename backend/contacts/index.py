"""
API контактов: ручное добавление, импорт CSV, инвайт-ссылки, QR-коды.
GET /              — список внешних контактов пользователя
POST /             — добавить контакт вручную
POST /import       — импорт CSV (name,phone,email,position,department)
GET /invites       — список инвайт-ссылок пользователя
POST /invites      — создать инвайт-ссылку
GET /invite/{code} — публичная инфо по инвайту (без авторизации)
POST /join         — принять инвайт (зарегистрированный пользователь вступает в список)
GET /notifications — непрочитанные уведомления текущего пользователя
POST /notifications/read — пометить уведомления прочитанными
"""
import json
import os
import secrets
import csv
import io
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_by_session(cur, session_id):
    if not session_id:
        return None
    cur.execute(
        """SELECT u.id, u.username, u.display_name, u.avatar_initials, u.organization
           FROM sessions s JOIN users u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()""",
        (session_id,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "display_name": row[2], "avatar_initials": row[3], "organization": row[4]}


def initials_from_name(name: str) -> str:
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
    session_id = headers.get("X-Session-Id") or (event.get("queryStringParameters") or {}).get("session_id")

    conn = get_conn()
    cur = conn.cursor()

    # Публичный эндпоинт: GET /invite/{code}
    if method == "GET" and "/invite/" in path:
        code = path.split("/invite/")[-1].strip("/")
        cur.execute(
            "SELECT id, label, created_by, used_count, max_uses, expires_at FROM invites WHERE code = %s",
            (code,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Ссылка не найдена"})}
        invite_id, label, created_by, used_count, max_uses, expires_at = row
        cur.execute("SELECT display_name, organization, avatar_initials FROM users WHERE id = %s", (created_by,))
        u = cur.fetchone()
        conn.close()
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "code": code,
                "label": label,
                "creator": {"display_name": u[0] if u else "Пользователь", "organization": u[1] if u else None, "avatar_initials": u[2] if u else "??"},
                "used_count": used_count,
                "max_uses": max_uses,
                "expired": False,
            })
        }

    # Публичный эндпоинт: POST /join — принять инвайт
    if method == "POST" and path.endswith("/join"):
        body = json.loads(event.get("body") or "{}")
        code = body.get("code")
        user = get_user_by_session(cur, session_id)
        if not user:
            conn.close()
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Нет авторизации"})}
        cur.execute("SELECT id, created_by, max_uses, used_count FROM invites WHERE code = %s", (code,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Ссылка не найдена"})}
        invite_id, created_by, max_uses, used_count = row
        if max_uses and used_count >= max_uses:
            conn.close()
            return {"statusCode": 410, "headers": CORS, "body": json.dumps({"error": "Лимит использований исчерпан"})}
        # Добавляем в external_contacts создателю инвайта
        cur.execute(
            "SELECT id FROM external_contacts WHERE owner_id = %s AND linked_user_id = %s",
            (created_by, user["id"])
        )
        if not cur.fetchone():
            cur.execute(
                """INSERT INTO external_contacts (owner_id, display_name, phone, email, avatar_initials, source, linked_user_id)
                   SELECT %s, display_name, phone, email, avatar_initials, 'invite', id FROM users WHERE id = %s""",
                (created_by, user["id"])
            )
        # Добавляем создателя инвайта в контакты пришедшего
        cur.execute(
            "SELECT id FROM external_contacts WHERE owner_id = %s AND linked_user_id = %s",
            (user["id"], created_by)
        )
        if not cur.fetchone():
            cur.execute(
                """INSERT INTO external_contacts (owner_id, display_name, phone, email, avatar_initials, source, linked_user_id)
                   SELECT %s, display_name, phone, email, avatar_initials, 'invite', id FROM users WHERE id = %s""",
                (user["id"], created_by)
            )
        cur.execute("UPDATE invites SET used_count = used_count + 1 WHERE id = %s", (invite_id,))
        # Уведомление владельцу ссылки
        cur.execute(
            """INSERT INTO notifications (user_id, type, title, body, data)
               VALUES (%s, 'invite_join', %s, %s, %s)""",
            (
                created_by,
                "Новый контакт по ссылке",
                f"{user['display_name']} принял ваше приглашение и добавлен в контакты",
                json.dumps({"user_id": user["id"], "display_name": user["display_name"], "avatar_initials": user["avatar_initials"]}),
            )
        )
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "message": "Вы добавлены в список контактов"})}

    # Далее требуется авторизация
    user = get_user_by_session(cur, session_id)
    if not user:
        conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Нет авторизации"})}

    user_id = user["id"]

    # GET / — список внешних контактов
    if method == "GET" and not "/invite" in path:
        cur.execute(
            """SELECT ec.id, ec.display_name, ec.phone, ec.email, ec.position, ec.department,
                      ec.avatar_initials, ec.notes, ec.source, ec.linked_user_id, ec.created_at,
                      u.online
               FROM external_contacts ec
               LEFT JOIN users u ON u.id = ec.linked_user_id
               WHERE ec.owner_id = %s
               ORDER BY ec.display_name""",
            (user_id,)
        )
        rows = cur.fetchall()
        conn.close()
        contacts = [
            {
                "id": r[0], "display_name": r[1], "phone": r[2], "email": r[3],
                "position": r[4], "department": r[5], "avatar_initials": r[6] or initials_from_name(r[1]),
                "notes": r[7], "source": r[8], "linked_user_id": r[9],
                "created_at": r[10].isoformat() if r[10] else None,
                "online": r[11] or False,
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"contacts": contacts})}

    # POST / — добавить контакт вручную
    if method == "POST" and not any(x in path for x in ["/import", "/invite", "/join"]):
        body = json.loads(event.get("body") or "{}")
        name = (body.get("display_name") or "").strip()
        if not name:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите имя"})}
        cur.execute(
            """INSERT INTO external_contacts (owner_id, display_name, phone, email, position, department, avatar_initials, notes, source)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'manual')
               RETURNING id""",
            (user_id, name, body.get("phone"), body.get("email"), body.get("position"), body.get("department"),
             body.get("avatar_initials") or initials_from_name(name), body.get("notes"))
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "id": new_id})}

    # POST /import — импорт CSV
    if method == "POST" and path.endswith("/import"):
        body = json.loads(event.get("body") or "{}")
        csv_text = body.get("csv", "")
        reader = csv.DictReader(io.StringIO(csv_text))
        added = 0
        for row in reader:
            name = (row.get("name") or row.get("display_name") or "").strip()
            if not name:
                continue
            cur.execute(
                """INSERT INTO external_contacts (owner_id, display_name, phone, email, position, department, avatar_initials, source)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, 'csv')""",
                (user_id, name, row.get("phone") or row.get("телефон"),
                 row.get("email"), row.get("position") or row.get("должность"),
                 row.get("department") or row.get("отдел"),
                 initials_from_name(name))
            )
            added += 1
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "added": added})}

    # GET /invites — список инвайтов
    if method == "GET" and "/invite" in path:
        cur.execute(
            "SELECT id, code, label, used_count, max_uses, expires_at, created_at FROM invites WHERE created_by = %s ORDER BY created_at DESC",
            (user_id,)
        )
        rows = cur.fetchall()
        conn.close()
        invites = [
            {
                "id": r[0], "code": r[1], "label": r[2], "used_count": r[3],
                "max_uses": r[4], "expires_at": r[5].isoformat() if r[5] else None,
                "created_at": r[6].isoformat() if r[6] else None,
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"invites": invites})}

    # POST /invites — создать инвайт
    if method == "POST" and "/invite" in path:
        body = json.loads(event.get("body") or "{}")
        code = secrets.token_urlsafe(16)
        cur.execute(
            "INSERT INTO invites (code, created_by, label, max_uses) VALUES (%s, %s, %s, %s) RETURNING id, code",
            (code, user_id, body.get("label"), body.get("max_uses"))
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True, "id": row[0], "code": row[1]})}

    # GET /notifications — непрочитанные уведомления
    if method == "GET" and "/notification" in path:
        cur.execute(
            """SELECT id, type, title, body, data, created_at
               FROM notifications
               WHERE user_id = %s AND read_at IS NULL
               ORDER BY created_at DESC
               LIMIT 50""",
            (user_id,)
        )
        rows = cur.fetchall()
        conn.close()
        notifs = [
            {
                "id": r[0], "type": r[1], "title": r[2], "body": r[3],
                "data": r[4], "created_at": r[5].isoformat() if r[5] else None,
            }
            for r in rows
        ]
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"notifications": notifs, "unread": len(notifs)})}

    # POST /notifications/read — пометить прочитанными
    if method == "POST" and "/notification" in path:
        body = json.loads(event.get("body") or "{}")
        ids = body.get("ids")
        if ids:
            placeholders = ",".join(["%s"] * len(ids))
            cur.execute(
                f"UPDATE notifications SET read_at = NOW() WHERE id IN ({placeholders}) AND user_id = %s",
                (*ids, user_id)
            )
        else:
            cur.execute("UPDATE notifications SET read_at = NOW() WHERE user_id = %s AND read_at IS NULL", (user_id,))
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}