import { useState, useEffect, useCallback, createContext, useContext } from "react";
import Icon from "@/components/ui/icon";
import { FONT, card3d, btn3d, heading3d, liveIcon, msgOwn, msgOther } from "@/styles/theme3d";

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

const CHAT_PATTERNS: Record<string, { image: string; size: string }> = {
  none:     { image: "none", size: "auto" },
  dots:     { image: "radial-gradient(circle, var(--t-border-md) 1px, transparent 1px)", size: "16px 16px" },
  lines:    { image: "repeating-linear-gradient(0deg, transparent, transparent 18px, var(--t-border) 18px, var(--t-border) 19px)", size: "100% 19px" },
  grid:     { image: "linear-gradient(var(--t-border) 1px, transparent 1px), linear-gradient(90deg, var(--t-border) 1px, transparent 1px)", size: "20px 20px" },
  diamonds: { image: "repeating-linear-gradient(45deg, transparent, transparent 10px, var(--t-border) 10px, var(--t-border) 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, var(--t-border) 10px, var(--t-border) 11px)", size: "14px 14px" },
  circles:  { image: "radial-gradient(circle at 50% 50%, transparent 8px, var(--t-border) 8px, var(--t-border) 9px, transparent 9px)", size: "18px 18px" },
  waves:    { image: "repeating-linear-gradient(-45deg, transparent, transparent 6px, var(--t-border) 6px, var(--t-border) 7px)", size: "8px 8px" },
  stars:    { image: "radial-gradient(circle, var(--t-accent) 1px, transparent 1px), radial-gradient(circle, var(--t-border-md) 0.5px, transparent 0.5px)", size: "24px 24px, 12px 12px" },
};

function applyPattern(patternId: string) {
  const p = CHAT_PATTERNS[patternId] || CHAT_PATTERNS.none;
  document.documentElement.style.setProperty("--t-chat-pattern", p.image);
  document.documentElement.style.setProperty("--t-chat-pattern-size", p.size);
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => (localStorage.getItem("app_theme") as ThemeId) || "dark-blue");
  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem("app_theme", t);
    document.body.setAttribute("data-theme", t);
  };
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    applyPattern(localStorage.getItem("chat_pattern") || "none");
  }, [theme]);
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
  const px = { sm: 32, md: 40, lg: 48 }[size];
  const fs = { sm: 11, md: 13, lg: 15 }[size];
  return (
    <div className="relative flex-shrink-0">
      <div style={{
        width: px, height: px, borderRadius: 10, flexShrink: 0,
        background: "linear-gradient(145deg, var(--t-bg-card), var(--t-bg-panel))",
        border: "1px solid var(--t-border-md)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT.heading, fontWeight: 700, fontSize: fs, letterSpacing: "0.05em",
        color: "var(--t-accent)",
      }}>
        {initials}
      </div>
      {online !== undefined && (
        <span style={{
          position: "absolute", bottom: -2, right: -2,
          width: 10, height: 10, borderRadius: "50%",
          background: online ? "var(--t-online)" : "var(--t-text-dim)",
          border: "2px solid var(--t-bg-panel)",
          boxShadow: online ? "0 0 6px var(--t-online)" : "none",
        }} />
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

const FORM_CARD: React.CSSProperties = {
  background: "rgba(8,3,0,0.92)",
  border: "1px solid rgba(255,100,20,0.35)",
  borderRadius: 20,
  boxShadow: "0 0 50px rgba(255,80,0,0.2), 0 30px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,160,60,0.2), inset 0 -1px 0 rgba(255,40,0,0.12)",
  transform: "perspective(900px) rotateX(2deg) translateY(0)",
  /* backdropFilter убран — он размывает текст внутри */
  padding: "28px 28px 24px",
  position: "relative" as const,
};
const inputCls = "w-full rounded-xl px-4 py-3 focus:outline-none transition-all";
const inputWithIconCls = "w-full rounded-xl pl-10 pr-4 py-3 focus:outline-none transition-all";
// Стиль для текста внутри полей — чёткий, не размытый
const INPUT_TEXT: React.CSSProperties = {
  color: "#ffffff",
  fontSize: 14,
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 400,
  WebkitFontSmoothing: "antialiased" as const,
  MozOsxFontSmoothing: "grayscale" as const,
};
const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,100,20,0.3)",
  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)",
  ...INPUT_TEXT,
};
const INPUT_FOCUS_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,160,50,0.6)",
  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,120,0,0.15)",
  ...INPUT_TEXT,
};
const BTN_STYLE: React.CSSProperties = {
  width: "100%", padding: "13px", borderRadius: 12, fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 700, fontSize: 15, letterSpacing: "0.1em",
  color: "#ffffff",
  textShadow: "0 1px 3px rgba(0,0,0,0.5)",
  WebkitFontSmoothing: "antialiased" as const,
  cursor: "pointer",
  background: "linear-gradient(135deg, #d44800 0%, #ff6600 40%, #ff9000 70%, #d44800 100%)",
  backgroundSize: "200% 100%",
  border: "1px solid rgba(255,140,0,0.4)",
  boxShadow: "0 4px 0 #7a2200, 0 8px 20px rgba(255,80,0,0.35), inset 0 1px 0 rgba(255,200,100,0.25)",
  transform: "perspective(200px) rotateX(6deg) translateY(0px)",
  transition: "all 0.15s ease",
  position: "relative" as const,
};
const errBox = "flex items-center gap-2 text-[11px] rounded-xl px-3 py-2.5";
const label = "block text-[10px] font-semibold uppercase tracking-widest mb-2";
const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'Rajdhani', sans-serif",
  color: "rgba(255,180,80,0.9)",
  letterSpacing: "0.15em",
  fontWeight: 700,
  WebkitFontSmoothing: "antialiased" as const,
};
const ICON_STYLE: React.CSSProperties = { color: "rgba(255,140,50,0.9)" };

function Spinner() {
  return <span className="w-4 h-4 border-2 rounded-full animate-spin inline-block" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff" }} />;
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

  // Звёзды — генерируем один раз
  const stars = Array.from({ length: 200 }, (_, i) => ({
    x: (i * 137.508 + 31) % 100,
    y: (i * 97.3 + 17) % 100,
    size: 0.5 + (i % 5) * 0.4,
    dur: 2 + (i % 6),
    delay: (i * 0.23) % 5,
    bright: i % 7 === 0,
  }));

  return (
    <div className="flex h-screen w-screen overflow-hidden relative" style={{ background: "#000000", fontFamily: "'Space Grotesk', sans-serif", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>

      {/* ── ЗВЁЗДНОЕ НЕБО ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {stars.map((s, i) => (
          <div key={i} className="absolute rounded-full" style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: `${s.size}px`, height: `${s.size}px`,
            background: s.bright ? "#fff" : `rgba(255,255,255,${0.4 + (i % 4) * 0.15})`,
            boxShadow: s.bright ? `0 0 ${s.size * 3}px ${s.size}px rgba(255,220,180,0.8)` : "none",
            animation: `starBlink ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }} />
        ))}
        {/* Редкие яркие звёзды со вспышками */}
        {Array.from({ length: 12 }, (_, i) => (
          <div key={`bright-${i}`} className="absolute" style={{
            left: `${(i * 83 + 5) % 100}%`, top: `${(i * 61 + 13) % 100}%`,
            width: "3px", height: "3px",
            background: "#fff",
            borderRadius: "50%",
            boxShadow: "0 0 6px 2px rgba(255,200,100,0.9), 0 0 12px 4px rgba(255,100,50,0.5)",
            animation: `starFlare ${4 + i % 5}s ease-in-out ${i * 0.7}s infinite`,
          }} />
        ))}
      </div>

      {/* ── ТУМАННОСТИ ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 15% 40%, rgba(80,0,160,0.12) 0%, transparent 50%)", animation:"nebDrift 20s ease-in-out infinite alternate" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 85% 60%, rgba(160,0,80,0.10) 0%, transparent 45%)", animation:"nebDrift 15s ease-in-out 3s infinite alternate-reverse" }} />
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 90%, rgba(20,0,100,0.15) 0%, transparent 40%)", animation:"nebDrift 25s ease-in-out 6s infinite alternate" }} />
      </div>

      {/* ── ЛЕВАЯ ПАНЕЛЬ — красивый текст в 3D ── */}
      <div className="hidden lg:flex w-[440px] flex-shrink-0 flex-col justify-between p-12 relative overflow-hidden z-10" style={{ borderRight: "1px solid rgba(255,100,30,0.15)" }}>
        <div className="relative z-10">
          {/* Лого */}
          <div className="flex items-center gap-4 mb-14">
            <div className="relative w-14 h-14 flex items-center justify-center" style={{
              background: "linear-gradient(145deg, #1a0a00, #2d1200)",
              borderRadius: "14px",
              border: "1px solid rgba(255,120,30,0.5)",
              boxShadow: "0 0 20px rgba(255,80,0,0.5), 0 0 60px rgba(255,40,0,0.2), inset 0 1px 0 rgba(255,160,80,0.3)",
              transform: "perspective(200px) rotateX(5deg)",
            }}>
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, color: "#ff8c00", WebkitFontSmoothing: "antialiased" }}>Д</span>
              <div style={{ position:"absolute", inset:0, borderRadius:"14px", background:"linear-gradient(135deg, rgba(255,120,0,0.1) 0%, transparent 60%)" }} />
            </div>
            <div>
              <div style={{ fontFamily:"'Orbitron', sans-serif", fontSize:18, fontWeight:900, letterSpacing:"0.15em", color:"#ff9d00", WebkitFontSmoothing:"antialiased" }}>ДРУГ</div>
              <div style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:11, color:"rgba(255,150,50,0.7)", letterSpacing:"0.2em", marginTop:2, WebkitFontSmoothing:"antialiased" }}>MESSENGER</div>
            </div>
          </div>

          {/* Заголовок 3D */}
          <div style={{ perspective: "600px", marginBottom: 32 }}>
            <h1 style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: 36,
              fontWeight: 900,
              lineHeight: 1.2,
              letterSpacing: "0.02em",
              color: "#ff8800",
              /* Убираем WebkitTextFillColor + filter — они размывают */
              textShadow: "0 0 40px rgba(255,100,0,0.5), 0 2px 0 rgba(180,60,0,0.6)",
              transform: "perspective(400px) rotateX(3deg)",
              transformOrigin: "50% 100%",
              WebkitFontSmoothing: "antialiased",
            }}>
              КОРПОРАТИВНЫЙ<br />МЕССЕНДЖЕР
            </h1>
          </div>

          <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:13, color:"rgba(255,180,100,0.7)", lineHeight:1.7, letterSpacing:"0.02em", WebkitFontSmoothing:"antialiased" }}>
            Безопасная связь для вашей команды.<br />Чаты, звонки, файлы и боты в одном месте.
          </p>
        </div>

        {/* Фичи */}
        <div className="relative z-10 space-y-4">
          {[
            { icon: "Shield", text: "Сквозное шифрование", sub: "End-to-end" },
            { icon: "Zap", text: "Мгновенная доставка", sub: "Real-time" },
            { icon: "Users", text: "До 10 000 пользователей", sub: "Enterprise" },
          ].map((f, i) => (
            <div key={f.text} className="flex items-center gap-4" style={{ animation: `featureIn 0.6s ease ${0.2 + i * 0.15}s both` }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(145deg, #1a0800, #2d1500)",
                border: "1px solid rgba(255,100,20,0.4)",
                boxShadow: "0 2px 8px rgba(255,80,0,0.2), inset 0 1px 0 rgba(255,160,60,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                animation: `iconPulse ${3 + i}s ease-in-out ${i * 0.5}s infinite`,
              }}>
                <Icon name={f.icon} size={16} style={{ color: "#ff9030" }} />
              </div>
              <div>
                <div style={{ fontFamily:"'Rajdhani', sans-serif", fontWeight:600, fontSize:13, color:"rgba(255,200,120,0.9)", letterSpacing:"0.05em" }}>{f.text}</div>
                <div style={{ fontFamily:"'Space Grotesk', sans-serif", fontSize:10, color:"rgba(255,120,40,0.45)", letterSpacing:"0.15em" }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ПРАВАЯ ЧАСТЬ — форма ── */}
      <div className="flex-1 flex items-center justify-center px-6 overflow-y-auto py-8 z-10 relative">
        <div className="w-full max-w-[400px]">

          {/* Мобильное лого */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(145deg,#1a0a00,#2d1200)", border:"1px solid rgba(255,120,30,0.5)", boxShadow:"0 0 16px rgba(255,80,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:"#ff8c00", WebkitFontSmoothing:"antialiased" }}>Д</span>
            </div>
            <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, letterSpacing:"0.12em", color:"#ff9d00", WebkitFontSmoothing:"antialiased" }}>ДРУГ</span>
          </div>

          {/* STEP: LOGIN */}
          {step === "login" && (
            <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              <div style={FORM_CARD}>
                <div style={{ position:"absolute", inset:0, borderRadius:20, background:"linear-gradient(135deg, rgba(255,120,30,0.08) 0%, transparent 50%)", pointerEvents:"none" }} />
                <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, letterSpacing:"0.04em", color:"#ff9000", textShadow:"0 0 20px rgba(255,140,0,0.4), 0 1px 0 rgba(120,60,0,0.5)", marginBottom:4, WebkitFontSmoothing:"antialiased" }}>ВХОД</h2>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(255,180,80,0.75)", marginBottom:24, letterSpacing:"0.03em", WebkitFontSmoothing:"antialiased" }}>Введите никнейм и пароль</p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className={label} style={LABEL_STYLE}>Никнейм</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ animation:"iconPulse 3s ease-in-out infinite" }}><Icon name="AtSign" size={15} style={ICON_STYLE} /></div>
                      <input type="text" value={username} onChange={e => { setUsername(e.target.value); clearErr(); }}
                        placeholder="username" autoFocus autoComplete="username"
                        className={inputWithIconCls} style={INPUT_STYLE} onFocus={e => Object.assign(e.target.style, INPUT_FOCUS_STYLE)} onBlur={e => Object.assign(e.target.style, INPUT_STYLE)} />
                    </div>
                  </div>
                  <div>
                    <label className={label} style={LABEL_STYLE}>Пароль</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ animation:"iconPulse 4s ease-in-out infinite" }}><Icon name="Lock" size={15} style={ICON_STYLE} /></div>
                      <input type={showPass ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); clearErr(); }}
                        placeholder="••••••••" autoComplete="current-password"
                        className={inputWithIconCls + " pr-10"} style={INPUT_STYLE} onFocus={e => Object.assign(e.target.style, INPUT_FOCUS_STYLE)} onBlur={e => Object.assign(e.target.style, INPUT_STYLE)} />
                      <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:"rgba(255,120,40,0.6)" }}>
                        <Icon name={showPass ? "EyeOff" : "Eye"} size={15} />
                      </button>
                    </div>
                  </div>
                  {error && <div className={errBox} style={{ background:"rgba(255,50,0,0.15)", border:"1px solid rgba(255,80,0,0.3)" }}><Icon name="AlertCircle" size={12} />{error}</div>}
                  <button type="submit" disabled={loading || !username.trim() || !password.trim()} style={{ ...BTN_STYLE, backgroundSize:"200%", animation: loading ? "none" : "btnShimmer 3s linear infinite", opacity: (loading || !username.trim() || !password.trim()) ? 0.4 : 1 }}>
                    {loading ? <span className="flex items-center justify-center gap-2"><Spinner />Входим...</span> : "ВОЙТИ →"}
                  </button>
                </form>
                <div className="mt-5 flex justify-between items-center">
                  <button onClick={() => { setStep("forgot"); clearErr(); setEmail(""); }} style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(255,120,40,0.5)", background:"none", border:"none", cursor:"pointer" }}>Забыл пароль</button>
                  <button onClick={() => { setStep("forgot"); clearErr(); setEmail(""); }} style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:13, color:"rgba(255,180,60,0.9)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.05em" }}>РЕГИСТРАЦИЯ →</button>
                </div>
              </div>
            </div>
          )}

          {/* STEP: FORGOT */}
          {step === "forgot" && (
            <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              <button onClick={() => { setStep("login"); clearErr(); }} className="flex items-center gap-1.5 mb-5 transition-colors" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, color:"rgba(255,120,40,0.6)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.05em" }}>
                <Icon name="ArrowLeft" size={13} /> НАЗАД
              </button>
              <div style={FORM_CARD}>
                <div style={{ position:"absolute", inset:0, borderRadius:20, background:"linear-gradient(135deg, rgba(255,120,30,0.08) 0%, transparent 50%)", pointerEvents:"none" }} />
                <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, letterSpacing:"0.04em", color:"#ff9000", textShadow:"0 0 20px rgba(255,140,0,0.4), 0 1px 0 rgba(120,60,0,0.5)", marginBottom:4, WebkitFontSmoothing:"antialiased" }}>EMAIL</h2>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(255,180,80,0.75)", marginBottom:24, WebkitFontSmoothing:"antialiased" }}>Введите email — пришлём код</p>
                <form onSubmit={handleSendCode} className="space-y-4">
                  <div>
                    <label className={label} style={LABEL_STYLE}>Email</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ animation:"iconPulse 3s ease-in-out infinite" }}><Icon name="Mail" size={15} style={ICON_STYLE} /></div>
                      <input type="email" value={email} onChange={e => { setEmail(e.target.value); clearErr(); }}
                        placeholder="you@company.ru" autoFocus autoComplete="email"
                        className={inputWithIconCls} style={INPUT_STYLE} onFocus={e => Object.assign(e.target.style, INPUT_FOCUS_STYLE)} onBlur={e => Object.assign(e.target.style, INPUT_STYLE)} />
                    </div>
                  </div>
                  {error && <div className={errBox} style={{ background:"rgba(255,50,0,0.15)", border:"1px solid rgba(255,80,0,0.3)" }}><Icon name="AlertCircle" size={12} />{error}</div>}
                  <button type="submit" disabled={loading || !email.trim()} style={{ ...BTN_STYLE, backgroundSize:"200%", animation: loading ? "none" : "btnShimmer 3s linear infinite", opacity: (loading || !email.trim()) ? 0.4 : 1 }}>
                    {loading ? <span className="flex items-center justify-center gap-2"><Spinner />Отправляем...</span> : "ПОЛУЧИТЬ КОД →"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP: EMAIL CODE */}
          {step === "email_code" && (
            <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              <button onClick={() => { setStep("forgot"); setCode(["","","","","",""]); clearErr(); }} className="flex items-center gap-1.5 mb-5" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, color:"rgba(255,120,40,0.6)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.05em" }}>
                <Icon name="ArrowLeft" size={13} /> НАЗАД
              </button>
              <div style={FORM_CARD}>
                <div style={{ position:"absolute", inset:0, borderRadius:20, background:"linear-gradient(135deg, rgba(255,120,30,0.08) 0%, transparent 50%)", pointerEvents:"none" }} />
                <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, letterSpacing:"0.04em", color:"#ff9000", textShadow:"0 0 20px rgba(255,140,0,0.4), 0 1px 0 rgba(120,60,0,0.5)", marginBottom:4, WebkitFontSmoothing:"antialiased" }}>КОД</h2>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(255,180,80,0.75)", marginBottom:24, WebkitFontSmoothing:"antialiased" }}>6-значный код на <span style={{ color:"#ffcc00", fontWeight:600 }}>{email}</span></p>
                <div className="flex gap-2 mb-6">
                  {code.map((digit, idx) => (
                    <input key={idx} type="text" inputMode="numeric" maxLength={1} value={digit}
                      ref={el => { codeRefs[idx] = el; }}
                      onChange={e => handleCodeChange(idx, e.target.value, codeRefs)}
                      onKeyDown={e => handleCodeKey(idx, e, codeRefs)}
                      onFocus={e => e.target.select()}
                      className={`w-11 h-12 text-center text-xl font-mono font-semibold rounded-xl focus:outline-none transition-all ${loading ? "opacity-50" : ""}`}
                      style={{ fontFamily:"'Orbitron',sans-serif", background: digit ? "rgba(255,120,0,0.2)" : "rgba(255,255,255,0.04)", border: digit ? "1px solid rgba(255,160,30,0.6)" : "1px solid rgba(255,100,20,0.2)", color: digit ? "#ffcc00" : "rgba(255,255,255,0.2)", boxShadow: digit ? "0 0 12px rgba(255,120,0,0.3), inset 0 2px 4px rgba(0,0,0,0.3)" : "inset 0 2px 4px rgba(0,0,0,0.3)" }}
                      autoFocus={idx === 0} />
                  ))}
                </div>
                {error && <div className={errBox + " mb-4"} style={{ background:"rgba(255,50,0,0.15)", border:"1px solid rgba(255,80,0,0.3)" }}><Icon name="AlertCircle" size={12} />{error}</div>}
                <button onClick={() => handleVerifyCode()} disabled={!codeComplete || loading} style={{ ...BTN_STYLE, backgroundSize:"200%", animation: loading ? "none" : "btnShimmer 3s linear infinite", opacity: (!codeComplete || loading) ? 0.4 : 1, marginBottom:16 }}>
                  {loading ? <span className="flex items-center justify-center gap-2"><Spinner />Проверяем...</span> : "ПРОДОЛЖИТЬ →"}
                </button>
                <div className="text-center">
                  {resendTimer > 0
                    ? <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(255,120,40,0.4)" }}>Повтор через <span style={{ color:"rgba(255,180,60,0.7)" }}>{resendTimer}с</span></span>
                    : <button onClick={() => handleSendCode()} style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, color:"rgba(255,180,60,0.8)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.05em" }}>ОТПРАВИТЬ СНОВА</button>
                  }
                </div>
              </div>
            </div>
          )}

          {/* STEP: REGISTER */}
          {step === "register" && (
            <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              <div style={FORM_CARD}>
                <div style={{ position:"absolute", inset:0, borderRadius:20, background:"linear-gradient(135deg, rgba(255,120,30,0.08) 0%, transparent 50%)", pointerEvents:"none" }} />
                <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, letterSpacing:"0.04em", color:"#ff9000", textShadow:"0 0 20px rgba(255,140,0,0.4), 0 1px 0 rgba(120,60,0,0.5)", marginBottom:4, WebkitFontSmoothing:"antialiased" }}>РЕГИСТРАЦИЯ</h2>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(255,180,80,0.75)", marginBottom:20, WebkitFontSmoothing:"antialiased" }}>Создайте аккаунт</p>
                <form onSubmit={handleRegister} className="space-y-3">
                  {[
                    { label:"Имя и фамилия", val:displayName, set:(v:string)=>{setDisplayName(v);clearErr();}, ph:"Иван Петров", icon:null, af:true },
                    { label:"Организация", val:organization, set:(v:string)=>{setOrganization(v);clearErr();}, ph:"ООО Ромашка", icon:null, af:false },
                    { label:"Подразделение", val:department, set:(v:string)=>{setDepartment(v);clearErr();}, ph:"Отдел разработки", icon:null, af:false },
                  ].map(f => (
                    <div key={f.label}>
                      <label className={label} style={LABEL_STYLE}>{f.label}</label>
                      <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} autoFocus={f.af}
                        className={inputCls} style={INPUT_STYLE} onFocus={e=>Object.assign(e.target.style,INPUT_FOCUS_STYLE)} onBlur={e=>Object.assign(e.target.style,INPUT_STYLE)} />
                    </div>
                  ))}
                  <div>
                    <label className={label} style={LABEL_STYLE}>Никнейм</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{animation:"iconPulse 3s ease-in-out infinite"}}><Icon name="AtSign" size={15} style={ICON_STYLE} /></div>
                      <input value={newUsername} onChange={e=>{setNewUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g,""));clearErr();}}
                        placeholder="ivan_petrov" autoComplete="username" className={inputWithIconCls}
                        style={INPUT_STYLE} onFocus={e=>Object.assign(e.target.style,INPUT_FOCUS_STYLE)} onBlur={e=>Object.assign(e.target.style,INPUT_STYLE)} />
                    </div>
                    <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:10, color:"rgba(255,120,40,0.35)", marginTop:4 }}>3–30 символов: латиница, цифры, _</p>
                  </div>
                  {[
                    { label:"Пароль", val:newPassword, set:(v:string)=>{setNewPassword(v);clearErr();}, ph:"Минимум 6 символов", ac:"new-password" },
                    { label:"Повторите пароль", val:newPassword2, set:(v:string)=>{setNewPassword2(v);clearErr();}, ph:"••••••••", ac:"new-password" },
                  ].map((f,fi) => (
                    <div key={f.label}>
                      <label className={label} style={LABEL_STYLE}>{f.label}</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{animation:`iconPulse ${3+fi}s ease-in-out infinite`}}><Icon name="Lock" size={15} style={ICON_STYLE} /></div>
                        <input type={showPass?"text":"password"} value={f.val} onChange={e=>f.set(e.target.value)}
                          placeholder={f.ph} autoComplete={f.ac} className={inputWithIconCls+(fi===0?" pr-10":"")}
                          style={INPUT_STYLE} onFocus={e=>Object.assign(e.target.style,INPUT_FOCUS_STYLE)} onBlur={e=>Object.assign(e.target.style,INPUT_STYLE)} />
                        {fi===0 && <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:"rgba(255,120,40,0.6)"}}><Icon name={showPass?"EyeOff":"Eye"} size={15}/></button>}
                      </div>
                    </div>
                  ))}
                  {error && <div className={errBox} style={{background:"rgba(255,50,0,0.15)",border:"1px solid rgba(255,80,0,0.3)"}}><Icon name="AlertCircle" size={12}/>{error}</div>}
                  <button type="submit" disabled={loading||!displayName.trim()||!newUsername.trim()||newPassword.length<6} style={{...BTN_STYLE,backgroundSize:"200%",animation:loading?"none":"btnShimmer 3s linear infinite",opacity:(loading||!displayName.trim()||!newUsername.trim()||newPassword.length<6)?0.4:1}}>
                    {loading?<span className="flex items-center justify-center gap-2"><Spinner/>Создаём...</span>:"СОЗДАТЬ АККАУНТ →"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP: RESET PASSWORD */}
          {step === "reset_password" && (
            <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              <div style={FORM_CARD}>
                <div style={{ position:"absolute", inset:0, borderRadius:20, background:"linear-gradient(135deg, rgba(255,120,30,0.08) 0%, transparent 50%)", pointerEvents:"none" }} />
                <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, letterSpacing:"0.04em", color:"#ff9000", textShadow:"0 0 20px rgba(255,140,0,0.4), 0 1px 0 rgba(120,60,0,0.5)", marginBottom:4, WebkitFontSmoothing:"antialiased" }}>НОВЫЙ ПАРОЛЬ</h2>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(255,180,80,0.75)", marginBottom:24, WebkitFontSmoothing:"antialiased" }}>Придумайте надёжный пароль</p>
                <form onSubmit={handleReset} className="space-y-4">
                  {[
                    { label:"Новый пароль", val:newPassword, set:(v:string)=>{setNewPassword(v);clearErr();}, ph:"Минимум 6 символов", af:true },
                    { label:"Повторите пароль", val:newPassword2, set:(v:string)=>{setNewPassword2(v);clearErr();}, ph:"••••••••", af:false },
                  ].map((f,fi) => (
                    <div key={f.label}>
                      <label className={label} style={LABEL_STYLE}>{f.label}</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="Lock" size={15} style={ICON_STYLE}/></div>
                        <input type={showPass?"text":"password"} value={f.val} onChange={e=>f.set(e.target.value)}
                          placeholder={f.ph} autoFocus={f.af} autoComplete="new-password"
                          className={inputWithIconCls+(fi===0?" pr-10":"")}
                          style={INPUT_STYLE} onFocus={e=>Object.assign(e.target.style,INPUT_FOCUS_STYLE)} onBlur={e=>Object.assign(e.target.style,INPUT_STYLE)} />
                        {fi===0 && <button type="button" onClick={()=>setShowPass(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:"rgba(255,120,40,0.6)"}}><Icon name={showPass?"EyeOff":"Eye"} size={15}/></button>}
                      </div>
                    </div>
                  ))}
                  {error && <div className={errBox} style={{background:"rgba(255,50,0,0.15)",border:"1px solid rgba(255,80,0,0.3)"}}><Icon name="AlertCircle" size={12}/>{error}</div>}
                  <button type="submit" disabled={loading||newPassword.length<6} style={{...BTN_STYLE,backgroundSize:"200%",animation:loading?"none":"btnShimmer 3s linear infinite",opacity:(loading||newPassword.length<6)?0.4:1}}>
                    {loading?<span className="flex items-center justify-center gap-2"><Spinner/>Сохраняем...</span>:"СОХРАНИТЬ ПАРОЛЬ →"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Rajdhani:wght@500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: perspective(600px) rotateX(8deg) translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: perspective(600px) rotateX(2deg) translateY(0) scale(1); }
        }
        @keyframes starBlink {
          0%,100% { opacity: 0.2; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.4); }
        }
        @keyframes starFlare {
          0%,100% { opacity:0.3; transform:scale(1); box-shadow:0 0 4px 1px rgba(255,200,100,0.6); }
          50%     { opacity:1;   transform:scale(1.6); box-shadow:0 0 12px 4px rgba(255,100,50,1), 0 0 24px 8px rgba(255,200,50,0.4); }
        }
        @keyframes nebDrift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(30px,20px) scale(1.1); }
        }
        @keyframes iconPulse {
          0%,100% { filter: drop-shadow(0 0 4px rgba(255,100,0,0.5)); }
          50%     { filter: drop-shadow(0 0 10px rgba(255,160,0,0.9)); }
        }
        @keyframes featureIn {
          from { opacity:0; transform: translateX(-20px); }
          to   { opacity:1; transform: translateX(0); }
        }
        @keyframes btnShimmer {
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
  const [chatPattern, setChatPattern] = useState<string>(() => localStorage.getItem("chat_pattern") || "none");
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

  // Звёзды для настроек
  const settingStars = Array.from({ length: 60 }, (_, i) => ({
    x: (i * 127.3 + 7) % 100, y: (i * 91.7 + 19) % 100,
    size: 0.5 + (i % 3) * 0.4, dur: 2 + (i % 6), delay: (i * 0.27) % 4,
    bright: i % 9 === 0,
  }));

  return (
    <div className="flex flex-1 overflow-hidden relative">

      {/* Звёздный фон настроек */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {settingStars.map((s, i) => (
          <div key={i} className="absolute rounded-full" style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            background: s.bright ? "var(--t-accent)" : "rgba(255,255,255,0.25)",
            animation: s.bright ? `appStarFlare ${s.dur}s ease-in-out ${s.delay}s infinite` : `appStarBlink ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }} />
        ))}
        {/* Туманность */}
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 20% 30%, color-mix(in srgb, var(--t-accent) 5%, transparent) 0%, transparent 50%)", pointerEvents:"none" }} />
      </div>

      {/* Left nav */}
      <div className="w-56 flex flex-col flex-shrink-0 pt-4 relative z-10" style={{
        background: `linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 6%, var(--t-bg-main)), var(--t-bg-main))`,
        borderRight: "1px solid var(--t-border)",
        boxShadow: "2px 0 16px rgba(0,0,0,0.4)",
      }}>
        <div className="px-4 mb-4">
          <h2 style={{ ...heading3d(11), letterSpacing: "0.18em" }}>НАСТРОЙКИ</h2>
        </div>
        {tabs.map(item => {
          const active = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className="flex items-center gap-3 px-4 py-3 text-left transition-all duration-200"
              style={{
                background: active ? `linear-gradient(90deg, color-mix(in srgb, var(--t-accent) 15%, transparent), transparent)` : "transparent",
                borderLeft: active ? "3px solid var(--t-accent)" : "3px solid transparent",
                color: active ? "var(--t-accent)" : "var(--t-text-dim)",
                fontFamily: FONT.heading, fontWeight: active ? 700 : 500, fontSize: 13, letterSpacing: "0.06em",
                boxShadow: active ? `inset 0 0 20px color-mix(in srgb, var(--t-accent) 5%, transparent)` : "none",
              }}>
              <Icon name={item.icon} size={15} style={active ? liveIcon(0) : { color: "var(--t-text-dim)" }} />
              {item.label.toUpperCase()}
            </button>
          );
        })}
        <div className="mt-auto mb-4 px-4">
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all btn-3d"
            style={{ ...btn3d("var(--t-danger)"), fontSize: 12, justifyContent: "center" }}>
            <Icon name="LogOut" size={13} style={{ color: "#fff" }} />
            <span style={{ fontFamily: FONT.heading, fontWeight: 700, letterSpacing: "0.08em" }}>ВЫЙТИ</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 relative z-10">

      {/* === ВКЛАДКА: ОФОРМЛЕНИЕ === */}
      {activeTab === "appearance" && (
        <div className="max-w-2xl">
          <h3 style={{ ...heading3d(15), letterSpacing: "0.1em", marginBottom: 4 }}>ОФОРМЛЕНИЕ</h3>
          <p style={{ fontFamily: FONT.body, fontSize: 12, color: "var(--t-text-dim)", marginBottom: 24 }}>Выберите цветовую тему интерфейса</p>

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

          {/* ── ОБОИ ЧАТА ── */}
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3 mt-6" style={{ color: "var(--t-text-dim)" }}>Обои чата</h3>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { id: "none",     label: "Без обоев",  bg: "var(--t-chat-bg)", pattern: "none",   preview: "solid" },
              { id: "dots",     label: "Точки",      bg: "var(--t-chat-bg)", pattern: "dots",   preview: "dots" },
              { id: "lines",    label: "Линии",      bg: "var(--t-chat-bg)", pattern: "lines",  preview: "lines" },
              { id: "grid",     label: "Сетка",      bg: "var(--t-chat-bg)", pattern: "grid",   preview: "grid" },
              { id: "diamonds", label: "Ромбы",      bg: "var(--t-chat-bg)", pattern: "diamonds", preview: "diamonds" },
              { id: "circles",  label: "Круги",      bg: "var(--t-chat-bg)", pattern: "circles", preview: "circles" },
              { id: "waves",    label: "Волны",      bg: "var(--t-chat-bg)", pattern: "waves",  preview: "waves" },
              { id: "stars",    label: "Звёзды",     bg: "var(--t-chat-bg)", pattern: "stars",  preview: "stars" },
            ].map(p => {
              const isActive = chatPattern === p.id;
              const patternStyles: Record<string, string> = {
                none:     "none",
                dots:     `radial-gradient(circle, var(--t-border-md) 1px, transparent 1px)`,
                lines:    `repeating-linear-gradient(0deg, transparent, transparent 18px, var(--t-border) 18px, var(--t-border) 19px)`,
                grid:     `linear-gradient(var(--t-border) 1px, transparent 1px), linear-gradient(90deg, var(--t-border) 1px, transparent 1px)`,
                diamonds: `repeating-linear-gradient(45deg, transparent, transparent 10px, var(--t-border) 10px, var(--t-border) 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, var(--t-border) 10px, var(--t-border) 11px)`,
                circles:  `radial-gradient(circle at 50% 50%, transparent 8px, var(--t-border) 8px, var(--t-border) 9px, transparent 9px)`,
                waves:    `repeating-linear-gradient(-45deg, transparent, transparent 6px, var(--t-border) 6px, var(--t-border) 7px)`,
                stars:    `radial-gradient(circle, var(--t-accent) 1px, transparent 1px), radial-gradient(circle, var(--t-border-md) 0.5px, transparent 0.5px)`,
              };
              const sizes: Record<string, string> = {
                dots: "16px 16px", lines: "100% 19px", grid: "20px 20px",
                diamonds: "14px 14px", circles: "18px 18px", waves: "8px 8px", stars: "24px 24px, 12px 12px",
              };
              return (
                <button key={p.id} onClick={() => {
                  localStorage.setItem("chat_pattern", p.id);
                  applyPattern(p.id);
                  setChatPattern(p.id);
                }} className="relative rounded-lg overflow-hidden transition-all" style={{
                  height: 60, border: `2px solid ${chatPattern === p.id ? "var(--t-accent)" : "var(--t-border)"}`,
                  boxShadow: chatPattern === p.id ? "0 0 0 1px var(--t-accent)" : "none",
                  background: "var(--t-chat-bg)",
                  backgroundImage: patternStyles[p.id],
                  backgroundSize: sizes[p.id] || "auto",
                }}>
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-1.5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }}>
                    <span className="text-[9px] font-medium" style={{ color: isActive ? "var(--t-accent)" : "rgba(255,255,255,0.7)" }}>{p.label}</span>
                  </div>
                  {isActive && <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: "var(--t-accent)" }}><Icon name="Check" size={8} className="text-white" /></div>}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--t-bg-main)", border: "1px solid var(--t-border)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Info" size={13} className="text-[var(--t-accent)]" />
              <span className="text-xs font-medium" style={{ color: "var(--t-text)" }}>Тема применяется мгновенно</span>
            </div>
            <p className="text-xs" style={{ color: "var(--t-text-dim)" }}>Выбор сохраняется в браузере.</p>
          </div>
        </div>
      )}

      {/* === ВКЛАДКА: ПРОФИЛЬ === */}
      {activeTab === "profile" && <>
        <h3 style={{ ...heading3d(15), letterSpacing: "0.1em", marginBottom: 20 }}>ПРОФИЛЬ</h3>

        {/* Avatar preview */}
        <div className="flex items-center gap-5 mb-7 p-5 max-w-lg" style={{ ...card3d(), animation: "card3dFloat 7s ease-in-out infinite" }}>
          <label className="relative cursor-pointer group flex-shrink-0">
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt="avatar" className="object-cover" style={{ width: 56, height: 56, borderRadius: 14, border: `2px solid color-mix(in srgb, var(--t-accent) 40%, transparent)`, boxShadow: `0 0 16px color-mix(in srgb, var(--t-accent) 30%, transparent)` }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(145deg, var(--t-bg-card), var(--t-bg-panel))`, border: `2px solid color-mix(in srgb, var(--t-accent) 40%, transparent)`, boxShadow: `0 0 16px color-mix(in srgb, var(--t-accent) 30%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.heading, fontWeight: 700, fontSize: 18, color: "var(--t-accent)" }}>
                {displayName.trim().split(" ").length >= 2
                  ? (displayName.trim().split(" ")[0][0] + displayName.trim().split(" ")[1][0]).toUpperCase()
                  : currentUser.avatar_initials}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100" style={{ borderRadius: 14, background: "rgba(0,0,0,0.6)" }}>
              {avatarUploading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Icon name="Camera" size={16} className="text-white" />}
            </div>
          </label>
          <div>
            <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 16, color: "var(--t-text)", letterSpacing: "0.04em", filter: "drop-shadow(0 1px 4px color-mix(in srgb, var(--t-accent) 30%, transparent))" }}>{displayName || currentUser.display_name}</div>
            {position && <div style={{ fontFamily: FONT.body, fontSize: 12, color: "var(--t-accent)", marginTop: 2 }}>{position}</div>}
            {department && <div style={{ fontFamily: FONT.body, fontSize: 11, color: "var(--t-text-dim)", marginTop: 2 }}>{department}</div>}
            <button
              type="button"
              onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
              style={{ fontFamily: FONT.heading, fontSize: 11, color: "var(--t-accent)", letterSpacing: "0.08em", background: "none", border: "none", cursor: "pointer", marginTop: 6 }}
            >
              {currentUser.avatar_url ? "Сменить фото" : "Загрузить фото"}
            </button>
            {avatarError && <div className="text-[10px] text-[#f87171] mt-1">{avatarError}</div>}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label style={{ display: "block", fontFamily: FONT.heading, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "var(--t-text-dim)", marginBottom: 6, textTransform: "uppercase" }}>Имя и Фамилия</label>
              <input
                value={displayName}
                onChange={e => { setDisplayName(e.target.value); setError(""); setSuccess(false); }}
                placeholder="Иван Петров"
                className="w-full px-4 py-2.5 focus:outline-none transition-all"
                style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)", borderRadius: 10, color: "var(--t-text)", fontFamily: FONT.body, fontSize: 13, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: FONT.heading, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "var(--t-text-dim)", marginBottom: 6, textTransform: "uppercase" }}>Должность</label>
              <input
                value={position}
                onChange={e => { setPosition(e.target.value); setSuccess(false); }}
                placeholder="Менеджер"
                className="w-full px-4 py-2.5 focus:outline-none transition-all"
                style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)", borderRadius: 10, color: "var(--t-text)", fontFamily: FONT.body, fontSize: 13, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: FONT.heading, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "var(--t-text-dim)", marginBottom: 6, textTransform: "uppercase" }}>Отдел</label>
              <input
                value={department}
                onChange={e => { setDepartment(e.target.value); setSuccess(false); }}
                placeholder="Продажи"
                className="w-full px-4 py-2.5 focus:outline-none transition-all"
                style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)", borderRadius: 10, color: "var(--t-text)", fontFamily: FONT.body, fontSize: 13, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)" }}
              />
            </div>
            <div className="col-span-2">
              <label style={{ display: "block", fontFamily: FONT.heading, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "var(--t-text-dim)", marginBottom: 6, textTransform: "uppercase" }}>Телефон</label>
              <input value={currentUser.phone || ""} readOnly
                className="w-full px-4 py-2.5 cursor-not-allowed"
                style={{ background: "var(--t-bg-main)", border: "1px solid var(--t-border)", borderRadius: 10, color: "var(--t-text-dim)", fontFamily: FONT.mono, fontSize: 12 }}
              />
              <p style={{ fontFamily: FONT.body, fontSize: 10, color: "var(--t-border-md)", marginTop: 4 }}>Номер телефона изменить нельзя</p>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: 10, fontFamily: FONT.body, fontSize: 12, color: "#f87171" }}>
              <Icon name="AlertCircle" size={12} style={{ color: "#f87171", filter: "drop-shadow(0 0 4px rgba(255,80,80,0.6))" }} /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(50,255,100,0.08)", border: "1px solid rgba(50,200,80,0.3)", borderRadius: 10, fontFamily: FONT.body, fontSize: 12, color: "#4ade80" }}>
              <Icon name="CheckCircle" size={12} style={{ color: "#4ade80", filter: "drop-shadow(0 0 4px rgba(50,200,80,0.6))" }} /> Профиль сохранён
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving || !isDirty}
              className="btn-3d px-6 py-2.5 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ ...btn3d("var(--t-accent)"), fontSize: 12 }}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 rounded-full animate-spin inline-block" style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                  СОХРАНЯЕМ...
                </span>
              ) : "СОХРАНИТЬ"}
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
                className="px-4 py-2.5 transition-all"
                style={{ fontFamily: FONT.heading, fontWeight: 600, fontSize: 12, letterSpacing: "0.08em", color: "var(--t-text-dim)", background: "none", border: "1px solid var(--t-border)", borderRadius: 10, cursor: "pointer" }}
              >
                ОТМЕНА
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
      <div className="flex h-screen w-screen items-center justify-center" style={{ background: "#000" }}>
        <div style={{ fontFamily: FONT.heading, fontSize: 13, color: "rgba(255,150,50,0.6)", letterSpacing: "0.2em", animation: "glowPulse 1.5s ease-in-out infinite" }}>ЗАГРУЗКА...</div>
      </div>
    );
  }

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  // Звёзды для фона приложения
  const appStars = Array.from({ length: 80 }, (_, i) => ({
    x: (i * 139.5 + 23) % 100, y: (i * 83.7 + 11) % 100,
    size: 0.5 + (i % 4) * 0.3, dur: 3 + (i % 5), delay: (i * 0.31) % 4,
    bright: i % 11 === 0,
  }));

  return (
    <div className="flex h-screen w-screen overflow-hidden transition-colors duration-300 relative" style={{ fontFamily: FONT.body, background: T.bgDeep, color: T.text }}>

      {/* ── Звёзды фона (только для тёмных тем) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden app-star" style={{ zIndex: 0 }}>
        {appStars.map((s, i) => (
          <div key={i} className="absolute rounded-full app-star" style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size,
            background: s.bright ? "var(--t-accent)" : "rgba(255,255,255,0.3)",
            animation: s.bright ? `appStarFlare ${s.dur}s ease-in-out ${s.delay}s infinite` : `appStarBlink ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }} />
        ))}
      </div>

      {/* ── 3D SIDEBAR ── */}
      <nav className="flex flex-col items-center py-3 w-[62px] gap-0.5 flex-shrink-0 relative z-10" style={{
        background: `linear-gradient(180deg, var(--t-bg-deep) 0%, color-mix(in srgb, var(--t-bg-deep) 92%, var(--t-accent)) 100%)`,
        borderRight: "1px solid var(--t-border)",
        boxShadow: "2px 0 16px rgba(0,0,0,0.25), inset -1px 0 0 rgba(255,255,255,0.04)",
      }}>
        {/* Лого */}
        <div className="mb-3" style={{ padding: "4px 0" }}>
          <div className="nav-logo" style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(145deg, color-mix(in srgb, var(--t-accent) 80%, white), var(--t-accent))`,
            boxShadow: `0 2px 12px color-mix(in srgb, var(--t-accent) 50%, transparent), 0 4px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: "perspective(200px) rotateX(6deg)",
          }}>
            <span style={{ fontFamily: FONT.display, fontSize: 14, fontWeight: 900, color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>Д</span>
          </div>
        </div>

        {navItems.map((item, idx) => {
          const active = section === item.id;
          return (
            <button key={item.id} onClick={() => setSection(item.id)} title={item.label}
              className={`w-[50px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200 ${active ? "nav-item-active" : ""}`}
              style={{
                height: 46, padding: "4px 2px",
                background: active ? `linear-gradient(145deg, color-mix(in srgb, var(--t-accent) 15%, transparent), color-mix(in srgb, var(--t-accent) 8%, transparent))` : "transparent",
                border: active ? `1px solid color-mix(in srgb, var(--t-accent) 30%, transparent)` : "1px solid transparent",
                color: active ? "var(--t-accent)" : "var(--t-text-dim)",
                boxShadow: active ? `0 0 12px color-mix(in srgb, var(--t-accent) 20%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)` : "none",
                transform: active ? "perspective(200px) rotateX(3deg) scale(1.02)" : "none",
                animation: active ? `iconLive ${3 + idx * 0.5}s ease-in-out infinite` : "none",
              }}>
              <Icon name={item.icon} size={17} />
              <span style={{ fontSize: 8, fontFamily: FONT.heading, fontWeight: 600, letterSpacing: "0.05em" }}>{item.label}</span>
            </button>
          );
        })}

        <div className="mt-auto flex flex-col items-center gap-0.5">
          {bottomNav.map((item, idx) => {
            const active = section === item.id;
            return (
              <button key={item.id} onClick={() => setSection(item.id)} title={item.label}
                className="w-[50px] rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200"
                style={{
                  height: 46, padding: "4px 2px",
                  background: active ? `color-mix(in srgb, var(--t-accent) 12%, transparent)` : "transparent",
                  border: active ? `1px solid color-mix(in srgb, var(--t-accent) 25%, transparent)` : "1px solid transparent",
                  color: active ? "var(--t-accent)" : "var(--t-text-dim)",
                  animation: active ? `iconLive ${3 + idx * 0.7}s ease-in-out infinite` : "none",
                }}>
                <Icon name={item.icon} size={17} />
                <span style={{ fontSize: 8, fontFamily: FONT.heading, fontWeight: 600, letterSpacing: "0.05em" }}>{item.label}</span>
              </button>
            );
          })}
          <div style={{ width: 32, height: 1, background: "var(--t-border)", margin: "4px 0" }} />
          {/* Аватар пользователя */}
          <button title={currentUser.display_name} onClick={() => setSection("settings")} style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(145deg, var(--t-bg-card), var(--t-bg-panel))`,
            border: `2px solid color-mix(in srgb, var(--t-accent) 50%, var(--t-border))`,
            boxShadow: `0 2px 8px rgba(0,0,0,0.15)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: FONT.heading, fontWeight: 700, fontSize: 11,
            color: "var(--t-accent)", cursor: "pointer",
            transition: "all 0.2s ease",
          }}>
            {currentUser.avatar_initials}
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden relative z-10">

        {/* CHATS */}
        {section === "chats" && (
          <>
            {/* ── Левая панель: список чатов ── */}
            <div className="w-72 flex flex-col flex-shrink-0" style={{ background: "var(--t-bg-main)", borderRight: "1px solid var(--t-border)", boxShadow: "2px 0 12px rgba(0,0,0,0.3)" }}>
              <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--t-border)", background: `linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))` }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 style={{ ...heading3d(12), letterSpacing: "0.12em" }}>ЧАТЫ</h2>
                  {loadingChats && <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />}
                </div>
                <div className="relative">
                  <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={liveIcon(0)} />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск..."
                    className="w-full pl-8 pr-3 py-2 focus:outline-none transition-all"
                    style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)", borderRadius: 10, color: "var(--t-text)", fontFamily: FONT.body, fontSize: 12, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)" }} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredChats.map(chat => (
                  <button key={chat.id} onClick={() => setActiveChat(chat)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200"
                    style={{
                      borderBottom: "1px solid var(--t-bg-panel)",
                      background: activeChat?.id === chat.id
                        ? `linear-gradient(90deg, color-mix(in srgb, var(--t-accent) 12%, transparent), transparent)`
                        : "transparent",
                      borderLeft: activeChat?.id === chat.id ? `3px solid var(--t-accent)` : "3px solid transparent",
                    }}>
                    <AvatarBadge initials={chat.avatar} online={chat.type === "personal" ? chat.online : undefined} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span style={{ fontFamily: FONT.heading, fontWeight: 600, fontSize: 13, color: "var(--t-text)", letterSpacing: "0.02em" }} className="truncate">{chat.name}</span>
                        <span style={{ fontFamily: FONT.mono, fontSize: 10, color: "var(--t-text-dim)" }} className="ml-2 flex-shrink-0">{chat.last_time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontFamily: FONT.body, fontSize: 11, color: "var(--t-text-dim)" }} className="truncate">{chat.last_message}</span>
                        {chat.unread > 0 && (
                          <span className="ml-2 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "var(--t-accent)", color: "var(--t-bg-deep)", fontSize: 9, fontWeight: 700, boxShadow: "0 0 8px var(--t-accent)", animation: "badgePulse 2s infinite" }}>{chat.unread}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {chats.length === 0 && !loadingChats && (
                  <div className="p-6 text-center" style={{ color: "var(--t-text-dim)", fontFamily: FONT.body, fontSize: 12 }}>Нет чатов</div>
                )}
              </div>
            </div>

            {/* ── Правая часть: переписка ── */}
            <div className="flex flex-col flex-1 overflow-hidden">
              {activeChat ? (
                <>
                  {/* Заголовок чата */}
                  <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{
                    borderBottom: "1px solid var(--t-border)",
                    background: `linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 6%, var(--t-bg-main)), var(--t-bg-main))`,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                  }}>
                    <div className="flex items-center gap-3">
                      <AvatarBadge initials={activeChat.avatar} online={activeChat.type === "personal" ? activeChat.online : undefined} />
                      <div>
                        <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 14, color: "var(--t-text)", letterSpacing: "0.05em", filter: "drop-shadow(0 1px 4px color-mix(in srgb, var(--t-accent) 30%, transparent))" }}>{activeChat.name}</div>
                        <div style={{ fontFamily: FONT.body, fontSize: 11, color: activeChat.online ? "var(--t-online)" : "var(--t-text-dim)" }}>
                          {activeChat.type === "personal" ? (activeChat.online ? "● В сети" : "Не в сети") : "Групповой чат"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[
                        { icon: "Phone", action: () => setActiveCall(true) },
                        { icon: "Video", action: () => setActiveVideo(true) },
                        { icon: "MoreVertical", action: () => {} },
                      ].map((btn, i) => (
                        <button key={i} onClick={btn.action} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ color: "var(--t-text-dim)", animation: `iconLive ${4 + i}s ease-in-out infinite` }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `color-mix(in srgb, var(--t-accent) 15%, transparent)`; (e.currentTarget as HTMLElement).style.color = "var(--t-accent)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--t-text-dim)"; }}>
                          <Icon name={btn.icon} size={16} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Область сообщений */}
                  <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-2" style={{ background: "var(--t-chat-bg)", backgroundImage: "var(--t-chat-pattern)", backgroundSize: "var(--t-chat-pattern-size, auto)" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-px" style={{ background: "var(--t-border)" }} />
                      <span style={{ fontFamily: FONT.mono, fontSize: 10, color: "var(--t-text-dim)" }}>
                        {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      <div className="flex-1 h-px" style={{ background: "var(--t-border)" }} />
                    </div>

                    {loadingMessages && messages.length === 0 && (
                      <div className="flex justify-center py-8">
                        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />
                      </div>
                    )}

                    {messages.map((msg, mi) => (
                      <div key={msg.id} className={`flex items-end gap-2 ${msg.own ? "flex-row-reverse" : ""}`}
                        style={{ animation: `msgIn 0.25s ease ${mi * 0.03}s both` }}>
                        {!msg.own && <AvatarBadge initials={msg.sender_avatar || "??"} size="sm" />}
                        <div className={`max-w-[68%] flex flex-col gap-1 ${msg.own ? "items-end" : "items-start"}`}>
                          {!msg.own && (
                            <span className="msg-sender ml-2" style={{ color: "var(--t-accent)" }}>{msg.sender_name}</span>
                          )}
                          <div className="px-4 py-2.5" style={msg.own ? msgOwn() : msgOther()}>
                            {msg.type === "file" ? (
                              <a href={msg.file_url || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: `color-mix(in srgb, var(--t-accent) 15%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <Icon name={/\.(png|jpe?g|gif|webp|svg)$/i.test(msg.file_name || "") ? "Image" : /\.(zip|rar|7z|tar)$/i.test(msg.file_name || "") ? "Archive" : "FileText"} size={18} style={liveIcon()} />
                                </div>
                                <div className="min-w-0">
                                  <div className="msg-text font-medium truncate max-w-[180px]" style={{ color: "var(--t-text)" }}>{msg.file_name}</div>
                                  <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "var(--t-text-dim)" }}>{msg.file_size}</div>
                                </div>
                              </a>
                            ) : (
                              <span className="msg-text">{msg.text}</span>
                            )}
                          </div>
                          <span className="msg-time mx-1">{msg.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Поле ввода */}
                  <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--t-border)", background: `linear-gradient(0deg, var(--t-bg-main), color-mix(in srgb, var(--t-bg-main) 95%, var(--t-accent)))` }}>
                    {uploadingFile && (
                      <div className="flex items-center gap-2 mb-2" style={{ fontFamily: FONT.body, fontSize: 11, color: "var(--t-accent)" }}>
                        <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />
                        Загружаем файл...
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-2" style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                      <label className="cursor-pointer flex-shrink-0 transition-all" style={liveIcon(1)}>
                        <Icon name="Paperclip" size={17} />
                        <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
                      </label>
                      <input
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Написать сообщение..."
                        className="flex-1 bg-transparent focus:outline-none msg-text"
                        style={{ color: "var(--t-text)", fontFamily: FONT.body, fontSize: 13, letterSpacing: "0.01em" }}
                      />
                      <button onClick={handleSend} disabled={sendingMsg || !msgInput.trim()}
                        className="btn-3d flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                        style={{ ...btn3d("var(--t-accent)"), width: 34, height: 34, padding: 0 }}>
                        <Icon name="Send" size={14} style={{ color: "#fff" }} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center" style={{ animation: "slideInUp 0.5s ease both" }}>
                    <div style={{ width: 80, height: 80, borderRadius: 20, margin: "0 auto 16px", ...card3d(), display: "flex", alignItems: "center", justifyContent: "center", animation: "card3dFloat 5s ease-in-out infinite" }}>
                      <Icon name="MessageSquare" size={36} style={liveIcon()} />
                    </div>
                    <p style={{ fontFamily: FONT.heading, fontSize: 14, color: "var(--t-text-dim)", letterSpacing: "0.1em" }}>ВЫБЕРИТЕ ЧАТ</p>
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
              <div className="w-72 flex flex-col border-r flex-shrink-0" style={{ borderColor: "var(--t-border)", background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))", boxShadow: "2px 0 12px rgba(0,0,0,0.3)" }}>
                <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--t-border)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>КОНТАКТЫ</h2>
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
                    <div className="flex flex-col items-center justify-center py-8 px-4 gap-3">
                      <div style={{ ...card3d(), padding: "14px", display: "inline-flex" }}>
                        <Icon name="UserX" size={22} style={liveIcon(0)} />
                      </div>
                      <span style={{ ...heading3d(11), letterSpacing: "0.12em" }}>НЕТ ДАННЫХ</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="flex items-center justify-between mb-5 max-w-2xl">
                  <h3 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>ВСЕ СОТРУДНИКИ ({filtered.length})</h3>
                  <div className="flex gap-2">
                    <button onClick={importFromPhone} className="btn-3d px-3 py-1.5 text-[10px] flex items-center gap-1.5" style={{ ...btn3d("var(--t-accent)") }}>
                      <Icon name="Smartphone" size={11} /> ИМПОРТ
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-2xl">
                  {filtered.map((c, index) => (
                    <div key={c.id} className="p-4 transition-all" style={{ ...card3d(), animation: "card3dFloat 4s ease-in-out infinite", animationDelay: `${index * 0.15}s` }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div style={{ boxShadow: c.online ? "0 0 6px var(--t-online)" : undefined, borderRadius: "50%" }}>
                          <AvatarBadge initials={c.avatar_initials} size="lg" online={c.online} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>{c.display_name}</div>
                          <div className="text-[11px] truncate" style={{ fontFamily: FONT.body, color: "var(--t-accent)" }}>{c.department}</div>
                        </div>
                      </div>
                      {c.position && <div className="text-[11px] mb-1" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{c.position}</div>}
                      <div className="flex gap-1.5 mt-3">
                        <button onClick={() => openChatWith(c.id)} className="btn-3d flex-1 py-1.5 text-[10px] flex items-center justify-center gap-1" style={{ ...btn3d("var(--t-accent)") }}>
                          <Icon name="MessageSquare" size={11} style={liveIcon(index * 0.3)} /> ЧАТ
                        </button>
                        <button onClick={() => startCall(c, "audio")} className="btn-3d flex-1 py-1.5 text-[10px] flex items-center justify-center gap-1" style={{ ...btn3d("var(--t-accent)") }}>
                          <Icon name="Phone" size={11} style={liveIcon(index * 0.3 + 0.1)} /> ЗВОНОК
                        </button>
                        <button onClick={() => startCall(c, "video")} className="btn-3d flex-1 py-1.5 text-[10px] flex items-center justify-center gap-1" style={{ ...btn3d("var(--t-accent)") }}>
                          <Icon name="Video" size={11} style={liveIcon(index * 0.3 + 0.2)} /> ВИДЕО
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
            <div className="w-80 flex flex-col border-r flex-shrink-0" style={{ borderColor: "var(--t-border)", background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))", boxShadow: "2px 0 12px rgba(0,0,0,0.3)" }}>
              <div className="px-4 pt-4 pb-3 border-b flex items-center justify-between" style={{ borderColor: "var(--t-border)" }}>
                <h2 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>ЗВОНКИ</h2>
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
                  <div className="flex flex-col items-center justify-center py-8 px-4 gap-3">
                    <div style={{ ...card3d(), padding: "14px", display: "inline-flex" }}>
                      <Icon name="PhoneOff" size={22} style={liveIcon(0)} />
                    </div>
                    <span style={{ ...heading3d(11), letterSpacing: "0.12em" }}>НЕТ ДАННЫХ</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ ...card3d() }}>
                  <Icon name="Phone" size={32} style={liveIcon(0)} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>НОВЫЙ ЗВОНОК</p>
                <p className="text-xs mb-5" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>Выберите контакт для звонка</p>
                <div className="flex gap-2 justify-center">
                  {contacts.slice(0, 4).map((c, index) => (
                    <button key={c.id} onClick={() => startCall(c, "audio")} className="flex flex-col items-center gap-1.5 p-2 rounded-sm transition-colors">
                      <div style={{ boxShadow: c.online ? "0 0 6px var(--t-online)" : undefined, borderRadius: "50%" }}>
                        <AvatarBadge initials={c.avatar_initials} online={c.online} />
                      </div>
                      <span className="text-[10px] max-w-[48px] truncate" style={{ fontFamily: FONT.body, color: "var(--t-text-muted)" }}>{c.display_name.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setSection("contacts"); }} className="btn-3d px-4 py-2 text-xs flex items-center gap-1.5" style={{ ...btn3d("#22c55e") }}>
                  <Icon name="Phone" size={13} /> АУДИОЗВОНОК
                </button>
                <button onClick={() => { setSection("contacts"); }} className="btn-3d px-4 py-2 text-xs flex items-center gap-1.5" style={{ ...btn3d("var(--t-accent)") }}>
                  <Icon name="Video" size={13} /> ВИДЕОЗВОНОК
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIDEO */}
        {section === "video" && (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-72 flex flex-col border-r flex-shrink-0" style={{ borderColor: "var(--t-border)", background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))", boxShadow: "2px 0 12px rgba(0,0,0,0.3)" }}>
              <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--t-border)" }}>
                <h2 style={{ ...heading3d(13), letterSpacing: "0.12em", marginBottom: 8 }}>ВИДЕОЗВОНОК</h2>
                <p className="text-[11px]" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>Выберите контакт</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contacts.map((c, index) => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors" style={{ borderBottom: "1px solid var(--t-bg-panel)" }} onClick={() => startCall(c, "video")}>
                    <div style={{ boxShadow: c.online ? "0 0 6px var(--t-online)" : undefined, borderRadius: "50%" }}>
                      <AvatarBadge initials={c.avatar_initials} online={c.online} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>{c.display_name}</div>
                      <div className="text-[11px] truncate" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{c.department}</div>
                    </div>
                    <Icon name="Video" size={14} style={liveIcon(index * 0.3)} />
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
                <div className="text-center max-w-xs flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ ...card3d() }}>
                    <Icon name="Video" size={32} style={liveIcon(0)} />
                  </div>
                  <h3 style={{ ...heading3d(15), letterSpacing: "0.12em" }}>ВИДЕОЗВОНКИ</h3>
                  <p className="text-xs" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>Выберите контакт слева для начала видеозвонка</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FILES */}
        {section === "files" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--t-border)", background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))" }}>
              <div>
                <h2 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>ФАЙЛЫ</h2>
                <p className="text-xs mt-0.5" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>Все файлы переписок</p>
              </div>
              <button className="btn-3d px-3 py-1.5 text-xs flex items-center gap-1.5" style={{ ...btn3d("var(--t-accent)") }}>
                <Icon name="Upload" size={12} /> ЗАГРУЗИТЬ
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="overflow-hidden" style={{ ...card3d() }}>
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--t-border)", background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))" }}>
                      {["Имя файла", "Размер", "Отправитель", "Дата", ""].map((h, i) => (
                        <th key={h} className="text-left px-4 py-2.5 text-[10px] tracking-widest uppercase" style={{ ...heading3d(10), letterSpacing: "0.12em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {STATIC_FILES.map((f, index) => (
                      <tr key={f.id} className="transition-colors" style={{ borderBottom: "1px solid var(--t-bg-panel)" }}>
                        <td className="px-4 py-3"><div className="flex items-center gap-2.5"><FileIconComp type={f.type} /><span className="text-xs font-medium" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>{f.name}</span></div></td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)" }}>{f.size}</td>
                        <td className="px-4 py-3 text-xs" style={{ fontFamily: FONT.body, color: "var(--t-text-muted)" }}>{f.sender}</td>
                        <td className="px-4 py-3 text-xs" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{f.date}</td>
                        <td className="px-4 py-3"><button className="transition-colors"><Icon name="Download" size={14} style={liveIcon(index * 0.2)} /></button></td>
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
            <div className="px-6 pt-5 pb-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--t-border)", background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))" }}>
              <div>
                <h2 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>БОТЫ</h2>
                <p className="text-xs mt-0.5" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>Корпоративные автоматизации</p>
              </div>
              <button className="btn-3d px-3 py-1.5 text-xs flex items-center gap-1.5" style={{ ...btn3d("var(--t-accent)") }}>
                <Icon name="Plus" size={12} /> СОЗДАТЬ БОТА
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-3 gap-4">
                {STATIC_BOTS.map((bot, index) => (
                  <div key={bot.id} className="p-4 transition-all" style={{ ...card3d(), animation: "card3dFloat 4s ease-in-out infinite", animationDelay: `${index * 0.2}s` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-sm flex items-center justify-center text-xs font-medium" style={{ ...card3d(), padding: 0 }}>
                          <span style={liveIcon(index * 0.3)}>{bot.avatar}</span>
                        </div>
                        <div>
                          <div className="text-xs" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>{bot.name}</div>
                          <div className="text-[10px]" style={{ fontFamily: FONT.body, color: "var(--t-accent)" }}>{bot.category}</div>
                        </div>
                      </div>
                      <div className="w-2 h-2 rounded-full mt-1" style={{ background: bot.active ? "#22c55e" : "var(--t-text-dim)", boxShadow: bot.active ? "0 0 6px var(--t-online)" : undefined }} />
                    </div>
                    <p className="text-[11px] leading-relaxed mb-3" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{bot.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono" style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)" }}>{bot.requests.toLocaleString()} запросов</span>
                      <button className="btn-3d px-2 py-1 text-[10px]" style={{ ...btn3d("var(--t-accent)") }}>ОТКРЫТЬ →</button>
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
            <div className="px-6 pt-5 pb-4 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: "var(--t-border)", background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))" }}>
              <div>
                <h2 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>АНАЛИТИКА</h2>
                <p className="text-xs mt-0.5" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>Панель администратора</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Активных пользователей", value: String(contacts.filter(c => c.online).length + 1), icon: "Users", color: "var(--t-accent)" },
                  { label: "Сообщений в системе", value: String(messages.length), icon: "MessageSquare", color: "#22c55e" },
                  { label: "Активных чатов", value: String(chats.length), icon: "Hash", color: "#f59e0b" },
                  { label: "Ботов запущено", value: String(STATIC_BOTS.filter(b => b.active).length), icon: "Bot", color: "#a78bfa" },
                ].map((kpi, index) => (
                  <div key={kpi.label} className="p-4 transition-all" style={{ ...card3d(kpi.color, 0.18), animation: "card3dFloat 4s ease-in-out infinite", animationDelay: `${index * 0.2}s` }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] uppercase tracking-wide leading-tight" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{kpi.label}</span>
                      <Icon name={kpi.icon} size={14} style={liveIcon(index * 0.3)} />
                    </div>
                    <div className="text-2xl font-semibold font-mono" style={{ fontFamily: FONT.mono, color: "var(--t-text)" }}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              <div className="p-4" style={{ ...card3d() }}>
                <h4 style={{ ...heading3d(13), letterSpacing: "0.12em", marginBottom: 16 }}>ПОЛЬЗОВАТЕЛИ</h4>
                <div className="space-y-2.5">
                  {contacts.slice(0, 5).map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="text-[10px] font-mono w-4" style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)" }}>{i + 1}</span>
                      <div style={{ boxShadow: c.online ? "0 0 6px var(--t-online)" : undefined, borderRadius: "50%" }}>
                        <AvatarBadge initials={c.avatar_initials} size="sm" online={c.online} />
                      </div>
                      <div className="flex-1 text-xs" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>{c.display_name}</div>
                      <span className="text-[11px]" style={{ fontFamily: FONT.body, color: "var(--t-accent)" }}>{c.department}</span>
                      <span className="text-[10px]" style={{ fontFamily: FONT.body, color: c.online ? "#22c55e" : "var(--t-text-dim)", textShadow: c.online ? "0 0 6px #22c55e" : undefined }}>{c.online ? "В СЕТИ" : "НЕ В СЕТИ"}</span>
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