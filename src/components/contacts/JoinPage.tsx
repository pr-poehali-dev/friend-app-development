import { useState, useEffect } from "react";
import { FONT, btn3d, card3d, heading3d } from "@/styles/theme3d";
import Icon from "@/components/ui/icon";

interface Props {
  code: string;
  apiUrl: string;
  sessionId: string | null;
  onJoined: () => void;
  onLogin: () => void;
}

interface InviteInfo {
  code: string;
  label: string | null;
  creator: { display_name: string; organization: string | null; avatar_initials: string };
  used_count: number;
}

export default function JoinPage({ code, apiUrl, sessionId, onJoined, onLogin }: Props) {
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiUrl}/invite/${code}`);
        const data = await res.json();
        if (res.ok) setInfo(data);
        else setError(data.error || "Ссылка недействительна");
      } catch { setError("Ошибка загрузки"); }
      setLoading(false);
    };
    load();
  }, [code]);

  const handleJoin = async () => {
    if (!sessionId) { onLogin(); return; }
    setJoining(true); setError("");
    try {
      const res = await fetch(`${apiUrl}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.ok) { setDone(true); setTimeout(onJoined, 2000); }
      else setError(data.error || "Ошибка");
    } catch { setError("Ошибка соединения"); }
    setJoining(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--t-bg-deep)" }}>
      <div className="w-full max-w-sm" style={{ ...card3d(), padding: 0, overflow: "hidden" }}>
        <div className="p-6 text-center border-b" style={{ borderColor: "var(--t-border)", background: "color-mix(in srgb, var(--t-accent) 8%, var(--t-bg-card))" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "var(--t-accent)", boxShadow: "0 0 20px color-mix(in srgb, var(--t-accent) 50%, transparent)" }}>
            <Icon name="UserPlus" size={28} style={{ color: "#fff" }} />
          </div>
          <p className="text-[11px] mb-1" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)", letterSpacing: "0.08em" }}>ПРИГЛАШЕНИЕ</p>
          <h1 style={{ ...heading3d(20), letterSpacing: "0.08em" }}>Присоединиться</h1>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader" size={28} className="animate-spin" style={{ color: "var(--t-accent)" }} />
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <Icon name="AlertCircle" size={32} className="mx-auto mb-2" style={{ color: "var(--t-danger)" }} />
              <p className="text-sm" style={{ fontFamily: FONT.body, color: "var(--t-danger)" }}>{error}</p>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <Icon name="CheckCircle" size={40} className="mx-auto mb-3" style={{ color: "#22c55e" }} />
              <p className="text-sm font-medium mb-1" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>Вы добавлены!</p>
              <p className="text-xs" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>Переходим в приложение...</p>
            </div>
          ) : info ? (
            <>
              <div className="flex items-center gap-3 p-4 rounded-lg mb-4" style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--t-accent)", fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: FONT.heading }}>
                  {info.creator.avatar_initials}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>
                    {info.creator.display_name}
                  </p>
                  {info.creator.organization && (
                    <p className="text-[11px]" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{info.creator.organization}</p>
                  )}
                </div>
              </div>

              {info.label && (
                <p className="text-xs text-center mb-4" style={{ fontFamily: FONT.body, color: "var(--t-text-muted)" }}>
                  {info.label}
                </p>
              )}

              <p className="text-xs text-center mb-5" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>
                Нажмите кнопку, чтобы добавиться в список контактов этого пользователя и получить возможность общаться, звонить и видеозванивать.
              </p>

              {error && <p className="text-[11px] text-center mb-3" style={{ color: "var(--t-danger)", fontFamily: FONT.body }}>{error}</p>}

              <button onClick={handleJoin} disabled={joining}
                className="btn-3d w-full py-3 text-sm flex items-center justify-center gap-2"
                style={{ ...btn3d("var(--t-accent)"), opacity: joining ? 0.7 : 1 }}>
                {joining ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name="UserPlus" size={16} />}
                {sessionId ? "ПРИСОЕДИНИТЬСЯ" : "ВОЙТИ И ПРИСОЕДИНИТЬСЯ"}
              </button>

              <p className="text-[10px] text-center mt-3" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>
                Уже перешли: {info.used_count}
              </p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
