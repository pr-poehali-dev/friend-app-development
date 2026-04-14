import { useState, useEffect, useCallback, createContext, useContext } from "react";
import Icon from "@/components/ui/icon";
import { FONT, card3d, btn3d, heading3d, liveIcon, msgOwn, msgOther } from "@/styles/theme3d";
import AddContactModal from "@/components/contacts/AddContactModal";
import InviteModal from "@/components/contacts/InviteModal";
import JoinPage from "@/components/contacts/JoinPage";
import NotificationToast, { type AppNotification } from "@/components/ui/NotificationToast";
import { useLang } from "@/LangContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

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
  contacts: "https://functions.poehali.dev/5c7f4e46-aec0-4fab-8215-3c55c316f3a3",
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

// ── Карточка формы: NO rotateX — он размывает текст внутри
const FORM_CARD: React.CSSProperties = {
  background: "#0e0500",
  border: "2px solid rgba(255,120,20,0.7)",
  borderRadius: 18,
  boxShadow: [
    "0 0 0 1px rgba(255,80,0,0.3)",
    "0 0 30px rgba(255,100,0,0.5)",
    "0 0 70px rgba(255,60,0,0.25)",
    "0 20px 50px rgba(0,0,0,0.8)",
    "inset 0 1px 0 rgba(255,180,60,0.25)",
  ].join(", "),
  padding: "28px 28px 24px",
  position: "relative" as const,
};
const FORM_CARD_CLS = "login-form-card";

// Поля ввода — чёткий текст, яркая обводка
const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1.5px solid rgba(255,100,20,0.5)",
  boxShadow: "inset 0 1px 4px rgba(0,0,0,0.6)",
  color: "#ffffff",
  fontSize: 14,
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 500,
};
const INPUT_FOCUS_STYLE: React.CSSProperties = {
  background: "rgba(255,130,0,0.08)",
  border: "1.5px solid rgba(255,160,40,0.9)",
  boxShadow: "inset 0 1px 4px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,120,0,0.2), 0 0 16px rgba(255,100,0,0.3)",
  color: "#ffffff",
  fontSize: 14,
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: 500,
};
const inputCls = "w-full rounded-xl px-4 py-3 focus:outline-none transition-all";
const inputWithIconCls = "w-full rounded-xl pl-10 pr-4 py-3 focus:outline-none transition-all";

// Кнопка — NO rotateX, яркое свечение
const BTN_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: 12,
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 800,
  fontSize: 16,
  letterSpacing: "0.12em",
  color: "#ffffff",
  cursor: "pointer",
  background: "linear-gradient(180deg, #ff7700 0%, #e85000 50%, #c43800 100%)",
  border: "2px solid rgba(255,160,50,0.6)",
  boxShadow: [
    "0 0 0 1px rgba(255,80,0,0.4)",
    "0 0 20px rgba(255,100,0,0.6)",
    "0 0 50px rgba(255,60,0,0.3)",
    "0 4px 0 #7a2000",
    "inset 0 1px 0 rgba(255,220,100,0.35)",
  ].join(", "),
  // transform убран — без rotateX текст чёткий
  transition: "all 0.15s ease",
  position: "relative" as const,
};

const errBox = "flex items-center gap-2 text-[12px] rounded-xl px-3 py-2.5";
const label = "block text-[11px] font-bold uppercase tracking-widest mb-2";
const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'Rajdhani', sans-serif",
  color: "#ffaa40",
  letterSpacing: "0.18em",
  fontWeight: 700,
};
const ICON_STYLE: React.CSSProperties = { color: "#ff9030" };

function Spinner() {
  return <span className="w-4 h-4 border-2 rounded-full animate-spin inline-block" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "#fff" }} />;
}

function LoginScreen({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const { t } = useLang();
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
    <div className="flex h-screen w-screen overflow-hidden relative" style={{ background: "#000000", fontFamily: "'Space Grotesk', sans-serif", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", height: "100dvh" }}>

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
              border: "2px solid rgba(255,120,30,0.7)",
              boxShadow: "0 0 20px rgba(255,80,0,0.6), 0 0 50px rgba(255,40,0,0.25), inset 0 1px 0 rgba(255,180,80,0.3)",
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
              textShadow: "0 0 40px rgba(255,100,0,0.6), 0 0 80px rgba(255,60,0,0.3), 0 2px 0 rgba(150,50,0,0.8)",
              // transform убран — rotateX размывает текст
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
      <div className="flex-1 flex items-center justify-center px-4 overflow-y-auto z-10 relative"
        style={{ paddingTop: "max(24px, env(safe-area-inset-top))", paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
        <div className="w-full max-w-[400px]">

          {/* Мобильное лого */}
          <div className="lg:hidden flex items-center gap-3 mb-5">
            <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(145deg,#1a0a00,#2d1200)", border:"1px solid rgba(255,120,30,0.5)", boxShadow:"0 0 16px rgba(255,80,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, fontWeight:900, color:"#ff8c00", WebkitFontSmoothing:"antialiased" }}>Д</span>
            </div>
            <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:14, fontWeight:900, letterSpacing:"0.12em", color:"#ff9d00", WebkitFontSmoothing:"antialiased" }}>ДРУГ</span>
          </div>

          {/* STEP: LOGIN */}
          {step === "login" && (
            <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              <div style={FORM_CARD} className={FORM_CARD_CLS}>
                <div style={{ position:"absolute", inset:0, borderRadius:20, background:"linear-gradient(135deg, rgba(255,120,30,0.08) 0%, transparent 50%)", pointerEvents:"none" }} />
                <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, letterSpacing:"0.04em", color:"#ff9000", textShadow:"0 0 20px rgba(255,140,0,0.4), 0 1px 0 rgba(120,60,0,0.5)", marginBottom:4, WebkitFontSmoothing:"antialiased" }}>{t("login_title")}</h2>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(255,180,80,0.75)", marginBottom:24, letterSpacing:"0.03em", WebkitFontSmoothing:"antialiased" }}>{t("login_subtitle")}</p>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className={label} style={LABEL_STYLE}>{t("login_username")}</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ animation:"iconPulse 3s ease-in-out infinite" }}><Icon name="AtSign" size={15} style={ICON_STYLE} /></div>
                      <input type="text" value={username} onChange={e => { setUsername(e.target.value); clearErr(); }}
                        placeholder="username" autoFocus autoComplete="username"
                        className={inputWithIconCls} style={INPUT_STYLE} onFocus={e => Object.assign(e.target.style, INPUT_FOCUS_STYLE)} onBlur={e => Object.assign(e.target.style, INPUT_STYLE)} />
                    </div>
                  </div>
                  <div>
                    <label className={label} style={LABEL_STYLE}>{t("login_password")}</label>
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
                    {loading ? <span className="flex items-center justify-center gap-2"><Spinner />{t("login_loading")}</span> : t("login_button")}
                  </button>
                </form>
                <div className="mt-5 flex justify-between items-center">
                  <button onClick={() => { setStep("forgot"); clearErr(); setEmail(""); }} style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(255,120,40,0.5)", background:"none", border:"none", cursor:"pointer" }}>{t("login_forgot")}</button>
                  <button onClick={() => { setStep("forgot"); clearErr(); setEmail(""); }} style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:13, color:"rgba(255,180,60,0.9)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.05em" }}>{t("login_register")}</button>
                </div>
              </div>
            </div>
          )}

          {/* STEP: FORGOT */}
          {step === "forgot" && (
            <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              <button onClick={() => { setStep("login"); clearErr(); }} className="flex items-center gap-1.5 mb-5 transition-colors" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, color:"rgba(255,120,40,0.6)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.05em" }}>
                <Icon name="ArrowLeft" size={13} /> {t("email_back")}
              </button>
              <div style={FORM_CARD} className={FORM_CARD_CLS}>
                <div style={{ position:"absolute", inset:0, borderRadius:20, background:"linear-gradient(135deg, rgba(255,120,30,0.08) 0%, transparent 50%)", pointerEvents:"none" }} />
                <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, letterSpacing:"0.04em", color:"#ff9000", textShadow:"0 0 20px rgba(255,140,0,0.4), 0 1px 0 rgba(120,60,0,0.5)", marginBottom:4, WebkitFontSmoothing:"antialiased" }}>{t("email_title")}</h2>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(255,180,80,0.75)", marginBottom:24, WebkitFontSmoothing:"antialiased" }}>{t("email_subtitle")}</p>
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
                    {loading ? <span className="flex items-center justify-center gap-2"><Spinner />{t("email_sending")}</span> : t("email_button")}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP: EMAIL CODE */}
          {step === "email_code" && (
            <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              <button onClick={() => { setStep("forgot"); setCode(["","","","","",""]); clearErr(); }} className="flex items-center gap-1.5 mb-5" style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, color:"rgba(255,120,40,0.6)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.05em" }}>
                <Icon name="ArrowLeft" size={13} /> {t("email_back")}
              </button>
              <div style={FORM_CARD} className={FORM_CARD_CLS}>
                <div style={{ position:"absolute", inset:0, borderRadius:20, background:"linear-gradient(135deg, rgba(255,120,30,0.08) 0%, transparent 50%)", pointerEvents:"none" }} />
                <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:22, fontWeight:900, letterSpacing:"0.04em", color:"#ff9000", textShadow:"0 0 20px rgba(255,140,0,0.4), 0 1px 0 rgba(120,60,0,0.5)", marginBottom:4, WebkitFontSmoothing:"antialiased" }}>{t("code_title")}</h2>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(255,180,80,0.75)", marginBottom:24, WebkitFontSmoothing:"antialiased" }}>{t("code_subtitle")} <span style={{ color:"#ffcc00", fontWeight:600 }}>{email}</span></p>
                <div className="flex gap-2 mb-6">
                  {code.map((digit, idx) => (
                    <input key={idx} type="text" inputMode="numeric" maxLength={1} value={digit}
                      ref={el => { codeRefs[idx] = el; }}
                      onChange={e => handleCodeChange(idx, e.target.value, codeRefs)}
                      onKeyDown={e => handleCodeKey(idx, e, codeRefs)}
                      onFocus={e => e.target.select()}
                      className={`login-code-input w-11 h-12 text-center text-xl font-mono font-semibold rounded-xl focus:outline-none transition-all ${loading ? "opacity-50" : ""}`}
                      style={{ fontFamily:"'Orbitron',sans-serif", background: digit ? "rgba(255,120,0,0.2)" : "rgba(255,255,255,0.04)", border: digit ? "1px solid rgba(255,160,30,0.6)" : "1px solid rgba(255,100,20,0.2)", color: digit ? "#ffcc00" : "rgba(255,255,255,0.2)", boxShadow: digit ? "0 0 12px rgba(255,120,0,0.3), inset 0 2px 4px rgba(0,0,0,0.3)" : "inset 0 2px 4px rgba(0,0,0,0.3)" }}
                      autoFocus={idx === 0} />
                  ))}
                </div>
                {error && <div className={errBox + " mb-4"} style={{ background:"rgba(255,50,0,0.15)", border:"1px solid rgba(255,80,0,0.3)" }}><Icon name="AlertCircle" size={12} />{error}</div>}
                <button onClick={() => handleVerifyCode()} disabled={!codeComplete || loading} style={{ ...BTN_STYLE, backgroundSize:"200%", animation: loading ? "none" : "btnShimmer 3s linear infinite", opacity: (!codeComplete || loading) ? 0.4 : 1, marginBottom:16 }}>
                  {loading ? <span className="flex items-center justify-center gap-2"><Spinner />{t("code_checking")}</span> : t("code_button")}
                </button>
                <div className="text-center">
                  {resendTimer > 0
                    ? <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(255,120,40,0.4)" }}>{t("code_resend_timer")} <span style={{ color:"rgba(255,180,60,0.7)" }}>{resendTimer}с</span></span>
                    : <button onClick={() => handleSendCode()} style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:13, color:"rgba(255,180,60,0.8)", background:"none", border:"none", cursor:"pointer", letterSpacing:"0.05em" }}>{t("code_resend")}</button>
                  }
                </div>
              </div>
            </div>
          )}

          {/* STEP: REGISTER */}
          {step === "register" && (
            <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              <div style={FORM_CARD} className={FORM_CARD_CLS}>
                <div style={{ position:"absolute", inset:0, borderRadius:20, background:"linear-gradient(135deg, rgba(255,120,30,0.08) 0%, transparent 50%)", pointerEvents:"none" }} />
                <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:900, letterSpacing:"0.04em", color:"#ff9000", textShadow:"0 0 20px rgba(255,140,0,0.4), 0 1px 0 rgba(120,60,0,0.5)", marginBottom:4, WebkitFontSmoothing:"antialiased" }}>{t("reg_title")}</h2>
                <p style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, color:"rgba(255,180,80,0.75)", marginBottom:20, WebkitFontSmoothing:"antialiased" }}>{t("reg_subtitle")}</p>
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
                    {loading?<span className="flex items-center justify-center gap-2"><Spinner/>{t("reg_loading")}</span>:t("reg_button")}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP: RESET PASSWORD */}
          {step === "reset_password" && (
            <div style={{ animation: "fadeSlideIn 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
              <div style={FORM_CARD} className={FORM_CARD_CLS}>
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
  const { t } = useLang();
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
    { id: "profile" as const, icon: "User", label: t("settings_profile") },
    { id: "appearance" as const, icon: "Palette", label: t("settings_appearance") },
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
          <h2 style={{ ...heading3d(11), letterSpacing: "0.18em" }}>{t("settings_title")}</h2>
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
        <div className="mt-auto mb-4 px-4 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 mb-1">
            <span style={{ fontFamily: FONT.heading, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--t-text-dim)", textTransform: "uppercase" }}>{t("settings_language")}</span>
            <LanguageSwitcher compact />
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all btn-3d"
            style={{ ...btn3d("var(--t-danger)"), fontSize: 12, justifyContent: "center" }}>
            <Icon name="LogOut" size={13} style={{ color: "#fff" }} />
            <span style={{ fontFamily: FONT.heading, fontWeight: 700, letterSpacing: "0.08em" }}>{t("settings_logout")}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 relative z-10">

      {/* === ВКЛАДКА: ОФОРМЛЕНИЕ === */}
      {activeTab === "appearance" && (
        <div className="max-w-2xl">
          <h3 style={{ ...heading3d(15), letterSpacing: "0.1em", marginBottom: 4 }}>{t("settings_appearance")}</h3>
          <p style={{ fontFamily: FONT.body, fontSize: 12, color: "var(--t-text-dim)", marginBottom: 24 }}>{t("settings_theme")}</p>

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
          <h3 className="text-xs font-semibold uppercase tracking-widest mb-3 mt-6" style={{ color: "var(--t-text-dim)" }}>{t("settings_wallpaper")}</h3>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { id: "none",     label: t("settings_no_wallpaper"),  bg: "var(--t-chat-bg)", pattern: "none",   preview: "solid" },
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
        <h3 style={{ ...heading3d(15), letterSpacing: "0.1em", marginBottom: 20 }}>{t("settings_profile")}</h3>

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
              {t("settings_avatar")}
            </button>
            {avatarError && <div className="text-[10px] text-[#f87171] mt-1">{avatarError}</div>}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label style={{ display: "block", fontFamily: FONT.heading, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "var(--t-text-dim)", marginBottom: 6, textTransform: "uppercase" }}>{t("settings_name")}</label>
              <input
                value={displayName}
                onChange={e => { setDisplayName(e.target.value); setError(""); setSuccess(false); }}
                placeholder="Иван Петров"
                className="w-full px-4 py-2.5 focus:outline-none transition-all"
                style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)", borderRadius: 10, color: "var(--t-text)", fontFamily: FONT.body, fontSize: 13, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: FONT.heading, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "var(--t-text-dim)", marginBottom: 6, textTransform: "uppercase" }}>{t("settings_position")}</label>
              <input
                value={position}
                onChange={e => { setPosition(e.target.value); setSuccess(false); }}
                placeholder="Менеджер"
                className="w-full px-4 py-2.5 focus:outline-none transition-all"
                style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)", borderRadius: 10, color: "var(--t-text)", fontFamily: FONT.body, fontSize: 13, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: FONT.heading, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "var(--t-text-dim)", marginBottom: 6, textTransform: "uppercase" }}>{t("settings_dept")}</label>
              <input
                value={department}
                onChange={e => { setDepartment(e.target.value); setSuccess(false); }}
                placeholder="Продажи"
                className="w-full px-4 py-2.5 focus:outline-none transition-all"
                style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)", borderRadius: 10, color: "var(--t-text)", fontFamily: FONT.body, fontSize: 13, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)" }}
              />
            </div>
            <div className="col-span-2">
              <label style={{ display: "block", fontFamily: FONT.heading, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "var(--t-text-dim)", marginBottom: 6, textTransform: "uppercase" }}>{t("settings_phone")}</label>
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
              <Icon name="CheckCircle" size={12} style={{ color: "#4ade80", filter: "drop-shadow(0 0 4px rgba(50,200,80,0.6))" }} /> {t("settings_saved")}
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
                  {t("settings_saving")}
                </span>
              ) : t("settings_save")}
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
                {t("common_cancel")}
              </button>
            )}
          </div>
        </form>
      </>}

      </div>
    </div>
  );
}

// ============ MOBILE HOOK ============
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return isMobile;
}

// ============ MAIN APP ============
function AppInner() {
  useTheme(); // подписка на тему (применяется через CSS body[data-theme])
  const isMobile = useIsMobile();
  const { t } = useLang();

  const navItems = [
    { id: "chats" as Section, icon: "MessageSquare", label: t("nav_chats") },
    { id: "contacts" as Section, icon: "Users", label: t("nav_contacts") },
    { id: "calls" as Section, icon: "Phone", label: t("nav_calls") },
    { id: "video" as Section, icon: "Video", label: t("nav_video") },
    { id: "files" as Section, icon: "FolderOpen", label: t("nav_files") },
    { id: "bots" as Section, icon: "Bot", label: t("nav_bots") },
  ];

  const bottomNav = [
    { id: "settings" as Section, icon: "Settings", label: t("nav_settings") },
    { id: "analytics" as Section, icon: "BarChart2", label: t("nav_analytics") },
  ];
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [section, setSection] = useState<Section>("chats");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false); // true = открыт чат/карточка, false = список
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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [externalContacts, setExternalContacts] = useState<{id:number;display_name:string;phone?:string;email?:string;position?:string;department?:string;avatar_initials:string;online:boolean;source:string;linked_user_id?:number}[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const inviteCode = new URLSearchParams(window.location.search).get("invite");

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

  // Load external contacts
  const loadExternalContacts = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const res = await fetch(`${API.contacts}?action=contacts`, { headers: { "X-Session-Id": sessionToken } });
      const data = await res.json();
      if (data.contacts) setExternalContacts(data.contacts);
    } catch (e) { console.error(e); }
  }, [sessionToken]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const res = await fetch(`${API.contacts}?action=notifications`, { headers: { "X-Session-Id": sessionToken } });
      const data = await res.json();
      if (data.notifications?.length) setNotifications(data.notifications);
    } catch { /* silent */ }
  }, [sessionToken]);

  const dismissNotifications = useCallback(async (ids: number[]) => {
    if (!sessionToken) return;
    setNotifications(prev => prev.filter(n => !ids.includes(n.id)));
    fetch(`${API.contacts}?action=read_notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sessionToken },
      body: JSON.stringify({ ids }),
    }).catch(() => {});
  }, [sessionToken]);

  // Poll notifications every 15s
  useEffect(() => {
    if (!sessionToken) return;
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 15000);
    return () => clearInterval(iv);
  }, [sessionToken, fetchNotifications]);

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
      loadExternalContacts();
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

  // Код инвайта — из URL или из sessionStorage (после логина)
  const pendingInvite = inviteCode || sessionStorage.getItem("pending_invite");

  if (!currentUser) {
    if (inviteCode) {
      return (
        <JoinPage
          code={inviteCode}
          apiUrl={API.contacts}
          sessionId={null}
          onJoined={() => { window.history.replaceState({}, "", "/"); }}
          onLogin={() => {
            sessionStorage.setItem("pending_invite", inviteCode);
            window.history.replaceState({}, "", "/");
          }}
        />
      );
    }
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (pendingInvite) {
    // Берём токен из state или напрямую из localStorage (если state ещё не обновился)
    const joinToken = sessionToken || localStorage.getItem("session_token");
    return (
      <JoinPage
        code={pendingInvite}
        apiUrl={API.contacts}
        sessionId={joinToken}
        onJoined={() => {
          sessionStorage.removeItem("pending_invite");
          window.history.replaceState({}, "", "/");
          loadExternalContacts();
          setSection("contacts");
        }}
        onLogin={() => {}}
      />
    );
  }

  // Звёзды для фона приложения
  const appStars = Array.from({ length: 80 }, (_, i) => ({
    x: (i * 139.5 + 23) % 100, y: (i * 83.7 + 11) % 100,
    size: 0.5 + (i % 4) * 0.3, dur: 3 + (i % 5), delay: (i * 0.31) % 4,
    bright: i % 11 === 0,
  }));

  return (
    <div className="flex w-screen overflow-hidden transition-colors duration-300 relative" style={{ fontFamily: FONT.body, background: T.bgDeep, color: T.text, height: "100dvh" }}>
      <NotificationToast notifications={notifications} onDismiss={dismissNotifications} onGoToContacts={() => setSection("contacts")} />

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

      {/* ── 3D SIDEBAR (только десктоп) ── */}
      <nav className="flex-col items-center py-3 w-[62px] gap-0.5 flex-shrink-0 relative z-10"
        style={{
          display: isMobile ? "none" : "flex",
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
          <LanguageSwitcher compact />
        </div>
      </nav>

      {/* ── BOTTOM NAV (только мобильный) ── */}
      {isMobile && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          background: `linear-gradient(180deg, color-mix(in srgb, var(--t-bg-deep) 95%, var(--t-accent)), var(--t-bg-deep))`,
          borderTop: "1px solid var(--t-border)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", justifyContent: "space-around",
          padding: `6px 4px calc(10px + env(safe-area-inset-bottom, 0px))`,
        }}>
          {[...navItems, ...bottomNav].slice(0, 5).map((item, idx) => {
            const active = section === item.id;
            return (
              <button key={item.id} onClick={() => { setSection(item.id); setMobilePanelOpen(false); }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "6px 10px", borderRadius: 12, flex: 1,
                  background: active ? `color-mix(in srgb, var(--t-accent) 15%, transparent)` : "transparent",
                  border: active ? `1px solid color-mix(in srgb, var(--t-accent) 30%, transparent)` : "1px solid transparent",
                  color: active ? "var(--t-accent)" : "var(--t-text-dim)",
                  animation: active ? `iconLive ${3 + idx * 0.5}s ease-in-out infinite` : "none",
                }}>
                <Icon name={item.icon} size={19} />
                <span style={{ fontSize: 8, fontFamily: FONT.heading, fontWeight: 600, letterSpacing: "0.05em" }}>{item.label}</span>
              </button>
            );
          })}
          {/* Аватар/настройки */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 6px", flex: "0 0 auto" }}>
            <LanguageSwitcher compact />
          </div>
          <button onClick={() => { setSection("settings"); setMobilePanelOpen(false); }}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "6px 10px", borderRadius: 12, flex: 1,
              background: section === "settings" ? `color-mix(in srgb, var(--t-accent) 15%, transparent)` : "transparent",
              border: section === "settings" ? `1px solid color-mix(in srgb, var(--t-accent) 30%, transparent)` : "1px solid transparent",
            }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: "var(--t-accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT.heading, fontWeight: 700, fontSize: 9, color: "#fff",
            }}>{currentUser.avatar_initials}</div>
            <span style={{ fontSize: 8, fontFamily: FONT.heading, fontWeight: 600, letterSpacing: "0.05em", color: section === "settings" ? "var(--t-accent)" : "var(--t-text-dim)" }}>{t("nav_me")}</span>
          </button>
        </nav>
      )}

      {/* Content */}
      <div className="flex flex-1 overflow-hidden relative z-10" style={{ paddingBottom: isMobile ? 64 : 0 }}>

        {/* CHATS */}
        {section === "chats" && (
          <>
            {/* ── Левая панель: список чатов ── */}
            <div style={{
              width: isMobile ? "100%" : 288, flexShrink: 0,
              display: isMobile && mobilePanelOpen ? "none" : "flex",
              flexDirection: "column",
              background: "var(--t-bg-main)", borderRight: "1px solid var(--t-border)", boxShadow: "2px 0 12px rgba(0,0,0,0.3)"
            }}>
              <div className="px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--t-border)", background: `linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))` }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 style={{ ...heading3d(12), letterSpacing: "0.12em" }}>{t("chats_title")}</h2>
                  {loadingChats && <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />}
                </div>
                <div className="relative">
                  <Icon name="Search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={liveIcon(0)} />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t("chats_search")}
                    className="w-full pl-8 pr-3 py-2 focus:outline-none transition-all"
                    style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)", borderRadius: 10, color: "var(--t-text)", fontFamily: FONT.body, fontSize: 12, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)" }} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredChats.map(chat => (
                  <button key={chat.id} onClick={() => { setActiveChat(chat); if (isMobile) setMobilePanelOpen(true); }}
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
                  <div className="p-6 text-center" style={{ color: "var(--t-text-dim)", fontFamily: FONT.body, fontSize: 12 }}>{t("chats_empty")}</div>
                )}
              </div>
            </div>

            {/* ── Правая часть: переписка ── */}
            <div className="flex flex-col flex-1 overflow-hidden" style={{ display: isMobile && !mobilePanelOpen ? "none" : "flex" }}>
              {activeChat ? (
                <>
                  {/* Заголовок чата */}
                  <div className="flex items-center justify-between px-3 py-3 flex-shrink-0" style={{
                    borderBottom: "1px solid var(--t-border)",
                    background: `linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 6%, var(--t-bg-main)), var(--t-bg-main))`,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                  }}>
                    <div className="flex items-center gap-2">
                      {isMobile && (
                        <button onClick={() => setMobilePanelOpen(false)} style={{ color: "var(--t-accent)", padding: "4px 6px 4px 0" }}>
                          <Icon name="ChevronLeft" size={20} />
                        </button>
                      )}
                      <AvatarBadge initials={activeChat.avatar} online={activeChat.type === "personal" ? activeChat.online : undefined} />
                      <div>
                        <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 14, color: "var(--t-text)", letterSpacing: "0.05em", filter: "drop-shadow(0 1px 4px color-mix(in srgb, var(--t-accent) 30%, transparent))" }}>{activeChat.name}</div>
                        <div style={{ fontFamily: FONT.body, fontSize: 11, color: activeChat.online ? "var(--t-online)" : "var(--t-text-dim)" }}>
                          {activeChat.type === "personal" ? (activeChat.online ? t("chats_online") : t("chats_offline")) : t("chats_group")}
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
                        placeholder={t("msg_placeholder")}
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
                    <p style={{ fontFamily: FONT.heading, fontSize: 14, color: "var(--t-text-dim)", letterSpacing: "0.1em" }}>{t("common_select_chat")}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* CONTACTS */}
        {section === "contacts" && (() => {
          type AnyContact = { id: number; username: string; display_name: string; position?: string; department?: string; phone?: string; avatar_initials: string; online: boolean; source: string; linked_user_id?: number };
          const allContacts: AnyContact[] = [
            ...contacts.map(c => ({ ...c, source: "internal", linked_user_id: undefined })),
            ...externalContacts.filter(ec => !contacts.some(c => c.id === ec.linked_user_id)).map(ec => ({ ...ec, username: "" })),
          ];
          const filtered = allContacts.filter(c =>
            c.display_name.toLowerCase().includes(contactSearch.toLowerCase()) ||
            (c.department || "").toLowerCase().includes(contactSearch.toLowerCase()) ||
            (c.position || "").toLowerCase().includes(contactSearch.toLowerCase())
          );
          return (
            <>
              {showAddContact && sessionToken && (
                <AddContactModal
                  onClose={() => setShowAddContact(false)}
                  onAdded={() => loadExternalContacts()}
                  apiUrl={API.contacts}
                  sessionId={sessionToken}
                />
              )}
              {showInviteModal && sessionToken && (
                <InviteModal
                  onClose={() => setShowInviteModal(false)}
                  apiUrl={API.contacts}
                  sessionId={sessionToken}
                />
              )}
              <div className="flex flex-1 overflow-hidden">
                <div style={{
                  width: isMobile ? "100%" : 288, flexShrink: 0,
                  display: isMobile && mobilePanelOpen ? "none" : "flex",
                  flexDirection: "column",
                  borderRight: "1px solid var(--t-border)",
                  background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))",
                  boxShadow: "2px 0 12px rgba(0,0,0,0.3)",
                }}>
                  <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--t-border)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>{t("contacts_title")}</h2>
                      <span className="text-[10px]" style={{ color: "var(--t-text-dim)" }}>{allContacts.length}</span>
                    </div>
                    <div className="relative">
                      <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--t-text-dim)" }} />
                      <input value={contactSearch} onChange={e => setContactSearch(e.target.value)} placeholder={t("contacts_search")}
                        className="w-full rounded-sm pl-7 pr-3 py-1.5 text-xs placeholder-[#4a5568] focus:outline-none"
                        style={{ background: "var(--t-bg-active)", border: "1px solid var(--t-border)", color: "var(--t-text-muted)" }} />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filtered.map(c => (
                      <div key={`${c.source}-${c.id}`} className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors" style={{ borderBottom: "1px solid var(--t-bg-panel)" }} onClick={() => isMobile && setMobilePanelOpen(true)}>
                        <AvatarBadge initials={c.avatar_initials} online={c.online} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate" style={{ color: "var(--t-text)" }}>{c.display_name}</div>
                          <div className="text-[11px] truncate" style={{ color: "var(--t-text-dim)" }}>{c.position || c.department}</div>
                        </div>
                        {c.source !== "internal" && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "color-mix(in srgb, var(--t-accent) 15%, transparent)", color: "var(--t-accent)", fontFamily: FONT.mono }}>
                            {c.source === "invite" ? "invite" : "csv"}
                          </span>
                        )}
                      </div>
                    ))}
                    {filtered.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 px-4 gap-3">
                        <div style={{ ...card3d(), padding: "14px", display: "inline-flex" }}>
                          <Icon name="UserX" size={22} style={liveIcon(0)} />
                        </div>
                        <span style={{ ...heading3d(11), letterSpacing: "0.12em" }}>{t("contacts_empty")}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4" style={{ display: isMobile && !mobilePanelOpen ? "none" : undefined }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {isMobile && (
                        <button onClick={() => setMobilePanelOpen(false)} style={{ color: "var(--t-accent)" }}>
                          <Icon name="ChevronLeft" size={20} />
                        </button>
                      )}
                      <h3 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>{t("contacts_title")} ({filtered.length})</h3>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowAddContact(true)} className="btn-3d px-3 py-1.5 text-[10px] flex items-center gap-1.5" style={{ ...btn3d("var(--t-accent)") }}>
                        <Icon name="UserPlus" size={11} /> {t("contacts_add")}
                      </button>
                      <button onClick={() => setShowInviteModal(true)} className="btn-3d px-3 py-1.5 text-[10px] flex items-center gap-1.5" style={{ ...btn3d("var(--t-accent)") }}>
                        <Icon name="Link" size={11} /> {t("contacts_invite")}
                      </button>
                    </div>
                  </div>
                  <div className={`grid gap-3 ${isMobile ? "grid-cols-1" : "grid-cols-2"} max-w-2xl`}>
                    {filtered.map((c, index) => (
                      <div key={`${c.source}-${c.id}`} className="p-4 transition-all" style={{ ...card3d(), animation: "card3dFloat 4s ease-in-out infinite", animationDelay: `${index * 0.15}s` }}>
                        <div className="flex items-center gap-3 mb-3">
                          <div style={{ boxShadow: c.online ? "0 0 6px var(--t-online)" : undefined, borderRadius: "50%" }}>
                            <AvatarBadge initials={c.avatar_initials} size="lg" online={c.online} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>{c.display_name}</div>
                            <div className="text-[11px] truncate" style={{ fontFamily: FONT.body, color: "var(--t-accent)" }}>{c.department}</div>
                          </div>
                          {c.source !== "internal" && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 self-start" style={{ background: "color-mix(in srgb, var(--t-accent) 15%, transparent)", color: "var(--t-accent)", fontFamily: FONT.mono }}>
                              {c.source === "invite" ? "invite" : c.source}
                            </span>
                          )}
                        </div>
                        {c.position && <div className="text-[11px] mb-1" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{c.position}</div>}
                        {c.phone && <div className="text-[11px] mb-1" style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)" }}>{c.phone}</div>}
                        <div className="flex gap-1.5 mt-3">
                          {c.source === "internal" || c.linked_user_id ? (
                            <>
                              <button onClick={() => openChatWith(c.linked_user_id || c.id)} className="btn-3d flex-1 py-1.5 text-[10px] flex items-center justify-center gap-1" style={{ ...btn3d("var(--t-accent)") }}>
                                <Icon name="MessageSquare" size={11} style={liveIcon(index * 0.3)} /> {t("contacts_chat")}
                              </button>
                              <button onClick={() => startCall(c as unknown as Contact, "audio")} className="btn-3d flex-1 py-1.5 text-[10px] flex items-center justify-center gap-1" style={{ ...btn3d("var(--t-accent)") }}>
                                <Icon name="Phone" size={11} style={liveIcon(index * 0.3 + 0.1)} /> {t("contacts_call")}
                              </button>
                              <button onClick={() => startCall(c as unknown as Contact, "video")} className="btn-3d flex-1 py-1.5 text-[10px] flex items-center justify-center gap-1" style={{ ...btn3d("var(--t-accent)") }}>
                                <Icon name="Video" size={11} style={liveIcon(index * 0.3 + 0.2)} /> {t("contacts_video")}
                              </button>
                            </>
                          ) : (
                            <div className="text-[10px] w-full text-center py-1" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>
                              {t("contacts_not_reg")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <div style={{ ...card3d(), padding: "20px", display: "inline-flex" }}>
                        <Icon name="Users" size={32} style={liveIcon(0)} />
                      </div>
                      <div className="text-center">
                        <p style={{ ...heading3d(13), letterSpacing: "0.1em", marginBottom: 6 }}>{t("contacts_none")}</p>
                        <p className="text-xs" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>
                          {t("contacts_none_sub")}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setShowAddContact(true)} className="btn-3d px-4 py-2 text-xs flex items-center gap-2" style={{ ...btn3d("var(--t-accent)") }}>
                          <Icon name="UserPlus" size={14} /> {t("contacts_add_manual")}
                        </button>
                        <button onClick={() => setShowInviteModal(true)} className="btn-3d px-4 py-2 text-xs flex items-center gap-2" style={{ ...btn3d("var(--t-accent)") }}>
                          <Icon name="Link" size={14} /> {t("contacts_send_link")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {/* CALLS */}
        {section === "calls" && (
          <div className="flex flex-1 overflow-hidden">
            <div style={{
              width: isMobile ? "100%" : 320, flexShrink: 0, display: "flex", flexDirection: "column",
              borderRight: "1px solid var(--t-border)",
              background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))",
              boxShadow: "2px 0 12px rgba(0,0,0,0.3)"
            }}>
              <div className="px-4 pt-4 pb-3 border-b flex items-center justify-between" style={{ borderColor: "var(--t-border)" }}>
                <h2 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>{t("calls_title")}</h2>
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
                    <span style={{ ...heading3d(11), letterSpacing: "0.12em" }}>{t("calls_empty")}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-6" style={{ display: isMobile ? "none" : "flex" }}>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ ...card3d() }}>
                  <Icon name="Phone" size={32} style={liveIcon(0)} />
                </div>
                <p className="text-sm font-medium mb-1" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>{t("calls_new")}</p>
                <p className="text-xs mb-5" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{t("calls_new_sub")}</p>
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
                  <Icon name="Phone" size={13} /> {t("calls_audio")}
                </button>
                <button onClick={() => { setSection("contacts"); }} className="btn-3d px-4 py-2 text-xs flex items-center gap-1.5" style={{ ...btn3d("var(--t-accent)") }}>
                  <Icon name="Video" size={13} /> {t("calls_video_call")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIDEO */}
        {section === "video" && (
          <div className="flex flex-1 overflow-hidden">
            <div style={{
              width: isMobile ? "100%" : 288, flexShrink: 0, display: "flex", flexDirection: "column",
              borderRight: "1px solid var(--t-border)",
              background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))",
              boxShadow: "2px 0 12px rgba(0,0,0,0.3)"
            }}>
              <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "var(--t-border)" }}>
                <h2 style={{ ...heading3d(13), letterSpacing: "0.12em", marginBottom: 8 }}>{t("video_title")}</h2>
                <p className="text-[11px]" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{t("video_select")}</p>
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
            <div className="flex-1 flex flex-col items-center justify-center" style={{ display: isMobile ? "none" : "flex" }}>
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
                  <h3 style={{ ...heading3d(15), letterSpacing: "0.12em" }}>{t("video_heading")}</h3>
                  <p className="text-xs" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{t("video_sub")}</p>
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
                <h2 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>{t("files_title")}</h2>
                <p className="text-xs mt-0.5" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{t("files_sub")}</p>
              </div>
              <button className="btn-3d px-3 py-1.5 text-xs flex items-center gap-1.5" style={{ ...btn3d("var(--t-accent)") }}>
                <Icon name="Upload" size={12} /> {t("files_upload")}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="overflow-hidden" style={{ ...card3d() }}>
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--t-border)", background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))" }}>
                      {[t("files_name"), t("files_size"), t("files_sender"), t("files_date"), ""].map((h, i) => (
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
                <h2 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>{t("bots_title")}</h2>
                <p className="text-xs mt-0.5" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{t("bots_sub")}</p>
              </div>
              <button className="btn-3d px-3 py-1.5 text-xs flex items-center gap-1.5" style={{ ...btn3d("var(--t-accent)") }}>
                <Icon name="Plus" size={12} /> {t("bots_create")}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-3"}`}>
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
                      <span className="text-[10px] font-mono" style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)" }}>{bot.requests.toLocaleString()} {t("bots_requests")}</span>
                      <button className="btn-3d px-2 py-1 text-[10px]" style={{ ...btn3d("var(--t-accent)") }}>{t("bots_open")}</button>
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
                <h2 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>{t("analytics_title")}</h2>
                <p className="text-xs mt-0.5" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{t("analytics_sub")}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className={`grid gap-3 mb-5 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
                {[
                  { label: t("analytics_users"), value: String(contacts.filter(c => c.online).length + 1), icon: "Users", color: "var(--t-accent)" },
                  { label: t("analytics_msgs"), value: String(messages.length), icon: "MessageSquare", color: "#22c55e" },
                  { label: t("analytics_chats"), value: String(chats.length), icon: "Hash", color: "#f59e0b" },
                  { label: t("analytics_bots"), value: String(STATIC_BOTS.filter(b => b.active).length), icon: "Bot", color: "#a78bfa" },
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
                <h4 style={{ ...heading3d(13), letterSpacing: "0.12em", marginBottom: 16 }}>{t("analytics_members")}</h4>
                <div className="space-y-2.5">
                  {contacts.slice(0, 5).map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="text-[10px] font-mono w-4" style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)" }}>{i + 1}</span>
                      <div style={{ boxShadow: c.online ? "0 0 6px var(--t-online)" : undefined, borderRadius: "50%" }}>
                        <AvatarBadge initials={c.avatar_initials} size="sm" online={c.online} />
                      </div>
                      <div className="flex-1 text-xs" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>{c.display_name}</div>
                      <span className="text-[11px]" style={{ fontFamily: FONT.body, color: "var(--t-accent)" }}>{c.department}</span>
                      <span className="text-[10px]" style={{ fontFamily: FONT.body, color: c.online ? "#22c55e" : "var(--t-text-dim)", textShadow: c.online ? "0 0 6px #22c55e" : undefined }}>{c.online ? t("analytics_online").toUpperCase() : t("chats_offline").toUpperCase()}</span>
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