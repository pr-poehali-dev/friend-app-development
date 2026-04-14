"""
API звонков мессенджера Друг.
POST /start    — инициировать звонок (caller → callee)
POST /answer   — принять или отклонить звонок
POST /end      — завершить звонок
POST /signal   — передать WebRTC сигнал (offer/answer/candidate)
GET  /signals  — получить сигналы для меня (polling)
GET  /history  — история звонков
GET  /incoming — проверить входящий звонок
"""
import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def t(table):
    return f"{SCHEMA}.{table}"


def get_user(cur, session_id):
    if not session_id:
        return None
    cur.execute(
        f"""SELECT u.id, u.display_name, u.avatar_initials
           FROM {t('sessions')} s JOIN {t('users')} u ON u.id = s.user_id
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
        user = get_user(cur, session_id)
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}

        user_id, user_name, user_avatar = user[0], user[1], user[2]

        # GET /ice-servers — ICE-серверы для WebRTC (STUN + TURN из секрета)
        if method == "GET" and "ice-servers" in path:
            ice_servers = [
                {"urls": "stun:stun.l.google.com:19302"},
                {"urls": "stun:stun1.l.google.com:19302"},
                {"urls": "stun:stun2.l.google.com:19302"},
                {"urls": "stun:stun.cloudflare.com:3478"},
            ]
            turn_raw = os.environ.get("TURN_CREDENTIALS", "")
            if turn_raw:
                try:
                    turn_cfg = json.loads(turn_raw)
                    if isinstance(turn_cfg, list):
                        ice_servers.extend(turn_cfg)
                    else:
                        ice_servers.append(turn_cfg)
                except Exception as e:
                    print(f"TURN parse error: {e}")
            # Всегда добавляем запасной публичный TURN
            ice_servers.extend([
                {"urls": ["turn:relay1.expressturn.com:3478", "turns:relay1.expressturn.com:443"],
                 "username": "efOG5BPZFP2AQIQPNJ", "credential": "uBhKqPuaVmvBFxp8"},
            ])
            return {"statusCode": 200, "headers": CORS,
                    "body": json.dumps({"ice_servers": ice_servers})}

        # GET /history — история звонков
        if method == "GET" and "history" in path:
            cur.execute(
                f"""SELECT c.id, c.caller_id, c.callee_id, c.call_type, c.status,
                          c.started_at, c.ended_at, c.duration,
                          u1.display_name, u1.avatar_initials,
                          u2.display_name, u2.avatar_initials
                   FROM {t('calls')} c
                   JOIN {t('users')} u1 ON u1.id = c.caller_id
                   JOIN {t('users')} u2 ON u2.id = c.callee_id
                   WHERE c.caller_id = %s OR c.callee_id = %s
                   ORDER BY c.started_at DESC LIMIT 50""",
                (user_id, user_id)
            )
            rows = cur.fetchall()
            calls = []
            for r in rows:
                is_caller = r[1] == user_id
                other_name = r[10] if is_caller else r[8]
                other_avatar = r[11] if is_caller else r[9]
                if r[5]:
                    started = r[5].strftime("%d.%m %H:%M")
                else:
                    started = ""
                call_type_label = "incoming" if not is_caller else "outgoing"
                if r[4] == "missed" and not is_caller:
                    call_type_label = "missed"
                calls.append({
                    "id": r[0],
                    "type": call_type_label,
                    "call_type": r[3],
                    "status": r[4],
                    "name": other_name,
                    "avatar": other_avatar,
                    "time": started,
                    "duration": f"{r[7] // 60}:{r[7] % 60:02d}" if r[7] else "—",
                    "is_video": r[3] == "video",
                })
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"calls": calls})}

        # GET /incoming — проверить входящий звонок
        if method == "GET" and "incoming" in path:
            cur.execute(
                f"""SELECT c.id, c.caller_id, c.call_type,
                          u.display_name, u.avatar_initials
                   FROM {t('calls')} c
                   JOIN {t('users')} u ON u.id = c.caller_id
                   WHERE c.callee_id = %s AND c.status = 'pending'
                   ORDER BY c.started_at DESC LIMIT 1""",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"call": None})}
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "call": {
                    "id": row[0],
                    "caller_id": row[1],
                    "call_type": row[2],
                    "caller_name": row[3],
                    "caller_avatar": row[4],
                }
            })}

        # GET /signals — получить WebRTC сигналы
        if method == "GET" and "signals" in path:
            params = event.get("queryStringParameters") or {}
            call_id = params.get("call_id")
            after_id = int(params.get("after_id", 0))
            if not call_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "call_id required"})}
            cur.execute(
                f"""SELECT id, from_user_id, signal_type, payload
                   FROM {t('webrtc_signals')}
                   WHERE call_id = %s AND to_user_id = %s AND id > %s
                   ORDER BY id ASC""",
                (call_id, user_id, after_id)
            )
            rows = cur.fetchall()
            signals = [{"id": r[0], "from": r[1], "type": r[2], "payload": r[3]} for r in rows]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"signals": signals})}

        if method == "POST":
            body = json.loads(event.get("body") or "{}")

            # POST /start — начать звонок
            if "start" in path:
                callee_id = body.get("callee_id")
                call_type = body.get("call_type", "audio")
                if not callee_id:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "callee_id required"})}

                # Отменить предыдущие зависшие звонки
                cur.execute(
                    f"UPDATE {t('calls')} SET status = 'missed' WHERE caller_id = %s AND status = 'pending'",
                    (user_id,)
                )
                cur.execute(
                    f"""INSERT INTO {t('calls')} (caller_id, callee_id, call_type, status)
                       VALUES (%s, %s, %s, 'pending') RETURNING id""",
                    (user_id, callee_id, call_type)
                )
                call_id = cur.fetchone()[0]
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"call_id": call_id})}

            # POST /answer — ответить на звонок
            if "answer" in path:
                call_id = body.get("call_id")
                accepted = body.get("accepted", False)
                if not call_id:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "call_id required"})}
                new_status = "active" if accepted else "declined"
                cur.execute(
                    f"UPDATE {t('calls')} SET status = %s WHERE id = %s AND callee_id = %s",
                    (new_status, call_id, user_id)
                )
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"status": new_status})}

            # POST /end — завершить звонок
            if "end" in path:
                call_id = body.get("call_id")
                if not call_id:
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "call_id required"})}
                cur.execute(
                    f"""UPDATE {t('calls')} SET status = 'ended', ended_at = NOW(),
                       duration = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
                       WHERE id = %s AND (caller_id = %s OR callee_id = %s)""",
                    (call_id, user_id, user_id)
                )
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

            # POST /signal — отправить WebRTC сигнал
            if "signal" in path:
                call_id = body.get("call_id")
                to_user_id = body.get("to_user_id")
                signal_type = body.get("type")
                payload = body.get("payload", "")
                if not all([call_id, to_user_id, signal_type]):
                    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "missing fields"})}
                cur.execute(
                    f"""INSERT INTO {t('webrtc_signals')} (call_id, from_user_id, to_user_id, signal_type, payload)
                       VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                    (call_id, user_id, to_user_id, signal_type, json.dumps(payload))
                )
                sig_id = cur.fetchone()[0]
                conn.commit()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"signal_id": sig_id})}

    finally:
        conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}