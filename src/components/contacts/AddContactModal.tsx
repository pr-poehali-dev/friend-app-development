import { useState, useRef } from "react";
import { FONT, btn3d, card3d, heading3d, input3d } from "@/styles/theme3d";
import Icon from "@/components/ui/icon";

interface Props {
  onClose: () => void;
  onAdded: () => void;
  apiUrl: string;
  sessionId: string;
}

export default function AddContactModal({ onClose, onAdded, apiUrl, sessionId }: Props) {
  const [tab, setTab] = useState<"manual" | "csv">("manual");
  const [form, setForm] = useState({ display_name: "", phone: "", email: "", position: "", department: "" });
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleManualSubmit = async () => {
    if (!form.display_name.trim()) { setError("Укажите имя"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${apiUrl}?action=add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) { onAdded(); onClose(); }
      else setError(data.error || "Ошибка");
    } catch { setError("Ошибка соединения"); }
    finally { setLoading(false); }
  };

  const handleCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      const rows = text.trim().split("\n").slice(0, 4).map(r => r.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (!csvText.trim()) { setError("Загрузите файл или вставьте CSV"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${apiUrl}?action=import`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (data.ok) { onAdded(); onClose(); }
      else setError(data.error || "Ошибка");
    } catch { setError("Ошибка соединения"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md mx-4" style={{ ...card3d(), padding: 0, overflow: "hidden" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--t-border)" }}>
          <span style={{ ...heading3d(14), letterSpacing: "0.1em" }}>ДОБАВИТЬ КОНТАКТ</span>
          <button onClick={onClose} style={{ color: "var(--t-text-dim)", cursor: "pointer" }}>
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex border-b" style={{ borderColor: "var(--t-border)" }}>
          {(["manual", "csv"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-medium transition-colors"
              style={{
                fontFamily: FONT.heading, fontWeight: 700, letterSpacing: "0.08em",
                color: tab === t ? "var(--t-accent)" : "var(--t-text-dim)",
                borderBottom: tab === t ? "2px solid var(--t-accent)" : "2px solid transparent",
                background: "transparent",
              }}>
              {t === "manual" ? "ВРУЧНУЮ" : "ЗАГРУЗИТЬ CSV"}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "manual" ? (
            <div className="flex flex-col gap-3">
              {[
                { key: "display_name", label: "Имя*", placeholder: "Иван Иванов" },
                { key: "phone", label: "Телефон", placeholder: "+7 900 000 0000" },
                { key: "email", label: "Email", placeholder: "ivan@example.com" },
                { key: "position", label: "Должность", placeholder: "Менеджер" },
                { key: "department", label: "Отдел", placeholder: "Продажи" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-[10px] mb-1" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)", letterSpacing: "0.06em" }}>{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-xs rounded-sm outline-none"
                    style={{ ...input3d(), fontSize: 12 }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
                style={{ borderColor: "var(--t-border)", background: "var(--t-bg-panel)" }}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCsvFile(f); }}
              >
                <Icon name="Upload" size={24} className="mx-auto mb-2" style={{ color: "var(--t-text-dim)" }} />
                <p className="text-xs" style={{ fontFamily: FONT.body, color: "var(--t-text-muted)" }}>
                  Перетащите CSV или <span style={{ color: "var(--t-accent)" }}>выберите файл</span>
                </p>
                <p className="text-[10px] mt-1" style={{ color: "var(--t-text-dim)" }}>
                  Колонки: name, phone, email, position, department
                </p>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }} />
              </div>

              {csvPreview.length > 0 && (
                <div className="rounded-sm overflow-hidden" style={{ border: "1px solid var(--t-border)" }}>
                  <table className="w-full text-[10px]">
                    <tbody>
                      {csvPreview.map((row, i) => (
                        <tr key={i} style={{ background: i === 0 ? "var(--t-bg-active)" : "transparent", borderBottom: "1px solid var(--t-border)" }}>
                          {row.map((cell, j) => (
                            <td key={j} className="px-2 py-1.5 truncate max-w-[80px]"
                              style={{ fontFamily: FONT.mono, color: i === 0 ? "var(--t-accent)" : "var(--t-text-muted)" }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvText.trim().split("\n").length > 4 && (
                    <div className="px-2 py-1 text-[10px]" style={{ color: "var(--t-text-dim)", fontFamily: FONT.body }}>
                      + ещё {csvText.trim().split("\n").length - 4} строк
                    </div>
                  )}
                </div>
              )}

              <textarea
                value={csvText}
                onChange={e => {
                  setCsvText(e.target.value);
                  const rows = e.target.value.trim().split("\n").slice(0, 4).map(r => r.split(",").map(c => c.trim()));
                  setCsvPreview(rows);
                }}
                placeholder={"name,phone,email\nИван Иванов,+79001234567,ivan@mail.ru"}
                rows={3}
                className="w-full px-3 py-2 text-[11px] rounded-sm outline-none resize-none"
                style={{ ...input3d(), fontFamily: FONT.mono }}
              />
            </div>
          )}

          {error && <p className="mt-2 text-[11px]" style={{ color: "var(--t-danger)", fontFamily: FONT.body }}>{error}</p>}

          <div className="flex gap-2 mt-4">
            <button onClick={onClose} className="flex-1 py-2 text-xs rounded-sm"
              style={{ background: "var(--t-bg-active)", color: "var(--t-text-muted)", fontFamily: FONT.heading, fontWeight: 700, letterSpacing: "0.06em", border: "1px solid var(--t-border)", cursor: "pointer" }}>
              ОТМЕНА
            </button>
            <button
              onClick={tab === "manual" ? handleManualSubmit : handleCsvImport}
              disabled={loading}
              className="btn-3d flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
              style={{ ...btn3d("var(--t-accent)"), opacity: loading ? 0.7 : 1 }}>
              {loading ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="UserPlus" size={13} />}
              {tab === "manual" ? "ДОБАВИТЬ" : "ИМПОРТ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}