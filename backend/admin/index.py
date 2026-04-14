"""
Панель администратора.
GET  ?action=users          — все пользователи + статистика посещений
GET  ?action=user&id=X      — детали пользователя: контакты, чаты, файлы
GET  ?action=chat&id=X      — переписка в чате (скрытый просмотр)
GET  ?action=bans           — список блокировок
POST ?action=send           — отправить сообщение от имени пользователя или всем
POST ?action=ban            — заблокировать пользователя
POST ?action=unban          — разблокировать
POST ?action=set_role       — назначить/снять роль admin
"""
import json, os, psycopg2

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

def get_admin(cur, sid):
    if not sid:
        return None
    cur.execute(
        f"""SELECT u.id, u.display_name, u.role
           FROM {tbl('sessions')} s JOIN {tbl('users')} u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()""",
        (sid,)
    )
    row = cur.fetchone()
    if not row or row[2] != 'admin':
        return None
    return row

def log_action(cur, admin_id, action, target_id=None, meta=None):
    cur.execute(
        f"""INSERT INTO {tbl('admin_logs')} (admin_id, action, target_id, meta)
           VALUES (%s, %s, %s, %s)""",
        (admin_id, action, target_id, json.dumps(meta) if meta else None)
    )

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs     = event.get("queryStringParameters") or {}
    hdrs   = event.get("headers") or {}
    sid    = hdrs.get("x-session-id") or hdrs.get("X-Session-Id")
    action = qs.get("action", "")

    conn = get_conn()
    try:
        cur = conn.cursor()
        admin = get_admin(cur, sid)
        if not admin:
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "forbidden"})}
        admin_id = admin[0]

        # ── GET users — все пользователи + статистика ──────────────
        if method == "GET" and action == "users":
            cur.execute(
                f"""SELECT u.id, u.display_name, u.username, u.email, u.phone,
                          u.position, u.department, u.organization,
                          u.online, u.last_seen, u.created_at, u.role, u.avatar_url,
                          u.avatar_initials,
                          (SELECT COUNT(*) FROM {tbl('sessions')} s2 WHERE s2.user_id = u.id) as session_count,
                          (SELECT COUNT(*) FROM {tbl('messages')} m WHERE m.sender_id = u.id) as msg_count,
                          (SELECT COUNT(*) FROM {tbl('chat_members')} cm WHERE cm.user_id = u.id) as chat_count,
                          b.banned_until, b.reason as ban_reason
                   FROM {tbl('users')} u
                   LEFT JOIN {tbl('user_bans')} b ON b.user_id = u.id
                     AND (b.banned_until IS NULL OR b.banned_until > NOW())
                   ORDER BY u.id"""
            )
            rows = cur.fetchall()
            users = [{
                "id": r[0], "display_name": r[1], "username": r[2],
                "email": r[3], "phone": r[4], "position": r[5],
                "department": r[6], "organization": r[7],
                "online": r[8],
                "last_seen": r[9].isoformat() if r[9] else None,
                "created_at": r[10].isoformat() if r[10] else None,
                "role": r[11], "avatar_url": r[12], "avatar_initials": r[13],
                "session_count": r[14], "msg_count": r[15], "chat_count": r[16],
                "banned_until": r[17].isoformat() if r[17] else ("banned" if r[18] else None),
                "ban_reason": r[18],
                "is_banned": r[17] is not None or r[18] is not None,
            } for r in rows]
            log_action(cur, admin_id, "view_users")
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"users": users})}

        # ── GET user — детальная инфо по одному пользователю ───────
        if method == "GET" and action == "user":
            uid = int(qs.get("id", 0))
            if not uid:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id required"})}

            # Контакты пользователя
            cur.execute(
                f"""SELECT ec.display_name, ec.phone, ec.email, u2.online
                   FROM {tbl('external_contacts')} ec
                   LEFT JOIN {tbl('users')} u2 ON u2.id = ec.linked_user_id
                   WHERE ec.owner_id = %s ORDER BY ec.display_name""",
                (uid,)
            )
            contacts = [{"name": r[0], "phone": r[1], "email": r[2], "online": r[3]} for r in cur.fetchall()]

            # Чаты пользователя
            cur.execute(
                f"""SELECT c.id, c.type, c.name,
                          (SELECT COUNT(*) FROM {tbl('messages')} m WHERE m.chat_id = c.id AND m.sender_id = %s) as sent
                   FROM {tbl('chats')} c
                   JOIN {tbl('chat_members')} cm ON cm.chat_id = c.id AND cm.user_id = %s
                   ORDER BY c.created_at DESC""",
                (uid, uid)
            )
            chats = [{"id": r[0], "type": r[1], "name": r[2] or "Личный чат", "sent": r[3]} for r in cur.fetchall()]

            # Последние файлы
            cur.execute(
                f"""SELECT file_name, file_size, file_url, created_at
                   FROM {tbl('user_files')} WHERE user_id = %s ORDER BY created_at DESC LIMIT 20""",
                (uid,)
            )
            files = [{"name": r[0], "size": r[1], "url": r[2],
                      "date": r[3].strftime("%d.%m.%Y")} for r in cur.fetchall()]

            log_action(cur, admin_id, "view_user", uid)
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "contacts": contacts, "chats": chats, "files": files
            })}

        # ── GET chat — переписка в чате ─────────────────────────────
        if method == "GET" and action == "chat":
            cid = int(qs.get("id", 0))
            if not cid:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "id required"})}
            offset = int(qs.get("offset", 0))
            cur.execute(
                f"""SELECT m.id, m.text, m.msg_type, m.file_name, m.file_url,
                          m.created_at, u.display_name, u.avatar_initials
                   FROM {tbl('messages')} m JOIN {tbl('users')} u ON u.id = m.sender_id
                   WHERE m.chat_id = %s
                   ORDER BY m.created_at DESC LIMIT 50 OFFSET %s""",
                (cid, offset)
            )
            rows = cur.fetchall()
            messages = [{
                "id": r[0], "text": r[1], "type": r[2],
                "file_name": r[3], "file_url": r[4],
                "time": r[5].strftime("%d.%m %H:%M"),
                "sender": r[6], "avatar": r[7],
            } for r in reversed(rows)]
            log_action(cur, admin_id, "view_chat", cid)
            conn.commit()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"messages": messages})}

        # ── GET bans — список активных блокировок ──────────────────
        if method == "GET" and action == "bans":
            cur.execute(
                f"""SELECT b.id, u.id, u.display_name, u.username,
                          b.reason, b.banned_until, b.created_at,
                          ab.display_name as banned_by_name
                   FROM {tbl('user_bans')} b
                   JOIN {tbl('users')} u ON u.id = b.user_id
                   JOIN {tbl('users')} ab ON ab.id = b.banned_by
                   WHERE b.banned_until IS NULL OR b.banned_until > NOW()
                   ORDER BY b.created_at DESC"""
            )
            bans = [{
                "id": r[0], "user_id": r[1], "user_name": r[2], "username": r[3],
                "reason": r[4],
                "banned_until": r[5].isoformat() if r[5] else "навсегда",
                "created_at": r[6].strftime("%d.%m.%Y"),
                "banned_by": r[7],
            } for r in cur.fetchall()]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"bans": bans})}

        if method == "POST":
            body = json.loads(event.get("body") or "{}")

            # ── POST send — отправить сообщение ────────────────────
            if action == "send":
                text    = body.get("text", "").strip()
                chat_id = body.get("chat_id")    # один чат
                all_msg = body.get("all", False)  # всем пользователям

                if not text:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "text required"})}

                if all_msg:
                    # Создать или найти чат с каждым пользователем и отправить
                    cur.execute(f"SELECT id FROM {tbl('users')} WHERE id != %s", (admin_id,))
                    uids = [r[0] for r in cur.fetchall()]
                    sent = 0
                    for uid in uids:
                        # Найти личный чат
                        cur.execute(
                            f"""SELECT c.id FROM {tbl('chats')} c
                               JOIN {tbl('chat_members')} cm1 ON cm1.chat_id = c.id AND cm1.user_id = %s
                               JOIN {tbl('chat_members')} cm2 ON cm2.chat_id = c.id AND cm2.user_id = %s
                               WHERE c.type = 'personal' LIMIT 1""",
                            (admin_id, uid)
                        )
                        row = cur.fetchone()
                        if not row:
                            cur.execute(f"INSERT INTO {tbl('chats')} (type) VALUES ('personal') RETURNING id")
                            cid = cur.fetchone()[0]
                            cur.execute(f"INSERT INTO {tbl('chat_members')} (chat_id, user_id) VALUES (%s,%s),(%s,%s)",
                                        (cid, admin_id, cid, uid))
                        else:
                            cid = row[0]
                        cur.execute(
                            f"INSERT INTO {tbl('messages')} (chat_id, sender_id, text) VALUES (%s,%s,%s)",
                            (cid, admin_id, text)
                        )
                        sent += 1
                    log_action(cur, admin_id, "broadcast", meta={"text": text[:50], "sent": sent})
                    conn.commit()
                    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"sent": sent})}
                elif chat_id:
                    cur.execute(
                        f"INSERT INTO {tbl('messages')} (chat_id, sender_id, text) VALUES (%s,%s,%s) RETURNING id",
                        (chat_id, admin_id, text)
                    )
                    msg_id = cur.fetchone()[0]
                    log_action(cur, admin_id, "send_message", chat_id, {"text": text[:50]})
                    conn.commit()
                    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"message_id": msg_id})}

            # ── POST ban — заблокировать ────────────────────────────
            if action == "ban":
                uid    = body.get("user_id")
                reason = body.get("reason", "")
                hours  = body.get("hours")  # None = навсегда
                if not uid:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id required"})}
                banned_until = None
                if hours:
                    cur.execute("SELECT NOW() + (%s * INTERVAL '1 hour')", (int(hours),))
                    banned_until = cur.fetchone()[0]
                cur.execute(
                    f"INSERT INTO {tbl('user_bans')} (user_id, banned_by, reason, banned_until) VALUES (%s,%s,%s,%s)",
                    (uid, admin_id, reason, banned_until)
                )
                # Удалить все сессии пользователя
                cur.execute(f"DELETE FROM {tbl('sessions')} WHERE user_id = %s", (uid,))
                log_action(cur, admin_id, "ban", uid, {"hours": hours, "reason": reason})
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

            # ── POST unban — разблокировать ─────────────────────────
            if action == "unban":
                uid = body.get("user_id")
                if not uid:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id required"})}
                # Помечаем все баны как истёкшие (через обновление banned_until на прошлое)
                cur.execute(
                    f"""UPDATE {tbl('user_bans')} SET banned_until = NOW() - INTERVAL '1 second'
                       WHERE user_id = %s AND (banned_until IS NULL OR banned_until > NOW())""",
                    (uid,)
                )
                log_action(cur, admin_id, "unban", uid)
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

            # ── POST set_role — назначить/снять роль ────────────────
            if action == "set_role":
                uid  = body.get("user_id")
                role = body.get("role", "user")  # "admin" или "user"
                if not uid or role not in ("admin", "user"):
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id and role required"})}
                cur.execute(f"UPDATE {tbl('users')} SET role = %s WHERE id = %s", (role, uid))
                log_action(cur, admin_id, "set_role", uid, {"role": role})
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

            # ── POST delete_user — удалить пользователя ──────────────
            if action == "delete_user":
                uid = int(body.get("user_id", 0))
                if not uid:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "user_id required"})}
                if uid == admin_id:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нельзя удалить себя"})}
                # Каскадная очистка
                for tname in ["bot_messages", "notifications", "upload_sessions", "user_files",
                               "message_reactions", "sms_codes", "email_codes", "admin_logs"]:
                    cur.execute(f"DELETE FROM {tbl(tname)} WHERE user_id = %s", (uid,))
                cur.execute(f"DELETE FROM {tbl('webrtc_signals')} WHERE from_user_id=%s OR to_user_id=%s", (uid, uid))
                cur.execute(f"DELETE FROM {tbl('calls')} WHERE caller_id=%s OR callee_id=%s", (uid, uid))
                cur.execute(f"DELETE FROM {tbl('invites')} WHERE created_by=%s", (uid,))
                cur.execute(f"DELETE FROM {tbl('external_contacts')} WHERE owner_id=%s OR linked_user_id=%s", (uid, uid))
                cur.execute(f"DELETE FROM {tbl('user_bans')} WHERE user_id=%s OR banned_by=%s", (uid, uid))
                cur.execute(f"DELETE FROM {tbl('messages')} WHERE sender_id=%s", (uid,))
                cur.execute(f"DELETE FROM {tbl('chat_members')} WHERE user_id=%s", (uid,))
                # Удалить осиротевшие чаты
                cur.execute(f"""DELETE FROM {tbl('chats')} WHERE id NOT IN (
                    SELECT DISTINCT chat_id FROM {tbl('chat_members')})""")
                cur.execute(f"DELETE FROM {tbl('sessions')} WHERE user_id=%s", (uid,))
                cur.execute(f"DELETE FROM {tbl('users')} WHERE id=%s", (uid,))
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    finally:
        conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}