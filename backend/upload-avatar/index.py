"""
Загрузка аватара пользователя.
POST / — загрузить изображение (base64 в JSON), сохранить в S3, обновить avatar_url.
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": CORS, "body": json.dumps({"error": "method_not_allowed"})}

    headers = event.get("headers") or {}
    session_token = headers.get("x-session-id") or headers.get("X-Session-Id")
    if not session_token:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "unauthorized"})}

    body = json.loads(event.get("body") or "{}")
    image_b64 = body.get("image")
    content_type = body.get("content_type", "image/jpeg")

    if not image_b64:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "image_required"})}

    if content_type not in ALLOWED_TYPES:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "invalid_type", "message": "Допустимы jpeg, png, webp, gif"})}

    image_data = base64.b64decode(image_b64)
    if len(image_data) > MAX_SIZE_BYTES:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "too_large", "message": "Файл не должен превышать 5 МБ"})}

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

        ext = content_type.split("/")[-1].replace("jpeg", "jpg")
        key = f"avatars/{user_id}/{uuid.uuid4().hex}.{ext}"

        s3 = get_s3()
        s3.put_object(Bucket="files", Key=key, Body=image_data, ContentType=content_type)

        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        cur.execute(
            "UPDATE users SET avatar_url = %s WHERE id = %s RETURNING id, username, display_name, position, department, phone, avatar_initials, online, avatar_url",
            (cdn_url, user_id)
        )
        u = cur.fetchone()
        conn.commit()

        user = {
            "id": u[0], "username": u[1], "display_name": u[2],
            "position": u[3], "department": u[4], "phone": u[5],
            "avatar_initials": u[6], "online": u[7], "avatar_url": u[8],
        }
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user, "avatar_url": cdn_url})}
    finally:
        conn.close()
