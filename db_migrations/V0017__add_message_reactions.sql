CREATE TABLE IF NOT EXISTS t_p35508816_friend_app_developme.message_reactions (
  id         SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES t_p35508816_friend_app_developme.messages(id),
  user_id    INTEGER NOT NULL REFERENCES t_p35508816_friend_app_developme.users(id),
  emoji      VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_msg ON t_p35508816_friend_app_developme.message_reactions(message_id);
