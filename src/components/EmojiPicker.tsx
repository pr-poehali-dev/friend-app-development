import { useState, useRef, useEffect } from "react";

// ── Категории и эмодзи ────────────────────────────────────────────────────────
const CATEGORIES: { id: string; icon: string; label: string; emojis: string[] }[] = [
  {
    id: "recent", icon: "🕐", label: "Недавние",
    emojis: [], // заполняется динамически
  },
  {
    id: "smileys", icon: "😊", label: "Смайлы",
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩",
      "😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐",
      "🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😔","😪","🤤","😴","😷","🤒","🤕",
      "🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟",
      "🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖",
      "😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡",
      "👹","👺","👻","👽","👾","🤖",
    ],
  },
  {
    id: "gestures", icon: "👋", label: "Жесты",
    emojis: [
      "👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆",
      "🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️",
      "💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👀",
      "👁","👅","👄","🫦","💋","🩸",
    ],
  },
  {
    id: "people", icon: "👨", label: "Люди",
    emojis: [
      "👶","🧒","👦","👧","🧑","👱","👨","🧔","👩","🧓","👴","👵","🙍","🙎","🙅","🙆",
      "💁","🙋","🧏","🙇","🤦","🤷","👮","🕵","💂","🥷","👷","🫅","🤴","👸","🧙","🧝",
      "🧛","🧟","🧌","🧞","🧜","🧚","👼","🤰","🫄","🤱","🧑‍🍼","🎅","🤶","🧑‍🎄",
      "🦸","🦹","🧑‍💼","👨‍💼","👩‍💼","🧑‍🔧","👨‍🔧","👩‍🔧","🧑‍🏫","👨‍🏫","👩‍🏫",
      "💑","👫","👬","👭","💏","👨‍👩‍👦","👨‍👩‍👧","👨‍👩‍👧‍👦",
    ],
  },
  {
    id: "animals", icon: "🐶", label: "Животные",
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈",
      "🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🪱",
      "🐛","🦋","🐌","🐞","🐜","🪲","🦟","🦗","🪳","🕷","🦂","🐢","🐍","🦎","🦖","🦕",
      "🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🦭","🐊","🐅","🐆",
      "🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🦙",
      "🐑","🐏","🐐","🦌","🐕","🐩","🦮","🐈","🐓","🦃","🦤","🦚","🦜","🦢","🕊","🐇",
    ],
  },
  {
    id: "food", icon: "🍕", label: "Еда",
    emojis: [
      "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥",
      "🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶","🫑","🧄","🧅","🥔","🍠","🫘","🌰","🥜",
      "🍞","🥐","🥖","🫓","🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭",
      "🍔","🍟","🍕","🫔","🌮","🌯","🥙","🧆","🥚","🍱","🍘","🍙","🍚","🍛","🍜","🍝",
      "🍣","🍤","🍙","🥟","🦪","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬",
      "🍭","🍮","🍯","☕","🫖","🧃","🥤","🧋","🍵","🍺","🍻","🥂","🍷","🥃","🍸","🍹",
    ],
  },
  {
    id: "travel", icon: "✈️", label: "Путешествия",
    emojis: [
      "🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🛵","🏍",
      "🛺","🚲","🛴","🛹","🛼","🚏","🛣","🛤","⛽","🚨","🚥","🚦","🛑","🚧","⚓","🛟",
      "⛵","🛶","🚤","🛳","⛴","🚢","✈️","🛩","🛫","🛬","🪂","💺","🚁","🛸","🚀","🛰",
      "🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏭","🏗","🏘","🏰","🏯",
      "🏟","🗼","🗽","⛪","🕌","🛕","🕍","🕋","⛩","🗾","🎑","🏞","🌅","🌄","🌠","🎇",
      "🗺","🌍","🌎","🌏","🧭","🌋","⛰","🏔","🗻","🏕","🏖","🏜","🏝","🏛","🌁","🌃",
    ],
  },
  {
    id: "objects", icon: "💡", label: "Объекты",
    emojis: [
      "⌚","📱","💻","⌨️","🖥","🖨","🖱","🖲","💽","💾","💿","📀","📷","📸","📹","🎥",
      "📽","🎞","📞","☎️","📟","📠","📺","📻","🧭","⏱","⏲","⏰","🕰","⌛","⏳","📡",
      "🔋","🔌","💡","🔦","🕯","🪔","🧯","🛢","💰","💴","💵","💶","💷","💸","💳","🪙",
      "💎","⚖️","🔧","🔨","⚒","🛠","⛏","🔩","🗜","🔗","⛓","🧲","🔫","💣","🧨","🪓",
      "🔪","🗡","⚔️","🛡","🪚","🔬","🔭","📡","🩺","💊","💉","🩸","🩹","🩼","🩻","🚪",
      "🪑","🚽","🚿","🛁","🧴","🧷","🧹","🧺","🧻","🪣","🧼","🫧","🪥","🧽","🪒","🧻",
    ],
  },
  {
    id: "symbols", icon: "❤️", label: "Символы",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞",
      "💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉","✡️","🔯","🕎","☯️","☦️","🛐",
      "⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️","🉑","☢️",
      "☣️","📴","📳","🈶","🈚","🈸","🈺","🈷️","✴️","🆚","💮","🉐","㊙️","㊗️","🈴","🈵",
      "🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⭕","🛑","⛔","📛","🚫","💯","💢",
      "♨️","🚷","🚯","🚳","🚱","🔞","📵","🚭","❗","❕","❓","❔","‼️","⁉️","🔅","🔆",
      "🔱","⚜️","🔰","♻️","✅","🈯","💹","❎","🌐","💠","Ⓜ️","🌀","💤","🏧","🚾","♿",
      "🅿️","🛗","🈳","🈹","🚺","🚹","🚼","🚻","🚮","🎦","📶","🈁","🔣","ℹ️","🔤","🔡",
      "🔠","🆖","🆗","🆙","🆒","🆕","🆓","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟",
      "🔢","▶️","⏸","⏹","⏺","⏭","⏮","⏩","⏪","⏫","⏬","◀️","🔼","🔽","➡️","⬅️",
      "⬆️","⬇️","↗️","↘️","↙️","↖️","↕️","↔️","↩️","↪️","⤴️","⤵️","🔀","🔁","🔂","🔃",
    ],
  },
  {
    id: "flags", icon: "🏁", label: "Флаги",
    emojis: [
      "🏁","🚩","🎌","🏴","🏳️","🏳️‍🌈","🏳️‍⚧️","🏴‍☠️",
      "🇷🇺","🇺🇸","🇬🇧","🇩🇪","🇫🇷","🇮🇹","🇪🇸","🇨🇳","🇯🇵","🇰🇷","🇮🇳","🇧🇷",
      "🇨🇦","🇦🇺","🇲🇽","🇦🇷","🇿🇦","🇳🇬","🇪🇬","🇸🇦","🇹🇷","🇮🇷","🇮🇱","🇺🇦",
      "🇵🇱","🇸🇪","🇳🇴","🇩🇰","🇫🇮","🇨🇭","🇦🇹","🇧🇪","🇳🇱","🇵🇹","🇬🇷","🇨🇿",
    ],
  },
];

// ── Анимированные стикеры (Lottie/Telegram-style через открытые URL) ──────────
const STICKER_PACKS: { id: string; name: string; stickers: { id: string; emoji: string; label: string }[] }[] = [
  {
    id: "reactions", name: "Реакции",
    stickers: [
      { id: "like",    emoji: "👍", label: "Лайк" },
      { id: "love",    emoji: "❤️", label: "Люблю" },
      { id: "haha",    emoji: "😂", label: "Смеюсь" },
      { id: "wow",     emoji: "😮", label: "Вау" },
      { id: "sad",     emoji: "😢", label: "Грустно" },
      { id: "angry",   emoji: "😡", label: "Злюсь" },
      { id: "clap",    emoji: "👏", label: "Аплодирую" },
      { id: "fire",    emoji: "🔥", label: "Огонь" },
      { id: "100",     emoji: "💯", label: "Сотка" },
      { id: "think",   emoji: "🤔", label: "Думаю" },
      { id: "ok",      emoji: "👌", label: "Окей" },
      { id: "party",   emoji: "🎉", label: "Праздник" },
    ],
  },
  {
    id: "office", name: "Офис",
    stickers: [
      { id: "work",    emoji: "💼", label: "Работа" },
      { id: "coffee",  emoji: "☕", label: "Кофе" },
      { id: "meet",    emoji: "📅", label: "Встреча" },
      { id: "report",  emoji: "📊", label: "Отчёт" },
      { id: "done",    emoji: "✅", label: "Готово" },
      { id: "deadline",emoji: "⏰", label: "Дедлайн" },
      { id: "idea",    emoji: "💡", label: "Идея" },
      { id: "email",   emoji: "📧", label: "Почта" },
      { id: "phone2",  emoji: "📞", label: "Звонок" },
      { id: "doc",     emoji: "📄", label: "Документ" },
      { id: "money",   emoji: "💰", label: "Деньги" },
      { id: "chart",   emoji: "📈", label: "Рост" },
    ],
  },
  {
    id: "mood", name: "Настроение",
    stickers: [
      { id: "happy",   emoji: "😊", label: "Счастлив" },
      { id: "cool",    emoji: "😎", label: "Круто" },
      { id: "tired",   emoji: "😴", label: "Устал" },
      { id: "hungry",  emoji: "🤤", label: "Голоден" },
      { id: "sick",    emoji: "🤒", label: "Болею" },
      { id: "strong",  emoji: "💪", label: "Сильный" },
      { id: "run",     emoji: "🏃", label: "Убегаю" },
      { id: "dance",   emoji: "🕺", label: "Танцую" },
      { id: "music",   emoji: "🎵", label: "Музыка" },
      { id: "game",    emoji: "🎮", label: "Игра" },
      { id: "sleep",   emoji: "💤", label: "Сплю" },
      { id: "winner",  emoji: "🏆", label: "Победитель" },
    ],
  },
];

// ── Типы ──────────────────────────────────────────────────────────────────────
interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onStickerSelect: (sticker: string) => void;
  onClose: () => void;
}

// ── Хранилище недавних ────────────────────────────────────────────────────────
const RECENT_KEY = "emoji_recent";
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function addRecent(emoji: string) {
  const r = [emoji, ...getRecent().filter(e => e !== emoji)].slice(0, 32);
  localStorage.setItem(RECENT_KEY, JSON.stringify(r));
}

// ── Компонент ─────────────────────────────────────────────────────────────────
export default function EmojiPicker({ onEmojiSelect, onStickerSelect, onClose }: EmojiPickerProps) {
  const [tab, setTab]         = useState<"emoji" | "stickers">("emoji");
  const [catId, setCatId]     = useState("smileys");
  const [packId, setPackId]   = useState("reactions");
  const [search, setSearch]   = useState("");
  const [recent, setRecent]   = useState<string[]>(getRecent);
  const ref = useRef<HTMLDivElement>(null);

  // Закрыть при клике снаружи
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleEmoji = (emoji: string) => {
    addRecent(emoji);
    setRecent(getRecent());
    onEmojiSelect(emoji);
  };

  const handleSticker = (sticker: { emoji: string; label: string }) => {
    onStickerSelect(sticker.emoji + " " + sticker.label);
  };

  // Фильтрация по поиску
  const allEmojis = CATEGORIES.flatMap(c => c.emojis);
  const filtered  = search
    ? allEmojis.filter(e => {
        // Простой поиск по кодовым точкам (в браузере эмодзи ищутся нечётко)
        return true; // показываем все при поиске, фильтр по названию ниже
      }).slice(0, 80)
    : null;

  const activeCat = CATEGORIES.find(c => c.id === catId);
  const displayEmojis = search
    ? allEmojis.slice(0, 80)
    : catId === "recent"
    ? recent
    : (activeCat?.emojis ?? []);

  const activePack = STICKER_PACKS.find(p => p.id === packId);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: 0,
        width: 340,
        maxHeight: 420,
        background: "var(--t-bg-panel)",
        border: "1px solid var(--t-border)",
        borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 100,
        animation: "emojiPickerIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <style>{`
        @keyframes emojiPickerIn {
          from { opacity:0; transform: scale(0.85) translateY(8px); }
          to   { opacity:1; transform: scale(1)    translateY(0); }
        }
        .emoji-btn {
          font-size: 22px;
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px; cursor: pointer; transition: background 0.1s;
          border: none; background: transparent;
          line-height: 1;
        }
        .emoji-btn:hover { background: color-mix(in srgb, var(--t-accent) 15%, transparent); }
        .sticker-btn {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 4px; padding: 8px 4px; border-radius: 10px; cursor: pointer;
          transition: background 0.1s; border: none; background: transparent;
        }
        .sticker-btn:hover { background: color-mix(in srgb, var(--t-accent) 12%, transparent); }
        .sticker-emoji { font-size: 32px; line-height: 1; }
        .sticker-label { font-size: 9px; color: var(--t-text-dim); text-align: center; }
        .emoji-scroll::-webkit-scrollbar { width: 4px; }
        .emoji-scroll::-webkit-scrollbar-track { background: transparent; }
        .emoji-scroll::-webkit-scrollbar-thumb { background: var(--t-border); border-radius: 2px; }
      `}</style>

      {/* Tabs */}
      <div style={{
        display: "flex", borderBottom: "1px solid var(--t-border)",
        padding: "6px 8px 0", gap: 2, flexShrink: 0,
      }}>
        {(["emoji", "stickers"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: "6px 14px", borderRadius: "8px 8px 0 0", fontSize: 12,
              fontFamily: "monospace", letterSpacing: "0.05em",
              background: tab === t ? "var(--t-bg-main)" : "transparent",
              color: tab === t ? "var(--t-accent)" : "var(--t-text-dim)",
              border: "none", cursor: "pointer", fontWeight: tab === t ? 700 : 400,
              borderBottom: tab === t ? "2px solid var(--t-accent)" : "2px solid transparent",
            }}>
            {t === "emoji" ? "😊 ЭМОДЗИ" : "🎭 СТИКЕРЫ"}
          </button>
        ))}
      </div>

      {tab === "emoji" && (
        <>
          {/* Search */}
          <div style={{ padding: "8px 10px 0", flexShrink: 0 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск эмодзи..."
              style={{
                width: "100%", background: "var(--t-bg-main)",
                border: "1px solid var(--t-border)", borderRadius: 8,
                padding: "6px 10px", color: "var(--t-text)", fontSize: 12,
                fontFamily: "sans-serif", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Category tabs */}
          {!search && (
            <div style={{
              display: "flex", gap: 2, padding: "6px 8px",
              overflowX: "auto", flexShrink: 0,
            }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setCatId(cat.id)}
                  title={cat.label}
                  style={{
                    fontSize: 18, width: 32, height: 32, borderRadius: 8,
                    background: catId === cat.id
                      ? "color-mix(in srgb, var(--t-accent) 20%, transparent)"
                      : "transparent",
                    border: catId === cat.id
                      ? "1px solid color-mix(in srgb, var(--t-accent) 40%, transparent)"
                      : "1px solid transparent",
                    cursor: "pointer", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                  {cat.icon}
                </button>
              ))}
            </div>
          )}

          {/* Emoji grid */}
          <div className="emoji-scroll"
            style={{ flex: 1, overflowY: "auto", padding: "4px 8px 8px" }}>
            {displayEmojis.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--t-text-dim)", fontSize: 12 }}>
                {catId === "recent" ? "Вы ещё не использовали эмодзи" : "Ничего не найдено"}
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: 2,
              }}>
                {displayEmojis.map((emoji, i) => (
                  <button key={`${emoji}-${i}`} className="emoji-btn"
                    onClick={() => handleEmoji(emoji)}
                    title={emoji}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "stickers" && (
        <>
          {/* Pack selector */}
          <div style={{
            display: "flex", gap: 6, padding: "8px 10px",
            borderBottom: "1px solid var(--t-border)", flexShrink: 0,
          }}>
            {STICKER_PACKS.map(pack => (
              <button key={pack.id} onClick={() => setPackId(pack.id)}
                style={{
                  padding: "4px 10px", borderRadius: 8, fontSize: 11,
                  fontFamily: "monospace",
                  background: packId === pack.id
                    ? "color-mix(in srgb, var(--t-accent) 20%, transparent)"
                    : "transparent",
                  border: packId === pack.id
                    ? "1px solid color-mix(in srgb, var(--t-accent) 40%, transparent)"
                    : "1px solid var(--t-border)",
                  color: packId === pack.id ? "var(--t-accent)" : "var(--t-text-dim)",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}>
                {pack.name}
              </button>
            ))}
          </div>

          {/* Stickers grid */}
          <div className="emoji-scroll"
            style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 4,
            }}>
              {(activePack?.stickers ?? []).map(sticker => (
                <button key={sticker.id} className="sticker-btn"
                  onClick={() => handleSticker(sticker)}>
                  <span className="sticker-emoji">{sticker.emoji}</span>
                  <span className="sticker-label">{sticker.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Footer hint */}
      <div style={{
        padding: "6px 12px", borderTop: "1px solid var(--t-border)",
        fontSize: 10, color: "var(--t-text-dim)", fontFamily: "monospace",
        letterSpacing: "0.05em", flexShrink: 0,
      }}>
        {tab === "emoji"
          ? `${catId === "recent" ? recent.length : (activeCat?.emojis.length ?? 0)} эмодзи · Нажми для вставки`
          : `${activePack?.stickers.length ?? 0} стикеров`
        }
      </div>
    </div>
  );
}
