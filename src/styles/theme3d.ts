// ===== ОБЩИЕ 3D СТИЛИ ДЛЯ ПРИЛОЖЕНИЯ =====
import type React from "react";

export const FONT = {
  display:  "'Orbitron', sans-serif",
  heading:  "'Rajdhani', sans-serif",
  body:     "'Space Grotesk', sans-serif",
  mono:     "'IBM Plex Mono', monospace",
};

// Карточка с 3D эффектом — адаптивна к теме
export const card3d = (accent = "var(--t-accent)", opacity = 0.18): React.CSSProperties => ({
  background: "var(--t-bg-card)",
  border: `1px solid color-mix(in srgb, ${accent} ${Math.round(opacity * 100)}%, var(--t-border))`,
  borderRadius: 16,
  boxShadow: `
    0 4px 16px rgba(0,0,0,0.12),
    0 1px 4px rgba(0,0,0,0.08),
    inset 0 1px 0 rgba(255,255,255,0.08)
  `,
  transform: "perspective(800px) rotateX(1deg)",
});

// Кнопка 3D выпуклая — текст всегда белый, хорошо читается
export const btn3d = (color = "var(--t-accent)"): React.CSSProperties => ({
  background: `linear-gradient(160deg,
    color-mix(in srgb, ${color} 85%, white) 0%,
    ${color} 50%,
    color-mix(in srgb, ${color} 70%, black) 100%)`,
  border: `1px solid color-mix(in srgb, ${color} 60%, black)`,
  borderRadius: 10,
  color: "#ffffff",
  fontFamily: FONT.heading,
  fontWeight: 700,
  letterSpacing: "0.06em",
  cursor: "pointer",
  boxShadow: `
    0 0 0 1px color-mix(in srgb, ${color} 50%, transparent),
    0 4px 0 color-mix(in srgb, ${color} 60%, black),
    0 6px 14px color-mix(in srgb, ${color} 40%, transparent),
    inset 0 1px 0 rgba(255,255,255,0.25)
  `,
  transition: "all 0.15s ease",
  position: "relative" as const,
  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
});

// Текст заголовок — чёткий, без размытия
export const heading3d = (size = 20): React.CSSProperties => ({
  fontFamily: FONT.heading,
  fontSize: size,
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: "var(--t-text)",
  // Убираем filter/textShadow — они размывают текст
  // Используем только color через CSS-переменную
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

// Бейдж — адаптивный
export const badge3d = (): React.CSSProperties => ({
  background: "var(--t-accent)",
  color: "#ffffff",
  borderRadius: "50%",
  fontSize: 9,
  fontWeight: 700,
  boxShadow: "0 0 6px color-mix(in srgb, var(--t-accent) 60%, transparent)",
  animation: "badgePulse 2s ease-in-out infinite",
});

// Иконка живая — без размытия filter
export const liveIcon = (delay = 0): React.CSSProperties => ({
  color: "var(--t-accent)",
  animation: `iconLive 3s ease-in-out ${delay}s infinite`,
});

// Поле ввода — чёткие цвета
export const input3d = (): React.CSSProperties => ({
  background: "var(--t-bg-panel)",
  border: "1px solid var(--t-border-md)",
  borderRadius: 10,
  color: "var(--t-text)",
  fontFamily: FONT.body,
  boxShadow: "inset 0 1px 4px rgba(0,0,0,0.12)",
  transition: "all 0.2s ease",
});

// Пузырь своего сообщения — текст всегда контрастный
export const msgOwn = (): React.CSSProperties => ({
  background: "var(--t-msg-own-bg)",
  border: "1px solid var(--t-msg-own-br)",
  borderRadius: "16px 16px 4px 16px",
  fontFamily: FONT.body,
  fontSize: 13.5,
  lineHeight: 1.6,
  letterSpacing: "0.01em",
  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  color: "var(--t-text)",
  fontWeight: 400,
});

// Пузырь чужого сообщения — текст чёткий
export const msgOther = (): React.CSSProperties => ({
  background: "var(--t-bg-card)",
  border: "1px solid var(--t-border)",
  borderRadius: "16px 16px 16px 4px",
  fontFamily: FONT.body,
  fontSize: 13.5,
  lineHeight: 1.6,
  letterSpacing: "0.01em",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  color: "var(--t-text-muted)",
  fontWeight: 400,
});