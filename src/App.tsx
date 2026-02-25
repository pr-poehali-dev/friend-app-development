import { useState } from "react";
import Icon from "@/components/ui/icon";

type Section =
  | "chats"
  | "contacts"
  | "calls"
  | "video"
  | "files"
  | "bots"
  | "settings"
  | "analytics";

interface Message {
  id: number;
  from: string;
  text: string;
  time: string;
  own: boolean;
  type?: "text" | "file" | "audio";
  fileName?: string;
  fileSize?: string;
}

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  type: "personal" | "group" | "bot";
  avatar: string;
}

interface Contact {
  id: number;
  name: string;
  position: string;
  department: string;
  online: boolean;
  avatar: string;
  phone: string;
}

interface CallRecord {
  id: number;
  name: string;
  type: "incoming" | "outgoing" | "missed";
  duration: string;
  time: string;
  avatar: string;
  isVideo: boolean;
}

interface FileRecord {
  id: number;
  name: string;
  size: string;
  type: "doc" | "img" | "archive" | "audio" | "video";
  sender: string;
  date: string;
}

interface Bot {
  id: number;
  name: string;
  description: string;
  category: string;
  active: boolean;
  avatar: string;
  requests: number;
}

const CHATS: Chat[] = [
  { id: 1, name: "Алексей Морозов", lastMessage: "Отчёт по Q4 готов", time: "10:24", unread: 3, online: true, type: "personal", avatar: "АМ" },
  { id: 2, name: "Проектная группа", lastMessage: "Встреча перенесена на пятницу", time: "09:51", unread: 7, online: false, type: "group", avatar: "ПГ" },
  { id: 3, name: "Мария Белова", lastMessage: "Документы подписаны", time: "Вчера", unread: 0, online: true, type: "personal", avatar: "МБ" },
  { id: 4, name: "ИТ-отдел", lastMessage: "Обновление системы в 23:00", time: "Вчера", unread: 1, online: false, type: "group", avatar: "ИТ" },
  { id: 5, name: "HR Бот", lastMessage: "Ваш отпуск одобрен", time: "Вт", unread: 0, online: true, type: "bot", avatar: "HR" },
  { id: 6, name: "Сергей Ковалёв", lastMessage: "Принял, спасибо", time: "Пн", unread: 0, online: false, type: "personal", avatar: "СК" },
  { id: 7, name: "Совет директоров", lastMessage: "Повестка дня обновлена", time: "Пн", unread: 2, online: false, type: "group", avatar: "СД" },
];

const MESSAGES: Message[] = [
  { id: 1, from: "Алексей Морозов", text: "Добрый день, Иван. Отчёт по Q4 уже готов.", time: "10:20", own: false },
  { id: 2, from: "Я", text: "Алексей, отлично! Можешь отправить директору?", time: "10:21", own: true },
  { id: 3, from: "Алексей Морозов", text: "Конечно, сейчас пришлю файл.", time: "10:22", own: false, type: "file", fileName: "Отчёт_Q4_2025.xlsx", fileSize: "2.4 МБ" },
  { id: 4, from: "Я", text: "Получил, спасибо. Проверю и отвечу.", time: "10:23", own: true },
  { id: 5, from: "Алексей Морозов", text: "Кстати, встреча с инвесторами подтверждена на четверг в 14:00.", time: "10:24", own: false },
];

const CONTACTS: Contact[] = [
  { id: 1, name: "Алексей Морозов", position: "Финансовый директор", department: "Финансы", online: true, avatar: "АМ", phone: "+7 495 000-01-01" },
  { id: 2, name: "Мария Белова", position: "Руководитель HR", department: "Персонал", online: true, avatar: "МБ", phone: "+7 495 000-01-02" },
  { id: 3, name: "Сергей Ковалёв", position: "Технический директор", department: "ИТ", online: false, avatar: "СК", phone: "+7 495 000-01-03" },
  { id: 4, name: "Анна Петрова", position: "Главный бухгалтер", department: "Финансы", online: false, avatar: "АП", phone: "+7 495 000-01-04" },
  { id: 5, name: "Дмитрий Орлов", position: "Директор по продажам", department: "Продажи", online: true, avatar: "ДО", phone: "+7 495 000-01-05" },
  { id: 6, name: "Елена Смирнова", position: "Юрисконсульт", department: "Юридический", online: false, avatar: "ЕС", phone: "+7 495 000-01-06" },
];

const CALLS: CallRecord[] = [
  { id: 1, name: "Алексей Морозов", type: "outgoing", duration: "12:34", time: "Сегодня, 09:15", avatar: "АМ", isVideo: false },
  { id: 2, name: "Проектная группа", type: "incoming", duration: "45:02", time: "Сегодня, 08:30", avatar: "ПГ", isVideo: true },
  { id: 3, name: "Мария Белова", type: "missed", duration: "—", time: "Вчера, 17:42", avatar: "МБ", isVideo: false },
  { id: 4, name: "Сергей Ковалёв", type: "outgoing", duration: "08:15", time: "Вчера, 14:00", avatar: "СК", isVideo: true },
  { id: 5, name: "Дмитрий Орлов", type: "incoming", duration: "22:47", time: "Пн, 11:30", avatar: "ДО", isVideo: false },
];

const FILES: FileRecord[] = [
  { id: 1, name: "Отчёт_Q4_2025.xlsx", size: "2.4 МБ", type: "doc", sender: "Алексей Морозов", date: "Сегодня" },
  { id: 2, name: "Презентация_инвесторы.pptx", size: "8.7 МБ", type: "doc", sender: "Мария Белова", date: "Вчера" },
  { id: 3, name: "Схема_архитектуры.png", size: "1.2 МБ", type: "img", sender: "Сергей Ковалёв", date: "Вчера" },
  { id: 4, name: "Договор_поставки.zip", size: "4.1 МБ", type: "archive", sender: "Елена Смирнова", date: "Пн" },
  { id: 5, name: "Запись_совещания.mp3", size: "18.3 МБ", type: "audio", sender: "ИТ-отдел", date: "Пн" },
  { id: 6, name: "Демо_продукта.mp4", size: "124 МБ", type: "video", sender: "Дмитрий Орлов", date: "Вс" },
];

const BOTS: Bot[] = [
  { id: 1, name: "HR Бот", description: "Управление отпусками, больничными и кадровыми документами", category: "Персонал", active: true, avatar: "HR", requests: 1204 },
  { id: 2, name: "Финансы Бот", description: "Автоматизация счетов, актов и платёжных поручений", category: "Финансы", active: true, avatar: "ФБ", requests: 847 },
  { id: 3, name: "ИТ Поддержка", description: "Заявки в техподдержку, статус инцидентов", category: "ИТ", active: true, avatar: "ИП", requests: 2391 },
  { id: 4, name: "Новостной бот", description: "Корпоративные новости и объявления", category: "Коммуникации", active: false, avatar: "НБ", requests: 312 },
  { id: 5, name: "Аналитика GPT", description: "ИИ-анализ данных и отчётов по запросу", category: "ИИ", active: true, avatar: "АИ", requests: 589 },
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

function Avatar({ initials, size = "md", online }: { initials: string; size?: "sm" | "md" | "lg"; online?: boolean }) {
  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-12 h-12 text-base" };
  return (
    <div className="relative flex-shrink-0">
      <div className={`${sizes[size]} rounded-sm bg-[#1a2332] text-[#4a9eff] font-ibm font-medium flex items-center justify-center border border-[#2a3548] tracking-wider`}>
        {initials}
      </div>
      {online !== undefined && (
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0d1421] ${online ? "bg-[#22c55e]" : "bg-[#4a5568]"}`} />
      )}
    </div>
  );
}

function FileIcon({ type }: { type: FileRecord["type"] }) {
  const map = {
    doc: { icon: "FileText", color: "text-[#4a9eff]" },
    img: { icon: "Image", color: "text-[#22c55e]" },
    archive: { icon: "Archive", color: "text-[#f59e0b]" },
    audio: { icon: "Music", color: "text-[#a78bfa]" },
    video: { icon: "Film", color: "text-[#f87171]" },
  };
  const { icon, color } = map[type];
  return <Icon name={icon} size={20} className={color} />;
}

export default function App() {
  const [section, setSection] = useState<Section>("chats");
  const [activeChat, setActiveChat] = useState<Chat | null>(CHATS[0]);
  const [msgInput, setMsgInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCall, setActiveCall] = useState(false);
  const [activeVideo, setActiveVideo] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const filteredChats = CHATS.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen bg-[#0d1421] font-ibm text-[#e2e8f0] overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="flex flex-col items-center py-4 w-16 bg-[#080f1a] border-r border-[#1a2332] gap-1 flex-shrink-0">
        <div className="mb-4">
          <div className="w-9 h-9 rounded-sm bg-[#4a9eff] flex items-center justify-center">
            <span className="text-[#080f1a] font-ibm font-semibold text-sm">Д</span>
          </div>
        </div>

        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setSection(item.id)}
            title={item.label}
            className={`w-11 h-11 rounded-sm flex flex-col items-center justify-center gap-0.5 transition-all duration-150
              ${section === item.id
                ? "bg-[#1a2332] text-[#4a9eff]"
                : "text-[#4a5568] hover:text-[#94a3b8] hover:bg-[#111827]"
              }`}
          >
            <Icon name={item.icon} size={18} />
            <span className="text-[9px] font-medium">{item.label}</span>
          </button>
        ))}

        <div className="mt-auto flex flex-col items-center gap-1">
          {bottomNav.map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              title={item.label}
              className={`w-11 h-11 rounded-sm flex flex-col items-center justify-center gap-0.5 transition-all duration-150
                ${section === item.id
                  ? "bg-[#1a2332] text-[#4a9eff]"
                  : "text-[#4a5568] hover:text-[#94a3b8] hover:bg-[#111827]"
                }`}
            >
              <Icon name={item.icon} size={18} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          ))}
          <div className="w-11 h-px bg-[#1a2332] my-1" />
          <div className="w-9 h-9 rounded-sm bg-[#1a2332] border border-[#2a3548] flex items-center justify-center text-[#4a9eff] text-xs font-medium cursor-pointer hover:border-[#4a9eff] transition-colors">
            ИВ
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">

        {/* CHATS */}
        {section === "chats" && (
          <>
            <div className="w-72 flex flex-col border-r border-[#1a2332] bg-[#0a1120] flex-shrink-0">
              <div className="px-4 pt-4 pb-3 border-b border-[#1a2332]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-[#e2e8f0] tracking-widest uppercase">Чаты</h2>
                  <button className="w-7 h-7 rounded-sm bg-[#1a2332] flex items-center justify-center text-[#4a9eff] hover:bg-[#243048] transition-colors">
                    <Icon name="Plus" size={14} />
                  </button>
                </div>
                <div className="relative">
                  <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Поиск..."
                    className="w-full bg-[#111827] border border-[#1a2332] rounded-sm pl-7 pr-3 py-1.5 text-xs text-[#94a3b8] placeholder-[#4a5568] focus:outline-none focus:border-[#4a9eff] transition-colors"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredChats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-[#0d1421] text-left transition-all duration-150
                      ${activeChat?.id === chat.id ? "bg-[#111827]" : "hover:bg-[#0e1627]"}`}
                  >
                    <Avatar initials={chat.avatar} online={chat.type === "personal" ? chat.online : undefined} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-[#e2e8f0] truncate">{chat.name}</span>
                        <span className="text-[10px] text-[#4a5568] ml-2 flex-shrink-0">{chat.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[#4a5568] truncate">{chat.lastMessage}</span>
                        {chat.unread > 0 && (
                          <span className="ml-2 flex-shrink-0 w-4 h-4 rounded-full bg-[#4a9eff] text-[#080f1a] text-[9px] font-semibold flex items-center justify-center">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
              {activeChat ? (
                <>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a2332] bg-[#0a1120] flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <Avatar initials={activeChat.avatar} online={activeChat.type === "personal" ? activeChat.online : undefined} />
                      <div>
                        <div className="text-sm font-medium text-[#e2e8f0]">{activeChat.name}</div>
                        <div className="text-[11px] text-[#4a5568]">
                          {activeChat.type === "personal"
                            ? (activeChat.online ? "В сети" : "Не в сети")
                            : activeChat.type === "group" ? "Групповой чат" : "Бот"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[
                        { icon: "Phone", action: () => setActiveCall(true) },
                        { icon: "Video", action: () => setActiveVideo(true) },
                        { icon: "Search", action: () => {} },
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
                      <span className="text-[10px] text-[#4a5568] font-mono">25 февраля 2026</span>
                      <div className="flex-1 h-px bg-[#1a2332]" />
                    </div>
                    {MESSAGES.map(msg => (
                      <div key={msg.id} className={`flex items-end gap-2 ${msg.own ? "flex-row-reverse" : ""}`}>
                        {!msg.own && <Avatar initials={activeChat.avatar} size="sm" />}
                        <div className={`max-w-[65%] flex flex-col gap-0.5 ${msg.own ? "items-end" : "items-start"}`}>
                          {!msg.own && (
                            <span className="text-[10px] text-[#4a9eff] font-medium ml-1">{msg.from}</span>
                          )}
                          <div className={`rounded-sm px-3 py-2 text-xs leading-relaxed
                            ${msg.own
                              ? "bg-[#1a3a5c] border border-[#2a4a6c] text-[#e2e8f0]"
                              : "bg-[#111827] border border-[#1a2332] text-[#cbd5e1]"
                            }`}>
                            {msg.type === "file" ? (
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-[#0d1421] rounded-sm flex items-center justify-center">
                                  <Icon name="FileText" size={16} className="text-[#4a9eff]" />
                                </div>
                                <div>
                                  <div className="font-medium text-[#e2e8f0]">{msg.fileName}</div>
                                  <div className="text-[10px] text-[#4a5568]">{msg.fileSize}</div>
                                </div>
                                <button className="ml-1 text-[#4a9eff] hover:text-[#7ab8ff] transition-colors">
                                  <Icon name="Download" size={14} />
                                </button>
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
                        onKeyDown={e => { if (e.key === "Enter") setMsgInput(""); }}
                        placeholder="Написать сообщение..."
                        className="flex-1 bg-transparent text-xs text-[#e2e8f0] placeholder-[#4a5568] focus:outline-none"
                      />
                      <button className="text-[#4a5568] hover:text-[#94a3b8] transition-colors">
                        <Icon name="Smile" size={16} />
                      </button>
                      <button className="text-[#4a5568] hover:text-[#94a3b8] transition-colors">
                        <Icon name="Mic" size={16} />
                      </button>
                      <button
                        onClick={() => setMsgInput("")}
                        className="w-7 h-7 bg-[#4a9eff] rounded-sm flex items-center justify-center text-[#080f1a] hover:bg-[#3b8fe0] transition-colors"
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
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-[#e2e8f0] tracking-widest uppercase">Контакты</h2>
                  <button className="w-7 h-7 rounded-sm bg-[#1a2332] flex items-center justify-center text-[#4a9eff] hover:bg-[#243048]">
                    <Icon name="UserPlus" size={13} />
                  </button>
                </div>
                <div className="relative">
                  <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                  <input placeholder="Поиск сотрудника..." className="w-full bg-[#111827] border border-[#1a2332] rounded-sm pl-7 pr-3 py-1.5 text-xs text-[#94a3b8] placeholder-[#4a5568] focus:outline-none focus:border-[#4a9eff]" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {CONTACTS.map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#0d1421] hover:bg-[#0e1627] cursor-pointer transition-colors">
                    <Avatar initials={c.avatar} online={c.online} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#e2e8f0] truncate">{c.name}</div>
                      <div className="text-[11px] text-[#4a5568] truncate">{c.position}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <h3 className="text-[10px] font-semibold text-[#4a5568] tracking-widest uppercase mb-4">Все сотрудники</h3>
              <div className="grid grid-cols-2 gap-3 max-w-2xl">
                {CONTACTS.map(c => (
                  <div key={c.id} className="bg-[#0a1120] border border-[#1a2332] rounded-sm p-4 hover:border-[#2a3548] transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar initials={c.avatar} size="lg" online={c.online} />
                      <div>
                        <div className="text-sm font-medium text-[#e2e8f0]">{c.name}</div>
                        <div className="text-[11px] text-[#4a9eff]">{c.department}</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#4a5568] mb-1">{c.position}</div>
                    <div className="text-[11px] font-mono text-[#4a5568]">{c.phone}</div>
                    <div className="flex gap-1.5 mt-3">
                      <button className="flex-1 py-1.5 text-[10px] bg-[#1a2332] border border-[#2a3548] rounded-sm text-[#94a3b8] hover:border-[#4a9eff] hover:text-[#4a9eff] transition-colors flex items-center justify-center gap-1">
                        <Icon name="MessageSquare" size={11} /> Написать
                      </button>
                      <button className="flex-1 py-1.5 text-[10px] bg-[#1a2332] border border-[#2a3548] rounded-sm text-[#94a3b8] hover:border-[#22c55e] hover:text-[#22c55e] transition-colors flex items-center justify-center gap-1">
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
                <div className="flex gap-1 flex-wrap">
                  {["Все", "Входящие", "Исходящие", "Пропущенные"].map((f, i) => (
                    <button key={f} className={`px-2 py-1 text-[10px] rounded-sm border transition-colors ${i === 0 ? "bg-[#1a3a5c] border-[#4a9eff] text-[#4a9eff]" : "bg-[#111827] border-[#1a2332] text-[#4a5568] hover:text-[#94a3b8]"}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {CALLS.map(call => (
                  <div key={call.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#0d1421] hover:bg-[#0e1627] cursor-pointer transition-colors">
                    <Avatar initials={call.avatar} />
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
                <button
                  onClick={() => setActiveCall(true)}
                  className="px-5 py-2 bg-[#22c55e] text-[#080f1a] text-xs font-medium rounded-sm hover:bg-[#16a34a] transition-colors"
                >
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
                <button
                  onClick={() => setActiveVideo(true)}
                  className="px-4 py-2 bg-[#4a9eff] text-[#080f1a] text-xs font-medium rounded-sm hover:bg-[#3b8fe0] transition-colors flex items-center gap-1.5"
                >
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
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Icon name="Search" size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#4a5568]" />
                  <input placeholder="Поиск файлов..." className="bg-[#111827] border border-[#1a2332] rounded-sm pl-7 pr-3 py-1.5 text-xs text-[#94a3b8] placeholder-[#4a5568] focus:outline-none focus:border-[#4a9eff] w-48" />
                </div>
                <button className="px-3 py-1.5 bg-[#4a9eff] text-[#080f1a] text-xs font-medium rounded-sm hover:bg-[#3b8fe0] transition-colors flex items-center gap-1.5">
                  <Icon name="Upload" size={12} /> Загрузить
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="flex gap-2 mb-5">
                {["Все файлы", "Документы", "Изображения", "Архивы", "Медиа"].map((f, i) => (
                  <button key={f} className={`px-3 py-1.5 text-[11px] rounded-sm border transition-colors ${i === 0 ? "bg-[#1a3a5c] border-[#4a9eff] text-[#4a9eff]" : "bg-[#111827] border-[#1a2332] text-[#4a5568] hover:text-[#94a3b8]"}`}>
                    {f}
                  </button>
                ))}
              </div>
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
                    {FILES.map(f => (
                      <tr key={f.id} className="border-b border-[#0d1421] hover:bg-[#0e1627] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <FileIcon type={f.type} />
                            <span className="text-xs text-[#e2e8f0] font-medium">{f.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-[#4a5568]">{f.size}</td>
                        <td className="px-4 py-3 text-xs text-[#94a3b8]">{f.sender}</td>
                        <td className="px-4 py-3 text-xs text-[#4a5568]">{f.date}</td>
                        <td className="px-4 py-3">
                          <button className="text-[#4a5568] hover:text-[#4a9eff] transition-colors">
                            <Icon name="Download" size={14} />
                          </button>
                        </td>
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
                {BOTS.map(bot => (
                  <div key={bot.id} className="bg-[#0a1120] border border-[#1a2332] rounded-sm p-4 hover:border-[#2a3548] transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-sm bg-[#1a2332] border border-[#2a3548] flex items-center justify-center text-[#4a9eff] text-xs font-medium">
                          {bot.avatar}
                        </div>
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
                <div className="bg-[#0a1120] border border-dashed border-[#1a2332] rounded-sm p-4 flex flex-col items-center justify-center gap-2 hover:border-[#4a9eff] cursor-pointer transition-colors group">
                  <div className="w-10 h-10 rounded-sm bg-[#111827] flex items-center justify-center group-hover:bg-[#1a2332] transition-colors">
                    <Icon name="Plus" size={18} className="text-[#4a5568] group-hover:text-[#4a9eff]" />
                  </div>
                  <span className="text-[11px] text-[#4a5568] group-hover:text-[#94a3b8]">Новый бот</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {section === "settings" && (
          <div className="flex flex-1 overflow-hidden">
            <div className="w-52 flex flex-col border-r border-[#1a2332] bg-[#0a1120] flex-shrink-0 pt-4">
              <h2 className="px-4 text-[10px] font-semibold text-[#4a5568] tracking-widest uppercase mb-3">Настройки</h2>
              {[
                { icon: "User", label: "Профиль" },
                { icon: "Bell", label: "Уведомления" },
                { icon: "Shield", label: "Безопасность" },
                { icon: "Cloud", label: "Облако" },
                { icon: "Link", label: "Интеграции" },
                { icon: "Palette", label: "Оформление" },
                { icon: "Globe", label: "Язык" },
              ].map((item, i) => (
                <button key={i} className={`flex items-center gap-3 px-4 py-2.5 text-xs transition-colors ${i === 0 ? "bg-[#111827] text-[#4a9eff]" : "text-[#4a5568] hover:text-[#94a3b8] hover:bg-[#0e1627]"}`}>
                  <Icon name={item.icon} size={14} />
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <h3 className="text-sm font-semibold text-[#e2e8f0] mb-6">Профиль</h3>
              <div className="flex items-center gap-4 mb-7 p-4 bg-[#0a1120] border border-[#1a2332] rounded-sm max-w-lg">
                <div className="w-14 h-14 rounded-sm bg-[#1a2332] border border-[#2a3548] flex items-center justify-center text-[#4a9eff] text-lg font-medium">ИВ</div>
                <div>
                  <div className="text-sm font-medium text-[#e2e8f0]">Иван Владимиров</div>
                  <div className="text-xs text-[#4a9eff] mb-2">Генеральный директор</div>
                  <button className="text-[10px] text-[#4a5568] hover:text-[#94a3b8] border border-[#1a2332] rounded-sm px-2 py-1 transition-colors">
                    Изменить фото
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 max-w-lg">
                {[
                  { label: "Имя", value: "Иван" },
                  { label: "Фамилия", value: "Владимиров" },
                  { label: "Должность", value: "Генеральный директор" },
                  { label: "Телефон", value: "+7 495 000-00-01" },
                  { label: "Email", value: "i.vladimirov@corp.ru" },
                  { label: "Отдел", value: "Руководство" },
                ].map(field => (
                  <div key={field.label}>
                    <label className="block text-[10px] font-semibold text-[#4a5568] uppercase tracking-widest mb-1.5">{field.label}</label>
                    <input defaultValue={field.value} className="w-full bg-[#111827] border border-[#1a2332] rounded-sm px-3 py-2 text-xs text-[#e2e8f0] focus:outline-none focus:border-[#4a9eff] transition-colors" />
                  </div>
                ))}
              </div>
              <button className="mt-6 px-5 py-2 bg-[#4a9eff] text-[#080f1a] text-xs font-medium rounded-sm hover:bg-[#3b8fe0] transition-colors">
                Сохранить изменения
              </button>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {section === "analytics" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-[#1a2332] flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xs font-semibold text-[#e2e8f0] tracking-widest uppercase">Аналитика</h2>
                <p className="text-xs text-[#4a5568] mt-0.5">Панель администратора</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-[#111827] border border-[#1a2332] text-xs text-[#94a3b8] rounded-sm hover:border-[#4a9eff] transition-colors">Экспорт</button>
                <select className="px-3 py-1.5 bg-[#111827] border border-[#1a2332] text-xs text-[#94a3b8] rounded-sm focus:outline-none">
                  <option>Последние 30 дней</option>
                  <option>Последние 7 дней</option>
                  <option>Этот месяц</option>
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Активных пользователей", value: "847", change: "+12%", icon: "Users", color: "text-[#4a9eff]" },
                  { label: "Сообщений сегодня", value: "12 491", change: "+8%", icon: "MessageSquare", color: "text-[#22c55e]" },
                  { label: "Звонков за неделю", value: "234", change: "-3%", icon: "Phone", color: "text-[#f59e0b]" },
                  { label: "Файлов передано", value: "1.8 ГБ", change: "+24%", icon: "FolderOpen", color: "text-[#a78bfa]" },
                ].map(kpi => (
                  <div key={kpi.label} className="bg-[#0a1120] border border-[#1a2332] rounded-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-[#4a5568] uppercase tracking-wide leading-tight">{kpi.label}</span>
                      <Icon name={kpi.icon} size={14} className={kpi.color} />
                    </div>
                    <div className="text-xl font-semibold text-[#e2e8f0] font-mono">{kpi.value}</div>
                    <div className={`text-[10px] mt-1 ${kpi.change.startsWith("+") ? "text-[#22c55e]" : "text-[#f87171]"}`}>
                      {kpi.change} к пред. периоду
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="col-span-2 bg-[#0a1120] border border-[#1a2332] rounded-sm p-4">
                  <h4 className="text-xs font-semibold text-[#e2e8f0] mb-4">Активность за неделю</h4>
                  <div className="flex items-end gap-2 h-28">
                    {[65, 82, 54, 91, 73, 88, 45].map((v, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-[#1a3a5c] rounded-sm transition-all" style={{ height: `${v}%` }} />
                        <span className="text-[9px] text-[#4a5568]">{["Пн","Вт","Ср","Чт","Пт","Сб","Вс"][i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#0a1120] border border-[#1a2332] rounded-sm p-4">
                  <h4 className="text-xs font-semibold text-[#e2e8f0] mb-4">Безопасность</h4>
                  <div className="space-y-3">
                    {[
                      { label: "Зашифрованных сообщений", value: "100%", width: "100%", color: "bg-[#22c55e]" },
                      { label: "2FA активировано", value: "94%", width: "94%", color: "bg-[#4a9eff]" },
                      { label: "Угроз заблокировано", value: "0", width: "2%", color: "bg-[#f59e0b]" },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-[#4a5568]">{s.label}</span>
                          <span className="text-[#e2e8f0] font-mono">{s.value}</span>
                        </div>
                        <div className="h-1 bg-[#111827] rounded-full overflow-hidden">
                          <div className={`h-full ${s.color} rounded-full`} style={{ width: s.width }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#0a1120] border border-[#1a2332] rounded-sm p-4">
                <h4 className="text-xs font-semibold text-[#e2e8f0] mb-4">Активные пользователи</h4>
                <div className="space-y-2.5">
                  {CONTACTS.slice(0, 5).map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-[#4a5568] w-4">{i + 1}</span>
                      <Avatar initials={c.avatar} size="sm" online={c.online} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[#e2e8f0]">{c.name}</div>
                      </div>
                      <div className="w-32 h-1.5 bg-[#111827] rounded-full overflow-hidden">
                        <div className="h-full bg-[#4a9eff] rounded-full" style={{ width: `${90 - i * 12}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-[#4a5568] w-20 text-right">{[2341, 1987, 1654, 1203, 987][i]} сообщ.</span>
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
            <div className="w-14 h-14 rounded-full bg-[#1a2332] border border-[#2a3548] flex items-center justify-center text-[#4a9eff] font-medium mx-auto mb-4">АМ</div>
            <div className="text-sm font-medium text-[#e2e8f0] mb-1">Алексей Морозов</div>
            <div className="text-xs text-[#22c55e] font-mono mb-6">00:04:23</div>
            <div className="flex justify-center gap-3">
              <button onClick={() => setMicMuted(!micMuted)} className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${micMuted ? "bg-[#f87171] border-[#f87171] text-white" : "bg-[#1a2332] border-[#2a3548] text-[#94a3b8] hover:border-[#4a9eff]"}`}>
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
              <div className="w-20 h-20 rounded-full bg-[#1a2332] border border-[#2a3548] flex items-center justify-center text-[#4a9eff] text-2xl font-medium mx-auto mb-3">АМ</div>
              <div className="text-sm text-[#4a5568]">Камера недоступна</div>
            </div>
            <div className="absolute bottom-4 right-4 w-32 h-24 bg-[#111827] border border-[#2a3548] rounded-sm flex items-center justify-center text-[#4a5568] text-xs">
              {camOff ? <Icon name="VideoOff" size={20} /> : "Вы"}
            </div>
            <div className="absolute top-4 left-4 bg-black/50 rounded-sm px-3 py-1.5 text-xs text-[#e2e8f0]">
              Алексей Морозов · 00:12:41
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
            <button className="w-11 h-11 rounded-full bg-[#1a2332] border border-[#2a3548] text-[#94a3b8] flex items-center justify-center">
              <Icon name="Users" size={16} />
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
