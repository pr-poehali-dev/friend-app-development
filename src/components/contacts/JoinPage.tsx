import { useState, useEffect } from "react";
import { FONT, btn3d, card3d, heading3d } from "@/styles/theme3d";
import Icon from "@/components/ui/icon";
import { useLang } from "@/LangContext";

interface Props {
  code: string;
  apiUrl: string;
  authUrl: string;
  sessionId: string | null;
  onJoined: (token?: string, user?: unknown) => void;
  onLogin: () => void;
}

interface InviteInfo {
  code: string;
  label: string | null;
  creator: { display_name: string; organization: string | null; avatar_initials: string };
  used_count: number;
}

export default function JoinPage({ code, apiUrl, authUrl, sessionId, onJoined, onLogin }: Props) {
  const { t } = useLang();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Режим: "choice" | "register" | "login"
  const [mode, setMode] = useState<"choice" | "register" | "login">("choice");

  // Форма регистрации
  const [regName, setRegName] = useState("");
  const [regLogin, setRegLogin] = useState("");
  const [regPassword, setRegPassword] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiUrl}?action=invite_info&code=${encodeURIComponent(code)}`);
        const data = await res.json();
        if (res.ok) setInfo(data);
        else setError(data.error || "Ссылка недействительна");
      } catch { setError("Ошибка загрузки"); }
      setLoading(false);
    };
    load();
  }, [code]);

  // Если пользователь уже залогинен — сразу принять инвайт
  const handleJoinExisting = async () => {
    if (!sessionId) { setMode("choice"); return; }
    setJoining(true); setError("");
    try {
      const res = await fetch(`${apiUrl}?action=join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.ok) { setDone(true); setTimeout(() => onJoined(), 1500); }
      else setError(data.error || "Ошибка");
    } catch { setError("Ошибка соединения"); }
    setJoining(false);
  };

  // Регистрация нового пользователя по инвайту
  const handleRegister = async () => {
    if (!regName.trim() || !regLogin.trim() || !regPassword.trim()) {
      setError("Заполните все поля"); return;
    }
    setJoining(true); setError("");
    try {
      const res = await fetch(`${authUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: regName.trim(),
          username: regLogin.trim().toLowerCase(),
          password: regPassword.trim(),
          invite_code: code,
        }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setDone(true);
        setTimeout(() => onJoined(data.token, data.user), 1500);
      } else {
        setError(data.error || "Ошибка регистрации");
      }
    } catch { setError("Ошибка соединения"); }
    setJoining(false);
  };

  const inputStyle = {
    width: "100%", background: "var(--t-bg-main)",
    border: "1px solid var(--t-border)", borderRadius: 8,
    padding: "10px 12px", color: "var(--t-text)",
    fontFamily: FONT.body, fontSize: 13, outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--t-bg-deep)" }}>
      <div className="w-full max-w-sm" style={{ ...card3d(), padding: 0, overflow: "hidden" }}>
        {/* Шапка */}
        <div className="p-6 text-center border-b" style={{
          borderColor: "var(--t-border)",
          background: "color-mix(in srgb, var(--t-accent) 8%, var(--t-bg-card))"
        }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--t-accent)", boxShadow: "0 0 20px color-mix(in srgb, var(--t-accent) 50%, transparent)" }}>
            <Icon name="UserPlus" size={28} style={{ color: "#fff" }} />
          </div>
          <p className="text-[11px] mb-1" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)", letterSpacing: "0.08em" }}>
            {t("join_label")}
          </p>
          <h1 style={{ ...heading3d(20), letterSpacing: "0.08em" }}>{t("join_title")}</h1>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader" size={28} className="animate-spin" style={{ color: "var(--t-accent)" }} />
            </div>
          ) : error && !info ? (
            <div className="text-center py-4">
              <Icon name="AlertCircle" size={32} className="mx-auto mb-2" style={{ color: "var(--t-danger)" }} />
              <p className="text-sm" style={{ fontFamily: FONT.body, color: "var(--t-danger)" }}>{error}</p>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <Icon name="CheckCircle" size={40} className="mx-auto mb-3" style={{ color: "#22c55e" }} />
              <p className="text-sm font-medium mb-1" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>
                Добро пожаловать!
              </p>
              <p className="text-xs" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>Входим в мессенджер...</p>
            </div>
          ) : info ? (
            <>
              {/* Карточка создателя инвайта */}
              <div className="flex items-center gap-3 p-3 rounded-lg mb-4" style={{
                background: "var(--t-bg-panel)", border: "1px solid var(--t-border)"
              }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--t-accent)", fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: FONT.heading }}>
                  {info.creator.avatar_initials}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>
                    {info.creator.display_name}
                  </p>
                  {info.creator.organization && (
                    <p className="text-[11px]" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>
                      {info.creator.organization}
                    </p>
                  )}
                </div>
              </div>

              {info.label && (
                <p className="text-xs text-center mb-3" style={{ fontFamily: FONT.body, color: "var(--t-text-muted)" }}>
                  {info.label}
                </p>
              )}

              {error && (
                <p className="text-[11px] text-center mb-3 p-2 rounded" style={{
                  color: "var(--t-danger)", fontFamily: FONT.body,
                  background: "color-mix(in srgb, var(--t-danger) 10%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--t-danger) 25%, transparent)",
                }}>{error}</p>
              )}

              {/* Уже есть аккаунт — сразу вступить */}
              {sessionId && mode === "choice" && (
                <div className="flex flex-col gap-2">
                  <button onClick={handleJoinExisting} disabled={joining}
                    className="btn-3d w-full py-3 text-sm flex items-center justify-center gap-2"
                    style={{ ...btn3d("var(--t-accent)") }}>
                    {joining ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="UserPlus" size={16} />}
                    Принять приглашение
                  </button>
                  <p className="text-[10px] text-center" style={{ color: "var(--t-text-dim)", fontFamily: FONT.mono }}>
                    Использований: {info.used_count}
                  </p>
                </div>
              )}

              {/* Нет аккаунта — выбор */}
              {!sessionId && mode === "choice" && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-center" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>
                    Вас приглашают в мессенджер. Создайте аккаунт или войдите.
                  </p>
                  <button onClick={() => setMode("register")}
                    className="btn-3d w-full py-3 text-sm flex items-center justify-center gap-2"
                    style={{ ...btn3d("var(--t-accent)") }}>
                    <Icon name="UserPlus" size={16} /> Зарегистрироваться
                  </button>
                  <button onClick={() => { setMode("login"); onLogin(); }}
                    className="w-full py-2.5 text-sm flex items-center justify-center gap-2 rounded-lg transition-all"
                    style={{
                      background: "transparent", border: "1px solid var(--t-border)",
                      color: "var(--t-text-dim)", fontFamily: FONT.body, cursor: "pointer",
                    }}>
                    <Icon name="LogIn" size={16} /> Уже есть аккаунт — войти
                  </button>
                </div>
              )}

              {/* Форма регистрации */}
              {!sessionId && mode === "register" && (
                <div className="flex flex-col gap-3">
                  <button onClick={() => { setMode("choice"); setError(""); }}
                    style={{ background: "none", border: "none", color: "var(--t-accent)", cursor: "pointer", fontFamily: FONT.mono, fontSize: 11, textAlign: "left" }}>
                    ← Назад
                  </button>
                  <div>
                    <div className="text-[10px] mb-1 uppercase tracking-widest" style={{ color: "var(--t-text-dim)", fontFamily: FONT.mono }}>Ваше имя</div>
                    <input value={regName} onChange={e => setRegName(e.target.value)}
                      placeholder="Иван Иванов" style={inputStyle} />
                  </div>
                  <div>
                    <div className="text-[10px] mb-1 uppercase tracking-widest" style={{ color: "var(--t-text-dim)", fontFamily: FONT.mono }}>Логин</div>
                    <input value={regLogin} onChange={e => setRegLogin(e.target.value.replace(/[^a-z0-9_]/gi, ""))}
                      placeholder="ivanov" style={inputStyle} />
                  </div>
                  <div>
                    <div className="text-[10px] mb-1 uppercase tracking-widest" style={{ color: "var(--t-text-dim)", fontFamily: FONT.mono }}>Пароль</div>
                    <input value={regPassword} onChange={e => setRegPassword(e.target.value)}
                      type="password" placeholder="Минимум 4 символа" style={inputStyle} />
                  </div>
                  <button onClick={handleRegister} disabled={joining}
                    className="btn-3d w-full py-3 text-sm flex items-center justify-center gap-2 mt-1"
                    style={{ ...btn3d("var(--t-accent)") }}>
                    {joining ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
                    Создать аккаунт и вступить
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
