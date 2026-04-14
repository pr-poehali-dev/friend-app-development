// ============ INTERNATIONALIZATION ============
// Supported languages: ru (Russian), en (English)

export type Lang = "ru" | "en";

const LANG_KEY = "app_lang";

export function getSavedLang(): Lang {
  return (localStorage.getItem(LANG_KEY) as Lang) || "ru";
}

export function saveLang(lang: Lang) {
  localStorage.setItem(LANG_KEY, lang);
}

// ── Все строки интерфейса ──
export const translations = {
  // Navigation
  nav_chats:     { ru: "Чаты",      en: "Chats" },
  nav_contacts:  { ru: "Контакты",  en: "Contacts" },
  nav_calls:     { ru: "Звонки",    en: "Calls" },
  nav_video:     { ru: "Видео",     en: "Video" },
  nav_files:     { ru: "Файлы",     en: "Files" },
  nav_bots:      { ru: "Боты",      en: "Bots" },
  nav_settings:  { ru: "Настройки", en: "Settings" },
  nav_analytics: { ru: "Аналитика", en: "Analytics" },
  nav_me:        { ru: "Я",         en: "Me" },

  // Login screen
  login_title:       { ru: "ВХОД",                         en: "SIGN IN" },
  login_subtitle:    { ru: "Введите никнейм и пароль",     en: "Enter username and password" },
  login_username:    { ru: "Никнейм",                      en: "Username" },
  login_password:    { ru: "Пароль",                       en: "Password" },
  login_button:      { ru: "ВОЙТИ →",                      en: "SIGN IN →" },
  login_loading:     { ru: "Входим...",                    en: "Signing in..." },
  login_forgot:      { ru: "Забыл пароль",                 en: "Forgot password" },
  login_register:    { ru: "РЕГИСТРАЦИЯ →",                en: "REGISTER →" },

  // Email / Code step
  email_title:       { ru: "EMAIL",                        en: "EMAIL" },
  email_subtitle:    { ru: "Введите email — пришлём код",  en: "Enter email — we'll send a code" },
  email_label:       { ru: "Email / Никнейм",              en: "Email / Username" },
  email_button:      { ru: "ПОЛУЧИТЬ КОД →",               en: "GET CODE →" },
  email_sending:     { ru: "Отправляем...",                en: "Sending..." },
  email_back:        { ru: "← ВЕРНУТЬСЯ К ВХОДУ",          en: "← BACK TO LOGIN" },

  code_title:        { ru: "КОД",                          en: "CODE" },
  code_subtitle:     { ru: "6-значный код на",             en: "6-digit code sent to" },
  code_button:       { ru: "ПРОДОЛЖИТЬ →",                 en: "CONTINUE →" },
  code_checking:     { ru: "Проверяем...",                 en: "Checking..." },
  code_resend:       { ru: "ОТПРАВИТЬ СНОВА",              en: "RESEND CODE" },
  code_resend_timer: { ru: "Повтор через",                 en: "Resend in" },
  code_back:         { ru: "← НАЗАД",                      en: "← BACK" },

  // Registration
  reg_title:         { ru: "РЕГИСТРАЦИЯ",                  en: "REGISTER" },
  reg_subtitle:      { ru: "Создайте аккаунт",             en: "Create an account" },
  reg_name:          { ru: "Имя и фамилия",                en: "Full name" },
  reg_org:           { ru: "Организация",                  en: "Organization" },
  reg_dept:          { ru: "Отдел",                        en: "Department" },
  reg_username:      { ru: "Никнейм",                      en: "Username" },
  reg_username_hint: { ru: "3–30 символов: латиница, цифры, _", en: "3–30 chars: letters, digits, _" },
  reg_password:      { ru: "Пароль",                       en: "Password" },
  reg_password_hint: { ru: "Минимум 6 символов",           en: "At least 6 characters" },
  reg_password2:     { ru: "Повторите пароль",             en: "Confirm password" },
  reg_button:        { ru: "СОЗДАТЬ АККАУНТ →",            en: "CREATE ACCOUNT →" },
  reg_loading:       { ru: "Создаём...",                   en: "Creating..." },

  // Reset password
  reset_title:       { ru: "НОВЫЙ ПАРОЛЬ",                 en: "NEW PASSWORD" },
  reset_button:      { ru: "СОХРАНИТЬ →",                  en: "SAVE →" },
  reset_loading:     { ru: "Сохраняем...",                 en: "Saving..." },

  // Chats
  chats_title:       { ru: "ЧАТЫ",                         en: "CHATS" },
  chats_search:      { ru: "Поиск...",                     en: "Search..." },
  chats_empty:       { ru: "Нет чатов",                    en: "No chats" },
  chats_online:      { ru: "● В сети",                     en: "● Online" },
  chats_offline:     { ru: "Не в сети",                    en: "Offline" },
  chats_group:       { ru: "Групповой чат",                en: "Group chat" },
  chats_select:      { ru: "ВЫБЕРИТЕ ЧАТ",                 en: "SELECT A CHAT" },
  chats_select_sub:  { ru: "Выберите диалог из списка слева", en: "Select a conversation from the list" },

  // Message input
  msg_placeholder:   { ru: "Сообщение...",                 en: "Message..." },
  msg_send:          { ru: "Отправить",                    en: "Send" },
  msg_file:          { ru: "Прикрепить файл",              en: "Attach file" },

  // Contacts
  contacts_title:    { ru: "КОНТАКТЫ",                     en: "CONTACTS" },
  contacts_all:      { ru: "ВСЕ КОНТАКТЫ",                 en: "ALL CONTACTS" },
  contacts_search:   { ru: "Поиск...",                     en: "Search..." },
  contacts_empty:    { ru: "НЕТ ДАННЫХ",                   en: "NO DATA" },
  contacts_none:     { ru: "НЕТ КОНТАКТОВ",                en: "NO CONTACTS" },
  contacts_none_sub: { ru: "Добавьте контакт вручную или отправьте пригласительную ссылку", en: "Add a contact manually or send an invite link" },
  contacts_add:      { ru: "ДОБАВИТЬ",                     en: "ADD" },
  contacts_add_manual: { ru: "ДОБАВИТЬ ВРУЧНУЮ",           en: "ADD MANUALLY" },
  contacts_invite:   { ru: "ПРИГЛАСИТЬ",                   en: "INVITE" },
  contacts_send_link: { ru: "ОТПРАВИТЬ ССЫЛКУ",            en: "SEND LINK" },
  contacts_chat:     { ru: "ЧАТ",                          en: "CHAT" },
  contacts_call:     { ru: "ЗВОНОК",                       en: "CALL" },
  contacts_video:    { ru: "ВИДЕО",                        en: "VIDEO" },
  contacts_not_reg:  { ru: "Не зарегистрирован в системе", en: "Not registered in system" },

  // Calls
  calls_title:       { ru: "ЗВОНКИ",                       en: "CALLS" },
  calls_empty:       { ru: "НЕТ ДАННЫХ",                   en: "NO DATA" },
  calls_new:         { ru: "НОВЫЙ ЗВОНОК",                 en: "NEW CALL" },
  calls_new_sub:     { ru: "Выберите контакт для звонка",  en: "Select a contact to call" },
  calls_audio:       { ru: "АУДИОЗВОНОК",                  en: "AUDIO CALL" },
  calls_video_call:  { ru: "ВИДЕОЗВОНОК",                  en: "VIDEO CALL" },

  // Video
  video_title:       { ru: "ВИДЕОЗВОНОК",                  en: "VIDEO CALL" },
  video_select:      { ru: "Выберите контакт",             en: "Select contact" },
  video_heading:     { ru: "ВИДЕОЗВОНКИ",                  en: "VIDEO CALLS" },
  video_sub:         { ru: "Выберите контакт слева для начала видеозвонка", en: "Select a contact on the left to start a video call" },

  // Files
  files_title:       { ru: "ФАЙЛЫ",                        en: "FILES" },
  files_sub:         { ru: "Все файлы переписок",          en: "All conversation files" },
  files_upload:      { ru: "ЗАГРУЗИТЬ",                    en: "UPLOAD" },
  files_name:        { ru: "Имя файла",                    en: "File name" },
  files_size:        { ru: "Размер",                       en: "Size" },
  files_sender:      { ru: "Отправитель",                  en: "Sender" },
  files_date:        { ru: "Дата",                         en: "Date" },
  files_today:       { ru: "Сегодня",                      en: "Today" },
  files_yesterday:   { ru: "Вчера",                        en: "Yesterday" },
  files_empty:       { ru: "Нет файлов",                   en: "No files" },

  // Bots
  bots_title:        { ru: "БОТЫ",                         en: "BOTS" },
  bots_sub:          { ru: "Корпоративные автоматизации",  en: "Corporate automations" },
  bots_create:       { ru: "СОЗДАТЬ БОТА",                 en: "CREATE BOT" },
  bots_requests:     { ru: "запросов",                     en: "requests" },
  bots_open:         { ru: "ОТКРЫТЬ →",                    en: "OPEN →" },
  bots_active:       { ru: "активен",                      en: "active" },
  bots_inactive:     { ru: "неактивен",                    en: "inactive" },

  // Analytics
  analytics_title:   { ru: "АНАЛИТИКА",                    en: "ANALYTICS" },
  analytics_sub:     { ru: "Панель администратора",        en: "Admin dashboard" },
  analytics_users:   { ru: "Активных пользователей",       en: "Active users" },
  analytics_msgs:    { ru: "Сообщений в системе",          en: "Messages in system" },
  analytics_chats:   { ru: "Активных чатов",               en: "Active chats" },
  analytics_bots:    { ru: "Ботов запущено",               en: "Bots running" },
  analytics_members: { ru: "УЧАСТНИКИ",                    en: "MEMBERS" },
  analytics_online:  { ru: "в сети",                       en: "online" },

  // Settings
  settings_title:    { ru: "НАСТРОЙКИ",                    en: "SETTINGS" },
  settings_appearance: { ru: "ОФОРМЛЕНИЕ",                 en: "APPEARANCE" },
  settings_theme:    { ru: "Выберите цветовую тему интерфейса", en: "Choose interface color theme" },
  settings_wallpaper: { ru: "Обои чата",                   en: "Chat wallpaper" },
  settings_no_wallpaper: { ru: "Без обоев",                en: "No wallpaper" },
  settings_profile:  { ru: "ПРОФИЛЬ",                      en: "PROFILE" },
  settings_name:     { ru: "Имя и фамилия",                en: "Full name" },
  settings_position: { ru: "Должность",                    en: "Position" },
  settings_org:      { ru: "Организация",                  en: "Organization" },
  settings_dept:     { ru: "Отдел",                        en: "Department" },
  settings_phone:    { ru: "Телефон",                      en: "Phone" },
  settings_save:     { ru: "СОХРАНИТЬ",                    en: "SAVE" },
  settings_saving:   { ru: "Сохраняем...",                 en: "Saving..." },
  settings_saved:    { ru: "Сохранено!",                   en: "Saved!" },
  settings_logout:   { ru: "ВЫЙТИ ИЗ АККАУНТА",           en: "SIGN OUT" },
  settings_avatar:   { ru: "Сменить фото",                 en: "Change photo" },
  settings_danger:   { ru: "ВЫХОД",                        en: "SIGN OUT" },
  settings_language: { ru: "ЯЗЫК",                         en: "LANGUAGE" },

  // Add Contact Modal
  add_contact_title:  { ru: "ДОБАВИТЬ КОНТАКТ",            en: "ADD CONTACT" },
  add_manual_tab:     { ru: "ВРУЧНУЮ",                     en: "MANUALLY" },
  add_csv_tab:        { ru: "ЗАГРУЗИТЬ CSV",               en: "UPLOAD CSV" },
  add_name:           { ru: "Имя*",                        en: "Name*" },
  add_phone:          { ru: "Телефон",                     en: "Phone" },
  add_email:          { ru: "Email",                       en: "Email" },
  add_position:       { ru: "Должность",                   en: "Position" },
  add_dept:           { ru: "Отдел",                       en: "Department" },
  add_csv_drop:       { ru: "Перетащите CSV или выберите файл", en: "Drop CSV or choose file" },
  add_csv_cols:       { ru: "Колонки: name, phone, email, position, department", en: "Columns: name, phone, email, position, department" },
  add_cancel:         { ru: "ОТМЕНА",                      en: "CANCEL" },
  add_button:         { ru: "ДОБАВИТЬ",                    en: "ADD" },
  add_loading:        { ru: "Добавляем...",                en: "Adding..." },
  add_import:         { ru: "ИМПОРТИРОВАТЬ",               en: "IMPORT" },
  add_importing:      { ru: "Импортируем...",              en: "Importing..." },

  // Invite Modal
  invite_title:       { ru: "ПРИГЛАСИТЕЛЬНЫЕ ССЫЛКИ",      en: "INVITE LINKS" },
  invite_new:         { ru: "СОЗДАТЬ НОВУЮ ССЫЛКУ",        en: "CREATE NEW LINK" },
  invite_label_ph:    { ru: "Название (необязательно)",    en: "Label (optional)" },
  invite_create:      { ru: "СОЗДАТЬ",                     en: "CREATE" },
  invite_creating:    { ru: "...",                         en: "..." },
  invite_empty:       { ru: "Нет ссылок. Создайте первую!", en: "No links yet. Create one!" },
  invite_unnamed:     { ru: "Без названия",                en: "Unnamed" },
  invite_uses:        { ru: "переходов",                   en: "uses" },
  invite_copy:        { ru: "КОПИРОВАТЬ",                  en: "COPY" },
  invite_copied:      { ru: "СКОПИРОВАНО",                 en: "COPIED" },
  invite_qr:          { ru: "QR-КОД",                     en: "QR CODE" },
  invite_share:       { ru: "ПОДЕЛИТЬСЯ",                  en: "SHARE" },
  invite_email:       { ru: "EMAIL",                       en: "EMAIL" },
  invite_download:    { ru: "СКАЧАТЬ",                     en: "DOWNLOAD" },
  invite_hide_qr:     { ru: "СКРЫТЬ QR",                   en: "HIDE QR" },

  // Join Page
  join_label:         { ru: "ПРИГЛАШЕНИЕ",                 en: "INVITATION" },
  join_title:         { ru: "Присоединиться",              en: "Join" },
  join_desc:          { ru: "Нажмите кнопку, чтобы добавиться в список контактов этого пользователя и получить возможность общаться, звонить и видеозванивать.", en: "Press the button to be added to this user's contacts and be able to chat, call, and video call." },
  join_button:        { ru: "ПРИСОЕДИНИТЬСЯ",              en: "JOIN" },
  join_login_button:  { ru: "ВОЙТИ И ПРИСОЕДИНИТЬСЯ",      en: "SIGN IN & JOIN" },
  join_success:       { ru: "Вы добавлены!",               en: "You're added!" },
  join_redirect:      { ru: "Переходим в приложение...",   en: "Redirecting to app..." },
  join_uses:          { ru: "Уже перешли:",                en: "Already joined:" },
  join_invalid:       { ru: "Ссылка недействительна",      en: "Link is invalid" },
  join_load_error:    { ru: "Ошибка загрузки",             en: "Loading error" },
  join_conn_error:    { ru: "Ошибка соединения",           en: "Connection error" },

  // Common
  common_back:        { ru: "← НАЗАД",                     en: "← BACK" },
  common_close:       { ru: "Закрыть",                     en: "Close" },
  common_error:       { ru: "Ошибка",                      en: "Error" },
  common_conn_error:  { ru: "Ошибка соединения",           en: "Connection error" },
  common_loading:     { ru: "Загрузка...",                 en: "Loading..." },
  common_no_data:     { ru: "НЕТ ДАННЫХ",                  en: "NO DATA" },
  common_search:      { ru: "Поиск...",                    en: "Search..." },
  common_cancel:      { ru: "ОТМЕНА",                      en: "CANCEL" },
  common_save:        { ru: "СОХРАНИТЬ",                   en: "SAVE" },
  common_online:      { ru: "В сети",                      en: "Online" },
  common_offline:     { ru: "Не в сети",                   en: "Offline" },
  common_select_chat: { ru: "ВЫБЕРИТЕ ЧАТ",                en: "SELECT A CHAT" },
} as const;

export type TKey = keyof typeof translations;

export function t(key: TKey, lang: Lang): string {
  return translations[key][lang];
}
