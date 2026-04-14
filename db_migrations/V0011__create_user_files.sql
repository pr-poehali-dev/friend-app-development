CREATE TABLE IF NOT EXISTS t_p35508816_friend_app_developme.user_files (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES t_p35508816_friend_app_developme.users(id),
    file_name   TEXT NOT NULL,
    file_size   TEXT NOT NULL DEFAULT '0 Б',
    file_url    TEXT NOT NULL,
    mime_type   TEXT NOT NULL DEFAULT 'application/octet-stream',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON t_p35508816_friend_app_developme.user_files(user_id);
