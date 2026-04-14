"""
API ботов мессенджера.
GET  /        — список ботов
POST /chat    — отправить сообщение боту (GigaChat → OpenAI → fallback)
GET  /history — история сообщений с ботом (?bot_id=X)
"""
import json, os, uuid, urllib.request, urllib.error, ssl
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

FALLBACK = {
    "HR": [
        "Для оформления отпуска нужно подать заявление через HR-систему за 2 недели.",
        "Больничный лист оформляется у врача и передаётся в бухгалтерию.",
        "Отпуск по закону — 28 календарных дней в год.",
        "Для расчёта отпускных обратитесь в бухгалтерию.",
        "Кадровые вопросы решаются через HR-отдел.",
    ],
    "ФБ": [
        "Счёт на оплату нужно направить в бухгалтерию с пометкой «Срочно».",
        "Платёжное поручение обрабатывается в течение 3 рабочих дней.",
        "Для авансового отчёта нужны все оригиналы чеков.",
        "Бюджет на квартал утверждается финансовым директором.",
        "Для закрывающих документов обратитесь к финансовому менеджеру.",
    ],
    "ИП": [
        "Создайте заявку, указав описание проблемы и ваш компьютер.",
        "Время реакции на заявки — до 4 часов в рабочее время.",
        "Для срочных проблем звоните на горячую линию ИТ: вн. 100.",
        "Проблемы с доступом решаются системным администратором.",
        "Установка ПО — только через официальную заявку в ИТ-отдел.",
    ],
    "АИ": [
        "Для анализа данных опишите вашу задачу подробнее.",
        "Могу помочь с отчётами, данными и аналитикой.",
        "Для прогноза продаж нужны исторические данные минимум за 6 месяцев.",
        "Анализирую текст, цифры, таблицы — что именно вас интересует?",
        "Отчёт будет готов после получения данных.",
    ],
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def tbl(t):
    return f"{SCHEMA}.{t}"

def get_user(cur, sid):
    if not sid:
        return None
    cur.execute(
        f"""SELECT u.id, u.display_name, u.avatar_initials
           FROM {tbl('sessions')} s JOIN {tbl('users')} u ON u.id = s.user_id
           WHERE s.token = %s AND s.expires_at > NOW()""",
        (sid,)
    )
    return cur.fetchone()


# ── GigaChat ─────────────────────────────────────────────────────────────────

def get_gigachat_token(client_key: str) -> str:
    """Получить access_token через Client Credentials."""
    rq_uid = str(uuid.uuid4())
    data = b"scope=GIGACHAT_API_PERS"
    req = urllib.request.Request(
        "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
        data=data,
        headers={
            "Authorization": f"Basic {client_key}",
            "Content-Type": "application/x-www-form-urlencoded",
            "RqUID": rq_uid,
        },
        method="POST"
    )
    # GigaChat использует самоподписанный сертификат Сбера
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        return json.loads(resp.read())["access_token"]


def ask_gigachat(system_prompt: str, history: list, user_message: str) -> str | None:
    client_key = os.environ.get("GIGACHAT_KEY", "")
    if not client_key:
        return None
    try:
        token = get_gigachat_token(client_key)
        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-10:]:
            role = h["role"] if h["role"] in ("user", "assistant") else "user"
            messages.append({"role": role, "content": h["content"]})
        messages.append({"role": "user", "content": user_message})

        payload = json.dumps({
            "model": "GigaChat",
            "messages": messages,
            "max_tokens": 600,
            "temperature": 0.7,
        }).encode("utf-8")

        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        req = urllib.request.Request(
            "https://gigachat.devices.sberbank.ru/api/v1/chat/completions",
            data=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            method="POST"
        )
        with urllib.request.urlopen(req, context=ctx, timeout=25) as resp:
            data = json.loads(resp.read())
            return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"GigaChat error: {e}")
        return None


# ── OpenAI fallback ───────────────────────────────────────────────────────────

def ask_openai(system_prompt: str, history: list, user_message: str) -> str | None:
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        return None
    try:
        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-10:]:
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": user_message})
        payload = json.dumps({
            "model": "gpt-4o-mini",
            "messages": messages,
            "max_tokens": 500,
            "temperature": 0.7,
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.openai.com/v1/chat/completions",
            data=payload,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=25) as resp:
            return json.loads(resp.read())["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


def fallback_answer(avatar: str, _msg: str) -> str:
    import random
    answers = FALLBACK.get(avatar, ["Я обрабатываю ваш запрос. Уточните, пожалуйста."])
    return random.choice(answers)


# ── Handler ───────────────────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    """Боты мессенджера — GigaChat / OpenAI / fallback."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path   = event.get("path", "/")
    hdrs   = event.get("headers") or {}
    sid    = hdrs.get("x-session-id") or hdrs.get("X-Session-Id")

    conn = get_conn()
    try:
        cur = conn.cursor()
        user = get_user(cur, sid)
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}
        user_id, user_name, user_avatar = user

        # GET / — список ботов
        if method == "GET" and "history" not in path and "chat" not in path:
            cur.execute(
                f"SELECT id, name, description, category, avatar, active FROM {tbl('bots')} ORDER BY id"
            )
            rows = cur.fetchall()
            bots = []
            for r in rows:
                cur.execute(
                    f"SELECT COUNT(*) FROM {tbl('bot_messages')} WHERE bot_id=%s AND user_id=%s AND role='user'",
                    (r[0], user_id)
                )
                bots.append({
                    "id": r[0], "name": r[1], "description": r[2],
                    "category": r[3], "avatar": r[4], "active": r[5],
                    "requests": cur.fetchone()[0],
                })
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"bots": bots})}

        # GET /history
        if method == "GET" and "history" in path:
            params = event.get("queryStringParameters") or {}
            bot_id = params.get("bot_id")
            if not bot_id:
                return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "bot_id required"})}
            cur.execute(
                f"""SELECT id, role, content, created_at FROM {tbl('bot_messages')}
                   WHERE bot_id=%s AND user_id=%s ORDER BY created_at ASC LIMIT 100""",
                (bot_id, user_id)
            )
            msgs = [{"id": r[0], "role": r[1], "content": r[2], "time": r[3].strftime("%H:%M")}
                    for r in cur.fetchall()]
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"messages": msgs})}

        # POST /chat
        if method == "POST" and "chat" in path:
            body   = json.loads(event.get("body") or "{}")
            bot_id = body.get("bot_id")
            msg    = (body.get("message") or "").strip()
            if not bot_id or not msg:
                return {"statusCode": 400, "headers": CORS,
                        "body": json.dumps({"error": "bot_id and message required"})}

            cur.execute(
                f"SELECT name, avatar, active, system_prompt FROM {tbl('bots')} WHERE id=%s", (bot_id,)
            )
            bot = cur.fetchone()
            if not bot or not bot[2]:
                return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "bot not found"})}
            bot_name, bot_avatar, _, system_prompt = bot

            # Сохранить сообщение пользователя
            cur.execute(
                f"INSERT INTO {tbl('bot_messages')} (bot_id,user_id,role,content) VALUES (%s,%s,'user',%s) RETURNING id,created_at",
                (bot_id, user_id, msg)
            )
            user_row = cur.fetchone()

            # История для контекста
            cur.execute(
                f"""SELECT role, content FROM {tbl('bot_messages')}
                   WHERE bot_id=%s AND user_id=%s ORDER BY created_at DESC LIMIT 20""",
                (bot_id, user_id)
            )
            history = [{"role": r[0], "content": r[1]} for r in reversed(cur.fetchall())]

            # Генерация: GigaChat → OpenAI → fallback
            answer = (
                ask_gigachat(system_prompt, history[:-1], msg) or
                ask_openai(system_prompt, history[:-1], msg) or
                fallback_answer(bot_avatar, msg)
            )

            cur.execute(
                f"INSERT INTO {tbl('bot_messages')} (bot_id,user_id,role,content) VALUES (%s,%s,'assistant',%s) RETURNING id,created_at",
                (bot_id, user_id, answer)
            )
            bot_row = cur.fetchone()
            conn.commit()

            return {"statusCode": 200, "headers": CORS, "body": json.dumps({
                "user_message": {"id": user_row[0], "role": "user", "content": msg,
                                 "time": user_row[1].strftime("%H:%M")},
                "bot_message":  {"id": bot_row[0], "role": "assistant", "content": answer,
                                 "time": bot_row[1].strftime("%H:%M"),
                                 "bot_name": bot_name, "bot_avatar": bot_avatar},
            })}

    finally:
        conn.close()

    return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}
