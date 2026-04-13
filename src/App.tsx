import { useState, useEffect, useCallback, createContext, useContext } from "react";
import Icon from "@/components/ui/icon";

// ===== THEME =====
export type ThemeId = "dark-blue" | "whatsapp" | "telegram" | "light" | "purple" | "slate" | "teal";

export const THEMES: { id: ThemeId; name: string; accent: string; bg: string; preview: string[] }[] = [
  { id: "dark-blue", name: "Тёмно-синяя",    accent: "#4a9eff", bg: "#0a1120", preview: ["#0a1120","#111827","#4a9eff","#1a3a5c"] },
  { id: "whatsapp",  name: "WhatsApp",        accent: "#00a884", bg: "#202c33", preview: ["#202c33","#111b21","#00a884","#005c4b"] },
  { id: "telegram",  name: "Telegram",        accent: "#5288c1", bg: "#232e3c", preview: ["#232e3c","#17212b","#5288c1","#2b5278"] },
  { id: "light",     name: "Светлая",         accent: "#00a884", bg: "#ffffff", preview: ["#ffffff","#f0f2f5","#00a884","#d9fdd3"] },
  { id: "purple",    name: "Фиолетовая",      accent: "#a855f7", bg: "#1e1035", preview: ["#1e1035","#160b28","#a855f7","#5b21b6"] },
  { id: "slate",     name: "Тёмно-серая",     accent: "#e8912d", bg: "#222529", preview: ["#222529","#19191d","#e8912d","#3f0e40"] },
  { id: "teal",      name: "Аквамариновая",   accent: "#14b8a6", bg: "#0f2523", preview: ["#0f2523","#0a1a19","#14b8a6","#134e4a"] },
];

const ThemeContext = createContext<{ theme: ThemeId; setTheme: (t: ThemeId) => void }>({ theme: "dark-blue", setTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => (localStorage.getItem("app_theme") as ThemeId) || "dark-blue");
  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem("app_theme", t);
    document.body.setAttribute("data-theme", t);
  };
  useEffect(() => { document.body.setAttribute("data-theme", theme); }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

// T — shortcut для CSS-переменных темы
const T = {
  bgDeep:   "var(--t-bg-deep)",
  bgMain:   "var(--t-bg-main)",
  bgPanel:  "var(--t-bg-panel)",
  bgHover:  "var(--t-bg-hover)",
  bgActive: "var(--t-bg-active)",
  bgCard:   "var(--t-bg-card)",
  border:   "var(--t-border)",
  borderMd: "var(--t-border-md)",
  accent:   "var(--t-accent)",
  accent2:  "var(--t-accent-2)",
  text:     "var(--t-text)",
  muted:    "var(--t-text-muted)",
  dim:      "var(--t-text-dim)",
  online:   "var(--t-online)",
  danger:   "var(--t-danger)",
  msgOwnBg: "var(--t-msg-own-bg)",
  msgOwnBr: "var(--t-msg-own-br)",
  chatBg:   "var(--t-chat-bg)",
};

const API = {
  auth: "https://functions.poehali.dev/959bee44-9a42-4a9f-b352-21605b616456",
  chats: "https://functions.poehali.dev/871abe69-bab0-4421-9d49-eac8a87cbbab",
  messages: "https://functions.poehali.dev/3a4d8e8d-6ec2-41f4-8084-57c7800b94a3",
  profile: "https://functions.poehali.dev/eb1e5ec8-553a-4b79-a005-3fa365d9667b",
  avatar: "https://functions.poehali.dev/164ba4b4-9b9c-4668-8ca1-0bf6fbcbf6ab",
  calls: "https://functions.poehali.dev/af1c4fda-8213-498e-baac-420159c8fc6e",
};

type Section = "chats" | "contacts" | "calls" | "video" | "files" | "bots" | "settings" | "analytics";

interface User {
  id: number;
  username: string;
  display_name: string;
  position?: string;
  department?: string;
  organization?: string;
  email?: string;
  avatar_initials: string;
  avatar_url?: string;
  online: boolean;
}

interface Chat {
  id: number;
  type: string;
  name: string;
  avatar: string;
  online: boolean;
  last_message: string;
  last_time: string;
  unread: number;
}

interface Message {
  id: number;
  text: string;
  type: string;
  file_name?: string;
  file_size?: string;
  file_url?: string;
  time: string;
  sender_id: number;
  sender_name: string;
  sender_avatar: string;
  own: boolean;
}

interface CallRecord {
  id: number;
  type: "incoming" | "outgoing" | "missed";
  call_type: string;
  status: string;
  name: string;
  avatar: string;
  time: string;
  duration: string;
  is_video: boolean;
}

interface Contact {
  id: number;
  username: string;
  display_name: string;
  position?: string;
  department?: string;
  phone?: string;
  avatar_initials: string;
  online: boolean;
}

const STATIC_FILES = [
  { id: 1, name: "Отчёт_Q4_2025.xlsx", size: "2.4 МБ", type: "doc" as const, sender: "Алексей Морозов", date: "Сегодня" },
  { id: 2, name: "Презентация_инвесторы.pptx", size: "8.7 МБ", type: "doc" as const, sender: "Мария Белова", date: "Вчера" },
  { id: 3, name: "Схема_архитектуры.png", size: "1.2 МБ", type: "img" as const, sender: "Сергей Ковалёв", date: "Вчера" },
  { id: 4, name: "Договор_поставки.zip", size: "4.1 МБ", type: "archive" as const, sender: "Елена Смирнова", date: "Пн" },
];

const STATIC_CALLS = [
  { id: 1, name: "Алексей Морозов", type: "outgoing" as const, duration: "12:34", time: "Сегодня, 09:15", avatar: "АМ", isVideo: false },
  { id: 2, name: "Проектная группа", type: "incoming" as const, duration: "45:02", time: "Сегодня, 08:30", avatar: "ПГ", isVideo: true },
  { id: 3, name: "Мария Белова", type: "missed" as const, duration: "—", time: "Вчера, 17:42", avatar: "МБ", isVideo: false },
];

const STATIC_BOTS = [
  { id: 1, name: "HR Бот", description: "Управление отпусками и кадровыми документами", category: "Персонал", active: true, avatar: "HR", requests: 1204 },
  { id: 2, name: "Финансы Бот", description: "Автоматизация счетов и платёжных поручений", category: "Финансы", active: true, avatar: "ФБ", requests: 847 },
  { id: 3, name: "ИТ Поддержка", description: "Заявки в техподдержку, статус инцидентов", category: "ИТ", active: true, avatar: "ИП", requests: 2391 },
  { id: 4, name: "Аналитика GPT", description: "ИИ-анализ данных и отчётов по запросу", category: "ИИ", active: true, avatar: "АИ", requests: 589 },
];

const navItems = [
  { id: "chats" as Section, icon: "MessageSquare", label: "Чаты" },
  { id: "contacts" as Section, icon: "Users", label: "Контакты" },
  { id: "calls" as Section, icon: "Phone", label: "Звонки" },
  { id: "video" as Section, icon: "Video", label: "Видео" },
  { id: "files" as Section, icon: "FolderOpen", label: "Файлы" },
  { id: "bots" as Section, icon: "Bot", label: "Боты" },
];

const bottomNav = [
  { id: "settings" as Section, icon: "Settings", label: "Настройки" },
  { id: "analytics" as Section, icon: "BarChart2", label: "Аналитика" },
];

function AvatarBadge({ initials, size = "md", online }: { initials: string; size?: "sm" | "md" | "lg"; online?: boolean }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} rounded-sm bg-[#1a2332] text-[#4a9eff] font-medium flex items-center justify-center border border-[#2a3548] tracking-wider`}>
        {initials}
      </div>
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d1421] ${online ? "bg-[#22c55e]" : "bg-[#4a5568]"}`} />
      )}
    </div>
  );
}

function FileIconComp({ type }: { type: "doc" | "img" | "archive" | "audio" | "video" }) {
  const map = { doc: { icon: "FileText", color: "text-[#4a9eff]" }, img: { icon: "Image", color: "text-[#22c55e]" }, archive: { icon: "Archive", color: "text-[#f59e0b]" }, audio: { icon: "Music", color: "text-[#a78bfa]" }, video: { icon: "Film", color: "text-[#f87171]" } };
  const { icon, color } = map[type];
  return <Icon name={icon} size={20} className={color} />;
}

// ============ EMAIL AUTH SCREEN ============
type AuthStep = "login" | "forgot" | "email_code" | "register" | "reset_password";

const inputCls = "w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all backdrop-blur-sm";
const inputWithIconCls = "w-full bg-white/10 border border-white/20 rounded-lg pl-9 pr-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/60 focus:bg-white/15 transition-all backdrop-blur-sm";
const btnPrimary = "w-full py-3 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden";
const errBox = "flex items-center gap-2 text-[11px] text-red-200 bg-red-500/20 border border-red-400/30 rounded-lg px-3 py-2.5 backdrop-blur-sm";
const label = "block text-[10px] font-semibold text-white/50 uppercase tracking-widest mb-2";

function Spinner() {
  return <span className="w-4 h-4 border-2 border-[#080f1a]/30 border-t-[#080f1a] rounded-full animate-spin inline-block" />;
}

function LoginScreen({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [step, setStep] = useState<AuthStep>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [tempToken, setTempToken] = useState("");
  const [purpose, setPurpose] = useState<"register" | "login">("register");
  const [displayName, setDisplayName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [organization, setOrganization] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const codeRefs = Array.from({ length: 6 }, () => null) as (HTMLInputElement | null)[];

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = setTimeout(() => setResendTimer(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const setErr = (msg: string) => setError(msg);
  const clearErr = () => setError("");

  // ── Войти по паролю ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setErr("Заполните все поля"); return; }
    setLoading(true); clearErr();
    try {
      const res = await fetch(API.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || "Неверный никнейм или пароль"); return; }
      localStorage.setItem("session_token", data.token);
      onLogin(data.user, data.token);
    } catch { setErr("Ошибка соединения"); }
    finally { setLoading(false); }
  };

  // ── Отправить код на email ──
  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim()) { setErr("Введите email"); return; }
    setLoading(true); clearErr();
    try {
      const res = await fetch(API.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_code", email: email.trim() }),
      });
      const data = await res.json();
      if (res.status === 429) { setErr(data.message || "Подождите перед повторной отправкой"); return; }
      if (!res.ok) { setErr(data.message || "Не удалось отправить письмо"); return; }
      setPurpose(data.purpose);
      setStep("email_code");
      setResendTimer(60);
      setCode(["", "", "", "", "", ""]);
    } catch { setErr("Ошибка соединения"); }
    finally { setLoading(false); }
  };

  // ── Проверить код из email ──
  const handleVerifyCode = async (codeArr?: string[]) => {
    const codeStr = (codeArr || code).join("");
    if (codeStr.length < 6) { setErr("Введите 6 цифр кода"); return; }
    setLoading(true); clearErr();
    try {
      const res = await fetch(API.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_code", email: email.trim(), code: codeStr }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || "Неверный код"); setCode(["","","","","",""]); return; }
      setTempToken(data.temp_token);
      setStep(data.purpose === "register" ? "register" : "reset_password");
    } catch { setErr("Ошибка соединения"); }
    finally { setLoading(false); }
  };

  const handleCodeChange = (idx: number, val: string, refs: (HTMLInputElement | null)[]) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code]; next[idx] = digit; setCode(next); clearErr();
    if (digit && idx < 5) refs[idx + 1]?.focus();
  };

  const handleCodeKey = (idx: number, e: React.KeyboardEvent, refs: (HTMLInputElement | null)[]) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) refs[idx - 1]?.focus();
  };

  // ── Завершить регистрацию ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setErr("Введите имя"); return; }
    if (!newUsername.trim()) { setErr("Введите никнейм"); return; }
    if (newPassword.length < 6) { setErr("Пароль должен быть не менее 6 символов"); return; }
    if (newPassword !== newPassword2) { setErr("Пароли не совпадают"); return; }
    setLoading(true); clearErr();
    try {
      const res = await fetch(API.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          email: email.trim(),
          temp_token: tempToken,
          username: newUsername.trim(),
          password: newPassword,
          display_name: displayName.trim(),
          organization: organization.trim(),
          department: department.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || "Ошибка регистрации"); return; }
      localStorage.setItem("session_token", data.token);
      onLogin(data.user, data.token);
    } catch { setErr("Ошибка соединения"); }
    finally { setLoading(false); }
  };

  // ── Сброс пароля ──
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setErr("Пароль должен быть не менее 6 символов"); return; }
    if (newPassword !== newPassword2) { setErr("Пароли не совпадают"); return; }
    setLoading(true); clearErr();
    try {
      const res = await fetch(API.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", email: email.trim(), temp_token: tempToken, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || "Ошибка сброса пароля"); return; }
      localStorage.setItem("session_token", data.token);
      onLogin(data.user, data.token);
    } catch { setErr("Ошибка соединения"); }
    finally { setLoading(false); }
  };

  const codeComplete = code.every(d => d !== "");

  return (
    <div className="flex h-screen w-screen overflow-hidden relative" style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d1f3c 25%, #0a2448 50%, #0d1f3c 75%, #0a1628 100%)" }}>
      {/* Переливающийся перламутровый фон */}
      <div className="absolute inset-0 pointer-events-none" style={{ animation: "pearlShift 8s ease-in-out infinite" }} >
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(100,180,255,0.18) 0%, transparent 55%)", animation: "drift1 7s ease-in-out infinite alternate" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 30%, rgba(160,120,255,0.14) 0%, transparent 50%)", animation: "drift2 9s ease-in-out infinite alternate" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 55% 80%, rgba(80,220,220,0.10) 0%, transparent 45%)", animation: "drift3 11s ease-in-out infinite alternate" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 40% 20%, rgba(180,140,255,0.08) 0%, transparent 40%)", animation: "drift1 13s ease-in-out infinite alternate-reverse" }} />
      </div>
      {/* Мерцающие частицы */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <div key={i} className="absolute rounded-full" style={{
            width: `${2 + (i % 3)}px`, height: `${2 + (i % 3)}px`,
            left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`,
            background: i % 3 === 0 ? "rgba(160,200,255,0.6)" : i % 3 === 1 ? "rgba(180,150,255,0.5)" : "rgba(100,230,230,0.5)",
            animation: `sparkle ${3 + (i % 4)}s ease-in-out ${(i * 0.4) % 3}s infinite`,
          }} />
        ))}
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 flex-col justify-between p-10 relative overflow-hidden" style={{ borderRight: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(160deg, rgba(120,180,255,0.06) 0%, transparent 60%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #5ab4ff, #a78bfa)", boxShadow: "0 0 20px rgba(90,180,255,0.4)" }}>
              <span className="text-white font-bold text-base">Д</span>
            </div>
            <span className="text-sm font-semibold text-white/90 tracking-wide">Друг</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold leading-snug mb-4" style={{ background: "linear-gradient(135deg, #e0f0ff, #c4b5fd, #7dd3fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Корпоративный<br />мессенджер</h1>
            <p className="text-sm text-white/40 leading-relaxed">Безопасная связь для вашей команды. Чаты, звонки, файлы и боты в одном месте.</p>
          </div>
        </div>
        <div className="relative z-10 space-y-3">
          {[{ icon: "Shield", text: "Сквозное шифрование" }, { icon: "Zap", text: "Мгновенная доставка" }, { icon: "Users", text: "До 10 000 пользователей" }].map(f => (
            <div key={f.text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(90,180,255,0.15)", border: "1px solid rgba(90,180,255,0.25)" }}>
                <Icon name={f.icon} size={13} className="text-sky-300" />
              </div>
              <span className="text-xs text-white/50">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-8 overflow-y-auto py-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #5ab4ff, #a78bfa)" }}>
              <span className="text-white font-bold text-base">Д</span>
            </div>
            <span className="text-sm font-semibold text-white/90">Друг</span>
          </div>

          {/* STEP: LOGIN */}
          {step === "login" && (
            <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
              <div className="mb-8 p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(20px)" }}>
                <h2 className="text-xl font-semibold text-white mb-1.5">Вход</h2>
                <p className="text-xs text-white/40 mb-6">Введите никнейм и пароль</p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className={label}>Никнейм</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="AtSign" size={15} className="text-white/40" /></div>
                      <input type="text" value={username} onChange={e => { setUsername(e.target.value); clearErr(); }}
                        placeholder="username" autoFocus autoComplete="username"
                        className={inputWithIconCls} />
                    </div>
                  </div>
                  <div>
                    <label className={label}>Пароль</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="Lock" size={15} className="text-white/40" /></div>
                      <input type={showPass ? "text" : "password"} value={password}
                        onChange={e => { setPassword(e.target.value); clearErr(); }}
                        placeholder="••••••••" autoComplete="current-password"
                        className={inputWithIconCls + " pr-10"} />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                        <Icon name={showPass ? "EyeOff" : "Eye"} size={15} />
                      </button>
                    </div>
                  </div>
                  {error && <div className={errBox}><Icon name="AlertCircle" size={12} />{error}</div>}
                  <button type="submit" disabled={loading || !username.trim() || !password.trim()} className={btnPrimary} style={{ background: "linear-gradient(135deg, #5ab4ff, #a78bfa, #5ab4ff)", backgroundSize: "200% 100%", animation: loading ? "none" : "shimmer 3s linear infinite", boxShadow: "0 4px 20px rgba(90,180,255,0.3)" }}>
                    {loading ? <span className="flex items-center justify-center gap-2"><Spinner />Входим...</span> : "Войти →"}
                  </button>
                </form>
                <div className="mt-5 flex justify-between items-center">
                  <button onClick={() => { setStep("forgot"); clearErr(); setEmail(""); }}
                    className="text-xs text-white/40 hover:text-white/70 transition-colors">
                    Забыл пароль
                  </button>
                  <button onClick={() => { setStep("forgot"); clearErr(); setEmail(""); }}
                    className="text-xs text-sky-300 hover:text-sky-200 transition-colors">
                    Регистрация →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP: FORGOT / REGISTER start (email input) */}
          {step === "forgot" && (
            <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
              <button onClick={() => { setStep("login"); clearErr(); }} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 mb-6 transition-colors">
                <Icon name="ArrowLeft" size={13} /> Назад
              </button>
              <div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(20px)" }}>
                <h2 className="text-xl font-semibold text-white mb-1.5">Email</h2>
                <p className="text-xs text-white/40 mb-6">Введите email — пришлём код для входа или регистрации</p>
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div>
                    <label className={label}>Email</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="Mail" size={15} className="text-white/40" /></div>
                      <input type="email" value={email} onChange={e => { setEmail(e.target.value); clearErr(); }}
                        placeholder="you@company.ru" autoFocus autoComplete="email"
                        className={inputWithIconCls} />
                    </div>
                  </div>
                  {error && <div className={errBox}><Icon name="AlertCircle" size={12} />{error}</div>}
                  <button type="submit" disabled={loading || !email.trim()} className={btnPrimary} style={{ background: "linear-gradient(135deg, #5ab4ff, #a78bfa, #5ab4ff)", backgroundSize: "200% 100%", animation: loading ? "none" : "shimmer 3s linear infinite", boxShadow: "0 4px 20px rgba(90,180,255,0.3)" }}>
                    {loading ? <span className="flex items-center justify-center gap-2"><Spinner />Отправляем...</span> : "Получить код →"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP: EMAIL CODE */}
          {step === "email_code" && (
            <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
              <button onClick={() => { setStep("forgot"); setCode(["","","","","",""]); clearErr(); }} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 mb-6 transition-colors">
                <Icon name="ArrowLeft" size={13} /> Назад
              </button>
              <div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(20px)" }}>
                <h2 className="text-xl font-semibold text-white mb-1.5">Код из письма</h2>
                <p className="text-xs text-white/40 mb-6">Отправили 6-значный код на <span className="text-sky-300">{email}</span></p>
                <div className="flex gap-2 mb-6">
                  {code.map((digit, idx) => (
                    <input key={idx} type="text" inputMode="numeric" maxLength={1} value={digit}
                      ref={el => { codeRefs[idx] = el; }}
                      onChange={e => handleCodeChange(idx, e.target.value, codeRefs)}
                      onKeyDown={e => handleCodeKey(idx, e, codeRefs)}
                      onFocus={e => e.target.select()}
                      className={`w-11 h-12 text-center text-xl font-mono font-semibold rounded-lg focus:outline-none transition-all backdrop-blur-sm ${digit ? "text-white" : "text-white/30"} ${loading ? "opacity-50" : ""}`}
                      style={{ background: digit ? "rgba(90,180,255,0.2)" : "rgba(255,255,255,0.08)", border: digit ? "1px solid rgba(90,180,255,0.5)" : "1px solid rgba(255,255,255,0.15)" }}
                      autoFocus={idx === 0} />
                  ))}
                </div>
                {error && <div className={errBox + " mb-4"}><Icon name="AlertCircle" size={12} />{error}</div>}
                <button onClick={() => handleVerifyCode()} disabled={!codeComplete || loading} className={btnPrimary + " mb-4"} style={{ background: "linear-gradient(135deg, #5ab4ff, #a78bfa, #5ab4ff)", backgroundSize: "200% 100%", animation: loading ? "none" : "shimmer 3s linear infinite", boxShadow: "0 4px 20px rgba(90,180,255,0.3)" }}>
                  {loading ? <span className="flex items-center justify-center gap-2"><Spinner />Проверяем...</span> : "Продолжить →"}
                </button>
                <div className="text-center">
                  {resendTimer > 0
                    ? <span className="text-xs text-white/30">Повторная отправка через <span className="font-mono text-white/60">{resendTimer}с</span></span>
                    : <button onClick={() => handleSendCode()} className="text-xs text-sky-300 hover:text-sky-200 transition-colors">Отправить код повторно</button>
                  }
                </div>
              </div>
            </div>
          )}

          {/* STEP: REGISTER */}
          {step === "register" && (
            <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
              <div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(20px)" }}>
                <h2 className="text-xl font-semibold text-white mb-1.5">Регистрация</h2>
                <p className="text-xs text-white/40 mb-6">Заполните данные для создания аккаунта</p>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className={label}>Имя и фамилия</label>
                    <input value={displayName} onChange={e => { setDisplayName(e.target.value); clearErr(); }}
                      placeholder="Иван Петров" autoFocus className={inputCls} />
                  </div>
                  <div>
                    <label className={label}>Никнейм</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="AtSign" size={15} className="text-white/40" /></div>
                      <input value={newUsername} onChange={e => { setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "")); clearErr(); }}
                        placeholder="ivan_petrov" autoComplete="username"
                        className={inputWithIconCls} />
                    </div>
                    <p className="text-[10px] text-white/30 mt-1">3–30 символов: латиница, цифры, _</p>
                  </div>
                  <div>
                    <label className={label}>Организация</label>
                    <input value={organization} onChange={e => { setOrganization(e.target.value); clearErr(); }}
                      placeholder="ООО Ромашка" className={inputCls} />
                  </div>
                  <div>
                    <label className={label}>Подразделение</label>
                    <input value={department} onChange={e => { setDepartment(e.target.value); clearErr(); }}
                      placeholder="Отдел разработки" className={inputCls} />
                  </div>
                  <div>
                    <label className={label}>Пароль</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="Lock" size={15} className="text-white/40" /></div>
                      <input type={showPass ? "text" : "password"} value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); clearErr(); }}
                        placeholder="Минимум 6 символов" autoComplete="new-password"
                        className={inputWithIconCls + " pr-10"} />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                        <Icon name={showPass ? "EyeOff" : "Eye"} size={15} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={label}>Повторите пароль</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="Lock" size={15} className="text-white/40" /></div>
                      <input type={showPass ? "text" : "password"} value={newPassword2}
                        onChange={e => { setNewPassword2(e.target.value); clearErr(); }}
                        placeholder="••••••••" autoComplete="new-password"
                        className={inputWithIconCls} />
                    </div>
                  </div>
                  {error && <div className={errBox}><Icon name="AlertCircle" size={12} />{error}</div>}
                  <button type="submit" disabled={loading || !displayName.trim() || !newUsername.trim() || newPassword.length < 6} className={btnPrimary} style={{ background: "linear-gradient(135deg, #5ab4ff, #a78bfa, #5ab4ff)", backgroundSize: "200% 100%", animation: loading ? "none" : "shimmer 3s linear infinite", boxShadow: "0 4px 20px rgba(90,180,255,0.3)" }}>
                    {loading ? <span className="flex items-center justify-center gap-2"><Spinner />Создаём аккаунт...</span> : "Создать аккаунт →"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP: RESET PASSWORD */}
          {step === "reset_password" && (
            <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
              <div className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(20px)" }}>
                <h2 className="text-xl font-semibold text-white mb-1.5">Новый пароль</h2>
                <p className="text-xs text-white/40 mb-6">Придумайте новый пароль для аккаунта</p>
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className={label}>Новый пароль</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="Lock" size={15} className="text-white/40" /></div>
                      <input type={showPass ? "text" : "password"} value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); clearErr(); }}
                        placeholder="Минимум 6 символов" autoFocus autoComplete="new-password"
                        className={inputWithIconCls + " pr-10"} />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                        <Icon name={showPass ? "EyeOff" : "Eye"} size={15} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={label}>Повторите пароль</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="Lock" size={15} className="text-white/40" /></div>
                      <input type={showPass ? "text" : "password"} value={newPassword2}
                        onChange={e => { setNewPassword2(e.target.value); clearErr(); }}
                        placeholder="••••••••" autoComplete="new-password"
                        className={inputWithIconCls} />
                    </div>
                  </div>
                  {error && <div className={errBox}><Icon name="AlertCircle" size={12} />{error}</div>}
                  <button type="submit" disabled={loading || newPassword.length < 6} className={btnPrimary} style={{ background: "linear-gradient(135deg, #5ab4ff, #a78bfa, #5ab4ff)", backgroundSize: "200% 100%", animation: loading ? "none" : "shimmer 3s linear infinite", boxShadow: "0 4px 20px rgba(90,180,255,0.3)" }}>
                    {loading ? <span className="flex items-center justify-center gap-2"><Spinner />Сохраняем...</span> : "Сохранить пароль →"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift1 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(40px, -30px) scale(1.1); }
        }
        @keyframes drift2 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-50px, 40px) scale(1.15); }
        }
        @keyframes drift3 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, 50px) scale(1.08); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50%       { opacity: 1; transform: scale(1.2); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

// ============ SETTINGS PANEL ============
function SettingsPanel({
  currentUser,
  sessionToken,
  onUserUpdate,
  onLogout,
}: {
  currentUser: User;
  sessionToken: string;
  onUserUpdate: (u: User) => void;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "appearance">("profile");
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState(currentUser.display_name);
  const [position, setPosition] = useState(currentUser.position || "");
  const [department, setDepartment] = useState(currentUser.department || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const isDirty =
    displayName !== currentUser.display_name ||
    position !== (currentUser.position || "") ||
    department !== (currentUser.department || "");

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Только изображения (jpg, png, webp)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Файл не должен превышать 5 МБ");
      return;
    }
    setAvatarUploading(true);
    setAvatarError("");
    try {
      const reader = new FileReader();
      const b64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(API.avatar, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionToken },
        body: JSON.stringify({ image: b64, content_type: file.type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAvatarError(data.message || "Не удалось загрузить фото");
        return;
      }
      onUserUpdate(data.user);
    } catch {
      setAvatarError("Ошибка соединения");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim().split(" ").length < 2) {
      setError("Введите имя и фамилию");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(API.profile, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionToken },
        body: JSON.stringify({ display_name: displayName.trim(), position: position.trim(), department: department.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Не удалось сохранить");
        return;
      }
      onUserUpdate(data.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Ошибка соединения");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile" as const, icon: "User", label: "Профиль" },
    { id: "appearance" as const, icon: "Palette", label: "Оформление" },
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left nav */}
      <div className="w-52 flex flex-col border-r flex-shrink-0 pt-4" style={{ borderColor: "var(--t-border)", background: "var(--t-bg-main)" }}>
        <h2 className="px-4 text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--t-text-dim)" }}>Настройки</h2>
        {tabs.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className="flex items-center gap-3 px-4 py-2.5 text-xs transition-colors text-left"
            style={activeTab === item.id ? { background: "var(--t-bg-active)", color: "var(--t-accent)" } : { color: "var(--t-text-dim)" }}>
            <Icon name={item.icon} size={14} />{item.label}
          </button>
        ))}
        <div className="mt-auto mb-4 px-4">
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-sm transition-colors" style={{ color: "var(--t-danger)" }}>
            <Icon name="LogOut" size={13} /> Выйти
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">

      {/* === ВКЛАДКА: ОФОРМЛЕНИЕ === */}
      {activeTab === "appearance" && (
        <div className="max-w-2xl">
          <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--t-text)" }}>Оформление</h3>
          <p className="text-xs mb-6" style={{ color: "var(--t-text-dim)" }}>Выберите цветовую тему интерфейса</p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {THEMES.map(t => {
              const isActive = theme === t.id;
              return (
                <button key={t.id} onClick={() => setTheme(t.id)}
                  className="relative rounded-xl p-4 text-left transition-all duration-200 group"
                  style={{ background: t.bg, border: `2px solid ${isActive ? t.accent : "transparent"}`, boxShadow: isActive ? `0 0 0 1px ${t.accent}40` : "none" }}>
                  {/* Мини-превью */}
                  <div className="flex gap-1.5 mb-3">
                    {t.preview.map((c, i) => (
                      <div key={i} className="rounded-full" style={{ width: i === 0 ? 20 : 14, height: i === 0 ? 20 : 14, background: c, flexShrink: 0 }} />
                    ))}
                  </div>
                  {/* Мини интерфейс */}
                  <div className="rounded-lg overflow-hidden mb-3" style={{ background: t.preview[1], height: 56 }}>
                    <div className="flex gap-1 p-1.5">
                      <div className="rounded" style={{ width: 8, height: 8, background: t.preview[0] }} />
                      <div className="flex-1 rounded" style={{ height: 8, background: t.preview[0] }} />
                    </div>
                    <div className="flex justify-end px-1.5 pb-1">
                      <div className="rounded-md px-2 py-0.5 text-[8px]" style={{ background: t.preview[3], color: "#fff" }}>●●●</div>
                    </div>
                    <div className="px-1.5">
                      <div className="rounded-md px-1.5 py-0.5 text-[8px] w-fit" style={{ background: t.preview[1], border: `1px solid ${t.preview[0]}`, color: t.accent }}>●●●●●</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: t.accent }}>{t.name}</span>
                    {isActive && (
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: t.accent }}>
                        <Icon name="Check" size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--t-bg-main)", border: "1px solid var(--t-border)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Info" size={13} className="text-[var(--t-accent)]" />
              <span className="text-xs font-medium" style={{ color: "var(--t-text)" }}>Тема применяется мгновенно</span>
            </div>
            <p className="text-xs" style={{ color: "var(--t-text-dim)" }}>Выбор сохраняется в браузере и применяется при следующем входе.</p>
          </div>
        </div>
      )}

      {/* === ВКЛАДКА: ПРОФИЛЬ === */}
      {activeTab === "profile" && <>
        <h3 className="text-sm font-semibold mb-6" style={{ color: "var(--t-text)" }}>Профиль</h3>

        {/* Avatar preview */}
        <div className="flex items-center gap-4 mb-7 p-4 rounded-sm max-w-lg" style={{ background: "var(--t-bg-main)", border: "1px solid var(--t-border)" }}>
          <label className="relative w-14 h-14 cursor-pointer group flex-shrink-0">
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt="avatar" className="w-14 h-14 rounded-sm object-cover border border-[#2a3548]" />
            ) : (
              <div className="w-14 h-14 rounded-sm flex items-center justify-center text-lg font-medium" style={{ background: "var(--t-border)", border: "1px solid var(--t-border-md)", color: "var(--t-accent)" }}>
                {displayName.trim().split(" ").length >= 2
                  ? (displayName.trim().split(" ")[0][0] + displayName.trim().split(" ")[1][0]).toUpperCase()
                  : currentUser.avatar_initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-sm bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {avatarUploading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Icon name="Camera" size={16} className="text-white" />}
            </div>
          </label>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--t-text)" }}>{displayName || currentUser.display_name}</div>
            {position && <div className="text-xs mt-0.5" style={{ color: "var(--t-accent)" }}>{position}</div>}
            {department && <div className="text-[11px] mt-0.5" style={{ color: "var(--t-text-dim)" }}>{department}</div>}
            <button
              type="button"
              onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
              className="text-[10px] mt-1 transition-colors" style={{ color: "var(--t-accent)" }}
            >
              {currentUser.avatar_url ? "Сменить фото" : "Загрузить фото"}
            </button>
            {avatarError && <div className="text-[10px] text-[#f87171] mt-1">{avatarError}</div>}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-dim)" }}>Имя и Фамилия</label>
              <input
                value={displayName}
                onChange={e => { setDisplayName(e.target.value); setError(""); setSuccess(false); }}
                placeholder="Иван Петров"
                className="w-full rounded-sm px-3 py-2 text-xs placeholder-[#2a3548] focus:outline-none transition-colors"
                style={{ background: "var(--t-bg-active)", border: "1px solid var(--t-border)", color: "var(--t-text)" }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-dim)" }}>Должность</label>
              <input
                value={position}
                onChange={e => { setPosition(e.target.value); setSuccess(false); }}
                placeholder="Менеджер"
                className="w-full rounded-sm px-3 py-2 text-xs placeholder-[#2a3548] focus:outline-none transition-colors"
                style={{ background: "var(--t-bg-active)", border: "1px solid var(--t-border)", color: "var(--t-text)" }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-dim)" }}>Отдел</label>
              <input
                value={department}
                onChange={e => { setDepartment(e.target.value); setSuccess(false); }}
                placeholder="Продажи"
                className="w-full rounded-sm px-3 py-2 text-xs placeholder-[#2a3548] focus:outline-none transition-colors"
                style={{ background: "var(--t-bg-active)", border: "1px solid var(--t-border)", color: "var(--t-text)" }}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--t-text-dim)" }}>Телефон</label>
              <input
                value={currentUser.phone || ""}
                readOnly
                className="w-full rounded-sm px-3 py-2 text-xs font-mono cursor-not-allowed"
                style={{ background: "var(--t-bg-main)", border: "1px solid var(--t-border)", color: "var(--t-text-dim)" }}
              />
              <p className="mt-1 text-[10px]" style={{ color: "var(--t-border-md)" }}>Номер телефона изменить нельзя</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[11px] text-[#f87171] bg-[#140a0a] border border-[#2a1010] rounded-sm px-3 py-2.5">
              <Icon name="AlertCircle" size={12} /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-[11px] text-[#4ade80] bg-[#0a1a10] border border-[#1a3020] rounded-sm px-3 py-2.5">
              <Icon name="CheckCircle" size={12} /> Профиль сохранён
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="px-5 py-2 text-xs font-semibold rounded-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "var(--t-accent)", color: "var(--t-bg-deep)" }}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-[#080f1a]/30 border-t-[#080f1a] rounded-full animate-spin inline-block" />
                  Сохраняем...
                </span>
              ) : "Сохранить"}
            </button>
            {isDirty && (
              <button
                type="button"
                onClick={() => {
                  setDisplayName(currentUser.display_name);
                  setPosition(currentUser.position || "");
                  setDepartment(currentUser.department || "");
                  setError("");
                }}
                className="px-4 py-2 text-xs transition-colors"
                style={{ color: "var(--t-text-dim)" }}
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </>}

      </div>
    </div>
  );
}

// ============ MAIN APP ============
function AppInner() {
  useTheme(); // подписка на тему (применяется через CSS body[data-theme])
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [section, setSection] = useState<Section>("chats");
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [activeCall, setActiveCall] = useState(false);
  const [activeVideo, setActiveVideo] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  // Звонки
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [activeCallId, setActiveCallId] = useState<number | null>(null);
  const [callTarget, setCallTarget] = useState<Contact | null>(null);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [incomingCall, setIncomingCall] = useState<{id: number; caller_name: string; caller_avatar: string; call_type: string} | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [signalingLastId, setSignalingLastId] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);

  // Check existing session
  useEffect(() => {
    const token = localStorage.getItem("session_token");
    if (!token) { setAuthChecked(true); return; }
    fetch(API.auth, { headers: { "X-Session-Id": token } })
      .then(r => r.json())
      .then(data => {
        if (data.user) { setCurrentUser(data.user); setSessionToken(token); }
        else localStorage.removeItem("session_token");
      })
      .catch(() => localStorage.removeItem("session_token"))
      .finally(() => setAuthChecked(false));
    setAuthChecked(true);
  }, []);

  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "X-Session-Id": sessionToken || "",
  }), [sessionToken]);

  // Load chats
  const loadChats = useCallback(async () => {
    if (!sessionToken) return;
    setLoadingChats(true);
    try {
      const res = await fetch(API.chats, { headers: authHeaders() });
      const data = await res.json();
      if (data.chats) {
        setChats(data.chats);
        if (!activeChat && data.chats.length > 0) setActiveChat(data.chats[0]);
      }
    } finally {
      setLoadingChats(false);
    }
  }, [sessionToken, authHeaders, activeChat]);

  // Load contacts
  const loadContacts = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const res = await fetch(`${API.chats}/contacts`, { headers: authHeaders() });
      const data = await res.json();
      if (data.contacts) setContacts(data.contacts);
    } catch (e) { console.error(e); }
  }, [sessionToken, authHeaders]);

  // Load messages
  const loadMessages = useCallback(async (chatId: number) => {
    if (!sessionToken) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`${API.messages}?chat_id=${chatId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } finally {
      setLoadingMessages(false);
    }
  }, [sessionToken, authHeaders]);

  useEffect(() => {
    if (currentUser && sessionToken) {
      loadChats();
      loadContacts();
    }
  }, [currentUser, sessionToken]);

  useEffect(() => {
    if (activeChat) loadMessages(activeChat.id);
  }, [activeChat?.id]);

  // Auto-refresh messages every 5s
  useEffect(() => {
    if (!activeChat || !sessionToken) return;
    const iv = setInterval(() => loadMessages(activeChat.id), 5000);
    return () => clearInterval(iv);
  }, [activeChat?.id, sessionToken]);

  const handleSend = async () => {
    if (!msgInput.trim() || !activeChat || sendingMsg) return;
    const text = msgInput.trim();
    setMsgInput("");
    setSendingMsg(true);
    try {
      const res = await fetch(API.messages, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ chat_id: activeChat.id, text }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        loadChats();
      }
    } finally {
      setSendingMsg(false);
    }
  };

  // Загрузка файла в чат
  const handleFileUpload = async (file: File) => {
    if (!activeChat || uploadingFile) return;
    setUploadingFile(true);
    try {
      const reader = new FileReader();
      const b64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(`${API.messages}/upload`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ chat_id: activeChat.id, file_name: file.name, file_data: b64 }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        loadChats();
      }
    } finally {
      setUploadingFile(false);
    }
  };

  // Загрузка истории звонков
  const loadCallHistory = useCallback(async () => {
    if (!sessionToken) return;
    setLoadingCalls(true);
    try {
      const res = await fetch(`${API.calls}/history`, { headers: authHeaders() });
      const data = await res.json();
      if (data.calls) setCallHistory(data.calls);
    } finally {
      setLoadingCalls(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    if (section === "calls" && sessionToken) loadCallHistory();
  }, [section, sessionToken]);

  // Проверка входящих звонков каждые 3 секунды
  useEffect(() => {
    if (!sessionToken) return;
    const iv = setInterval(async () => {
      if (activeCallId) return;
      const res = await fetch(`${API.calls}/incoming`, { headers: authHeaders() });
      const data = await res.json();
      if (data.call) setIncomingCall(data.call);
    }, 3000);
    return () => clearInterval(iv);
  }, [sessionToken, activeCallId]);

  // Polling WebRTC сигналов
  useEffect(() => {
    if (!activeCallId || !peerConnection) return;
    const iv = setInterval(async () => {
      const res = await fetch(`${API.calls}/signals?call_id=${activeCallId}&after_id=${signalingLastId}`, { headers: authHeaders() });
      const data = await res.json();
      if (!data.signals?.length) return;
      for (const sig of data.signals) {
        setSignalingLastId(sig.id);
        if (sig.type === "offer") {
          await peerConnection.setRemoteDescription(JSON.parse(sig.payload));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          await sendSignal(activeCallId, sig.from, "answer", answer);
        } else if (sig.type === "answer") {
          await peerConnection.setRemoteDescription(JSON.parse(sig.payload));
        } else if (sig.type === "candidate") {
          await peerConnection.addIceCandidate(JSON.parse(sig.payload));
        } else if (sig.type === "hangup") {
          endCall();
        }
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [activeCallId, peerConnection, signalingLastId]);

  const sendSignal = async (callId: number, toUserId: number, type: string, payload: unknown) => {
    await fetch(`${API.calls}/signal`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ call_id: callId, to_user_id: toUserId, type, payload }),
    });
  };

  const createPeerConnection = (callId: number, targetUserId: number) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });
    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal(callId, targetUserId, "candidate", e.candidate);
    };
    pc.ontrack = (e) => {
      const stream = new MediaStream();
      stream.addTrack(e.track);
      setRemoteStream(stream);
    };
    return pc;
  };

  const startCall = async (contact: Contact, type: "audio" | "video") => {
    setCallTarget(contact);
    setCallType(type);
    setActiveCall(true);
    setCallDuration(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "video" });
      setLocalStream(stream);
      const callRes = await fetch(`${API.calls}/start`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ callee_id: contact.id, call_type: type }),
      });
      const callData = await callRes.json();
      const callId = callData.call_id;
      setActiveCallId(callId);
      const pc = createPeerConnection(callId, contact.id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(callId, contact.id, "offer", offer);
      setPeerConnection(pc);
    } catch {
      setActiveCall(false);
    }
  };

  const answerCall = async (call: typeof incomingCall) => {
    if (!call) return;
    setIncomingCall(null);
    setActiveCallId(call.id);
    setCallType(call.call_type as "audio" | "video");
    setActiveCall(true);
    setCallDuration(0);
    await fetch(`${API.calls}/answer`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ call_id: call.id, accepted: true }),
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: call.call_type === "video" });
      setLocalStream(stream);
      const pc = createPeerConnection(call.id, 0);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      setPeerConnection(pc);
    } catch (e) { console.warn("media error", e); }
  };

  const endCall = async () => {
    if (activeCallId) {
      await fetch(`${API.calls}/end`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ call_id: activeCallId }),
      });
      if (peerConnection) {
        await sendSignal(activeCallId, callTarget?.id || 0, "hangup", {});
      }
    }
    localStream?.getTracks().forEach(t => t.stop());
    peerConnection?.close();
    setLocalStream(null);
    setRemoteStream(null);
    setPeerConnection(null);
    setActiveCallId(null);
    setCallTarget(null);
    setActiveCall(false);
    setActiveVideo(false);
    setCallDuration(0);
  };

  // Таймер длительности звонка
  useEffect(() => {
    if (!activeCall) return;
    const iv = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(iv);
  }, [activeCall]);

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const handleLogin = (user: User, token: string) => {
    setCurrentUser(user);
    setSessionToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem("session_token");
    setCurrentUser(null);
    setSessionToken(null);
    setChats([]);
    setMessages([]);
    setActiveChat(null);
  };

  const openChatWith = async (contactId: number) => {
    try {
      const res = await fetch(API.chats, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ user_id: contactId }),
      });
      const data = await res.json();
      if (data.chat_id) {
        await loadChats();
        setSection("chats");
      }
    } catch (e) { console.error(e); }
  };

  const filteredChats = chats.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!authChecked && !currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ background: "var(--t-bg-panel)" }}>
        <div className="text-xs" style={{ color: "var(--t-text-dim)" }}>Загрузка...</div>
      </div>
    );
  }

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="flex h-screen w-screen overflow-hidden transition-colors duration-300" style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: T.bgPanel, color: T.text }}>
      {/* Sidebar */}
      <nav className="flex flex-col items-center py-4 w-16 gap-1 flex-shrink-0" style={{ background: T.bgDeep, borderRight: `1px solid ${T.border}` }}>
        <div className="mb-4">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ background: T.accent }}>
            <span className="font-semibold text-sm" style={{ color: T.bgDeep }}>Д</span>
          </div>
        </div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setSection(item.id)} title={item.label}
            className="w-11 h-11 rounded-sm flex flex-col items-center justify-center gap-0.5 transition-all duration-150"
            style={section === item.id ? { background: T.border, color: T.accent } : { color: T.dim }}>
            <Icon name={item.icon} size={18} />
            <span className="text-[9px] font-medium">{item.label}</span>
          </button>
        ))}
        <div className="mt-auto flex flex-col items-center gap-1">
          {bottomNav.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)} title={item.label}
              className="w-11 h-11 rounded-sm flex flex-col items-center justify-center gap-0.5 transition-all duration-150"
              style={section === item.id ? { background: T.border, color: T.accent } : { color: T.dim }}>
              <Icon name={item.icon} size={18} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          ))}
          <div className="w-11 h-px my-1" style={{ background: T.border }} />
          <div title={currentUser.display_name} className="w-9 h-9 rounded-sm flex items-center justify-center text-xs font-medium cursor-pointer transition-colors"
            style={{ background: T.border, border: `1px solid ${T.borderMd}`, color: T.accent }}>
            {currentUser.avatar_initials}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* CHATS */}
        {section === "chats" && (
          <>
            <div className="w-72 flex flex-col border-r flex-shrink-0" style={{ borderColor: "var(--t-border)", background: "var(--t-bg-main)" }}>
              <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--t-border)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--t-text)" }}>Чаты</h2>
                  {loadingChats && <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />}
                </div>
                <div className="relative">
                  <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--t-text-dim)" }} />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск..."
                    className="w-full rounded-sm pl-7 pr-3 py-1.5 text-xs placeholder-[#4a5568] focus:outline-none transition-colors"
                    style={{ background: "var(--t-bg-active)", border: "1px solid var(--t-border)", color: "var(--t-text-muted)" }} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredChats.map(chat => (
                  <button key={chat.id} onClick={() => setActiveChat(chat)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150"
                    style={{
                      borderBottom: "1px solid var(--t-bg-panel)",
                      background: activeChat?.id === chat.id ? "var(--t-bg-active)" : undefined,
                    }}>
                    <AvatarBadge initials={chat.avatar} online={chat.type === "personal" ? chat.online : undefined} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium truncate" style={{ color: "var(--t-text)" }}>{chat.name}</span>
                        <span className="text-[10px] ml-2 flex-shrink-0" style={{ color: "var(--t-text-dim)" }}>{chat.last_time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] truncate" style={{ color: "var(--t-text-dim)" }}>{chat.last_message}</span>
                        {chat.unread > 0 && (
                          <span className="ml-2 flex-shrink-0 w-4 h-4 rounded-full text-[9px] font-semibold flex items-center justify-center" style={{ background: "var(--t-accent)", color: "var(--t-bg-deep)" }}>{chat.unread}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {chats.length === 0 && !loadingChats && (
                  <div className="p-4 text-xs text-center" style={{ color: "var(--t-text-dim)" }}>Нет чатов</div>
                )}
              </div>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
              {activeChat ? (
                <>
                  <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "var(--t-border)", background: "var(--t-bg-main)" }}>
                    <div className="flex items-center gap-3">
                      <AvatarBadge initials={activeChat.avatar} online={activeChat.type === "personal" ? activeChat.online : undefined} />
                      <div>
                        <div className="text-sm font-medium" style={{ color: "var(--t-text)" }}>{activeChat.name}</div>
                        <div className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>
                          {activeChat.type === "personal" ? (activeChat.online ? "В сети" : "Не в сети") : "Групповой чат"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[
                        { icon: "Phone", action: () => setActiveCall(true) },
                        { icon: "Video", action: () => setActiveVideo(true) },
                        { icon: "MoreVertical", action: () => {} },
                      ].map((btn, i) => (
                        <button key={i} onClick={btn.action} className="w-8 h-8 rounded-sm flex items-center justify-center transition-all" style={{ color: "var(--t-text-dim)" }}>
                          <Icon name={btn.icon} size={16} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3" style={{ background: "var(--t-chat-bg)", backgroundImage: "var(--t-chat-pattern)" }}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-px" style={{ background: "var(--t-border)" }} />
                      <span className="text-[10px] font-mono" style={{ color: "var(--t-text-dim)" }}>
                        {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      <div className="flex-1 h-px" style={{ background: "var(--t-border)" }} />
                    </div>

                    {loadingMessages && messages.length === 0 && (
                      <div className="flex justify-center py-8">
                        <div className="w-5 h-5 border border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />
                      </div>
                    )}

                    {messages.map(msg => (
                      <div key={msg.id} className={`flex items-end gap-2 ${msg.own ? "flex-row-reverse" : ""}`}>
                        {!msg.own && <AvatarBadge initials={msg.sender_avatar || "??"} size="sm" />}
                        <div className={`max-w-[65%] flex flex-col gap-0.5 ${msg.own ? "items-end" : "items-start"}`}>
                          {!msg.own && (
                            <span className="text-[10px] font-medium ml-1" style={{ color: "var(--t-accent)" }}>{msg.sender_name}</span>
                          )}
                          <div className="rounded-sm px-3 py-2 text-xs leading-relaxed"
                            style={msg.own
                              ? { background: "var(--t-msg-own-bg)", border: "1px solid var(--t-msg-own-br)", color: "var(--t-text)" }
                              : { background: "var(--t-bg-active)", border: "1px solid var(--t-border)", color: "var(--t-text-muted)" }}>
                            {msg.type === "file" ? (
                              <a href={msg.file_url || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                                <Icon name={/\.(png|jpe?g|gif|webp|svg)$/i.test(msg.file_name || "") ? "Image" : /\.(zip|rar|7z|tar)$/i.test(msg.file_name || "") ? "Archive" : "FileText"} size={18} className="flex-shrink-0" style={{ color: "var(--t-accent)" }} />
                                <div className="min-w-0">
                                  <div className="font-medium truncate max-w-[180px]" style={{ color: "var(--t-text)" }}>{msg.file_name}</div>
                                  <div className="text-[10px] flex items-center gap-1" style={{ color: "var(--t-text-dim)" }}>{msg.file_size} <Icon name="Download" size={10} /></div>
                                </div>
                              </a>
                            ) : msg.text}
                          </div>
                          <span className="text-[10px] font-mono mx-1" style={{ color: "var(--t-text-dim)" }}>{msg.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-3 border-t flex-shrink-0" style={{ borderColor: "var(--t-border)", background: "var(--t-bg-main)" }}>
                    {uploadingFile && (
                      <div className="flex items-center gap-2 text-[11px] mb-2" style={{ color: "var(--t-accent)" }}>
                        <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />
                        Загружаем файл...
                      </div>
                    )}
                    <div className="flex items-center gap-2 rounded-sm px-3 py-2 transition-colors" style={{ background: "var(--t-bg-active)", border: "1px solid var(--t-border)" }}>
                      <label className="transition-colors cursor-pointer" style={{ color: "var(--t-text-dim)" }}>
                        <Icon name="Paperclip" size={16} />
                        <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
                      </label>
                      <input
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Написать сообщение..."
                        className="flex-1 bg-transparent text-xs placeholder-[#4a5568] focus:outline-none"
                        style={{ color: "var(--t-text)" }}
                      />
                      <button
                        onClick={handleSend}
                        disabled={sendingMsg || !msgInput.trim()}
                        className="w-7 h-7 rounded-sm flex items-center justify-center transition-colors disabled:opacity-40"
                        style={{ background: "var(--t-accent)", color: "var(--t-bg-deep)" }}
                      >
                        <Icon name="Send" size={13} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center" style={{ color: "var(--t-text-dim)" }}>
                  <div className="text-center">
                    <Icon name="MessageSquare" size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Выберите чат</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* CONTACTS */}
        {section === "contacts" && (() => {
          const filtered = contacts.filter(c =>
            c.display_name.toLowerCase().includes(contactSearch.toLowerCase()) ||
            (c.department || "").toLowerCase().includes(contactSearch.toLowerCase()) ||
            (c.position || "").toLowerCase().includes(contactSearch.toLowerCase())
          );
          const importFromPhone = async () => {
            if (!("contacts" in navigator)) { alert("Ваш браузер не поддерживает импорт контактов"); return; }
            try {
              const props = ["name", "tel"];
              // @ts-expect-error Contact Picker API
              const imported = await navigator.contacts.select(props, { multiple: true });
              alert(`Импортировано ${imported.length} контактов`);
            } catch { alert("Не удалось получить доступ к контактам"); }
          };
          return (
            <div className="flex flex-1 overflow-hidden">
              <div className="w-72 flex flex-col border-r flex-shrink-0" style={{ borderColor: "var(--t-border)", background: "var(--t-bg-main)" }}>
                <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--t-border)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--t-text)" }}>Контакты</h2>
                    <span className="text-[10px]" style={{ color: "var(--t-text-dim)" }}>{contacts.length}</span>
                  </div>
                  <div className="relative">
                    <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--t-text-dim)" }} />
                    <input value={contactSearch} onChange={e => setContactSearch(e.target.value)} placeholder="Поиск..."
                      className="w-full rounded-sm pl-7 pr-3 py-1.5 text-xs placeholder-[#4a5568] focus:outline-none"
                      style={{ background: "var(--t-bg-active)", border: "1px solid var(--t-border)", color: "var(--t-text-muted)" }} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filtered.map(c => (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors" style={{ borderBottom: "1px solid var(--t-bg-panel)" }}>
                      <AvatarBadge initials={c.avatar_initials} online={c.online} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: "var(--t-text)" }}>{c.display_name}</div>
                        <div className="text-[11px] truncate" style={{ color: "var(--t-text-dim)" }}>{c.position || c.department}</div>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <div className="p-4 text-xs text-center" style={{ color: "var(--t-text-dim)" }}>Ничего не найдено</div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="flex items-center justify-between mb-5 max-w-2xl">
                  <h3 className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: "var(--t-text-dim)" }}>Все сотрудники ({filtered.length})</h3>
                  <div className="flex gap-2">
                    <button onClick={importFromPhone} className="px-3 py-1.5 text-[10px] rounded-sm transition-colors flex items-center gap-1.5" style={{ background: "var(--t-border)", border: "1px solid var(--t-border-md)", color: "var(--t-text-muted)" }}>
                      <Icon name="Smartphone" size={11} /> Импорт
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-2xl">
                  {filtered.map(c => (
                    <div key={c.id} className="rounded-sm p-4 transition-colors" style={{ background: "var(--t-bg-main)", border: "1px solid var(--t-border)" }}>
                      <div className="flex items-center gap-3 mb-3">
                        <AvatarBadge initials={c.avatar_initials} size="lg" online={c.online} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: "var(--t-text)" }}>{c.display_name}</div>
                          <div className="text-[11px] truncate" style={{ color: "var(--t-accent)" }}>{c.department}</div>
                        </div>
                      </div>
                      {c.position && <div className="text-[11px] mb-1" style={{ color: "var(--t-text-dim)" }}>{c.position}</div>}
                      <div className="flex gap-1.5 mt-3">
                        <button onClick={() => openChatWith(c.id)} className="flex-1 py-1.5 text-[10px] rounded-sm transition-colors flex items-center justify-center gap-1" style={{ background: "var(--t-border)", border: "1px solid var(--t-border-md)", color: "var(--t-text-muted)" }}>
                          <Icon name="MessageSquare" size={11} /> Чат
                        </button>
                        <button onClick={() => startCall(c, "audio")} className="flex-1 py-1.5 text-[10px] rounded-sm transition-colors flex items-center justify-center gap-1" style={{ background: "var(--t-border)", border: "1px solid var(--t-border-md)", color: "var(--t-text-muted)" }}>
                          <Icon name="Phone" size={11} /> Звонок
                        </button>
                        <button onClick={() => startCall(c, "video")} className="flex-1 py-1.5 text-[10px] rounded-sm transition-colors flex items-center justify-center gap-1" style={{ background: "var(--t-border)", border: "1px solid var(--t-border-md)", color: "var(--t-text-muted)" }}>
                          <Icon name="Video" size={11} /> Видео
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* CALLS */}
        {section === "calls" && (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-80 flex flex-col border-r flex-shrink-0" style={{ borderColor: "var(--t-border)", background: "var(--t-bg-main)" }}>
              <div className="px-4 pt-4 pb-3 border-b flex items-center justify-between" style={{ borderColor: "var(--t-border)" }}>
                <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--t-text)" }}>Звонки</h2>
                {loadingCalls && <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />}
              </div>
              <div className="flex-1 overflow-y-auto">
                {callHistory.map(call => (
                  <div key={call.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors" style={{ borderBottom: "1px solid var(--t-bg-panel)" }}>
                    <AvatarBadge initials={call.avatar} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium" style={{ color: "var(--t-text)" }}>{call.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Icon name={call.type === "incoming" ? "PhoneIncoming" : call.type === "outgoing" ? "PhoneOutgoing" : "PhoneMissed"} size={11}
                          style={{ color: call.type === "missed" ? "#f87171" : call.type === "incoming" ? "#22c55e" : "var(--t-accent)" }} />
                        <span className="text-[10px]" style={{ color: "var(--t-text-dim)" }}>{call.time}</span>
                        {call.is_video && <Icon name="Video" size={10} className="ml-1" style={{ color: "var(--t-text-dim)" }} />}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono" style={{ color: "var(--t-text-dim)" }}>{call.duration}</span>
                  </div>
                ))}
                {callHistory.length === 0 && !loadingCalls && (
                  <div className="p-4 text-xs text-center" style={{ color: "var(--t-text-dim)" }}>История пуста</div>
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--t-bg-main)", border: "1px solid var(--t-border)" }}>
                  <Icon name="Phone" size={32} style={{ color: "var(--t-text-dim)" }} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--t-text)" }}>Новый звонок</p>
                <p className="text-xs mb-5" style={{ color: "var(--t-text-dim)" }}>Выберите контакт для звонка</p>
                <div className="flex gap-2 justify-center">
                  {contacts.slice(0, 4).map(c => (
                    <button key={c.id} onClick={() => startCall(c, "audio")} className="flex flex-col items-center gap-1.5 p-2 rounded-sm transition-colors">
                      <AvatarBadge initials={c.avatar_initials} online={c.online} />
                      <span className="text-[10px] max-w-[48px] truncate" style={{ color: "var(--t-text-muted)" }}>{c.display_name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setSection("contacts"); }} className="px-4 py-2 bg-[#22c55e] text-[#080f1a] text-xs font-medium rounded-sm hover:bg-[#16a34a] transition-colors flex items-center gap-1.5">
                  <Icon name="Phone" size={13} /> Аудиозвонок
                </button>
                <button onClick={() => { setSection("contacts"); }} className="px-4 py-2 text-xs font-medium rounded-sm transition-colors flex items-center gap-1.5" style={{ background: "var(--t-accent)", color: "var(--t-bg-deep)" }}>
                  <Icon name="Video" size={13} /> Видеозвонок
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIDEO */}
        {section === "video" && (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-72 flex flex-col border-r flex-shrink-0" style={{ borderColor: "var(--t-border)", background: "var(--t-bg-main)" }}>
              <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--t-border)" }}>
                <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--t-text)" }}>Видеозвонок</h2>
                <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>Выберите контакт</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contacts.map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors" style={{ borderBottom: "1px solid var(--t-bg-panel)" }} onClick={() => startCall(c, "video")}>
                    <AvatarBadge initials={c.avatar_initials} online={c.online} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "var(--t-text)" }}>{c.display_name}</div>
                      <div className="text-[11px] truncate" style={{ color: "var(--t-text-dim)" }}>{c.department}</div>
                    </div>
                    <Icon name="Video" size={14} style={{ color: "var(--t-text-dim)" }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              {activeVideo && remoteStream ? (
                <div className="relative w-full h-full bg-black">
                  <video autoPlay playsInline className="w-full h-full object-cover" ref={el => { if (el) el.srcObject = remoteStream; }} />
                  {localStream && (
                    <video autoPlay playsInline muted className="absolute bottom-4 right-4 w-32 h-24 object-cover rounded-sm border border-[#2a3548]" ref={el => { if (el) el.srcObject = localStream; }} />
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                    <button onClick={() => setMicMuted(v => !v)} className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${micMuted ? "bg-[#f87171]" : "bg-[#1a2332]"}`}>
                      <Icon name={micMuted ? "MicOff" : "Mic"} size={18} className="text-white" />
                    </button>
                    <button onClick={endCall} className="w-11 h-11 rounded-full bg-[#f87171] flex items-center justify-center">
                      <Icon name="PhoneOff" size={18} className="text-white" />
                    </button>
                    <button onClick={() => setCamOff(v => !v)} className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${camOff ? "bg-[#f87171]" : "bg-[#1a2332]"}`}>
                      <Icon name={camOff ? "VideoOff" : "Video"} size={18} className="text-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center max-w-xs">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--t-bg-main)", border: "1px solid var(--t-border)" }}>
                    <Icon name="Video" size={32} style={{ color: "var(--t-text-dim)" }} />
                  </div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--t-text)" }}>Видеозвонки</h3>
                  <p className="text-xs" style={{ color: "var(--t-text-dim)" }}>Выберите контакт слева для начала видеозвонка</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FILES */}
        {section === "files" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--t-border)" }}>
              <div>
                <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--t-text)" }}>Файлы</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--t-text-dim)" }}>Все файлы переписок</p>
              </div>
              <button className="px-3 py-1.5 text-xs font-medium rounded-sm transition-colors flex items-center gap-1.5" style={{ background: "var(--t-accent)", color: "var(--t-bg-deep)" }}>
                <Icon name="Upload" size={12} /> Загрузить
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="rounded-sm overflow-hidden" style={{ border: "1px solid var(--t-border)" }}>
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--t-border)", background: "var(--t-bg-main)" }}>
                      {["Имя файла", "Размер", "Отправитель", "Дата", ""].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase" style={{ color: "var(--t-text-dim)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {STATIC_FILES.map(f => (
                      <tr key={f.id} className="transition-colors" style={{ borderBottom: "1px solid var(--t-bg-panel)" }}>
                        <td className="px-4 py-3"><div className="flex items-center gap-2.5"><FileIconComp type={f.type} /><span className="text-xs font-medium" style={{ color: "var(--t-text)" }}>{f.name}</span></div></td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--t-text-dim)" }}>{f.size}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--t-text-muted)" }}>{f.sender}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--t-text-dim)" }}>{f.date}</td>
                        <td className="px-4 py-3"><button className="transition-colors" style={{ color: "var(--t-text-dim)" }}><Icon name="Download" size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BOTS */}
        {section === "bots" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--t-border)" }}>
              <div>
                <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--t-text)" }}>Боты</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--t-text-dim)" }}>Корпоративные автоматизации</p>
              </div>
              <button className="px-3 py-1.5 text-xs font-medium rounded-sm transition-colors flex items-center gap-1.5" style={{ background: "var(--t-accent)", color: "var(--t-bg-deep)" }}>
                <Icon name="Plus" size={12} /> Создать бота
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-3 gap-4">
                {STATIC_BOTS.map(bot => (
                  <div key={bot.id} className="rounded-sm p-4 transition-colors" style={{ background: "var(--t-bg-main)", border: "1px solid var(--t-border)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-sm flex items-center justify-center text-xs font-medium" style={{ background: "var(--t-border)", border: "1px solid var(--t-border-md)", color: "var(--t-accent)" }}>{bot.avatar}</div>
                        <div>
                          <div className="text-xs font-medium" style={{ color: "var(--t-text)" }}>{bot.name}</div>
                          <div className="text-[10px]" style={{ color: "var(--t-accent)" }}>{bot.category}</div>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full mt-1" style={{ background: bot.active ? "#22c55e" : "var(--t-text-dim)" }} />
                    </div>
                    <p className="text-[11px] leading-relaxed mb-3" style={{ color: "var(--t-text-dim)" }}>{bot.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono" style={{ color: "var(--t-text-dim)" }}>{bot.requests.toLocaleString()} запросов</span>
                      <button className="text-[10px] transition-colors" style={{ color: "var(--t-accent)" }}>Открыть →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {section === "settings" && (
          <SettingsPanel
            currentUser={currentUser}
            sessionToken={sessionToken!}
            onUserUpdate={setCurrentUser}
            onLogout={handleLogout}
          />
        )}

        {/* ANALYTICS */}
        {section === "analytics" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--t-border)" }}>
              <div>
                <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--t-text)" }}>Аналитика</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--t-text-dim)" }}>Панель администратора</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Активных пользователей", value: String(contacts.filter(c => c.online).length + 1), icon: "Users", color: "var(--t-accent)" },
                  { label: "Сообщений в системе", value: String(messages.length), icon: "MessageSquare", color: "#22c55e" },
                  { label: "Активных чатов", value: String(chats.length), icon: "Hash", color: "#f59e0b" },
                  { label: "Ботов запущено", value: String(STATIC_BOTS.filter(b => b.active).length), icon: "Bot", color: "#a78bfa" },
                ].map(kpi => (
                  <div key={kpi.label} className="rounded-sm p-4" style={{ background: "var(--t-bg-main)", border: "1px solid var(--t-border)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-wide leading-tight" style={{ color: "var(--t-text-dim)" }}>{kpi.label}</span>
                      <Icon name={kpi.icon} size={14} style={{ color: kpi.color }} />
                    </div>
                    <div className="text-2xl font-semibold font-mono" style={{ color: "var(--t-text)" }}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-sm p-4" style={{ background: "var(--t-bg-main)", border: "1px solid var(--t-border)" }}>
                <h4 className="text-xs font-semibold mb-4" style={{ color: "var(--t-text)" }}>Пользователи</h4>
                <div className="space-y-2.5">
                  {contacts.slice(0, 5).map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="text-[10px] font-mono w-4" style={{ color: "var(--t-text-dim)" }}>{i + 1}</span>
                      <AvatarBadge initials={c.avatar_initials} size="sm" online={c.online} />
                      <div className="flex-1 text-xs" style={{ color: "var(--t-text)" }}>{c.display_name}</div>
                      <span className="text-[11px]" style={{ color: "var(--t-accent)" }}>{c.department}</span>
                      <span className="text-[10px]" style={{ color: c.online ? "#22c55e" : "var(--t-text-dim)" }}>{c.online ? "В сети" : "Не в сети"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Incoming Call */}
      {incomingCall && !activeCall && (
        <div className="fixed bottom-6 right-6 bg-[#0a1120] border border-[#22c55e] rounded-sm p-4 w-72 shadow-2xl z-50" style={{ animation: "fadeSlideIn 0.3s ease" }}>
          <div className="flex items-center gap-3 mb-4">
            <AvatarBadge initials={incomingCall.caller_avatar} />
            <div>
              <div className="text-sm font-medium text-[#e2e8f0]">{incomingCall.caller_name}</div>
              <div className="text-xs text-[#22c55e] flex items-center gap-1">
                <Icon name={incomingCall.call_type === "video" ? "Video" : "Phone"} size={11} />
                Входящий {incomingCall.call_type === "video" ? "видео" : "аудио"}звонок
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => answerCall(incomingCall)} className="flex-1 py-2 bg-[#22c55e] text-[#080f1a] text-xs font-medium rounded-sm flex items-center justify-center gap-1.5">
              <Icon name="Phone" size={13} /> Принять
            </button>
            <button onClick={async () => {
              await fetch(`${API.calls}/answer`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ call_id: incomingCall.id, accepted: false }) });
              setIncomingCall(null);
            }} className="flex-1 py-2 bg-[#f87171] text-white text-xs font-medium rounded-sm flex items-center justify-center gap-1.5">
              <Icon name="PhoneOff" size={13} /> Отклонить
            </button>
          </div>
        </div>
      )}

      {/* Active Call Modal */}
      {activeCall && (
        <div className={`fixed z-50 ${callType === "video" ? "inset-0 bg-[#050c18] flex flex-col" : "inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center"}`}>
          {callType === "video" ? (
            <>
              <div className="flex-1 relative bg-[#0a1120]">
                {remoteStream ? (
                  <video autoPlay playsInline className="w-full h-full object-cover" ref={el => { if (el) el.srcObject = remoteStream; }} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <AvatarBadge initials={callTarget?.avatar_initials || "??"} size="lg" />
                    <div className="text-sm font-medium text-[#e2e8f0] mt-3">{callTarget?.display_name || "Звонок"}</div>
                    <div className="text-xs text-[#22c55e] font-mono mt-1 animate-pulse">Соединяем...</div>
                  </div>
                )}
                {localStream && (
                  <video autoPlay playsInline muted className="absolute bottom-4 right-4 w-32 h-24 object-cover rounded-sm border border-[#2a3548]" ref={el => { if (el) el.srcObject = localStream; }} />
                )}
                <div className="absolute top-4 left-4 bg-black/50 rounded-sm px-3 py-1.5 text-xs text-[#e2e8f0] font-mono">{formatDuration(callDuration)}</div>
              </div>
              <div className="flex justify-center items-center gap-3 py-4 border-t border-[#1a2332] bg-[#0a1120]">
                <button onClick={() => setMicMuted(v => !v)} className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${micMuted ? "bg-[#f87171] border-[#f87171] text-white" : "bg-[#1a2332] border-[#2a3548] text-[#94a3b8]"}`}>
                  <Icon name={micMuted ? "MicOff" : "Mic"} size={16} />
                </button>
                <button onClick={() => setCamOff(v => !v)} className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${camOff ? "bg-[#f87171] border-[#f87171] text-white" : "bg-[#1a2332] border-[#2a3548] text-[#94a3b8]"}`}>
                  <Icon name={camOff ? "VideoOff" : "Video"} size={16} />
                </button>
                <button onClick={endCall} className="w-12 h-12 rounded-full bg-[#f87171] border border-[#f87171] text-white flex items-center justify-center hover:bg-[#ef4444] transition-colors">
                  <Icon name="PhoneOff" size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="bg-[#0a1120] border border-[#1a2332] rounded-sm p-8 w-64 text-center shadow-2xl">
              {remoteStream && <audio autoPlay ref={el => { if (el) el.srcObject = remoteStream; }} />}
              <AvatarBadge initials={callTarget?.avatar_initials || activeChat?.avatar || "??"} size="lg" />
              <div className="text-sm font-medium text-[#e2e8f0] mt-4 mb-1">{callTarget?.display_name || activeChat?.name || "Звонок"}</div>
              <div className="text-xs text-[#22c55e] font-mono mb-6">{remoteStream ? formatDuration(callDuration) : "Соединяем..."}</div>
              <div className="flex justify-center gap-3">
                <button onClick={() => setMicMuted(v => !v)} className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${micMuted ? "bg-[#f87171] border-[#f87171] text-white" : "bg-[#1a2332] border-[#2a3548] text-[#94a3b8]"}`}>
                  <Icon name={micMuted ? "MicOff" : "Mic"} size={16} />
                </button>
                <button onClick={endCall} className="w-11 h-11 rounded-full bg-[#f87171] border border-[#f87171] text-white flex items-center justify-center hover:bg-[#ef4444] transition-colors">
                  <Icon name="PhoneOff" size={16} />
                </button>
                <button className="w-11 h-11 rounded-full bg-[#1a2332] border border-[#2a3548] text-[#94a3b8] flex items-center justify-center">
                  <Icon name="Volume2" size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}