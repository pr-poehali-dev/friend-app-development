import { useState, useEffect, useCallback, createContext, useContext, useRef } from "react";
import Icon from "@/components/ui/icon";
import { FONT, card3d, btn3d, heading3d, liveIcon, msgOwn, msgOther } from "@/styles/theme3d";
import AddContactModal from "@/components/contacts/AddContactModal";
import InviteModal from "@/components/contacts/InviteModal";
import JoinPage from "@/components/contacts/JoinPage";
import NotificationToast, { type AppNotification } from "@/components/ui/NotificationToast";
import { useLang } from "@/LangContext";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import CallWindow from "@/components/CallWindow";
import EmojiPicker from "@/components/EmojiPicker";
import CameraModal from "@/components/CameraModal";

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
  admin: "https://functions.poehali.dev/20879e61-7da5-482b-9d05-9c34d4f7ae44",
  auth: "https://functions.poehali.dev/959bee44-9a42-4a9f-b352-21605b616456",
  chats: "https://functions.poehali.dev/871abe69-bab0-4421-9d49-eac8a87cbbab",
  messages: "https://functions.poehali.dev/3a4d8e8d-6ec2-41f4-8084-57c7800b94a3",
  profile: "https://functions.poehali.dev/eb1e5ec8-553a-4b79-a005-3fa365d9667b",
  avatar: "https://functions.poehali.dev/164ba4b4-9b9c-4668-8ca1-0bf6fbcbf6ab",
  calls: "https://functions.poehali.dev/af1c4fda-8213-498e-baac-420159c8fc6e",
  contacts: "https://functions.poehali.dev/5c7f4e46-aec0-4fab-8215-3c55c316f3a3",
  fileUpload: "https://functions.poehali.dev/19819ee8-2dfb-41ae-90b2-13698b6ffa77",
  userFiles: "https://functions.poehali.dev/69211784-1643-4e44-a39e-dc0a506fcc08",
  bots: "https://functions.poehali.dev/7f596567-baf9-40fb-adea-97045136e1f3",
};

type Section = "chats" | "contacts" | "calls" | "video" | "files" | "bots" | "settings" | "analytics" | "admin";

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
  role?: string;
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
  other_user_id?: number;
}

interface MsgReaction {
  emoji: string;
  count: number;
  my: boolean;
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
  reactions?: MsgReaction[];
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



function AvatarBadge({ initials, size = "md", online, avatar_url }: { initials: string; size?: "sm" | "md" | "lg" | "xl"; online?: boolean; avatar_url?: string }) {
  const sizes = { sm: 32, md: 40, lg: 48, xl: 64 };
  const px = sizes[size];
  const fs = { sm: 11, md: 13, lg: 15, xl: 20 }[size];

  if (avatar_url) {
    return (
      <div style={{ position: "relative", display: "inline-flex" }}>
        <img
          src={avatar_url}
          alt={initials}
          style={{
            width: sizes[size], height: sizes[size],
            borderRadius: size === "xl" ? 20 : size === "lg" ? 16 : size === "sm" ? 8 : 12,
            objectFit: "cover",
            border: "2px solid color-mix(in srgb, var(--t-accent) 30%, transparent)",
          }}
        />
        {online !== undefined && (
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            width: size === "sm" ? 7 : 9, height: size === "sm" ? 7 : 9,
            borderRadius: "50%",
            background: online ? "var(--t-online)" : "var(--t-text-dim)",
            border: "2px solid var(--t-bg-panel)",
            boxShadow: online ? "0 0 6px var(--t-online)" : undefined,
          }} />
        )}
      </div>
    );
  }

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

// ============ INCOMING CALL SOUND ============
function IncomingCallSound() {
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext)();
    let stopped = false;
    let timeout: ReturnType<typeof setTimeout>;

    const ring = () => {
      if (stopped) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
      timeout = setTimeout(ring, 1200);
    };
    ring();
    return () => {
      stopped = true;
      clearTimeout(timeout);
      ctx.close();
    };
  }, []);
  return null;
}

// ============ MAIN APP ============
function AppInner() {
  useTheme(); // подписка на тему (применяется через CSS body[data-theme])
  const isMobile = useIsMobile();
  const { t } = useLang();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const navItems = [
    { id: "chats" as Section, icon: "MessageSquare", label: t("nav_chats") },
    { id: "contacts" as Section, icon: "Users", label: t("nav_contacts") },
    { id: "calls" as Section, icon: "Phone", label: t("nav_calls") },
    { id: "video" as Section, icon: "Video", label: t("nav_video") },
    { id: "files" as Section, icon: "FolderOpen", label: t("nav_files") },
    { id: "bots" as Section, icon: "Bot", label: t("nav_bots") },
    ...(currentUser?.role === "admin" ? [{ id: "analytics" as Section, icon: "BarChart2", label: t("nav_analytics") }] : []),
    ...(currentUser?.role === "admin" ? [{ id: "admin" as Section, icon: "Shield", label: "КАБИНЕТ" }] : []),
  ];

  const bottomNav = [
    { id: "settings" as Section, icon: "Settings", label: t("nav_settings") },
  ];

  const [section, setSection] = useState<Section>("chats");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false); // true = открыт чат/карточка, false = список
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [activeCall, setActiveCall] = useState(false);
  const [activeVideo, setActiveVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  // Звонки
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [activeCallId, setActiveCallId] = useState<number | null>(null);
  const [callTarget, setCallTarget] = useState<Contact | null>(null);
  const [callType, setCallType] = useState<"audio" | "video">("audio");
  const [incomingCall, setIncomingCall] = useState<{id: number; caller_name: string; caller_avatar: string; call_type: string; caller_id?: number} | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [signalingLastId, setSignalingLastId] = useState(0);
  const [callStatus, setCallStatus] = useState<"calling" | "ringing" | "active" | "error">("calling");
  const [callErrorMsg, setCallErrorMsg] = useState<string>("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [userFiles, setUserFiles] = useState<{id:number;name:string;size:string;url:string;mime:string;date:string;sender:string}[]>([]);
  const [loadingUserFiles, setLoadingUserFiles] = useState(false);
  const [uploadingUserFile, setUploadingUserFile] = useState(false);
  const [sendFileModal, setSendFileModal] = useState<{id:number;name:string;url:string} | null>(null);
  const [forwardFileModal, setForwardFileModal] = useState<{files:{name:string;url:string}[];} | null>(null);
  const [forwardChatIds, setForwardChatIds] = useState<number[]>([]);
  const [forwardingFile, setForwardingFile] = useState(false);
  const [sendChatIds, setSendChatIds] = useState<number[]>([]);
  const [sendEmails, setSendEmails] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sendingFile, setSendingFile] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [bots, setBots] = useState<{id:number;name:string;description:string;category:string;avatar:string;active:boolean;requests:number}[]>([]);
  const [loadingBots, setLoadingBots] = useState(false);
  const [activeBotId, setActiveBotId] = useState<number|null>(null);
  const [botMessages, setBotMessages] = useState<{id:number;role:string;content:string;time:string}[]>([]);
  const [botInput, setBotInput] = useState("");
  const [sendingBotMsg, setSendingBotMsg] = useState(false);
  const [externalContacts, setExternalContacts] = useState<{id:number;display_name:string;phone?:string;email?:string;position?:string;department?:string;avatar_initials:string;online:boolean;source:string;linked_user_id?:number}[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Локальный toast (без бэкенда) — для ошибок/уведомлений UI
  const showToast = (title: string, body: string, type: "info" | "warning" | "error" = "info") => {
    const fakeNotif: AppNotification = {
      id: Date.now(),
      type: type === "error" ? "warning" : type,
      title,
      body,
      data: null,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [fakeNotif, ...prev]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== fakeNotif.id)), 5000);
  };
  const [adminUsers, setAdminUsers] = useState<Record<string, unknown>[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminTab, setAdminTab] = useState<"users"|"bans"|"chat">("users");
  const [adminSelectedUser, setAdminSelectedUser] = useState<Record<string, unknown> | null>(null);
  const [adminUserDetail, setAdminUserDetail] = useState<{contacts:Record<string,unknown>[];chats:Record<string,unknown>[];files:Record<string,unknown>[]}|null>(null);
  const [adminChatId, setAdminChatId] = useState<number|null>(null);
  const [adminChatMessages, setAdminChatMessages] = useState<Record<string, unknown>[]>([]);
  const [adminBans, setAdminBans] = useState<Record<string, unknown>[]>([]);
  const [adminBroadcast, setAdminBroadcast] = useState("");
  const [adminBanModal, setAdminBanModal] = useState<{user_id:number;name:string}|null>(null);
  const [adminBanReason, setAdminBanReason] = useState("");
  const [adminBanHours, setAdminBanHours] = useState("");
  const [adminSendModal, setAdminSendModal] = useState<{chat_id?:number;name:string;all?:boolean}|null>(null);
  const [adminSendText, setAdminSendText] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState<number[]>([]);
  const [allUsers, setAllUsers] = useState<{id:number;display_name:string;avatar_initials:string;avatar_url?:string;online:boolean}[]>([]);
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

  const handleReact = async (messageId: number, emoji: string) => {
    try {
      const res = await fetch(`${API.messages}?action=react`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ message_id: messageId, emoji }),
      });
      const data = await res.json();
      if (data.reactions !== undefined) {
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, reactions: data.reactions } : m
        ));
      }
    } catch { /* silent */ }
  };

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
  // Универсальная чанковая загрузка файла
  const uploadFileChunked = async (
    file: File,
    contextKey: string  // "chat:{id}" или "store"
  ): Promise<{ message?: unknown; file?: unknown } | null> => {
    // 100KB бинарных = ~133KB base64 + JSON overhead — безопасно
    const CHUNK_SIZE = 100 * 1024;
    const MAX_MB = 50;
    if (file.size > MAX_MB * 1024 * 1024) {
      showToast("Файл слишком большой", `Максимальный размер файла — ${MAX_MB} МБ`, "error");
      return null;
    }

    setUploadProgress(5);

    // Читаем файл через FileReader (совместимо со всеми браузерами)
    const bytes = await new Promise<Uint8Array>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
      reader.readAsArrayBuffer(file);
    });
    const totalChunks = Math.max(1, Math.ceil(bytes.length / CHUNK_SIZE));

    const toBase64 = (buf: Uint8Array): string => {
      let binary = "";
      const len = buf.byteLength;
      for (let k = 0; k < len; k++) binary += String.fromCharCode(buf[k]);
      return btoa(binary);
    };

    // 1. init
    const initRes = await fetch(`${API.fileUpload}?action=init`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ file_name: file.name, file_size: file.size, context_key: contextKey }),
    });
    if (!initRes.ok) {
      const err = await initRes.json().catch(() => ({}));
      throw new Error(err.error || `init failed: ${initRes.status}`);
    }
    const { upload_id } = await initRes.json();
    setUploadProgress(10);

    // 2. chunks — последовательно с повтором при ошибке
    for (let i = 0; i < totalChunks; i++) {
      const slice = bytes.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const b64 = toBase64(slice);

      let lastErr: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const chunkRes = await fetch(`${API.fileUpload}?action=chunk`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            upload_id,
            chunk_index: i,
            total_chunks: totalChunks,
            data: b64,
          }),
        });
        if (chunkRes.ok) { lastErr = null; break; }
        const err = await chunkRes.json().catch(() => ({}));
        lastErr = new Error(err.error || `chunk ${i} failed: ${chunkRes.status}`);
        await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      }
      if (lastErr) throw lastErr;
      // Прогресс: 10% → 90% по чанкам
      setUploadProgress(10 + Math.round(((i + 1) / totalChunks) * 80));
    }

    // 3. finish
    const finishRes = await fetch(`${API.fileUpload}?action=finish`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ upload_id }),
    });
    if (!finishRes.ok) {
      const err = await finishRes.json().catch(() => ({}));
      throw new Error(err.error || `finish failed: ${finishRes.status}`);
    }
    setUploadProgress(100);
    const result = await finishRes.json();
    setTimeout(() => setUploadProgress(0), 600);
    return result;
  };

  const handleFileUpload = async (file: File) => {
    if (!activeChat || uploadingFile) return;
    setUploadingFile(true);
    setUploadProgress(10);
    try {
      const result = await uploadFileChunked(file, `chat:${activeChat.id}`);
      setUploadProgress(100);
      if (result?.message) {
        setMessages(prev => [...prev, result!.message as never]);
        loadChats();
      }
    } catch (e) {
      const msg = e instanceof Error ? `${e.message} | ${e.name}` : String(e);
      console.error("[file-upload] error:", e);
      showToast("Ошибка загрузки файла", msg, "error");
      setUploadProgress(0);
    } finally {
      setUploadingFile(false);
      setTimeout(() => setUploadProgress(0), 600);
    }
  };

  const handleUserFileUpload = async (file: File) => {
    if (uploadingUserFile) return;
    setUploadingUserFile(true);
    setUploadProgress(0);
    try {
      const result = await uploadFileChunked(file, "store");
      if (result?.file) {
        setUserFiles(prev => [result.file as never, ...prev]);
      }
    } catch (e) {
      showToast("Ошибка загрузки", e instanceof Error ? e.message : String(e), "error");
      setUploadProgress(0);
    } finally {
      setUploadingUserFile(false);
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

  const handleForwardFile = async () => {
    if (!forwardFileModal || forwardChatIds.length === 0) return;
    setForwardingFile(true);
    try {
      const results = await Promise.all(
        forwardChatIds.flatMap(chatId =>
          forwardFileModal.files.map(async f => {
            const res = await fetch(`${API.messages}?action=send`, {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify({ chat_id: chatId, text: "", msg_type: "file", file_name: f.name, file_url: f.url }),
            });
            const data = await res.json();
            return { chatId, message: data.message };
          })
        )
      );
      // Добавить сообщения в текущий чат если он среди выбранных
      if (activeChat) {
        const msgsForActive = results
          .filter(r => r.chatId === activeChat.id && r.message)
          .map(r => r.message);
        if (msgsForActive.length > 0) {
          setMessages(prev => [...prev, ...msgsForActive]);
        }
      }
      setForwardFileModal(null);
      setForwardChatIds([]);
      const cnt = forwardChatIds.length;
      const fcnt = forwardFileModal.files.length;
      showToast("Переслано", `${fcnt} файл(а) → ${cnt} чат(а)`, "info");
    } finally {
      setForwardingFile(false);
    }
  };

  useEffect(() => {
    if (section === "calls" && sessionToken) loadCallHistory();
  }, [section, sessionToken]);

  const loadUserFiles = useCallback(async () => {
    if (!sessionToken) return;
    setLoadingUserFiles(true);
    try {
      const res = await fetch(API.userFiles, { headers: authHeaders() });
      const data = await res.json();
      if (data.files) setUserFiles(data.files);
    } finally {
      setLoadingUserFiles(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    if (section === "files" && sessionToken) loadUserFiles();
  }, [section, sessionToken]);

  const loadBots = useCallback(async () => {
    if (!sessionToken) return;
    setLoadingBots(true);
    try {
      const res = await fetch(API.bots, { headers: authHeaders() });
      const data = await res.json();
      if (data.bots) setBots(data.bots);
    } finally {
      setLoadingBots(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    if (section === "bots" && sessionToken) loadBots();
  }, [section, sessionToken]);

  const loadAdminUsers = useCallback(async () => {
    if (!sessionToken || currentUser?.role !== "admin") return;
    setAdminLoading(true);
    try {
      const res = await fetch(`${API.admin}?action=users`, { headers: authHeaders() });
      const data = await res.json();
      if (data.users) setAdminUsers(data.users);
    } finally { setAdminLoading(false); }
  }, [sessionToken, currentUser]);

  const loadAdminUserDetail = async (uid: number) => {
    const res = await fetch(`${API.admin}?action=user&id=${uid}`, { headers: authHeaders() });
    const data = await res.json();
    setAdminUserDetail(data);
  };

  const loadAdminChat = async (chatId: number) => {
    setAdminChatId(chatId);
    setAdminTab("chat");
    const res = await fetch(`${API.admin}?action=chat&id=${chatId}`, { headers: authHeaders() });
    const data = await res.json();
    if (data.messages) setAdminChatMessages(data.messages);
  };

  const loadAdminBans = async () => {
    const res = await fetch(`${API.admin}?action=bans`, { headers: authHeaders() });
    const data = await res.json();
    if (data.bans) setAdminBans(data.bans);
  };

  useEffect(() => {
    if (section === "admin" && sessionToken && currentUser?.role === "admin") {
      loadAdminUsers();
      loadAdminBans();
    }
  }, [section, sessionToken, currentUser]);

  const loadAllUsers = useCallback(async () => {
    if (!sessionToken) return;
    const res = await fetch(`${API.chats}/contacts`, { headers: authHeaders() });
    const data = await res.json();
    if (data.contacts) setAllUsers(data.contacts);
  }, [sessionToken]);

  const createGroupChat = async () => {
    if (!newGroupName.trim() || newGroupMembers.length === 0) return;
    try {
      const res = await fetch(API.chats, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ type: "group", name: newGroupName.trim(), members: newGroupMembers }),
      });
      const data = await res.json();
      if (data.chat_id) {
        setShowCreateGroup(false);
        setNewGroupName("");
        setNewGroupMembers([]);
        await loadChats();
        setSection("chats");
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (section === "chats" && sessionToken) loadAllUsers();
  }, [section, sessionToken]);

  const loadBotHistory = async (botId: number) => {
    const res = await fetch(`${API.bots}/history?bot_id=${botId}`, { headers: authHeaders() });
    const data = await res.json();
    if (data.messages) setBotMessages(data.messages);
  };

  const sendBotMessage = async () => {
    if (!activeBotId || !botInput.trim() || sendingBotMsg) return;
    const msg = botInput.trim();
    setBotInput("");
    setSendingBotMsg(true);
    // Optimistic
    setBotMessages(prev => [...prev, { id: Date.now(), role: "user", content: msg, time: new Date().toLocaleTimeString("ru", {hour:"2-digit",minute:"2-digit"}) }]);
    try {
      const res = await fetch(`${API.bots}/chat`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ bot_id: activeBotId, message: msg }),
      });
      const data = await res.json();
      if (data.bot_message) {
        setBotMessages(prev => [...prev, data.bot_message]);
      }
    } finally {
      setSendingBotMsg(false);
    }
  };

  // Запрос разрешения на push-уведомления
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Проверка входящих звонков каждые 3 секунды
  useEffect(() => {
    if (!sessionToken) return;
    const iv = setInterval(async () => {
      if (activeCallId) return;
      const res = await fetch(`${API.calls}/incoming`, { headers: authHeaders() });
      const data = await res.json();
      if (data.call) {
        setIncomingCall(data.call);
        // Push notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`📞 Входящий ${data.call.call_type === "video" ? "видео" : "аудио"}звонок`, {
            body: data.call.caller_name,
            icon: "/favicon.ico",
            tag: `call-${data.call.id}`,
          });
        }
      }
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
          setCallStatus("active");
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

  const createPeerConnection = (callId: number, targetUserId: number, iceServers?: RTCIceServer[]) => {
    const defaultIce: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun.cloudflare.com:3478" },
      { urls: ["turn:relay1.expressturn.com:3478", "turns:relay1.expressturn.com:443"] as string[],
        username: "efOG5BPZFP2AQIQPNJ", credential: "uBhKqPuaVmvBFxp8" },
    ];
    const pc = new RTCPeerConnection({
      iceServers: iceServers || defaultIce,
      iceCandidatePoolSize: 10,
    });
    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal(callId, targetUserId, "candidate", e.candidate);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setCallStatus("active");
      // disconnected — временное, ждём reconnect; failed — финальная ошибка
      if (pc.connectionState === "failed") {
        setCallStatus("error");
        setCallErrorMsg("Не удалось установить соединение");
      }
    };
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setCallStatus("active");
      }
    };
    pc.ontrack = (e) => {
      setRemoteStream(prev => {
        const stream = prev || new MediaStream();
        e.streams[0]?.getTracks().forEach(t => {
          if (!stream.getTracks().find(x => x.id === t.id)) stream.addTrack(t);
        });
        if (!e.streams[0]) stream.addTrack(e.track);
        return stream;
      });
    };
    return pc;
  };

  const startCall = async (contact: Contact, type: "audio" | "video") => {
    if (!contact.id) {
      setCallTarget(contact);
      setCallType(type);
      setActiveCall(true);
      setCallStatus("error");
      setCallErrorMsg("Не удалось определить пользователя для звонка");
      return;
    }
    setCallTarget(contact);
    setCallType(type);
    setActiveCall(true);
    setCallStatus("calling");
    setCallErrorMsg("");
    setCallDuration(0);
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });
      setLocalStream(stream);
    } catch (err: unknown) {
      const name = err instanceof Error ? (err as { name?: string }).name : "";
      let msg = "Нет доступа к микрофону/камере";
      if (name === "NotAllowedError" || name === "PermissionDeniedError")
        msg = type === "video" ? "Разрешите доступ к камере и микрофону в браузере" : "Разрешите доступ к микрофону в браузере";
      else if (name === "NotFoundError" || name === "DevicesNotFoundError")
        msg = type === "video" ? "Камера или микрофон не найдены" : "Микрофон не найден";
      else if (name === "NotReadableError")
        msg = "Устройство занято другим приложением";
      setCallStatus("error");
      setCallErrorMsg(msg);
      return;
    }
    try {
      // Получаем ICE-серверы и создаём звонок параллельно
      const [iceRes, callRes] = await Promise.all([
        fetch(`${API.calls}/ice-servers`, { headers: authHeaders() }).catch(() => null),
        fetch(`${API.calls}/start`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ callee_id: contact.id, call_type: type }),
        }),
      ]);
      if (!callRes.ok) {
        const errData = await callRes.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${callRes.status}`);
      }
      const iceData = iceRes?.ok ? await iceRes.json().catch(() => null) : null;
      const iceServers: RTCIceServer[] | undefined = iceData?.ice_servers;
      const callData = await callRes.json();
      const callId = callData.call_id;
      if (!callId) throw new Error("Сервер не вернул ID звонка");
      setActiveCallId(callId);
      const pc = createPeerConnection(callId, contact.id, iceServers);
      stream.getTracks().forEach(track => pc.addTrack(track, stream!));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(callId, contact.id, "offer", offer);
      setPeerConnection(pc);
    } catch (err) {
      setCallStatus("error");
      const msg = err instanceof Error ? err.message : String(err);
      setCallErrorMsg(msg || "Не удалось начать звонок");
    }
  };

  const answerCall = async (call: typeof incomingCall) => {
    if (!call) return;
    setIncomingCall(null);
    setActiveCallId(call.id);
    setCallType(call.call_type as "audio" | "video");
    setActiveCall(true);
    setCallStatus("ringing");
    setCallErrorMsg("");
    setCallDuration(0);
    await fetch(`${API.calls}/answer`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ call_id: call.id, accepted: true }),
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.call_type === "video" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });
      setLocalStream(stream);
      const pc = createPeerConnection(call.id, call.caller_id ?? 0);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      setPeerConnection(pc);
    } catch (err: unknown) {
      const name = err instanceof Error ? (err as { name?: string }).name : "";
      let msg = "Нет доступа к микрофону/камере";
      if (name === "NotAllowedError" || name === "PermissionDeniedError")
        msg = call.call_type === "video" ? "Разрешите доступ к камере и микрофону в браузере" : "Разрешите доступ к микрофону в браузере";
      else if (name === "NotFoundError" || name === "DevicesNotFoundError")
        msg = call.call_type === "video" ? "Камера или микрофон не найдены" : "Микрофон не найден";
      else if (name === "NotReadableError")
        msg = "Устройство занято другим приложением";
      setCallStatus("error");
      setCallErrorMsg(msg);
    }
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

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setMicMuted(m => !m);
    }
  };

  const toggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setCamOff(c => !c);
    }
  };

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
          authUrl={API.auth}
          sessionId={null}
          onJoined={(token, user) => {
            if (token && user) {
              localStorage.setItem("session_token", token);
              handleLogin(user as User, token);
            }
            window.history.replaceState({}, "", "/");
          }}
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
    const joinToken = sessionToken || localStorage.getItem("session_token");
    return (
      <JoinPage
        code={pendingInvite}
        apiUrl={API.contacts}
        authUrl={API.auth}
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
                  <div className="flex items-center gap-1">
                    {loadingChats && <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />}
                    <button
                      onClick={() => { loadAllUsers(); setShowCreateGroup(true); }}
                      title="Создать группу"
                      className="p-1.5 rounded transition-colors hover:bg-white/10"
                      style={{ color: "var(--t-accent)" }}>
                      <Icon name="Users" size={14} />
                    </button>
                  </div>
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
                    <AvatarBadge initials={chat.avatar} online={chat.type === "personal" ? chat.online : undefined} avatar_url={chat.type === "personal" ? (chat as { avatar_url?: string }).avatar_url : undefined} />
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
                      <AvatarBadge initials={activeChat.avatar} online={activeChat.type === "personal" ? activeChat.online : undefined} avatar_url={activeChat.type === "personal" ? (activeChat as { avatar_url?: string }).avatar_url : undefined} />
                      <div>
                        <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 14, color: "var(--t-text)", letterSpacing: "0.05em", filter: "drop-shadow(0 1px 4px color-mix(in srgb, var(--t-accent) 30%, transparent))" }}>{activeChat.name}</div>
                        <div style={{ fontFamily: FONT.body, fontSize: 11, color: activeChat.online ? "var(--t-online)" : "var(--t-text-dim)" }}>
                          {activeChat.type === "personal" ? (activeChat.online ? t("chats_online") : t("chats_offline")) : t("chats_group")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" style={{ position: "relative" }}>
                      {/* Звонок — только для личных чатов */}
                      {activeChat.type === "personal" && (() => {
                        // Ищем реальный ID из списка контактов по имени или other_user_id
                        const knownContact = contacts.find(c => c.id === activeChat.other_user_id)
                          || externalContacts.find(c => c.linked_user_id === activeChat.other_user_id);
                        const resolvedId = activeChat.other_user_id
                          || knownContact?.id
                          || (externalContacts.find(c => c.display_name === activeChat.name)?.linked_user_id ?? 0);
                        const chatContact: Contact = {
                          id: resolvedId,
                          username: "",
                          display_name: activeChat.name,
                          avatar_initials: activeChat.avatar,
                          online: activeChat.online,
                        };
                        return (
                          <>
                            <button
                              onClick={() => startCall(chatContact, "audio")}
                              title="Аудиозвонок"
                              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                              style={{ color: "var(--t-text-dim)" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `color-mix(in srgb, var(--t-accent) 15%, transparent)`; (e.currentTarget as HTMLElement).style.color = "var(--t-accent)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--t-text-dim)"; }}>
                              <Icon name="Phone" size={16} />
                            </button>
                            <button
                              onClick={() => startCall(chatContact, "video")}
                              title="Видеозвонок"
                              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                              style={{ color: "var(--t-text-dim)" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `color-mix(in srgb, var(--t-accent) 15%, transparent)`; (e.currentTarget as HTMLElement).style.color = "var(--t-accent)"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--t-text-dim)"; }}>
                              <Icon name="Video" size={16} />
                            </button>
                          </>
                        );
                      })()}
                      {/* Три точки — меню чата */}
                      <div style={{ position: "relative" }}>
                        <button
                          onClick={() => setShowChatMenu(v => !v)}
                          title="Меню чата"
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                          style={{ color: showChatMenu ? "var(--t-accent)" : "var(--t-text-dim)", background: showChatMenu ? `color-mix(in srgb, var(--t-accent) 15%, transparent)` : "transparent" }}
                          onMouseEnter={e => { if (!showChatMenu) { (e.currentTarget as HTMLElement).style.background = `color-mix(in srgb, var(--t-accent) 15%, transparent)`; (e.currentTarget as HTMLElement).style.color = "var(--t-accent)"; } }}
                          onMouseLeave={e => { if (!showChatMenu) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--t-text-dim)"; } }}>
                          <Icon name="MoreVertical" size={16} />
                        </button>
                        {showChatMenu && (
                          <div
                            style={{
                              position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                              background: "var(--t-bg-panel)", border: "1px solid var(--t-border)",
                              borderRadius: 12, padding: "6px 0", minWidth: 180,
                              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                              animation: "emojiPickerIn 0.15s ease",
                            }}
                            onMouseLeave={() => setShowChatMenu(false)}
                          >
                            {[
                              { icon: "Search", label: "Поиск по сообщениям", action: () => {} },
                              { icon: "Bell", label: "Уведомления", action: () => {} },
                              ...(activeChat.type === "group" ? [
                                { icon: "Users", label: "Участники группы", action: () => {} },
                                { icon: "UserPlus", label: "Добавить участника", action: () => {} },
                              ] : []),
                              { icon: "Trash2", label: "Очистить историю", action: () => { setShowChatMenu(false); } },
                            ].map((item, idx) => (
                              <button key={idx} onClick={() => { item.action(); setShowChatMenu(false); }}
                                style={{
                                  display: "flex", alignItems: "center", gap: 10,
                                  width: "100%", padding: "8px 14px",
                                  background: "transparent", border: "none",
                                  color: item.icon === "Trash2" ? "var(--t-danger)" : "var(--t-text)",
                                  fontFamily: "var(--font-body, sans-serif)", fontSize: 13,
                                  cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = "color-mix(in srgb, var(--t-accent) 10%, transparent)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                              >
                                <Icon name={item.icon} size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Область сообщений */}
                  <div
                    className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-2"
                    style={{ background: "var(--t-chat-bg)", backgroundImage: "var(--t-chat-pattern)", backgroundSize: "var(--t-chat-pattern-size, auto)", position: "relative" }}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                    onDragLeave={e => { e.preventDefault(); setDragOver(false); }}
                    onDrop={e => {
                      e.preventDefault();
                      setDragOver(false);
                      if (!activeChat) return;
                      const files = Array.from(e.dataTransfer.files);
                      files.forEach(f => handleFileUpload(f));
                    }}
                  >
                    {dragOver && (
                      <div style={{
                        position: "absolute", inset: 0, zIndex: 20,
                        background: "color-mix(in srgb, var(--t-accent) 12%, transparent)",
                        border: "2px dashed var(--t-accent)",
                        borderRadius: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        pointerEvents: "none",
                      }}>
                        <div style={{ textAlign: "center" }}>
                          <Icon name="Upload" size={40} style={{ color: "var(--t-accent)", margin: "0 auto 8px" }} />
                          <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 14, color: "var(--t-accent)" }}>Отпустите для отправки</div>
                        </div>
                      </div>
                    )}
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
                      <div key={msg.id} className={`flex items-end gap-2 ${msg.own ? "flex-row-reverse" : ""} msg-row`}
                        style={{ animation: `msgIn 0.25s ease ${mi * 0.03}s both`, position: "relative" }}>
                        {!msg.own && <AvatarBadge initials={msg.sender_avatar || "??"} size="sm" avatar_url={(msg as { sender_avatar_url?: string }).sender_avatar_url} />}
                        <div className={`max-w-[68%] flex flex-col gap-1 ${msg.own ? "items-end" : "items-start"}`}>
                          {!msg.own && (
                            <span className="msg-sender ml-2" style={{ color: "var(--t-accent)" }}>{msg.sender_name}</span>
                          )}
                          {/* Пузырь сообщения + кнопка реакции */}
                          <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4, flexDirection: msg.own ? "row-reverse" : "row" }}>
                            <div className="px-4 py-2.5" style={msg.own ? msgOwn() : msgOther()}>
                              {msg.type === "file" ? (() => {
                                const name = msg.file_name || "";
                                const url = msg.file_url || "#";
                                const isImage = /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
                                const isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(name);
                                const isAudio = /\.(mp3|ogg|wav|m4a|aac)$/i.test(name);
                                const FileActions = () => (
                                  <div className="flex items-center gap-1 mt-2">
                                    <a
                                      href={url} download={name}
                                      title="Скачать"
                                      onClick={e => e.stopPropagation()}
                                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: "color-mix(in srgb, var(--t-accent) 15%, transparent)", border: "1px solid color-mix(in srgb, var(--t-accent) 30%, transparent)", color: "var(--t-accent)", fontFamily: FONT.mono, fontSize: 10, textDecoration: "none", cursor: "pointer" }}
                                    >
                                      <Icon name="Download" size={11} /> скачать
                                    </a>
                                    <button
                                      title="Переслать"
                                      onClick={() => { setForwardFileModal({ files: [{ name, url }] }); setForwardChatIds([]); }}
                                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: "color-mix(in srgb, var(--t-accent) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--t-accent) 20%, transparent)", color: "var(--t-text-dim)", fontFamily: FONT.mono, fontSize: 10, cursor: "pointer" }}
                                    >
                                      <Icon name="Forward" size={11} /> переслать
                                    </button>
                                  </div>
                                );
                                if (isImage) return (
                                  <div>
                                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}
                                      draggable onDragStart={e => { e.dataTransfer.setData("text/uri-list", url); e.dataTransfer.setData("text/plain", url); }}>
                                      <img src={url} alt={name} style={{ maxWidth: 260, maxHeight: 200, borderRadius: 8, display: "block", objectFit: "cover" }} loading="lazy" />
                                    </a>
                                    <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "var(--t-text-dim)", marginTop: 4 }}>{msg.file_size}</div>
                                    <FileActions />
                                  </div>
                                );
                                if (isVideo) return (
                                  <div>
                                    <video src={url} controls style={{ maxWidth: 260, maxHeight: 180, borderRadius: 8, display: "block" }} />
                                    <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "var(--t-text-dim)", marginTop: 4 }}>{name} · {msg.file_size}</div>
                                    <FileActions />
                                  </div>
                                );
                                if (isAudio) return (
                                  <div>
                                    <audio src={url} controls style={{ width: 220, marginBottom: 4 }} />
                                    <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "var(--t-text-dim)" }}>{name} · {msg.file_size}</div>
                                    <FileActions />
                                  </div>
                                );
                                return (
                                  <div>
                                    <div className="flex items-center gap-3"
                                      draggable onDragStart={e => { e.dataTransfer.setData("text/uri-list", url); e.dataTransfer.setData("text/plain", url); }}>
                                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `color-mix(in srgb, var(--t-accent) 15%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Icon name={/\.(zip|rar|7z|tar|gz)$/i.test(name) ? "Archive" : /\.(pdf)$/i.test(name) ? "FileText" : "File"} size={18} style={liveIcon()} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="msg-text font-medium truncate max-w-[180px]" style={{ color: "var(--t-text)" }}>{name}</div>
                                        <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "var(--t-text-dim)" }}>{msg.file_size}</div>
                                      </div>
                                    </div>
                                    <FileActions />
                                  </div>
                                );
                              })() : (
                                <span className="msg-text">{msg.text}</span>
                              )}
                            </div>
                            {/* Быстрые реакции — появляются при наведении */}
                            <div className="msg-react-bar" style={{
                              display: "flex", gap: 2, opacity: 0, transition: "opacity 0.15s",
                              pointerEvents: "none",
                            }}>
                              {["👍","❤️","😂","😮","😢","🔥"].map(e => (
                                <button key={e} onClick={() => handleReact(msg.id, e)}
                                  style={{
                                    fontSize: 16, lineHeight: 1, background: "var(--t-bg-panel)",
                                    border: "1px solid var(--t-border)", borderRadius: 8,
                                    cursor: "pointer", padding: "3px 5px", transition: "transform 0.1s",
                                  }}
                                  onMouseEnter={e2 => (e2.currentTarget.style.transform = "scale(1.25)")}
                                  onMouseLeave={e2 => (e2.currentTarget.style.transform = "scale(1)")}
                                >
                                  {e}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* Реакции под сообщением */}
                          {(msg.reactions ?? []).filter(r => r.emoji !== "__removed__" && r.count > 0).length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2, paddingLeft: msg.own ? 0 : 4, paddingRight: msg.own ? 4 : 0 }}>
                              {(msg.reactions ?? []).filter(r => r.emoji !== "__removed__" && r.count > 0).map(r => (
                                <button key={r.emoji} onClick={() => handleReact(msg.id, r.emoji)}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 3,
                                    background: r.my
                                      ? "color-mix(in srgb, var(--t-accent) 20%, transparent)"
                                      : "color-mix(in srgb, var(--t-bg-panel) 80%, transparent)",
                                    border: r.my
                                      ? "1px solid color-mix(in srgb, var(--t-accent) 50%, transparent)"
                                      : "1px solid var(--t-border)",
                                    borderRadius: 12, padding: "2px 7px",
                                    cursor: "pointer", fontSize: 13, lineHeight: 1.4,
                                    transition: "transform 0.1s, background 0.15s",
                                    fontFamily: FONT.mono,
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
                                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                                >
                                  <span>{r.emoji}</span>
                                  <span style={{ fontSize: 11, color: r.my ? "var(--t-accent)" : "var(--t-text-dim)", fontWeight: r.my ? 700 : 400 }}>{r.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          <span className="msg-time mx-1">{msg.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Поле ввода */}
                  <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--t-border)", background: `linear-gradient(0deg, var(--t-bg-main), color-mix(in srgb, var(--t-bg-main) 95%, var(--t-accent)))` }}>
                    {uploadingFile && (
                      <div className="flex items-center gap-2 mb-2 px-1" style={{ fontFamily: FONT.body, fontSize: 11, color: "var(--t-accent)" }}>
                        <div className="w-3 h-3 border-2 rounded-full animate-spin flex-shrink-0" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />
                        <span>Загружаем файл... {uploadProgress > 0 ? `${uploadProgress}%` : ""}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--t-border)" }}>
                          <div className="h-full rounded-full" style={{
                            background: uploadProgress === 100
                              ? "var(--t-online)"
                              : "linear-gradient(90deg, var(--t-accent), color-mix(in srgb, var(--t-accent) 70%, #fff))",
                            width: `${Math.max(5, uploadProgress)}%`,
                            transition: "width 0.3s ease",
                          }} />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-2" style={{ position: "relative", background: "var(--t-bg-panel)", border: "1px solid var(--t-border)", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                      {/* Emoji picker portal */}
                      {showEmojiPicker && (
                        <EmojiPicker
                          onEmojiSelect={emoji => setMsgInput(prev => prev + emoji)}
                          onStickerSelect={sticker => {
                            setMsgInput(prev => prev + sticker);
                            setShowEmojiPicker(false);
                          }}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      )}
                      {/* Attach */}
                      <label className={`flex-shrink-0 transition-all ${uploadingFile ? "opacity-40 pointer-events-none" : "cursor-pointer"}`} style={liveIcon(1)}
                        title="Прикрепить файл (до 50 МБ)">
                        <Icon name="Paperclip" size={17} />
                        <input type="file" className="hidden" accept="*/*" disabled={uploadingFile}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
                      </label>
                      {/* Camera */}
                      <button
                        className={`flex-shrink-0 transition-all ${uploadingFile ? "opacity-40 pointer-events-none" : "cursor-pointer"}`}
                        style={{ background: "transparent", border: "none", padding: 0, ...liveIcon(1) }}
                        title="Сделать фото"
                        disabled={uploadingFile}
                        onClick={() => setShowCamera(true)}
                      >
                        <Icon name="Camera" size={17} />
                      </button>
                      {/* Emoji button */}
                      <button
                        onClick={() => setShowEmojiPicker(v => !v)}
                        title="Эмодзи и стикеры"
                        className="flex-shrink-0 transition-all"
                        style={{
                          fontSize: 18, lineHeight: 1, background: "transparent", border: "none",
                          cursor: "pointer", padding: "2px 3px", borderRadius: 6,
                          opacity: showEmojiPicker ? 1 : 0.65,
                          filter: showEmojiPicker ? "drop-shadow(0 0 6px var(--t-accent))" : undefined,
                          transition: "all 0.15s",
                        }}>
                        😊
                      </button>
                      <input
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                          if (e.key === "Escape") setShowEmojiPicker(false);
                        }}
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
                            <AvatarBadge initials={c.avatar_initials} size="lg" online={c.online} avatar_url={(c as { avatar_url?: string }).avatar_url} />
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
                              <button onClick={() => startCall({ id: c.linked_user_id || c.id, username: "", display_name: c.display_name, avatar_initials: c.avatar_initials, online: c.online }, "audio")} className="btn-3d flex-1 py-1.5 text-[10px] flex items-center justify-center gap-1" style={{ ...btn3d("var(--t-accent)") }}>
                                <Icon name="Phone" size={11} style={liveIcon(index * 0.3 + 0.1)} /> {t("contacts_call")}
                              </button>
                              <button onClick={() => startCall({ id: c.linked_user_id || c.id, username: "", display_name: c.display_name, avatar_initials: c.avatar_initials, online: c.online }, "video")} className="btn-3d flex-1 py-1.5 text-[10px] flex items-center justify-center gap-1" style={{ ...btn3d("var(--t-accent)") }}>
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
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b flex items-center justify-between flex-shrink-0"
              style={{ borderColor: "var(--t-border)", background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))" }}>
              <div>
                <h2 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>{t("files_title")}</h2>
                <p className="text-xs mt-0.5" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>
                  {userFiles.length} {t("files_sub")} · хранение без ограничений
                </p>
              </div>
              <label className={`btn-3d px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer ${uploadingUserFile ? "opacity-50 pointer-events-none" : ""}`}
                style={{ ...btn3d("var(--t-accent)") }}>
                {uploadingUserFile
                  ? <><div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: "#fff", borderTopColor: "transparent" }} /> Загружаем...</>
                  : <><Icon name="Upload" size={12} /> {t("files_upload")}</>
                }
                <input type="file" className="hidden" accept="*/*" disabled={uploadingUserFile}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUserFileUpload(f); e.target.value = ""; }} />
              </label>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingUserFiles && userFiles.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />
                </div>
              ) : userFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div style={{ ...card3d(), padding: 16, display: "inline-flex" }}>
                    <Icon name="FolderOpen" size={28} style={liveIcon(0)} />
                  </div>
                  <span style={{ ...heading3d(11), letterSpacing: "0.1em" }}>{t("files_empty")}</span>
                  <span style={{ fontFamily: FONT.body, fontSize: 12, color: "var(--t-text-dim)" }}>
                    Нажмите «Загрузить» чтобы добавить первый файл
                  </span>
                </div>
              ) : (
                <div className="overflow-hidden" style={{ ...card3d() }}>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--t-border)", background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 5%, var(--t-bg-main)), var(--t-bg-main))" }}>
                        {[t("files_name"), t("files_size"), t("files_date"), ""].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5" style={{ ...heading3d(10), letterSpacing: "0.12em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {userFiles.map((f, idx) => (
                        <tr key={f.id} style={{ borderBottom: "1px solid var(--t-bg-panel)" }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div style={{ width: 28, height: 28, borderRadius: 6, background: "color-mix(in srgb, var(--t-accent) 15%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Icon name={/image/.test(f.mime) ? "Image" : /video/.test(f.mime) ? "Video" : /audio/.test(f.mime) ? "Music" : /pdf/.test(f.mime) ? "FileText" : /zip|rar|7z/.test(f.mime) ? "Archive" : "File"} size={14} style={liveIcon(idx * 0.1)} />
                              </div>
                              <span className="text-xs font-medium truncate max-w-[200px]" style={{ fontFamily: FONT.heading, color: "var(--t-text)" }}>{f.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)" }}>{f.size}</td>
                          <td className="px-4 py-3 text-xs" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{f.date}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <a href={f.url} download={f.name} target="_blank" rel="noopener noreferrer"
                                title="Скачать"
                                className="p-1.5 rounded transition-colors hover:bg-white/10">
                                <Icon name="Download" size={14} style={liveIcon(idx * 0.1)} />
                              </a>
                              <button
                                title="Разослать"
                                onClick={() => { setSendFileModal({id: f.id, name: f.name, url: f.url}); setSendChatIds([]); setSendEmails(""); setSendMessage(""); }}
                                className="p-1.5 rounded transition-colors hover:bg-white/10">
                                <Icon name="Send" size={14} style={liveIcon(idx * 0.1)} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Send Modal */}
            {sendFileModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
                <div className="w-full max-w-md mx-4 rounded-lg overflow-hidden" style={{ ...card3d(), background: "var(--t-bg-panel)" }}>
                  <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--t-border)" }}>
                    <span style={{ ...heading3d(12), letterSpacing: "0.1em" }}>РАЗОСЛАТЬ ФАЙЛ</span>
                    <button onClick={() => setSendFileModal(null)} style={{ color: "var(--t-text-dim)" }}>
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                  <div className="px-5 py-4 flex flex-col gap-4">
                    <div style={{ fontFamily: FONT.body, fontSize: 12, color: "var(--t-text-dim)" }}>
                      📎 {sendFileModal.name}
                    </div>

                    {/* Чаты */}
                    <div>
                      <div className="text-xs mb-2" style={{ ...heading3d(10), letterSpacing: "0.1em" }}>В ЧАТЫ (выберите один или несколько)</div>
                      <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                        {chats.map(ch => (
                          <label key={ch.id} className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-white/5">
                            <input type="checkbox" checked={sendChatIds.includes(ch.id)}
                              onChange={e => setSendChatIds(prev => e.target.checked ? [...prev, ch.id] : prev.filter(x => x !== ch.id))}
                              className="accent-[var(--t-accent)]" />
                            <span style={{ fontFamily: FONT.body, fontSize: 12, color: "var(--t-text)" }}>{ch.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <div className="text-xs mb-1" style={{ ...heading3d(10), letterSpacing: "0.1em" }}>НА EMAIL (через запятую)</div>
                      <input value={sendEmails} onChange={e => setSendEmails(e.target.value)}
                        placeholder="ivan@example.com, anna@example.com"
                        className="w-full bg-transparent focus:outline-none text-sm px-3 py-2 rounded"
                        style={{ border: "1px solid var(--t-border)", color: "var(--t-text)", fontFamily: FONT.body, fontSize: 12 }} />
                    </div>

                    {/* Сообщение */}
                    <div>
                      <div className="text-xs mb-1" style={{ ...heading3d(10), letterSpacing: "0.1em" }}>СОПРОВОДИТЕЛЬНОЕ СООБЩЕНИЕ</div>
                      <textarea value={sendMessage} onChange={e => setSendMessage(e.target.value)}
                        placeholder="Необязательно..."
                        rows={2}
                        className="w-full bg-transparent focus:outline-none text-sm px-3 py-2 rounded resize-none"
                        style={{ border: "1px solid var(--t-border)", color: "var(--t-text)", fontFamily: FONT.body, fontSize: 12 }} />
                    </div>
                  </div>
                  <div className="px-5 py-4 border-t flex gap-2 justify-end" style={{ borderColor: "var(--t-border)" }}>
                    <button onClick={() => setSendFileModal(null)}
                      className="px-4 py-2 text-xs rounded"
                      style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)", border: "1px solid var(--t-border)" }}>
                      ОТМЕНА
                    </button>
                    <button
                      disabled={sendingFile || (sendChatIds.length === 0 && !sendEmails.trim())}
                      onClick={async () => {
                        if (!sendFileModal) return;
                        setSendingFile(true);
                        try {
                          let chatSent = 0, mailSent = 0;
                          if (sendChatIds.length > 0) {
                            const r = await fetch(`${API.userFiles}/send-chat`, {
                              method: "POST", headers: authHeaders(),
                              body: JSON.stringify({ file_id: sendFileModal.id, chat_ids: sendChatIds }),
                            });
                            const d = await r.json();
                            chatSent = d.sent || 0;
                          }
                          if (sendEmails.trim()) {
                            const emails = sendEmails.split(",").map(e => e.trim()).filter(Boolean);
                            const r = await fetch(`${API.userFiles}/send-mail`, {
                              method: "POST", headers: authHeaders(),
                              body: JSON.stringify({ file_id: sendFileModal.id, emails, message: sendMessage }),
                            });
                            const d = await r.json();
                            mailSent = d.sent || 0;
                          }
                          showToast("Файл отправлен", `${chatSent} чат(ов), ${mailSent} email(ов)`, "info");
                          setSendFileModal(null);
                        } catch {
                          showToast("Ошибка отправки", "Не удалось отправить файл", "error");
                        } finally {
                          setSendingFile(false);
                        }
                      }}
                      className="btn-3d px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50"
                      style={{ ...btn3d("var(--t-accent)") }}>
                      {sendingFile
                        ? <><div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: "#fff", borderTopColor: "transparent" }} /> Отправляем...</>
                        : <><Icon name="Send" size={12} /> РАЗОСЛАТЬ</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BOTS */}
        {section === "bots" && (
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar — list of bots */}
            <div style={{
              width: isMobile && activeBotId ? 0 : isMobile ? "100%" : 300,
              flexShrink: 0, display: "flex", flexDirection: "column",
              borderRight: "1px solid var(--t-border)",
              overflow: "hidden", transition: "width 0.2s",
              background: "linear-gradient(180deg, color-mix(in srgb, var(--t-accent) 4%, var(--t-bg-main)), var(--t-bg-main))",
            }}>
              <div className="px-4 pt-4 pb-3 border-b flex items-center justify-between" style={{ borderColor: "var(--t-border)" }}>
                <h2 style={{ ...heading3d(13), letterSpacing: "0.12em" }}>{t("bots_title")}</h2>
                {loadingBots && <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-accent)", borderTopColor: "transparent" }} />}
              </div>
              <div className="flex-1 overflow-y-auto">
                {(bots.length > 0 ? bots : STATIC_BOTS).map((bot, index) => (
                  <div key={bot.id}
                    onClick={() => { setActiveBotId(bot.id); setBotMessages([]); loadBotHistory(bot.id); }}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      borderBottom: "1px solid var(--t-bg-panel)",
                      background: activeBotId === bot.id ? "color-mix(in srgb, var(--t-accent) 10%, transparent)" : undefined,
                    }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: `linear-gradient(135deg, var(--t-accent), color-mix(in srgb, var(--t-accent) 50%, #1e3a8a))`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: FONT.mono, fontWeight: 700, fontSize: 11, color: "#fff",
                      flexShrink: 0,
                    }}>
                      {bot.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>{bot.name}</div>
                      <div className="text-[10px] truncate" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{bot.description}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: bot.active ? "#22c55e" : "var(--t-text-dim)", boxShadow: bot.active ? "0 0 5px #22c55e" : undefined }} />
                      <span className="text-[9px] font-mono" style={{ color: "var(--t-text-dim)" }}>{bot.requests}</span>
                    </div>
                  </div>
                ))}
                {bots.length === 0 && !loadingBots && (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Icon name="Bot" size={28} style={liveIcon(0)} />
                    <span style={{ ...heading3d(10), letterSpacing: "0.1em" }}>НЕТ БОТОВ</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chat with bot */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {activeBotId ? (() => {
                const bot = (bots.length > 0 ? bots : STATIC_BOTS).find(b => b.id === activeBotId);
                return (
                  <>
                    {/* Bot header */}
                    <div className="px-4 py-3 border-b flex items-center gap-3 flex-shrink-0"
                      style={{ borderColor: "var(--t-border)", background: "color-mix(in srgb, var(--t-accent) 4%, var(--t-bg-main))" }}>
                      {isMobile && (
                        <button onClick={() => setActiveBotId(null)} style={{ color: "var(--t-text-dim)" }}>
                          <Icon name="ChevronLeft" size={18} />
                        </button>
                      )}
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: "linear-gradient(135deg, var(--t-accent), #1e3a8a)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: FONT.mono, fontWeight: 700, fontSize: 11, color: "#fff", flexShrink: 0,
                      }}>
                        {bot?.avatar}
                      </div>
                      <div>
                        <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 13, color: "var(--t-text)" }}>{bot?.name}</div>
                        <div style={{ fontFamily: FONT.body, fontSize: 10, color: "#22c55e" }}>● онлайн</div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                      {botMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-3 opacity-60">
                          <Icon name="Bot" size={32} style={liveIcon(0)} />
                          <span style={{ fontFamily: FONT.body, fontSize: 12, color: "var(--t-text-dim)" }}>Напишите вопрос боту</span>
                        </div>
                      )}
                      {botMessages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                          {msg.role === "assistant" && (
                            <div style={{
                              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                              background: "linear-gradient(135deg, var(--t-accent), #1e3a8a)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontFamily: FONT.mono, fontSize: 9, fontWeight: 700, color: "#fff",
                            }}>
                              {bot?.avatar}
                            </div>
                          )}
                          <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-xs leading-relaxed`}
                            style={{
                              background: msg.role === "user"
                                ? `linear-gradient(135deg, var(--t-accent), color-mix(in srgb, var(--t-accent) 70%, #1e3a8a))`
                                : "var(--t-bg-panel)",
                              color: msg.role === "user" ? "#fff" : "var(--t-text)",
                              fontFamily: FONT.body,
                              border: msg.role === "assistant" ? "1px solid var(--t-border)" : "none",
                              whiteSpace: "pre-wrap",
                            }}>
                            {msg.content}
                          </div>
                          <span style={{ fontFamily: FONT.mono, fontSize: 9, color: "var(--t-text-dim)", flexShrink: 0 }}>{msg.time}</span>
                        </div>
                      ))}
                      {sendingBotMsg && (
                        <div className="flex items-end gap-2">
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--t-accent), #1e3a8a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.mono, fontSize: 9, fontWeight: 700, color: "#fff" }}>
                            {bot?.avatar}
                          </div>
                          <div className="px-3 py-2 rounded-2xl" style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)" }}>
                            <div className="flex gap-1">
                              {[0,1,2].map(i => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--t-accent)", animationDelay: `${i*0.15}s` }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: "1px solid var(--t-border)" }}>
                      <div className="flex items-center gap-2 px-3 py-2"
                        style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)", borderRadius: 14 }}>
                        <input
                          value={botInput}
                          onChange={e => setBotInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBotMessage(); } }}
                          placeholder="Напишите сообщение..."
                          className="flex-1 bg-transparent focus:outline-none text-xs"
                          style={{ color: "var(--t-text)", fontFamily: FONT.body }}
                        />
                        <button onClick={sendBotMessage} disabled={!botInput.trim() || sendingBotMsg}
                          className="btn-3d flex items-center justify-center disabled:opacity-40 flex-shrink-0"
                          style={{ ...btn3d("var(--t-accent)"), width: 32, height: 32, padding: 0 }}>
                          <Icon name="Send" size={13} style={{ color: "#fff" }} />
                        </button>
                      </div>
                    </div>
                  </>
                );
              })() : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-60">
                  <Icon name="Bot" size={40} style={liveIcon(0)} />
                  <span style={{ ...heading3d(12), letterSpacing: "0.1em" }}>{t("bots_sub")}</span>
                  <span style={{ fontFamily: FONT.body, fontSize: 12, color: "var(--t-text-dim)" }}>Выберите бота слева</span>
                </div>
              )}
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
        {section === "analytics" && currentUser?.role === "admin" && (
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

        {/* ADMIN PANEL */}
        {section === "admin" && currentUser?.role === "admin" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b flex items-center justify-between flex-shrink-0"
              style={{ borderColor: "var(--t-border)", background: "linear-gradient(180deg, color-mix(in srgb, #ef4444 8%, var(--t-bg-main)), var(--t-bg-main))" }}>
              <div>
                <h2 style={{ ...heading3d(13), letterSpacing: "0.12em", color: "#ef4444" }}>⚙ ПАНЕЛЬ АДМИНИСТРАТОРА</h2>
                <p className="text-xs mt-0.5" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>
                  Управление пользователями · {adminUsers.length} зарегистрировано
                </p>
              </div>
              <div className="flex gap-2">
                {(["users","bans","chat"] as const).map(tab => (
                  <button key={tab} onClick={() => setAdminTab(tab)}
                    className="px-3 py-1.5 text-[10px] rounded uppercase tracking-widest transition-all"
                    style={{
                      fontFamily: FONT.mono,
                      background: adminTab === tab ? "#ef4444" : "transparent",
                      color: adminTab === tab ? "#fff" : "var(--t-text-dim)",
                      border: `1px solid ${adminTab === tab ? "#ef4444" : "var(--t-border)"}`,
                    }}>
                    {tab === "users" ? "ПОЛЬЗОВАТЕЛИ" : tab === "bans" ? "БЛОКИРОВКИ" : "ПЕРЕПИСКА"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Users Tab */}
              {adminTab === "users" && (
                <div className="flex flex-1 overflow-hidden">
                  {/* Users List */}
                  <div style={{ width: adminSelectedUser ? (isMobile ? "0" : 340) : "100%", flexShrink: 0, overflowY: "auto", borderRight: "1px solid var(--t-border)" }}>
                    {/* Broadcast bar */}
                    <div className="px-4 py-3 border-b flex gap-2" style={{ borderColor: "var(--t-border)", background: "color-mix(in srgb, #ef4444 4%, var(--t-bg-main))" }}>
                      <input value={adminBroadcast} onChange={e => setAdminBroadcast(e.target.value)}
                        placeholder="Сообщение всем пользователям..."
                        className="flex-1 bg-transparent focus:outline-none text-xs px-3 py-2 rounded"
                        style={{ border: "1px solid var(--t-border)", color: "var(--t-text)", fontFamily: FONT.body, fontSize: 12 }} />
                      <button
                        disabled={!adminBroadcast.trim()}
                        onClick={() => { setAdminSendModal({ name: "Всем пользователям", all: true }); setAdminSendText(adminBroadcast); }}
                        className="btn-3d px-3 py-2 text-[10px] flex items-center gap-1 disabled:opacity-40"
                        style={{ ...btn3d("#ef4444"), background: "#ef4444" }}>
                        <Icon name="Send" size={11} /> ВСЕМ
                      </button>
                    </div>

                    {adminLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#ef4444", borderTopColor: "transparent" }} />
                      </div>
                    ) : adminUsers.map(u => (
                      <div key={u.id}
                        onClick={() => { setAdminSelectedUser(u); loadAdminUserDetail(u.id); }}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                        style={{
                          borderBottom: "1px solid var(--t-bg-panel)",
                          background: adminSelectedUser?.id === u.id ? "color-mix(in srgb, #ef4444 8%, transparent)" : undefined,
                          opacity: u.is_banned ? 0.5 : 1,
                        }}>
                        <div style={{ position: "relative" }}>
                          <AvatarBadge initials={u.avatar_initials} size="sm" online={u.online} avatar_url={u.avatar_url} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium truncate" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>{u.display_name}</span>
                            {u.role === "admin" && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "#ef4444", color: "#fff", fontFamily: FONT.mono }}>ADM</span>}
                            {u.is_banned && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "#6b7280", color: "#fff", fontFamily: FONT.mono }}>БАН</span>}
                          </div>
                          <div className="text-[10px]" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>
                            @{u.username} · {u.msg_count} сообщ · {u.chat_count} чатов
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[9px]" style={{ fontFamily: FONT.mono, color: u.online ? "#22c55e" : "var(--t-text-dim)" }}>
                            {u.online ? "online" : u.last_seen ? new Date(u.last_seen).toLocaleDateString("ru") : "—"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* User Detail Panel */}
                  {adminSelectedUser && !isMobile && (
                    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                      {/* User header */}
                      <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: "var(--t-border)" }}>
                        <AvatarBadge initials={adminSelectedUser.avatar_initials} size="lg" online={adminSelectedUser.online} avatar_url={adminSelectedUser.avatar_url} />
                        <div className="flex-1">
                          <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 15, color: "var(--t-text)" }}>{adminSelectedUser.display_name}</div>
                          <div style={{ fontFamily: FONT.body, fontSize: 11, color: "var(--t-text-dim)" }}>@{adminSelectedUser.username} · {adminSelectedUser.email || "—"}</div>
                          <div style={{ fontFamily: FONT.body, fontSize: 11, color: "var(--t-text-dim)" }}>{adminSelectedUser.position || ""} {adminSelectedUser.department ? `· ${adminSelectedUser.department}` : ""}</div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <button onClick={() => { setAdminSendModal({ chat_id: undefined, name: adminSelectedUser.display_name }); setAdminSendText(""); }}
                            className="px-3 py-1.5 text-[10px] rounded flex items-center gap-1"
                            style={{ background: "var(--t-accent)", color: "#fff", fontFamily: FONT.mono, border: "none" }}>
                            <Icon name="Send" size={11} /> НАПИСАТЬ
                          </button>
                          {!adminSelectedUser.is_banned ? (
                            <button onClick={() => { setAdminBanModal({ user_id: adminSelectedUser.id, name: adminSelectedUser.display_name }); setAdminBanReason(""); setAdminBanHours(""); }}
                              className="px-3 py-1.5 text-[10px] rounded flex items-center gap-1"
                              style={{ background: "#ef4444", color: "#fff", fontFamily: FONT.mono, border: "none" }}>
                              <Icon name="Ban" size={11} /> ЗАБЛОКИРОВАТЬ
                            </button>
                          ) : (
                            <button onClick={async () => {
                                await fetch(`${API.admin}?action=unban`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id: adminSelectedUser.id }) });
                                loadAdminUsers();
                                setAdminSelectedUser((prev) => prev ? { ...prev, is_banned: false } : null);
                              }}
                              className="px-3 py-1.5 text-[10px] rounded flex items-center gap-1"
                              style={{ background: "#22c55e", color: "#fff", fontFamily: FONT.mono, border: "none" }}>
                              <Icon name="CheckCircle" size={11} /> РАЗБЛОКИРОВАТЬ
                            </button>
                          )}
                          <button onClick={async () => {
                              const newRole = adminSelectedUser.role === "admin" ? "user" : "admin";
                              await fetch(`${API.admin}?action=set_role`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id: adminSelectedUser.id, role: newRole }) });
                              loadAdminUsers();
                              setAdminSelectedUser((prev) => prev ? { ...prev, role: newRole } : null);
                            }}
                            className="px-3 py-1.5 text-[10px] rounded flex items-center gap-1"
                            style={{ background: adminSelectedUser.role === "admin" ? "#6b7280" : "#8b5cf6", color: "#fff", fontFamily: FONT.mono, border: "none" }}>
                            <Icon name="Shield" size={11} /> {adminSelectedUser.role === "admin" ? "СНЯТЬ ADMIN" : "НАЗНАЧИТЬ ADMIN"}
                          </button>
                          <button onClick={async () => {
                              if (!confirm(`Удалить пользователя «${adminSelectedUser.display_name}»? Действие необратимо.`)) return;
                              await fetch(`${API.admin}?action=delete_user`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id: adminSelectedUser.id }) });
                              setAdminSelectedUser(null);
                              loadAdminUsers();
                            }}
                            className="px-3 py-1.5 text-[10px] rounded flex items-center gap-1"
                            style={{ background: "#7f1d1d", color: "#fca5a5", fontFamily: FONT.mono, border: "1px solid #ef4444" }}>
                            <Icon name="Trash2" size={11} /> УДАЛИТЬ
                          </button>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "СООБЩЕНИЙ", value: adminSelectedUser.msg_count },
                          { label: "ЧАТОВ", value: adminSelectedUser.chat_count },
                          { label: "СЕССИЙ", value: adminSelectedUser.session_count },
                        ].map(s => (
                          <div key={s.label} className="p-3 rounded-lg text-center" style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)" }}>
                            <div style={{ fontFamily: FONT.mono, fontSize: 20, fontWeight: 700, color: "var(--t-text)" }}>{s.value}</div>
                            <div style={{ fontFamily: FONT.mono, fontSize: 9, color: "var(--t-text-dim)", letterSpacing: "0.1em" }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Contacts */}
                      {adminUserDetail && (
                        <>
                          <div>
                            <div className="text-[10px] uppercase tracking-widest mb-2" style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)" }}>КОНТАКТЫ ({adminUserDetail.contacts.length})</div>
                            <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                              {adminUserDetail.contacts.map((c, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs py-1" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>
                                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.online ? "#22c55e" : "var(--t-border)" }} />
                                  {c.name} {c.phone ? `· ${c.phone}` : ""} {c.email ? `· ${c.email}` : ""}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Chats */}
                          <div>
                            <div className="text-[10px] uppercase tracking-widest mb-2" style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)" }}>ЧАТЫ И ПЕРЕПИСКИ ({adminUserDetail.chats.length})</div>
                            <div className="flex flex-col gap-1">
                              {adminUserDetail.chats.map(c => (
                                <div key={c.id} className="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-white/5"
                                  onClick={() => loadAdminChat(c.id)}>
                                  <Icon name={c.type === "group" ? "Users" : "MessageSquare"} size={12} style={{ color: "var(--t-accent)" }} />
                                  <span className="text-xs flex-1" style={{ fontFamily: FONT.body, color: "var(--t-text)" }}>{c.name}</span>
                                  <span className="text-[10px]" style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)" }}>{c.sent} сообщ</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "color-mix(in srgb, #ef4444 15%, transparent)", color: "#ef4444", fontFamily: FONT.mono }}>
                                    ЧИТАТЬ →
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Files */}
                          {adminUserDetail.files.length > 0 && (
                            <div>
                              <div className="text-[10px] uppercase tracking-widest mb-2" style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)" }}>ФАЙЛЫ ({adminUserDetail.files.length})</div>
                              <div className="flex flex-col gap-1">
                                {adminUserDetail.files.map((f, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs py-1">
                                    <Icon name="File" size={12} style={{ color: "var(--t-accent)" }} />
                                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                                      className="flex-1 truncate hover:underline"
                                      style={{ fontFamily: FONT.body, color: "var(--t-text)" }}>{f.name}</a>
                                    <span style={{ fontFamily: FONT.mono, fontSize: 10, color: "var(--t-text-dim)" }}>{f.size} · {f.date}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bans Tab */}
              {adminTab === "bans" && (
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <div style={{ ...card3d() }}>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b" style={{ borderColor: "var(--t-border)" }}>
                          {["ПОЛЬЗОВАТЕЛЬ","ПРИЧИНА","ДО","КЕМ ЗАБЛОКИРОВАН",""].map(h => (
                            <th key={h} className="text-left px-4 py-2.5" style={{ ...heading3d(9), letterSpacing: "0.1em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {adminBans.map(b => (
                          <tr key={b.id} style={{ borderBottom: "1px solid var(--t-bg-panel)" }}>
                            <td className="px-4 py-3">
                              <div style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 12, color: "var(--t-text)" }}>{b.user_name}</div>
                              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "var(--t-text-dim)" }}>@{b.username}</div>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{b.reason || "—"}</td>
                            <td className="px-4 py-3 text-xs font-mono" style={{ fontFamily: FONT.mono, color: "#ef4444" }}>{b.banned_until === "навсегда" ? "навсегда" : new Date(b.banned_until).toLocaleDateString("ru")}</td>
                            <td className="px-4 py-3 text-xs" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{b.banned_by}</td>
                            <td className="px-4 py-3">
                              <button onClick={async () => {
                                  await fetch(`${API.admin}?action=unban`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id: b.user_id }) });
                                  loadAdminBans(); loadAdminUsers();
                                }}
                                className="text-[10px] px-2 py-1 rounded"
                                style={{ background: "#22c55e", color: "#fff", fontFamily: FONT.mono, border: "none" }}>
                                СНЯТЬ
                              </button>
                            </td>
                          </tr>
                        ))}
                        {adminBans.length === 0 && (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-xs" style={{ color: "var(--t-text-dim)", fontFamily: FONT.body }}>Нет активных блокировок</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Chat View Tab */}
              {adminTab === "chat" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {adminChatId ? (
                    <>
                      <div className="px-4 py-3 border-b flex items-center gap-2 flex-shrink-0" style={{ borderColor: "var(--t-border)", background: "color-mix(in srgb, #ef4444 4%, var(--t-bg-main))" }}>
                        <button onClick={() => setAdminTab("users")} style={{ color: "var(--t-text-dim)" }}><Icon name="ChevronLeft" size={16} /></button>
                        <Icon name="Eye" size={14} style={{ color: "#ef4444" }} />
                        <span style={{ fontFamily: FONT.mono, fontSize: 11, color: "#ef4444", letterSpacing: "0.1em" }}>
                          ПРОСМОТР ПЕРЕПИСКИ · ЧАТ #{adminChatId}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
                        {adminChatMessages.map(msg => (
                          <div key={msg.id} className="flex items-start gap-2">
                            <div style={{
                              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                              background: "var(--t-bg-panel)", border: "1px solid var(--t-border)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontFamily: FONT.mono, fontSize: 9, fontWeight: 700, color: "var(--t-accent)",
                            }}>
                              {msg.avatar}
                            </div>
                            <div>
                              <div className="flex items-baseline gap-2 mb-0.5">
                                <span style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 11, color: "var(--t-text)" }}>{msg.sender}</span>
                                <span style={{ fontFamily: FONT.mono, fontSize: 9, color: "var(--t-text-dim)" }}>{msg.time}</span>
                              </div>
                              {msg.type === "file" ? (
                                <a href={msg.file_url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 text-xs hover:underline"
                                  style={{ color: "var(--t-accent)", fontFamily: FONT.body }}>
                                  <Icon name="Paperclip" size={11} /> {msg.file_name}
                                </a>
                              ) : (
                                <div className="text-xs leading-relaxed" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)", maxWidth: 500 }}>{msg.text}</div>
                              )}
                            </div>
                          </div>
                        ))}
                        {adminChatMessages.length === 0 && (
                          <div className="flex items-center justify-center py-10 text-xs" style={{ color: "var(--t-text-dim)", fontFamily: FONT.body }}>
                            Нет сообщений
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2">
                      <Icon name="MessageSquare" size={32} style={{ color: "var(--t-text-dim)" }} />
                      <span style={{ fontFamily: FONT.body, fontSize: 12, color: "var(--t-text-dim)" }}>Выберите чат пользователя для просмотра</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ban Modal */}
            {adminBanModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
                <div className="w-80 mx-4 rounded-xl overflow-hidden" style={{ background: "var(--t-bg-panel)", border: "1px solid #ef4444" }}>
                  <div className="px-5 py-4 border-b" style={{ borderColor: "#ef4444", background: "color-mix(in srgb, #ef4444 10%, var(--t-bg-panel))" }}>
                    <span style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: 700, color: "#ef4444", letterSpacing: "0.1em" }}>БЛОКИРОВКА: {adminBanModal.name}</span>
                  </div>
                  <div className="px-5 py-4 flex flex-col gap-3">
                    <div>
                      <div className="text-[10px] uppercase mb-1" style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)" }}>ПРИЧИНА</div>
                      <input value={adminBanReason} onChange={e => setAdminBanReason(e.target.value)}
                        placeholder="Нарушение правил..."
                        className="w-full bg-transparent focus:outline-none text-sm px-3 py-2 rounded"
                        style={{ border: "1px solid var(--t-border)", color: "var(--t-text)", fontFamily: FONT.body, fontSize: 12 }} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase mb-1" style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)" }}>СРОК (часов, пусто = навсегда)</div>
                      <input value={adminBanHours} onChange={e => setAdminBanHours(e.target.value)} type="number" min="1"
                        placeholder="Например: 24 или 168"
                        className="w-full bg-transparent focus:outline-none text-sm px-3 py-2 rounded"
                        style={{ border: "1px solid var(--t-border)", color: "var(--t-text)", fontFamily: FONT.body, fontSize: 12 }} />
                    </div>
                  </div>
                  <div className="px-5 py-4 border-t flex gap-2 justify-end" style={{ borderColor: "var(--t-border)" }}>
                    <button onClick={() => setAdminBanModal(null)}
                      className="px-4 py-2 text-xs rounded"
                      style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)", border: "1px solid var(--t-border)" }}>
                      ОТМЕНА
                    </button>
                    <button onClick={async () => {
                        await fetch(`${API.admin}?action=ban`, {
                          method: "POST", headers: authHeaders(),
                          body: JSON.stringify({ user_id: adminBanModal.user_id, reason: adminBanReason, hours: adminBanHours ? parseInt(adminBanHours) : null }),
                        });
                        setAdminBanModal(null);
                        loadAdminUsers();
                        loadAdminBans();
                      }}
                      className="px-4 py-2 text-xs rounded flex items-center gap-1"
                      style={{ background: "#ef4444", color: "#fff", fontFamily: FONT.mono, border: "none" }}>
                      <Icon name="Ban" size={11} /> ЗАБЛОКИРОВАТЬ
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Send Message Modal */}
            {adminSendModal && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
                <div className="w-96 mx-4 rounded-xl overflow-hidden" style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)" }}>
                  <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--t-border)" }}>
                    <span style={{ fontFamily: FONT.mono, fontSize: 12, fontWeight: 700, color: "var(--t-text)", letterSpacing: "0.1em" }}>
                      СООБЩЕНИЕ → {adminSendModal.name}
                    </span>
                    <button onClick={() => setAdminSendModal(null)} style={{ color: "var(--t-text-dim)" }}><Icon name="X" size={14} /></button>
                  </div>
                  <div className="px-5 py-4">
                    <textarea value={adminSendText} onChange={e => setAdminSendText(e.target.value)}
                      placeholder="Текст сообщения..."
                      rows={4}
                      className="w-full bg-transparent focus:outline-none text-sm px-3 py-2 rounded resize-none"
                      style={{ border: "1px solid var(--t-border)", color: "var(--t-text)", fontFamily: FONT.body, fontSize: 13 }} />
                  </div>
                  <div className="px-5 py-4 border-t flex gap-2 justify-end" style={{ borderColor: "var(--t-border)" }}>
                    <button onClick={() => setAdminSendModal(null)}
                      className="px-4 py-2 text-xs rounded"
                      style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)", border: "1px solid var(--t-border)" }}>
                      ОТМЕНА
                    </button>
                    <button onClick={async () => {
                        const payload: Record<string, unknown> = { text: adminSendText };
                        if (adminSendModal.all) payload.all = true;
                        else {
                          // Найти или создать чат с пользователем
                          const chRes = await fetch(API.chats, { method: "POST", headers: authHeaders(), body: JSON.stringify({ user_id: adminSelectedUser?.id }) });
                          const chData = await chRes.json();
                          payload.chat_id = chData.chat_id;
                        }
                        await fetch(`${API.admin}?action=send`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
                        setAdminSendModal(null);
                        setAdminBroadcast("");
                        setAdminSendText("");
                      }}
                      disabled={!adminSendText.trim()}
                      className="btn-3d px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50"
                      style={{ ...btn3d("var(--t-accent)") }}>
                      <Icon name="Send" size={11} /> ОТПРАВИТЬ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-md mx-4 rounded-xl overflow-hidden" style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--t-border)" }}>
              <span style={{ ...heading3d(12), letterSpacing: "0.1em" }}>НОВАЯ ГРУППА</span>
              <button onClick={() => setShowCreateGroup(false)} style={{ color: "var(--t-text-dim)" }}><Icon name="X" size={16} /></button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4">
              <div>
                <div className="text-[10px] mb-1 uppercase tracking-widest" style={{ color: "var(--t-text-dim)", fontFamily: FONT.mono }}>НАЗВАНИЕ ГРУППЫ</div>
                <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Например: Отдел продаж"
                  className="w-full bg-transparent focus:outline-none text-sm px-3 py-2 rounded"
                  style={{ border: "1px solid var(--t-border)", color: "var(--t-text)", fontFamily: FONT.body, fontSize: 13 }} />
              </div>
              <div>
                <div className="text-[10px] mb-2 uppercase tracking-widest" style={{ color: "var(--t-text-dim)", fontFamily: FONT.mono }}>
                  УЧАСТНИКИ ({newGroupMembers.length} выбрано)
                </div>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {allUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-white/5">
                      <input type="checkbox" checked={newGroupMembers.includes(u.id)}
                        onChange={e => setNewGroupMembers(prev => e.target.checked ? [...prev, u.id] : prev.filter(x => x !== u.id))}
                        className="accent-[var(--t-accent)]" />
                      <AvatarBadge initials={u.avatar_initials} size="sm" online={u.online} avatar_url={u.avatar_url} />
                      <span style={{ fontFamily: FONT.body, fontSize: 12, color: "var(--t-text)" }}>{u.display_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t flex gap-2 justify-end" style={{ borderColor: "var(--t-border)" }}>
              <button onClick={() => setShowCreateGroup(false)}
                className="px-4 py-2 text-xs rounded"
                style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)", border: "1px solid var(--t-border)" }}>
                ОТМЕНА
              </button>
              <button onClick={createGroupChat}
                disabled={!newGroupName.trim() || newGroupMembers.length === 0}
                className="btn-3d px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50"
                style={{ ...btn3d("var(--t-accent)") }}>
                <Icon name="Users" size={12} /> СОЗДАТЬ ГРУППУ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call */}
      {incomingCall && !activeCall && (
        <>
          {/* Звук звонка через Web Audio API */}
          <IncomingCallSound />
          <div
            className="fixed z-[9998]"
            style={{
              bottom: 24, right: 24,
              width: 320,
              borderRadius: 16,
              overflow: "hidden",
              background: "linear-gradient(135deg, #0a1628 0%, #0f1f3d 100%)",
              border: "1px solid rgba(34,197,94,0.4)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.2)",
              animation: "incomingCallSlide 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            {/* Зелёная пульсирующая полоска сверху */}
            <div style={{
              height: 3,
              background: "linear-gradient(90deg, #22c55e, #16a34a, #22c55e)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s linear infinite",
            }} />

            <div className="p-4">
              {/* Аватар + имя */}
              <div className="flex items-center gap-3 mb-4">
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "linear-gradient(135deg, #22c55e, #15803d)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 700, color: "#fff",
                  fontFamily: "monospace",
                  flexShrink: 0,
                  animation: "callRing 1s ease-in-out infinite",
                  boxShadow: "0 0 0 4px rgba(34,197,94,0.2), 0 0 0 8px rgba(34,197,94,0.1)",
                }}>
                  {incomingCall.caller_avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0", fontFamily: "monospace", letterSpacing: "0.03em" }}>
                    {incomingCall.caller_name}
                  </div>
                  <div style={{ fontSize: 12, color: "#22c55e", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Icon name={incomingCall.call_type === "video" ? "Video" : "Phone"} size={11} />
                    Входящий {incomingCall.call_type === "video" ? "видеозвонок" : "аудиозвонок"}
                  </div>
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex gap-2">
                <button
                  onClick={() => answerCall(incomingCall)}
                  style={{
                    flex: 1, padding: "10px 0",
                    background: "linear-gradient(135deg, #22c55e, #16a34a)",
                    border: "none", borderRadius: 10,
                    color: "#fff", fontSize: 12, fontWeight: 700,
                    fontFamily: "monospace", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: "0 4px 12px rgba(34,197,94,0.3)",
                  }}
                >
                  <Icon name="Phone" size={14} /> Принять
                </button>
                <button
                  onClick={async () => {
                    await fetch(`${API.calls}/answer`, {
                      method: "POST", headers: authHeaders(),
                      body: JSON.stringify({ call_id: incomingCall.id, accepted: false }),
                    });
                    setIncomingCall(null);
                  }}
                  style={{
                    flex: 1, padding: "10px 0",
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    border: "none", borderRadius: 10,
                    color: "#fff", fontSize: 12, fontWeight: 700,
                    fontFamily: "monospace", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
                  }}
                >
                  <Icon name="PhoneOff" size={14} /> Отклонить
                </button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes incomingCallSlide {
              from { transform: translateX(120%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes callRing {
              0%, 100% { box-shadow: 0 0 0 4px rgba(34,197,94,0.2), 0 0 0 8px rgba(34,197,94,0.1); }
              50% { box-shadow: 0 0 0 8px rgba(34,197,94,0.25), 0 0 0 16px rgba(34,197,94,0.08); }
            }
            @keyframes shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </>
      )}

      {activeCall && (
        <CallWindow
          callType={callType}
          callTarget={callTarget}
          localStream={localStream}
          remoteStream={remoteStream}
          callDuration={callDuration}
          micMuted={micMuted}
          camOff={camOff}
          status={callStatus}
          errorMsg={callErrorMsg}
          onHangup={endCall}
          onToggleMic={toggleMic}
          onToggleCam={toggleCam}
        />
      )}

      {/* Forward File Modal */}
      {forwardFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-sm mx-4 rounded-xl overflow-hidden" style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--t-border)" }}>
              <span style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 13, color: "var(--t-text)", letterSpacing: "0.08em" }}>
                ПЕРЕСЛАТЬ {forwardFileModal.files.length > 1 ? `${forwardFileModal.files.length} ФАЙЛА` : "ФАЙЛ"}
              </span>
              <button onClick={() => setForwardFileModal(null)} style={{ color: "var(--t-text-dim)", background: "none", border: "none", cursor: "pointer" }}>
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4">
              {/* Список файлов */}
              <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                {forwardFileModal.files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "color-mix(in srgb, var(--t-accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--t-accent) 20%, transparent)" }}>
                    <Icon name="Paperclip" size={12} style={{ color: "var(--t-accent)", flexShrink: 0 }} />
                    <span style={{ fontFamily: FONT.body, fontSize: 11, color: "var(--t-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                  </div>
                ))}
              </div>
              {/* Выбор чатов */}
              <div>
                <div style={{ fontFamily: FONT.mono, fontSize: 10, color: "var(--t-text-dim)", letterSpacing: "0.1em", marginBottom: 8 }}>
                  ВЫБЕРИТЕ ЧАТЫ ({forwardChatIds.length} выбрано)
                </div>
                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                  {chats.map(ch => (
                    <label key={ch.id} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-white/5">
                      <input type="checkbox" checked={forwardChatIds.includes(ch.id)}
                        onChange={e => setForwardChatIds(prev => e.target.checked ? [...prev, ch.id] : prev.filter(x => x !== ch.id))}
                        className="accent-[var(--t-accent)]" />
                      <span style={{ fontFamily: FONT.body, fontSize: 12, color: "var(--t-text)" }}>{ch.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t flex gap-2 justify-end" style={{ borderColor: "var(--t-border)" }}>
              <button onClick={() => setForwardFileModal(null)}
                className="px-4 py-2 text-xs rounded"
                style={{ fontFamily: FONT.mono, color: "var(--t-text-dim)", border: "1px solid var(--t-border)", background: "none", cursor: "pointer" }}>
                ОТМЕНА
              </button>
              <button onClick={handleForwardFile}
                disabled={forwardChatIds.length === 0 || forwardingFile}
                className="px-4 py-2 text-xs rounded flex items-center gap-1.5 disabled:opacity-50"
                style={{ ...btn3d("var(--t-accent)") }}>
                {forwardingFile ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="Forward" size={12} />}
                ПЕРЕСЛАТЬ {forwardChatIds.length > 0 ? `→ ${forwardChatIds.length} чат(а)` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <CameraModal
          onClose={() => setShowCamera(false)}
          onPhoto={(file) => {
            setShowCamera(false);
            handleFileUpload(file);
          }}
        />
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