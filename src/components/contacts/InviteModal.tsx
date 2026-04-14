import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { FONT, btn3d, card3d, heading3d, input3d } from "@/styles/theme3d";
import Icon from "@/components/ui/icon";
import { useLang } from "@/LangContext";

interface Invite {
  id: number;
  code: string;
  label: string | null;
  used_count: number;
  max_uses: number | null;
  created_at: string;
}

interface Props {
  onClose: () => void;
  apiUrl: string;
  sessionId: string;
}

const APP_URL = window.location.origin;

function QRCode({ value, size = 200 }: { value: string; size?: number }) {
  return (
    <div style={{ background: "#fff", padding: 12, borderRadius: 8, display: "inline-block" }}>
      <QRCodeSVG value={value} size={size} fgColor="#007a63" bgColor="#ffffff" />
    </div>
  );
}

export default function InviteModal({ onClose, apiUrl, sessionId }: Props) {
  const { t } = useLang();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [error, setError] = useState("");

  const loadInvites = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}?action=invites`, { headers: { "X-Session-Id": sessionId } });
      let data = await res.json();
      if (typeof data === "string") { try { data = JSON.parse(data); } catch { /* ignore */ } }
      setInvites(data.invites || []);
      if (!selectedInvite && data.invites?.length) setSelectedInvite(data.invites[0]);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadInvites(); }, [apiUrl, sessionId]);

  const createInvite = async () => {
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`${apiUrl}?action=create_invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({ label: label.trim() || null }),
      });
      const rawText = await res.text();
      console.log("[InviteModal] response status:", res.status, "body:", rawText);
      let data: Record<string, unknown>;
      try { data = JSON.parse(rawText); } catch { data = {}; }
      if (typeof data === "string") { try { data = JSON.parse(data); } catch { /* ignore */ } }
      if ((data as {ok?: boolean}).ok || (data as {code?: string}).code) {
        await loadInvites();
        setLabel("");
      } else {
        setError((data as {error?: string}).error || `Ошибка ${res.status}: ${rawText.slice(0, 100)}`);
      }
    } catch (e) {
      console.error("[InviteModal] fetch error:", e);
      setError("Ошибка соединения");
    }
    setCreating(false);
  };

  const getInviteUrl = (code: string) => `${APP_URL}?invite=${code}`;

  const copyLink = async (code: string) => {
    await navigator.clipboard.writeText(getInviteUrl(code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async (code: string) => {
    const url = getInviteUrl(code);
    if (navigator.share) {
      await navigator.share({ title: "Присоединяйтесь!", url });
    } else {
      await copyLink(code);
    }
  };

  const downloadQR = (code: string) => {
    const svg = document.querySelector(".qr-download-target svg") as SVGElement;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 400, 400);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `invite-${code}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const sendViaEmail = (code: string) => {
    const url = getInviteUrl(code);
    window.open(`mailto:?subject=Приглашение&body=Присоединяйтесь по ссылке: ${url}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg mx-4" style={{ ...card3d(), padding: 0, overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "var(--t-border)" }}>
          <span style={{ ...heading3d(14), letterSpacing: "0.1em" }}>{t("invite_title")}</span>
          <button onClick={onClose} style={{ color: "var(--t-text-dim)", cursor: "pointer" }}>
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Создать новую ссылку */}
          <div className="p-4 rounded-lg" style={{ background: "var(--t-bg-panel)", border: "1px solid var(--t-border)" }}>
            <p className="text-[11px] mb-2" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)", letterSpacing: "0.06em" }}>{t("invite_new")}</p>
            <div className="flex gap-2">
              <input
                value={label}
                onChange={e => { setLabel(e.target.value); setError(""); }}
                placeholder={t("invite_label_ph")}
                className="flex-1 px-3 py-2 text-xs rounded-sm outline-none"
                style={{ ...input3d(), fontSize: 12 }}
                onKeyDown={e => e.key === "Enter" && createInvite()}
              />
              <button onClick={createInvite} disabled={creating}
                className="btn-3d px-4 py-2 text-xs flex items-center gap-1.5"
                style={{ ...btn3d("var(--t-accent)"), opacity: creating ? 0.7 : 1 }}>
                {creating ? <Icon name="Loader" size={13} className="animate-spin" /> : <Icon name="Plus" size={13} />}
                {t("invite_create")}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-[11px]" style={{ fontFamily: FONT.body, color: "var(--t-danger)" }}>{error}</p>
            )}
          </div>

          {/* Список ссылок */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Icon name="Loader" size={24} className="animate-spin" style={{ color: "var(--t-accent)" }} />
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="Link" size={32} className="mx-auto mb-2" style={{ color: "var(--t-text-dim)" }} />
              <p className="text-xs" style={{ fontFamily: FONT.body, color: "var(--t-text-dim)" }}>{t("invite_empty")}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {invites.map(invite => (
                <div key={invite.id}
                  className="p-4 rounded-lg cursor-pointer transition-all"
                  style={{
                    border: `1px solid ${selectedInvite?.id === invite.id ? "var(--t-accent)" : "var(--t-border)"}`,
                    background: selectedInvite?.id === invite.id ? "color-mix(in srgb, var(--t-accent) 8%, var(--t-bg-card))" : "var(--t-bg-card)",
                  }}
                  onClick={() => { setSelectedInvite(invite); setShowQR(false); }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium" style={{ fontFamily: FONT.heading, fontWeight: 700, color: "var(--t-text)" }}>
                      {invite.label || t("invite_unnamed")}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--t-bg-active)", color: "var(--t-text-dim)", fontFamily: FONT.mono }}>
                      {invite.used_count} {t("invite_uses")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-[11px] truncate flex-1" style={{ fontFamily: FONT.mono, color: "var(--t-accent)" }}>
                      {getInviteUrl(invite.code)}
                    </span>
                  </div>

                  {selectedInvite?.id === invite.id && (
                    <div className="mt-3">
                      {showQR ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="qr-download-target">
                            <QRCode value={getInviteUrl(invite.code)} size={180} />
                          </div>
                          <div className="flex gap-2 flex-wrap justify-center">
                            <button onClick={() => downloadQR(invite.code)}
                              className="btn-3d px-3 py-1.5 text-[10px] flex items-center gap-1"
                              style={btn3d("var(--t-accent)")}>
                              <Icon name="Download" size={11} /> {t("invite_download")}
                            </button>
                            <button onClick={() => setShowQR(false)}
                              className="px-3 py-1.5 text-[10px] rounded-sm"
                              style={{ background: "var(--t-bg-active)", color: "var(--t-text-muted)", fontFamily: FONT.heading, fontWeight: 700, letterSpacing: "0.06em", border: "1px solid var(--t-border)", cursor: "pointer" }}>
                              {t("invite_hide_qr")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => copyLink(invite.code)}
                            className="btn-3d px-3 py-1.5 text-[10px] flex items-center gap-1"
                            style={btn3d(copied ? "#22c55e" : "var(--t-accent)")}>
                            <Icon name={copied ? "Check" : "Copy"} size={11} />
                            {copied ? t("invite_copied") : t("invite_copy")}
                          </button>
                          <button onClick={() => shareLink(invite.code)}
                            className="btn-3d px-3 py-1.5 text-[10px] flex items-center gap-1"
                            style={btn3d("var(--t-accent)")}>
                            <Icon name="Share2" size={11} /> {t("invite_share")}
                          </button>
                          <button onClick={() => sendViaEmail(invite.code)}
                            className="btn-3d px-3 py-1.5 text-[10px] flex items-center gap-1"
                            style={btn3d("var(--t-accent)")}>
                            <Icon name="Mail" size={11} /> EMAIL
                          </button>
                          <button onClick={() => setShowQR(true)}
                            className="btn-3d px-3 py-1.5 text-[10px] flex items-center gap-1"
                            style={btn3d("var(--t-accent)")}>
                            <Icon name="QrCode" size={11} /> {t("invite_qr")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}