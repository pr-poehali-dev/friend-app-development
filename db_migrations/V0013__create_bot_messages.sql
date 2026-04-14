CREATE TABLE IF NOT EXISTS t_p35508816_friend_app_developme.bot_messages (
    id         SERIAL PRIMARY KEY,
    bot_id     INTEGER NOT NULL REFERENCES t_p35508816_friend_app_developme.bots(id),
    user_id    INTEGER NOT NULL REFERENCES t_p35508816_friend_app_developme.users(id),
    role       VARCHAR(20) NOT NULL CHECK (role IN ('user','assistant')),
    content    TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bot_messages_bot_user ON t_p35508816_friend_app_developme.bot_messages(bot_id, user_id);
