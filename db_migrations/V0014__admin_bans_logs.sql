-- Назначить Константина Шнюкова (Boss_OT) администратором
UPDATE t_p35508816_friend_app_developme.users SET role = 'admin' WHERE username = 'Boss_OT';

-- Убрать Иван Владимиров из admin (если нужно только один)
-- Оставляем обоих admin пока

-- Добавить таблицу блокировок
CREATE TABLE IF NOT EXISTS t_p35508816_friend_app_developme.user_bans (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES t_p35508816_friend_app_developme.users(id),
    banned_by   INTEGER NOT NULL REFERENCES t_p35508816_friend_app_developme.users(id),
    reason      TEXT,
    banned_until TIMESTAMPTZ,  -- NULL = навсегда
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON t_p35508816_friend_app_developme.user_bans(user_id);

-- Добавить таблицу admin-логов (кто что смотрел — скрытно)
CREATE TABLE IF NOT EXISTS t_p35508816_friend_app_developme.admin_logs (
    id          SERIAL PRIMARY KEY,
    admin_id    INTEGER NOT NULL REFERENCES t_p35508816_friend_app_developme.users(id),
    action      TEXT NOT NULL,
    target_id   INTEGER,
    meta        JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
