import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const API = {
  auth: "https://functions.poehali.dev/564d45d3-b0f8-406f-8586-18104dbab924",
  chats: "https://functions.poehali.dev/871abe69-bab0-4421-9d49-eac8a87cbbab",
  messages: "https://functions.poehali.dev/3a4d8e8d-6ec2-41f4-8084-57c7800b94a3",
  profile: "https://functions.poehali.dev/eb1e5ec8-553a-4b79-a005-3fa365d9667b",
  avatar: "https://functions.poehali.dev/164ba4b4-9b9c-4668-8ca1-0bf6fbcbf6ab",
};

type Section = "chats" | "contacts" | "calls" | "video" | "files" | "bots" | "settings" | "analytics";

interface User {
  id: number;
  username: string;
  display_name: string;
  position?: string;
  department?: string;
  phone?: string;
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
  time: string;
  sender_id: number;
  sender_name: string;
  sender_avatar: string;
  own: boolean;
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

// ============ SMS AUTH SCREEN ============
type AuthStep = "phone" | "code" | "register";

function LoginScreen({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [displayName, setDisplayName] = useState("");
  const [purpose, setPurpose] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const codeRefs = Array.from({ length: 6 }, () => null) as (HTMLInputElement | null)[];

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length <= 1) return `+${digits}`;
    if (digits.length <= 4) return `+${digits[0]} (${digits.slice(1)}`;
    if (digits.length <= 7) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+${digits[0]} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
    setPhone(raw);
    setError("");
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Введите корректный номер телефона");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", phone }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setError(data.message || "Подождите перед повторной отправкой");
        return;
      }
      if (!res.ok) {
        setError(data.message || "Не удалось отправить код");
        return;
      }
      setPurpose(data.purpose);
      setStep(data.purpose === "register" ? "register" : "code");
      setResendTimer(60);
      setCode(["", "", "", "", "", ""]);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (idx: number, val: string, refs: (HTMLInputElement | null)[]) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    setError("");
    if (digit && idx < 5) refs[idx + 1]?.focus();
    if (next.every(d => d !== "")) handleVerify(next, refs);
  };

  const handleCodeKey = (idx: number, e: React.KeyboardEvent, refs: (HTMLInputElement | null)[]) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) refs[idx - 1]?.focus();
  };

  const handleVerify = async (codeArr?: string[], _refs?: (HTMLInputElement | null)[]) => {
    const codeStr = (codeArr || code).join("");
    if (codeStr.length < 6) { setError("Введите 6 цифр кода"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API.auth, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", phone, code: codeStr, display_name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Неверный код");
        setCode(["", "", "", "", "", ""]);
        return;
      }
      localStorage.setItem("session_token", data.token);
      onLogin(data.user, data.token);
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim().split(" ").length < 2) {
      setError("Введите имя и фамилию");
      return;
    }
    setError("");
    setStep("code");
    setResendTimer(60);
  };

  const formattedPhone = formatPhone(phone);
  const codeComplete = code.every(d => d !== "");

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "#080f1a" }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 flex-col justify-between p-10 relative overflow-hidden border-r border-[#1a2332]">
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at 30% 50%, rgba(74,158,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(34,197,94,0.04) 0%, transparent 50%)"
        }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(#4a9eff 1px, transparent 1px), linear-gradient(90deg, #4a9eff 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-sm bg-[#4a9eff] flex items-center justify-center">
              <span className="text-[#080f1a] font-bold text-base">Д</span>
            </div>
            <span className="text-sm font-semibold text-[#e2e8f0] tracking-wide">Друг</span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-[#e2e8f0] leading-snug mb-4">
              Корпоративный<br />мессенджер
            </h1>
            <p className="text-sm text-[#4a5568] leading-relaxed">
              Безопасная связь для вашей команды. Чаты, звонки, файлы и боты в одном месте.
            </p>
          </div>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            { icon: "Shield", text: "Сквозное шифрование" },
            { icon: "Zap", text: "Мгновенная доставка" },
            { icon: "Users", text: "До 10 000 пользователей" },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-sm bg-[#1a2332] border border-[#2a3548] flex items-center justify-center">
                <Icon name={f.icon} size={13} className="text-[#4a9eff]" />
              </div>
              <span className="text-xs text-[#4a5568]">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-sm bg-[#4a9eff] flex items-center justify-center">
              <span className="text-[#080f1a] font-bold text-base">Д</span>
            </div>
            <span className="text-sm font-semibold text-[#e2e8f0]">Друг</span>
          </div>

          {/* STEP: PHONE */}
          {step === "phone" && (
            <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#e2e8f0] mb-1.5">Вход или регистрация</h2>
                <p className="text-xs text-[#4a5568]">Введите номер телефона — пришлём код</p>
              </div>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest mb-2">Номер телефона</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Icon name="Smartphone" size={15} className="text-[#4a5568]" />
                    </div>
                    <input
                      type="tel"
                      value={formattedPhone}
                      onChange={handlePhoneChange}
                      placeholder="+7 (900) 000-00-00"
                      autoFocus
                      className="w-full bg-[#0d1421] border border-[#1a2332] rounded-sm pl-9 pr-4 py-3 text-sm text-[#e2e8f0] placeholder-[#2a3548] focus:outline-none focus:border-[#4a9eff] transition-colors font-mono"
                    />
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-[11px] text-[#f87171] bg-[#140a0a] border border-[#2a1010] rounded-sm px-3 py-2.5">
                    <Icon name="AlertCircle" size={12} />
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading || phone.replace(/\D/g, "").length < 10}
                  className="w-full py-3 bg-[#4a9eff] text-[#080f1a] text-sm font-semibold rounded-sm hover:bg-[#3b8fe0] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#080f1a]/30 border-t-[#080f1a] rounded-full animate-spin inline-block" />
                      Отправляем...
                    </span>
                  ) : "Получить код →"}
                </button>
              </form>
            </div>
          )}

          {/* STEP: REGISTER (name) */}
          {step === "register" && (
            <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
              <button onClick={() => setStep("phone")} className="flex items-center gap-1.5 text-xs text-[#4a5568] hover:text-[#94a3b8] mb-8 transition-colors">
                <Icon name="ArrowLeft" size={13} /> Назад
              </button>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#e2e8f0] mb-1.5">Добро пожаловать</h2>
                <p className="text-xs text-[#4a5568]">Номер <span className="font-mono text-[#94a3b8]">{formattedPhone}</span> — новый. Как вас зовут?</p>
              </div>
              <form onSubmit={handleRegisterNext} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest mb-2">Имя и Фамилия</label>
                  <input
                    value={displayName}
                    onChange={e => { setDisplayName(e.target.value); setError(""); }}
                    placeholder="Иван Петров"
                    autoFocus
                    className="w-full bg-[#0d1421] border border-[#1a2332] rounded-sm px-4 py-3 text-sm text-[#e2e8f0] placeholder-[#2a3548] focus:outline-none focus:border-[#4a9eff] transition-colors"
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-[11px] text-[#f87171] bg-[#140a0a] border border-[#2a1010] rounded-sm px-3 py-2.5">
                    <Icon name="AlertCircle" size={12} />
                    {error}
                  </div>
                )}
                <button type="submit" disabled={!displayName.trim()}
                  className="w-full py-3 bg-[#4a9eff] text-[#080f1a] text-sm font-semibold rounded-sm hover:bg-[#3b8fe0] transition-all disabled:opacity-30">
                  Продолжить →
                </button>
              </form>
            </div>
          )}

          {/* STEP: CODE */}
          {step === "code" && (
            <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
              <button onClick={() => { setStep(purpose === "register" ? "register" : "phone"); setCode(["","","","","",""]); }} className="flex items-center gap-1.5 text-xs text-[#4a5568] hover:text-[#94a3b8] mb-8 transition-colors">
                <Icon name="ArrowLeft" size={13} /> Назад
              </button>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#e2e8f0] mb-1.5">
                  {purpose === "register" ? "Подтверждение" : "Код из СМС"}
                </h2>
                <p className="text-xs text-[#4a5568]">
                  Отправили 6-значный код на <span className="font-mono text-[#94a3b8]">{formattedPhone}</span>
                </p>
              </div>

              {/* 6-digit code input */}
              <div className="flex gap-2 mb-6">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    ref={el => { codeRefs[idx] = el; }}
                    onChange={e => handleCodeChange(idx, e.target.value, codeRefs)}
                    onKeyDown={e => handleCodeKey(idx, e, codeRefs)}
                    onFocus={e => e.target.select()}
                    className={`flex-1 h-14 text-center text-xl font-mono font-semibold bg-[#0d1421] border rounded-sm focus:outline-none transition-all
                      ${digit ? "border-[#4a9eff] text-[#e2e8f0]" : "border-[#1a2332] text-[#4a5568]"}
                      ${loading ? "opacity-50" : ""}
                      focus:border-[#4a9eff]`}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-[11px] text-[#f87171] bg-[#140a0a] border border-[#2a1010] rounded-sm px-3 py-2.5 mb-4">
                  <Icon name="AlertCircle" size={12} />
                  {error}
                </div>
              )}

              <button
                onClick={() => handleVerify()}
                disabled={!codeComplete || loading}
                className="w-full py-3 bg-[#4a9eff] text-[#080f1a] text-sm font-semibold rounded-sm hover:bg-[#3b8fe0] transition-all disabled:opacity-30 mb-4"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#080f1a]/30 border-t-[#080f1a] rounded-full animate-spin inline-block" />
                    Проверяем...
                  </span>
                ) : "Войти"}
              </button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <span className="text-xs text-[#4a5568]">
                    Повторная отправка через <span className="font-mono text-[#94a3b8]">{resendTimer}с</span>
                  </span>
                ) : (
                  <button onClick={() => handleSend()} className="text-xs text-[#4a9eff] hover:text-[#7ab8ff] transition-colors">
                    Отправить код повторно
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
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

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left nav */}
      <div className="w-52 flex flex-col border-r border-[#1a2332] bg-[#0a1120] flex-shrink-0 pt-4">
        <h2 className="px-4 text-[10px] font-semibold text-[#4a5568] tracking-widest uppercase mb-3">Настройки</h2>
        {[
          { icon: "User", label: "Профиль", active: true },
          { icon: "Bell", label: "Уведомления", active: false },
          { icon: "Shield", label: "Безопасность", active: false },
          { icon: "Link", label: "Интеграции", active: false },
        ].map(item => (
          <button key={item.label} className={`flex items-center gap-3 px-4 py-2.5 text-xs transition-colors ${item.active ? "bg-[#111827] text-[#4a9eff]" : "text-[#4a5568] hover:text-[#94a3b8] hover:bg-[#0e1627]"}`}>
            <Icon name={item.icon} size={14} />{item.label}
          </button>
        ))}
        <div className="mt-auto mb-4 px-4">
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#f87171] hover:bg-[#1a1020] rounded-sm transition-colors border border-transparent hover:border-[#3a1520]">
            <Icon name="LogOut" size={13} /> Выйти
          </button>
        </div>
      </div>

      {/* Profile form */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <h3 className="text-sm font-semibold text-[#e2e8f0] mb-6">Профиль</h3>

        {/* Avatar preview */}
        <div className="flex items-center gap-4 mb-7 p-4 bg-[#0a1120] border border-[#1a2332] rounded-sm max-w-lg">
          <label className="relative w-14 h-14 cursor-pointer group flex-shrink-0">
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
            {currentUser.avatar_url ? (
              <img src={currentUser.avatar_url} alt="avatar" className="w-14 h-14 rounded-sm object-cover border border-[#2a3548]" />
            ) : (
              <div className="w-14 h-14 rounded-sm bg-[#1a2332] border border-[#2a3548] flex items-center justify-center text-[#4a9eff] text-lg font-medium">
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
            <div className="text-sm font-medium text-[#e2e8f0]">{displayName || currentUser.display_name}</div>
            {position && <div className="text-xs text-[#4a9eff] mt-0.5">{position}</div>}
            {department && <div className="text-[11px] text-[#4a5568] mt-0.5">{department}</div>}
            <button
              type="button"
              onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
              className="text-[10px] text-[#4a9eff] hover:text-[#3b8fe0] mt-1 transition-colors"
            >
              {currentUser.avatar_url ? "Сменить фото" : "Загрузить фото"}
            </button>
            {avatarError && <div className="text-[10px] text-[#f87171] mt-1">{avatarError}</div>}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest mb-1.5">Имя и Фамилия</label>
              <input
                value={displayName}
                onChange={e => { setDisplayName(e.target.value); setError(""); setSuccess(false); }}
                placeholder="Иван Петров"
                className="w-full bg-[#111827] border border-[#1a2332] rounded-sm px-3 py-2 text-xs text-[#e2e8f0] placeholder-[#2a3548] focus:outline-none focus:border-[#4a9eff] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest mb-1.5">Должность</label>
              <input
                value={position}
                onChange={e => { setPosition(e.target.value); setSuccess(false); }}
                placeholder="Менеджер"
                className="w-full bg-[#111827] border border-[#1a2332] rounded-sm px-3 py-2 text-xs text-[#e2e8f0] placeholder-[#2a3548] focus:outline-none focus:border-[#4a9eff] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest mb-1.5">Отдел</label>
              <input
                value={department}
                onChange={e => { setDepartment(e.target.value); setSuccess(false); }}
                placeholder="Продажи"
                className="w-full bg-[#111827] border border-[#1a2332] rounded-sm px-3 py-2 text-xs text-[#e2e8f0] placeholder-[#2a3548] focus:outline-none focus:border-[#4a9eff] transition-colors"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest mb-1.5">Телефон</label>
              <input
                value={currentUser.phone || ""}
                readOnly
                className="w-full bg-[#0a1120] border border-[#1a2332] rounded-sm px-3 py-2 text-xs text-[#4a5568] font-mono cursor-not-allowed"
              />
              <p className="mt-1 text-[10px] text-[#2a3548]">Номер телефона изменить нельзя</p>
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
              className="px-5 py-2 bg-[#4a9eff] text-[#080f1a] text-xs font-semibold rounded-sm hover:bg-[#3b8fe0] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                className="px-4 py-2 text-xs text-[#4a5568] hover:text-[#94a3b8] transition-colors"
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ MAIN APP ============
export default function App() {
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
      <div className="flex h-screen w-screen bg-[#0d1421] items-center justify-center">
        <div className="text-[#4a5568] text-xs">Загрузка...</div>
      </div>
    );
  }

  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="flex h-screen w-screen bg-[#0d1421] text-[#e2e8f0] overflow-hidden" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Sidebar */}
      <nav className="flex flex-col items-center py-4 w-16 bg-[#080f1a] border-r border-[#1a2332] gap-1 flex-shrink-0">
        <div className="mb-4">
          <div className="w-9 h-9 rounded-sm bg-[#4a9eff] flex items-center justify-center">
            <span className="text-[#080f1a] font-semibold text-sm">Д</span>
          </div>
        </div>
        {navItems.map(item => (
          <button key={item.id} onClick={() => setSection(item.id)} title={item.label}
            className={`w-11 h-11 rounded-sm flex flex-col items-center justify-center gap-0.5 transition-all duration-150
              ${section === item.id ? "bg-[#1a2332] text-[#4a9eff]" : "text-[#4a5568] hover:text-[#94a3b8] hover:bg-[#111827]"}`}>
            <Icon name={item.icon} size={18} />
            <span className="text-[9px] font-medium">{item.label}</span>
          </button>
        ))}
        <div className="mt-auto flex flex-col items-center gap-1">
          {bottomNav.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)} title={item.label}
              className={`w-11 h-11 rounded-sm flex flex-col items-center justify-center gap-0.5 transition-all duration-150
                ${section === item.id ? "bg-[#1a2332] text-[#4a9eff]" : "text-[#4a5568] hover:text-[#94a3b8] hover:bg-[#111827]"}`}>
              <Icon name={item.icon} size={18} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          ))}
          <div className="w-11 h-px bg-[#1a2332] my-1" />
          <div
            title={currentUser.display_name}
            className="w-9 h-9 rounded-sm bg-[#1a2332] border border-[#2a3548] flex items-center justify-center text-[#4a9eff] text-xs font-medium cursor-pointer hover:border-[#4a9eff] transition-colors"
          >
            {currentUser.avatar_initials}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* CHATS */}
        {section === "chats" && (
          <>
            <div className="w-72 flex flex-col border-r border-[#1a2332] bg-[#0a1120] flex-shrink-0">
              <div className="px-4 pt-4 pb-3 border-b border-[#1a2332]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-[#e2e8f0] tracking-widest uppercase">Чаты</h2>
                  {loadingChats && <div className="w-3 h-3 border border-[#4a9eff] border-t-transparent rounded-full animate-spin" />}
                </div>
                <div className="relative">
                  <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Поиск..."
                    className="w-full bg-[#111827] border border-[#1a2332] rounded-sm pl-7 pr-3 py-1.5 text-xs text-[#94a3b8] placeholder-[#4a5568] focus:outline-none focus:border-[#4a9eff] transition-colors" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredChats.map(chat => (
                  <button key={chat.id} onClick={() => setActiveChat(chat)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-[#0d1421] text-left transition-all duration-150
                      ${activeChat?.id === chat.id ? "bg-[#111827]" : "hover:bg-[#0e1627]"}`}>
                    <AvatarBadge initials={chat.avatar} online={chat.type === "personal" ? chat.online : undefined} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-[#e2e8f0] truncate">{chat.name}</span>
                        <span className="text-[10px] text-[#4a5568] ml-2 flex-shrink-0">{chat.last_time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#4a5568] truncate">{chat.last_message}</span>
                        {chat.unread > 0 && (
                          <span className="ml-2 flex-shrink-0 w-4 h-4 rounded-full bg-[#4a9eff] text-[#080f1a] text-[9px] font-semibold flex items-center justify-center">{chat.unread}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {chats.length === 0 && !loadingChats && (
                  <div className="p-4 text-xs text-[#4a5568] text-center">Нет чатов</div>
                )}
              </div>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
              {activeChat ? (
                <>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a2332] bg-[#0a1120] flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <AvatarBadge initials={activeChat.avatar} online={activeChat.type === "personal" ? activeChat.online : undefined} />
                      <div>
                        <div className="text-sm font-medium text-[#e2e8f0]">{activeChat.name}</div>
                        <div className="text-[11px] text-[#4a5568]">
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
                        <button key={i} onClick={btn.action} className="w-8 h-8 rounded-sm flex items-center justify-center text-[#4a5568] hover:text-[#94a3b8] hover:bg-[#1a2332] transition-all">
                          <Icon name={btn.icon} size={16} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-px bg-[#1a2332]" />
                      <span className="text-[10px] text-[#4a5568] font-mono">
                        {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      <div className="flex-1 h-px bg-[#1a2332]" />
                    </div>

                    {loadingMessages && messages.length === 0 && (
                      <div className="flex justify-center py-8">
                        <div className="w-5 h-5 border border-[#4a9eff] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}

                    {messages.map(msg => (
                      <div key={msg.id} className={`flex items-end gap-2 ${msg.own ? "flex-row-reverse" : ""}`}>
                        {!msg.own && <AvatarBadge initials={msg.sender_avatar || "??"} size="sm" />}
                        <div className={`max-w-[65%] flex flex-col gap-0.5 ${msg.own ? "items-end" : "items-start"}`}>
                          {!msg.own && (
                            <span className="text-[10px] text-[#4a9eff] font-medium ml-1">{msg.sender_name}</span>
                          )}
                          <div className={`rounded-sm px-3 py-2 text-xs leading-relaxed
                            ${msg.own ? "bg-[#1a3a5c] border border-[#2a4a6c] text-[#e2e8f0]" : "bg-[#111827] border border-[#1a2332] text-[#cbd5e1]"}`}>
                            {msg.type === "file" ? (
                              <div className="flex items-center gap-2.5">
                                <Icon name="FileText" size={16} className="text-[#4a9eff]" />
                                <div>
                                  <div className="font-medium text-[#e2e8f0]">{msg.file_name}</div>
                                  <div className="text-[10px] text-[#4a5568]">{msg.file_size}</div>
                                </div>
                              </div>
                            ) : msg.text}
                          </div>
                          <span className="text-[10px] text-[#4a5568] font-mono mx-1">{msg.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-5 py-3 border-t border-[#1a2332] bg-[#0a1120] flex-shrink-0">
                    <div className="flex items-center gap-2 bg-[#111827] border border-[#1a2332] rounded-sm px-3 py-2 focus-within:border-[#4a9eff] transition-colors">
                      <button className="text-[#4a5568] hover:text-[#94a3b8] transition-colors">
                        <Icon name="Paperclip" size={16} />
                      </button>
                      <input
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Написать сообщение..."
                        className="flex-1 bg-transparent text-xs text-[#e2e8f0] placeholder-[#4a5568] focus:outline-none"
                      />
                      <button className="text-[#4a5568] hover:text-[#94a3b8] transition-colors">
                        <Icon name="Smile" size={16} />
                      </button>
                      <button
                        onClick={handleSend}
                        disabled={sendingMsg || !msgInput.trim()}
                        className="w-7 h-7 bg-[#4a9eff] rounded-sm flex items-center justify-center text-[#080f1a] hover:bg-[#3b8fe0] transition-colors disabled:opacity-40"
                      >
                        <Icon name="Send" size={13} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#4a5568]">
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
        {section === "contacts" && (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-72 flex flex-col border-r border-[#1a2332] bg-[#0a1120] flex-shrink-0">
              <div className="px-4 pt-4 pb-3 border-b border-[#1a2332]">
                <h2 className="text-xs font-semibold text-[#e2e8f0] tracking-widest uppercase mb-3">Контакты</h2>
                <div className="relative">
                  <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                  <input placeholder="Поиск сотрудника..." className="w-full bg-[#111827] border border-[#1a2332] rounded-sm pl-7 pr-3 py-1.5 text-xs text-[#94a3b8] placeholder-[#4a5568] focus:outline-none focus:border-[#4a9eff]" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contacts.map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#0d1421] hover:bg-[#0e1627] cursor-pointer transition-colors">
                    <AvatarBadge initials={c.avatar_initials} online={c.online} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#e2e8f0] truncate">{c.display_name}</div>
                      <div className="text-[11px] text-[#4a5568] truncate">{c.position}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <h3 className="text-[10px] font-semibold text-[#4a5568] tracking-widest uppercase mb-4">Все сотрудники</h3>
              <div className="grid grid-cols-2 gap-3 max-w-2xl">
                {contacts.map(c => (
                  <div key={c.id} className="bg-[#0a1120] border border-[#1a2332] rounded-sm p-4 hover:border-[#2a3548] transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <AvatarBadge initials={c.avatar_initials} size="lg" online={c.online} />
                      <div>
                        <div className="text-sm font-medium text-[#e2e8f0]">{c.display_name}</div>
                        <div className="text-[11px] text-[#4a9eff]">{c.department}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#4a5568] mb-1">{c.position}</div>
                    <div className="text-[11px] font-mono text-[#4a5568]">{c.phone}</div>
                    <div className="flex gap-1.5 mt-3">
                      <button
                        onClick={() => openChatWith(c.id)}
                        className="flex-1 py-1.5 text-[10px] bg-[#1a2332] border border-[#2a3548] rounded-sm text-[#94a3b8] hover:border-[#4a9eff] hover:text-[#4a9eff] transition-colors flex items-center justify-center gap-1">
                        <Icon name="MessageSquare" size={11} /> Написать
                      </button>
                      <button
                        onClick={() => setActiveCall(true)}
                        className="flex-1 py-1.5 text-[10px] bg-[#1a2332] border border-[#2a3548] rounded-sm text-[#94a3b8] hover:border-[#22c55e] hover:text-[#22c55e] transition-colors flex items-center justify-center gap-1">
                        <Icon name="Phone" size={11} /> Звонок
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CALLS */}
        {section === "calls" && (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-80 flex flex-col border-r border-[#1a2332] bg-[#0a1120] flex-shrink-0">
              <div className="px-4 pt-4 pb-3 border-b border-[#1a2332]">
                <h2 className="text-xs font-semibold text-[#e2e8f0] tracking-widest uppercase mb-3">Звонки</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {STATIC_CALLS.map(call => (
                  <div key={call.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#0d1421] hover:bg-[#0e1627] cursor-pointer transition-colors">
                    <AvatarBadge initials={call.avatar} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#e2e8f0]">{call.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Icon
                          name={call.type === "incoming" ? "PhoneIncoming" : call.type === "outgoing" ? "PhoneOutgoing" : "PhoneMissed"}
                          size={11}
                          className={call.type === "missed" ? "text-[#f87171]" : call.type === "incoming" ? "text-[#22c55e]" : "text-[#4a9eff]"}
                        />
                        <span className="text-[10px] text-[#4a5568]">{call.time}</span>
                        {call.isVideo && <Icon name="Video" size={10} className="text-[#4a5568] ml-1" />}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#4a5568]">{call.duration}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-[#0a1120] border border-[#1a2332] flex items-center justify-center mx-auto mb-5">
                  <Icon name="Phone" size={32} className="text-[#4a5568]" />
                </div>
                <p className="text-xs text-[#4a5568] mb-5">Начать новый звонок</p>
                <button onClick={() => setActiveCall(true)} className="px-5 py-2 bg-[#22c55e] text-[#080f1a] text-xs font-medium rounded-sm hover:bg-[#16a34a] transition-colors">
                  Новый звонок
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIDEO */}
        {section === "video" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-xs">
              <div className="w-20 h-20 rounded-full bg-[#0a1120] border border-[#1a2332] flex items-center justify-center mx-auto mb-5">
                <Icon name="Video" size={32} className="text-[#4a5568]" />
              </div>
              <h3 className="text-sm font-semibold text-[#e2e8f0] mb-2">Видеозвонки</h3>
              <p className="text-xs text-[#4a5568] mb-6 leading-relaxed">Защищённые видеоконференции до 50 участников с записью и демонстрацией экрана.</p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setActiveVideo(true)} className="px-4 py-2 bg-[#4a9eff] text-[#080f1a] text-xs font-medium rounded-sm hover:bg-[#3b8fe0] transition-colors flex items-center gap-1.5">
                  <Icon name="Video" size={13} /> Начать
                </button>
                <button className="px-4 py-2 bg-[#1a2332] border border-[#2a3548] text-[#94a3b8] text-xs rounded-sm hover:border-[#4a9eff] transition-colors flex items-center gap-1.5">
                  <Icon name="Users" size={13} /> Конференция
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FILES */}
        {section === "files" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-[#1a2332] flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xs font-semibold text-[#e2e8f0] tracking-widest uppercase">Файлы</h2>
                <p className="text-xs text-[#4a5568] mt-0.5">Все файлы переписок</p>
              </div>
              <button className="px-3 py-1.5 bg-[#4a9eff] text-[#080f1a] text-xs font-medium rounded-sm hover:bg-[#3b8fe0] transition-colors flex items-center gap-1.5">
                <Icon name="Upload" size={12} /> Загрузить
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="border border-[#1a2332] rounded-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1a2332] bg-[#0a1120]">
                      {["Имя файла", "Размер", "Отправитель", "Дата", ""].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold text-[#4a5568] tracking-widest uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {STATIC_FILES.map(f => (
                      <tr key={f.id} className="border-b border-[#0d1421] hover:bg-[#0e1627] transition-colors">
                        <td className="px-4 py-3"><div className="flex items-center gap-2.5"><FileIconComp type={f.type} /><span className="text-xs text-[#e2e8f0] font-medium">{f.name}</span></div></td>
                        <td className="px-4 py-3 text-xs font-mono text-[#4a5568]">{f.size}</td>
                        <td className="px-4 py-3 text-xs text-[#94a3b8]">{f.sender}</td>
                        <td className="px-4 py-3 text-xs text-[#4a5568]">{f.date}</td>
                        <td className="px-4 py-3"><button className="text-[#4a5568] hover:text-[#4a9eff] transition-colors"><Icon name="Download" size={14} /></button></td>
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
            <div className="px-6 pt-5 pb-4 border-b border-[#1a2332] flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xs font-semibold text-[#e2e8f0] tracking-widest uppercase">Боты</h2>
                <p className="text-xs text-[#4a5568] mt-0.5">Корпоративные автоматизации</p>
              </div>
              <button className="px-3 py-1.5 bg-[#4a9eff] text-[#080f1a] text-xs font-medium rounded-sm hover:bg-[#3b8fe0] transition-colors flex items-center gap-1.5">
                <Icon name="Plus" size={12} /> Создать бота
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-3 gap-4">
                {STATIC_BOTS.map(bot => (
                  <div key={bot.id} className="bg-[#0a1120] border border-[#1a2332] rounded-sm p-4 hover:border-[#2a3548] transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-sm bg-[#1a2332] border border-[#2a3548] flex items-center justify-center text-[#4a9eff] text-xs font-medium">{bot.avatar}</div>
                        <div>
                          <div className="text-xs font-medium text-[#e2e8f0]">{bot.name}</div>
                          <div className="text-[10px] text-[#4a9eff]">{bot.category}</div>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full mt-1 ${bot.active ? "bg-[#22c55e]" : "bg-[#4a5568]"}`} />
                    </div>
                    <p className="text-[11px] text-[#4a5568] leading-relaxed mb-3">{bot.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#4a5568]">{bot.requests.toLocaleString()} запросов</span>
                      <button className="text-[10px] text-[#4a9eff] hover:text-[#7ab8ff] transition-colors">Открыть →</button>
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
            <div className="px-6 pt-5 pb-4 border-b border-[#1a2332] flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xs font-semibold text-[#e2e8f0] tracking-widest uppercase">Аналитика</h2>
                <p className="text-xs text-[#4a5568] mt-0.5">Панель администратора</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Активных пользователей", value: String(contacts.filter(c => c.online).length + 1), icon: "Users", color: "text-[#4a9eff]" },
                  { label: "Сообщений в системе", value: String(messages.length), icon: "MessageSquare", color: "text-[#22c55e]" },
                  { label: "Активных чатов", value: String(chats.length), icon: "Hash", color: "text-[#f59e0b]" },
                  { label: "Ботов запущено", value: String(STATIC_BOTS.filter(b => b.active).length), icon: "Bot", color: "text-[#a78bfa]" },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-[#0a1120] border border-[#1a2332] rounded-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-[#4a5568] uppercase tracking-wide leading-tight">{kpi.label}</span>
                      <Icon name={kpi.icon} size={14} className={kpi.color} />
                    </div>
                    <div className="text-2xl font-semibold text-[#e2e8f0] font-mono">{kpi.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#0a1120] border border-[#1a2332] rounded-sm p-4">
                <h4 className="text-xs font-semibold text-[#e2e8f0] mb-4">Пользователи</h4>
                <div className="space-y-2.5">
                  {contacts.slice(0, 5).map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-[#4a5568] w-4">{i + 1}</span>
                      <AvatarBadge initials={c.avatar_initials} size="sm" online={c.online} />
                      <div className="flex-1 text-xs text-[#e2e8f0]">{c.display_name}</div>
                      <span className="text-[11px] text-[#4a9eff]">{c.department}</span>
                      <span className={`text-[10px] ${c.online ? "text-[#22c55e]" : "text-[#4a5568]"}`}>{c.online ? "В сети" : "Не в сети"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audio Call Modal */}
      {activeCall && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0a1120] border border-[#1a2332] rounded-sm p-8 w-64 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-[#1a2332] border border-[#2a3548] flex items-center justify-center text-[#4a9eff] font-medium mx-auto mb-4">
              {activeChat?.avatar || "??"}
            </div>
            <div className="text-sm font-medium text-[#e2e8f0] mb-1">{activeChat?.name || "Звонок"}</div>
            <div className="text-xs text-[#22c55e] font-mono mb-6">Звонок...</div>
            <div className="flex justify-center gap-3">
              <button onClick={() => setMicMuted(!micMuted)} className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${micMuted ? "bg-[#f87171] border-[#f87171] text-white" : "bg-[#1a2332] border-[#2a3548] text-[#94a3b8]"}`}>
                <Icon name={micMuted ? "MicOff" : "Mic"} size={16} />
              </button>
              <button onClick={() => setActiveCall(false)} className="w-11 h-11 rounded-full bg-[#f87171] border border-[#f87171] text-white flex items-center justify-center hover:bg-[#ef4444] transition-colors">
                <Icon name="PhoneOff" size={16} />
              </button>
              <button className="w-11 h-11 rounded-full bg-[#1a2332] border border-[#2a3548] text-[#94a3b8] flex items-center justify-center hover:border-[#4a9eff] transition-colors">
                <Icon name="Volume2" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {activeVideo && (
        <div className="fixed inset-0 bg-[#050c18] flex flex-col z-50">
          <div className="flex-1 relative flex items-center justify-center bg-[#0a1120]">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-[#1a2332] border border-[#2a3548] flex items-center justify-center text-[#4a9eff] text-2xl font-medium mx-auto mb-3">
                {activeChat?.avatar || "??"}
              </div>
              <div className="text-sm text-[#4a5568]">Камера недоступна</div>
            </div>
            <div className="absolute bottom-4 right-4 w-32 h-24 bg-[#111827] border border-[#2a3548] rounded-sm flex items-center justify-center text-[#4a5568] text-xs">
              {camOff ? <Icon name="VideoOff" size={20} /> : currentUser.avatar_initials}
            </div>
            <div className="absolute top-4 left-4 bg-black/50 rounded-sm px-3 py-1.5 text-xs text-[#e2e8f0]">
              {activeChat?.name || "Видеозвонок"}
            </div>
          </div>
          <div className="flex justify-center items-center gap-3 py-4 border-t border-[#1a2332] bg-[#0a1120]">
            <button onClick={() => setMicMuted(!micMuted)} className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${micMuted ? "bg-[#f87171] border-[#f87171] text-white" : "bg-[#1a2332] border-[#2a3548] text-[#94a3b8]"}`}>
              <Icon name={micMuted ? "MicOff" : "Mic"} size={16} />
            </button>
            <button onClick={() => setCamOff(!camOff)} className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${camOff ? "bg-[#f87171] border-[#f87171] text-white" : "bg-[#1a2332] border-[#2a3548] text-[#94a3b8]"}`}>
              <Icon name={camOff ? "VideoOff" : "Video"} size={16} />
            </button>
            <button className="w-11 h-11 rounded-full bg-[#1a2332] border border-[#2a3548] text-[#94a3b8] flex items-center justify-center">
              <Icon name="Monitor" size={16} />
            </button>
            <button onClick={() => setActiveVideo(false)} className="w-12 h-12 rounded-full bg-[#f87171] border border-[#f87171] text-white flex items-center justify-center hover:bg-[#ef4444] transition-colors">
              <Icon name="PhoneOff" size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}