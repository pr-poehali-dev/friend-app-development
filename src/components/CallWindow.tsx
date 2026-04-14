import { useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

interface Contact {
  id: number;
  username: string;
  display_name: string;
  position?: string;
  department?: string;
  phone?: string;
  avatar_initials: string;
  online: boolean;
}

interface CallWindowProps {
  callType: "audio" | "video";
  callTarget: Contact | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;
  micMuted: boolean;
  camOff: boolean;
  status: "calling" | "ringing" | "active" | "error";
  errorMsg: string;
  onHangup: () => void;
  onToggleMic: () => void;
  onToggleCam: () => void;
}

function formatDuration(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function AvatarCircle({ initials }: { initials: string }) {
  return (
    <div style={{
      width: 80, height: 80, borderRadius: "50%",
      background: "linear-gradient(145deg, #1a3a5c, #0a1120)",
      border: "2px solid rgba(74,158,255,0.4)",
      boxShadow: "0 0 24px rgba(74,158,255,0.2)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 24, color: "#4a9eff",
      letterSpacing: "0.05em",
    }}>
      {initials}
    </div>
  );
}

export default function CallWindow({
  callType,
  callTarget,
  localStream,
  remoteStream,
  callDuration,
  micMuted,
  camOff,
  status,
  errorMsg,
  onHangup,
  onToggleMic,
  onToggleCam,
}: CallWindowProps) {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const statusLabel = () => {
    if (status === "error") return errorMsg || "Ошибка";
    if (status === "calling") return "Вызов...";
    if (status === "ringing") return "Соединение...";
    if (status === "active") return formatDuration(callDuration);
    return "";
  };

  const targetName = callTarget?.display_name || "Звонок";
  const targetInitials = callTarget?.avatar_initials || "??";

  if (callType === "video") {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: "#050c18",
        display: "flex", flexDirection: "column",
      }}>
        {/* Remote video / placeholder */}
        <div style={{ flex: 1, position: "relative", background: "#0a1120", overflow: "hidden" }}>
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <AvatarCircle initials={targetInitials} />
              <div style={{ fontWeight: 600, fontSize: 16, color: "#e2e8f0", marginTop: 16 }}>{targetName}</div>
              <div style={{
                fontSize: 12, color: status === "error" ? "#f87171" : "#22c55e",
                fontFamily: "monospace", marginTop: 6,
                animation: status !== "active" && status !== "error" ? "pulse 1.5s ease-in-out infinite" : "none",
              }}>
                {statusLabel()}
              </div>
            </div>
          )}

          {/* Local video PiP */}
          {localStream && !camOff && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: "absolute", bottom: 16, right: 16,
                width: 128, height: 96,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #2a3548",
                background: "#0a1120",
              }}
            />
          )}

          {/* Duration overlay */}
          {status === "active" && (
            <div style={{
              position: "absolute", top: 16, left: 16,
              background: "rgba(0,0,0,0.5)",
              borderRadius: 6, padding: "4px 10px",
              fontSize: 12, color: "#e2e8f0",
              fontFamily: "monospace",
            }}>
              {formatDuration(callDuration)}
            </div>
          )}

          {/* Name overlay */}
          {remoteStream && (
            <div style={{
              position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
              fontSize: 13, color: "#e2e8f0", fontWeight: 600,
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            }}>
              {targetName}
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "center", gap: 16,
          padding: "16px 0", borderTop: "1px solid #1a2332",
          background: "#0a1120",
        }}>
          <ControlBtn
            active={micMuted}
            activeColor="#f87171"
            onClick={onToggleMic}
            icon={micMuted ? "MicOff" : "Mic"}
            title={micMuted ? "Включить микрофон" : "Выключить микрофон"}
          />
          <ControlBtn
            active={camOff}
            activeColor="#f87171"
            onClick={onToggleCam}
            icon={camOff ? "VideoOff" : "Video"}
            title={camOff ? "Включить камеру" : "Выключить камеру"}
          />
          <HangupBtn onClick={onHangup} />
        </div>
      </div>
    );
  }

  // Audio call
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {remoteStream && <audio ref={remoteAudioRef} autoPlay />}
      <div style={{
        background: "#0a1120",
        border: "1px solid #1a2332",
        borderRadius: 16,
        padding: "40px 48px",
        width: 280,
        textAlign: "center",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        <AvatarCircle initials={targetInitials} />
        <div style={{ fontWeight: 600, fontSize: 16, color: "#e2e8f0", marginTop: 20, marginBottom: 4 }}>
          {targetName}
        </div>
        <div style={{
          fontSize: 12,
          color: status === "error" ? "#f87171" : "#22c55e",
          fontFamily: "monospace",
          marginBottom: 28,
          minHeight: 18,
          animation: status !== "active" && status !== "error" ? "pulse 1.5s ease-in-out infinite" : "none",
        }}>
          {statusLabel()}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <ControlBtn
            active={micMuted}
            activeColor="#f87171"
            onClick={onToggleMic}
            icon={micMuted ? "MicOff" : "Mic"}
            title={micMuted ? "Включить микрофон" : "Выключить микрофон"}
          />
          <HangupBtn onClick={onHangup} />
          <ControlBtn
            active={false}
            activeColor="#4a9eff"
            onClick={() => {}}
            icon="Volume2"
            title="Громкость"
          />
        </div>
      </div>
    </div>
  );
}

function ControlBtn({
  active,
  activeColor,
  onClick,
  icon,
  title,
}: {
  active: boolean;
  activeColor: string;
  onClick: () => void;
  icon: string;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 44, height: 44,
        borderRadius: "50%",
        border: `1px solid ${active ? activeColor : "#2a3548"}`,
        background: active ? activeColor : "#1a2332",
        color: active ? "#fff" : "#94a3b8",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
        flexShrink: 0,
      }}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

function HangupBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Завершить звонок"
      style={{
        width: 48, height: 48,
        borderRadius: "50%",
        border: "1px solid #f87171",
        background: "#f87171",
        color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        transition: "background 0.2s ease",
        flexShrink: 0,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#ef4444"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f87171"; }}
    >
      <Icon name="PhoneOff" size={18} />
    </button>
  );
}
