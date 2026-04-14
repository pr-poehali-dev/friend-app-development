CREATE TABLE IF NOT EXISTS t_p35508816_friend_app_developme.upload_sessions (
    sess_id      SERIAL PRIMARY KEY,
    upload_id    TEXT NOT NULL UNIQUE,
    user_id      INTEGER NOT NULL REFERENCES t_p35508816_friend_app_developme.users(id),
    file_name    TEXT NOT NULL,
    file_size    BIGINT NOT NULL DEFAULT 0,
    context_key  TEXT NOT NULL DEFAULT 'store',
    chunks_received INTEGER NOT NULL DEFAULT 0,
    total_chunks INTEGER NOT NULL DEFAULT 0,
    done         BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_uid ON t_p35508816_friend_app_developme.upload_sessions(upload_id);
