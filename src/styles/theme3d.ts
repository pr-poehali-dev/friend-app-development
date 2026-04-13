// ===== ОБЩИЕ 3D СТИЛИ ДЛЯ ПРИЛОЖЕНИЯ =====
import type React from "react";

export const FONT = {
  display:  "'Orbitron', sans-serif",
  heading:  "'Rajdhani', sans-serif",
  body:     "'Space Grotesk', sans-serif",
  mono:     "'IBM Plex Mono', monospace",
};

// Карточка с 3D эффектом и подсветкой акцентом
export const card3d = (accent = "var(--t-accent)", opacity = 0.18): React.CSSProperties => ({
  background: "var(--t-bg-card)",
  border: `1px solid color-mix(in srgb, ${accent} ${Math.round(opacity * 100)}%, transparent)`,
  borderRadius: 16,
  boxShadow: `
    0 0 0 1px color-mix(in srgb, ${accent} ${Math.round(opacity * 50)}%, transparent),
    0 8px 32px rgba(0,0,0,0.5),
    0 2px 8px rgba(0,0,0,0.3),
    inset 0 1px 0 color-mix(in srgb, ${accent} 20%, transparent),
    inset 0 -1px 0 rgba(0,0,0,0.3)
  `,
  transform: "perspective(800px) rotateX(1deg)",
  backdropFilter: "blur(8px)",
});

// Кнопка 3D выпуклая
export const btn3d = (color = "var(--t-accent)"): React.CSSProperties => ({
  background: `linear-gradient(160deg, color-mix(in srgb, ${color} 130%, white), ${color} 50%, color-mix(in srgb, ${color} 70%, black))`,
  border: "none",
  borderRadius: 10,
  color: "#fff",
  fontFamily: FONT.heading,
  fontWeight: 700,
  letterSpacing: "0.06em",
  cursor: "pointer",
  boxShadow: `0 4px 0 color-mix(in srgb, ${color} 60%, black), 0 6px 16px color-mix(in srgb, ${color} 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)`,
  transform: "perspective(200px) rotateX(4deg) translateY(0)",
  transition: "all 0.12s ease",
  position: "relative" as const,
});

// Текст заголовок в 3D
export const heading3d = (size = 20): React.CSSProperties => ({
  fontFamily: FONT.heading,
  fontSize: size,
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: "var(--t-text)",
  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
  filter: "drop-shadow(0 1px 4px color-mix(in srgb, var(--t-accent) 40%, transparent))",
});

// Панель с боковой подсветкой
export const panel3d = (): React.CSSProperties => ({
  background: "var(--t-bg-main)",
  borderRight: "1px solid var(--t-border)",
  position: "relative" as const,
});

// Элемент списка с hover
export const listItem = (active: boolean): React.CSSProperties => ({
  background: active ? "var(--t-bg-active)" : "transparent",
  borderBottom: "1px solid var(--t-bg-panel)",
  transition: "all 0.15s ease",
  cursor: "pointer",
});

// Бейдж с пульсацией
export const badge3d = (): React.CSSProperties => ({
  background: "var(--t-accent)",
  color: "var(--t-bg-deep)",
  borderRadius: "50%",
  fontSize: 9,
  fontWeight: 700,
  boxShadow: "0 0 8px var(--t-accent)",
  animation: "badgePulse 2s ease-in-out infinite",
});

// Иконка живая
export const liveIcon = (delay = 0): React.CSSProperties => ({
  color: "var(--t-accent)",
  filter: `drop-shadow(0 0 4px var(--t-accent))`,
  animation: `iconLive 3s ease-in-out ${delay}s infinite`,
});

// Поле ввода
export const input3d = (): React.CSSProperties => ({
  background: "var(--t-bg-panel)",
  border: "1px solid var(--t-border)",
  borderRadius: 10,
  color: "var(--t-text)",
  fontFamily: FONT.body,
  boxShadow: "inset 0 2px 6px rgba(0,0,0,0.3)",
  transition: "all 0.2s ease",
});

// Пузырь сообщения своего
export const msgOwn = (): React.CSSProperties => ({
  background: "var(--t-msg-own-bg)",
  border: "1px solid var(--t-msg-own-br)",
  borderRadius: "16px 16px 4px 16px",
  fontFamily: FONT.body,
  fontSize: 13,
  lineHeight: 1.6,
  boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
  color: "var(--t-text)",
});

// Пузырь сообщения чужого
export const msgOther = (): React.CSSProperties => ({
  background: "var(--t-bg-card)",
  border: "1px solid var(--t-border)",
  borderRadius: "16px 16px 16px 4px",
  fontFamily: FONT.body,
  fontSize: 13,
  lineHeight: 1.6,
  boxShadow: "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)",
  color: "var(--t-text-muted)",
});