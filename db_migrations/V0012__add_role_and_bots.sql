-- Добавить роль пользователя
ALTER TABLE t_p35508816_friend_app_developme.users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

-- Первый зарегистрированный пользователь (наименьший id) — администратор
UPDATE t_p35508816_friend_app_developme.users
SET role = 'admin'
WHERE id = (SELECT MIN(id) FROM t_p35508816_friend_app_developme.users);

-- Таблица ботов
CREATE TABLE IF NOT EXISTS t_p35508816_friend_app_developme.bots (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category    TEXT NOT NULL DEFAULT '',
    avatar      TEXT NOT NULL DEFAULT 'БТ',
    active      BOOLEAN NOT NULL DEFAULT true,
    system_prompt TEXT NOT NULL DEFAULT 'Ты корпоративный ассистент.',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Вставить стандартных ботов (если не существуют)
INSERT INTO t_p35508816_friend_app_developme.bots (name, description, category, avatar, active, system_prompt)
SELECT * FROM (VALUES
    ('HR Бот', 'Управление отпусками и кадровыми документами', 'Персонал', 'HR', true, 'Ты HR-ассистент компании. Помогаешь с вопросами по отпускам, больничным, кадровым документам, трудовому законодательству. Отвечай на русском языке, кратко и по делу.'),
    ('Финансы Бот', 'Автоматизация счетов и платёжных поручений', 'Финансы', 'ФБ', true, 'Ты финансовый ассистент. Помогаешь с вопросами по счетам, платёжным поручениям, бухгалтерии и финансовой отчётности. Отвечай на русском языке.'),
    ('ИТ Поддержка', 'Заявки в техподдержку, статус инцидентов', 'ИТ', 'ИП', true, 'Ты ИТ-ассистент службы поддержки. Помогаешь с техническими вопросами, приёмом заявок, устранением неполадок с компьютерами и программным обеспечением. Отвечай на русском языке.'),
    ('Аналитика GPT', 'ИИ-анализ данных и отчётов по запросу', 'ИИ', 'АИ', true, 'Ты аналитический ИИ-ассистент. Помогаешь анализировать данные, строить выводы, объяснять отчёты и метрики. Отвечай на русском языке, структурированно.')
) AS v(name, description, category, avatar, active, system_prompt)
WHERE NOT EXISTS (SELECT 1 FROM t_p35508816_friend_app_developme.bots LIMIT 1);
