import { useEffect, useState } from "react";
import { FONT } from "@/styles/theme3d";
import Icon from "@/components/ui/icon";

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

interface ToastItem extends AppNotification {
  visible: boolean;
}

interface Props {
  notifications: AppNotification[];
  onDismiss: (ids: number[]) => void;
  onGoToContacts?: () => void;
}

export default function NotificationToast({ notifications, onDismiss, onGoToContacts }: Props) {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    if (!notifications.length) return;
    const newItems = notifications.map(n => ({ ...n, visible: true }));
    setItems(prev => {
      const existingIds = new Set(prev.map(i => i.id));
      const fresh = newItems.filter(n => !existingIds.has(n.id));
      return [...prev, ...fresh];
    });
    // Автоскрытие через 6 секунд
    const timer = setTimeout(() => {
      const ids = newItems.map(n => n.id);
      setItems(prev => prev.map(i => ids.includes(i.id) ? { ...i, visible: false } : i));
      setTimeout(() => {
        setItems(prev => prev.filter(i => !ids.includes(i.id)));
        onDismiss(ids);
      }, 400);
    }, 6000);
    return () => clearTimeout(timer);
  }, [notifications]);

  const dismiss = (id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, visible: false } : i));
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id));
      onDismiss([id]);
    }, 400);
  };

  const iconMap: Record<string, string> = {
    invite_join: "UserCheck",
    info: "Info",
    warning: "AlertTriangle",
  };

  if (!items.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 340,
        width: "100%",
        pointerEvents: "none",
      }}
    >
      {items.map(item => (
        <div
          key={item.id}
          style={{
            background: "var(--t-bg-card)",
            border: "1px solid color-mix(in srgb, var(--t-accent) 40%, var(--t-border))",
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px color-mix(in srgb, var(--t-accent) 20%, transparent)",
            padding: "12px 14px",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            pointerEvents: "all",
            transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
            opacity: item.visible ? 1 : 0,
            transform: item.visible ? "translateX(0) scale(1)" : "translateX(40px) scale(0.95)",
          }}
        >
          {/* Иконка / аватар */}
          {item.type === "invite_join" && item.data?.avatar_initials ? (
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "var(--t-accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT.heading, fontWeight: 700, fontSize: 13, color: "#fff",
              boxShadow: "0 0 12px color-mix(in srgb, var(--t-accent) 40%, transparent)",
            }}>
              {String(item.data.avatar_initials)}
            </div>
          ) : (
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "color-mix(in srgb, var(--t-accent) 18%, var(--t-bg-panel))",
              border: "1px solid color-mix(in srgb, var(--t-accent) 30%, var(--t-border))",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 12px color-mix(in srgb, var(--t-accent) 25%, transparent)",
            }}>
              <Icon name={iconMap[item.type] || "Bell"} size={18} style={{ color: "var(--t-accent)" }} />
            </div>
          )}

          {/* Текст */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: FONT.heading, fontWeight: 700, fontSize: 12,
              color: "var(--t-text)", letterSpacing: "0.05em", marginBottom: 3,
            }}>
              {item.title}
            </p>
            {item.body && (
              <p style={{
                fontFamily: FONT.body, fontSize: 11.5,
                color: "var(--t-text-muted)", lineHeight: 1.5,
              }}>
                {item.body}
              </p>
            )}
            <p style={{
              fontFamily: FONT.mono, fontSize: 10,
              color: "var(--t-text-dim)", marginTop: 4,
            }}>
              {new Date(item.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </p>
            {item.type === "invite_join" && onGoToContacts && (
              <button
                onClick={() => { onGoToContacts(); dismiss(item.id); }}
                style={{
                  marginTop: 8, padding: "4px 10px", borderRadius: 6, fontSize: 10,
                  fontFamily: FONT.heading, fontWeight: 700, letterSpacing: "0.06em",
                  background: "color-mix(in srgb, var(--t-accent) 20%, var(--t-bg-panel))",
                  border: "1px solid color-mix(in srgb, var(--t-accent) 40%, var(--t-border))",
                  color: "var(--t-accent)", cursor: "pointer",
                }}
              >
                ПЕРЕЙТИ В КОНТАКТЫ
              </button>
            )}
          </div>

          {/* Закрыть */}
          <button
            onClick={() => dismiss(item.id)}
            style={{
              flexShrink: 0, color: "var(--t-text-dim)", cursor: "pointer",
              background: "none", border: "none", padding: 2,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--t-text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--t-text-dim)")}
          >
            <Icon name="X" size={14} />
          </button>

          {/* Прогресс-бар */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
            borderRadius: "0 0 14px 14px",
            background: "color-mix(in srgb, var(--t-accent) 30%, transparent)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              background: "var(--t-accent)",
              animation: item.visible ? "notifProgress 6s linear forwards" : "none",
            }} />
          </div>
        </div>
      ))}

      <style>{`
        @keyframes notifProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}