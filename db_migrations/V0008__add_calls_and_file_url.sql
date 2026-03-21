-- Поле file_url в messages
ALTER TABLE t_p35508816_friend_app_developme.messages
  ADD COLUMN IF NOT EXISTS file_url TEXT NULL;

-- Таблица звонков
CREATE TABLE IF NOT EXISTS t_p35508816_friend_app_developme.calls (
  id SERIAL PRIMARY KEY,
  caller_id INTEGER NOT NULL REFERENCES t_p35508816_friend_app_developme.users(id),
  callee_id INTEGER NOT NULL REFERENCES t_p35508816_friend_app_developme.users(id),
  call_type VARCHAR(10) NOT NULL DEFAULT 'audio',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ NULL,
  duration INTEGER NULL
);

-- Таблица WebRTC сигналинга
CREATE TABLE IF NOT EXISTS t_p35508816_friend_app_developme.webrtc_signals (
  id SERIAL PRIMARY KEY,
  call_id INTEGER NOT NULL REFERENCES t_p35508816_friend_app_developme.calls(id),
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  signal_type VARCHAR(20) NOT NULL,
  payload TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);