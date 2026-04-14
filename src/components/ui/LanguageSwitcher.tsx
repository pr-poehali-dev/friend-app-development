import { useLang } from "@/LangContext";
import { FONT } from "@/styles/theme3d";

interface Props {
  compact?: boolean; // true = только флаг без текста (для сайдбара)
}

export default function LanguageSwitcher({ compact = false }: Props) {
  const { lang, setLang } = useLang();

  const isRu = lang === "ru";

  const toggle = () => setLang(isRu ? "en" : "ru");

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={isRu ? "Switch to English" : "Переключить на русский"}
        style={{
          width: 34, height: 20,
          borderRadius: 10,
          background: isRu
            ? "linear-gradient(90deg, #1e3a8a, #3b82f6)"
            : "linear-gradient(90deg, #b91c1c, #3b82f6)",
          border: "1px solid rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          fontSize: 9,
          fontFamily: FONT.mono,
          fontWeight: 700,
          color: "#fff",
          letterSpacing: "0.03em",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          flexShrink: 0,
          transition: "all 0.2s ease",
        }}
      >
        {isRu ? "RU" : "EN"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      title={isRu ? "Switch to English" : "Переключить на русский"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 10px",
        borderRadius: 8,
        background: "color-mix(in srgb, var(--t-accent) 10%, var(--t-bg-panel))",
        border: "1px solid color-mix(in srgb, var(--t-accent) 25%, var(--t-border))",
        cursor: "pointer",
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "color-mix(in srgb, var(--t-accent) 20%, var(--t-bg-panel))")}
      onMouseLeave={e => (e.currentTarget.style.background = "color-mix(in srgb, var(--t-accent) 10%, var(--t-bg-panel))")}
    >
      {/* Флаг */}
      <span style={{ fontSize: 14, lineHeight: 1 }}>
        {isRu ? "🇷🇺" : "🇬🇧"}
      </span>
      {/* Текущий язык */}
      <span style={{
        fontFamily: FONT.mono,
        fontWeight: 700,
        fontSize: 11,
        color: "var(--t-accent)",
        letterSpacing: "0.08em",
      }}>
        {isRu ? "RU" : "EN"}
      </span>
      {/* Стрелка */}
      <span style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        color: "var(--t-text-dim)",
      }}>
        ⇄
      </span>
      {/* Целевой язык */}
      <span style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        color: "var(--t-text-dim)",
        letterSpacing: "0.08em",
      }}>
        {isRu ? "EN" : "RU"}
      </span>
    </button>
  );
}
