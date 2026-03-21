ALTER TABLE t_p35508816_friend_app_developme.users
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS organization VARCHAR(255) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON t_p35508816_friend_app_developme.users (email) WHERE email IS NOT NULL;

-- Таблица email-кодов (замена sms_codes)
CREATE TABLE IF NOT EXISTS t_p35508816_friend_app_developme.email_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  purpose VARCHAR(20) NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);