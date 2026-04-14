import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { FONT } from "@/styles/theme3d";

interface Props {
  onClose: () => void;
  onPhoto: (file: File) => void;
}

export default function CameraModal({ onClose, onPhoto }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const startCamera = async (mode: "user" | "environment") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setReady(true);
        setError(null);
      }
    } catch {
      setError("Нет доступа к камере. Разрешите доступ в браузере.");
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const flipCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    setPhoto(null);
    startCamera(next);
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPhoto(dataUrl);
  };

  const retake = () => setPhoto(null);

  const send = () => {
    if (!photo) return;
    const arr = photo.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    const u8 = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
    const file = new File([u8], `photo_${Date.now()}.jpg`, { type: mime });
    onPhoto(file);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="flex flex-col rounded-2xl overflow-hidden" style={{
        background: "var(--t-bg-panel)",
        border: "1px solid var(--t-border)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        width: "min(420px, 95vw)",
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--t-border)" }}>
          <span style={{ fontFamily: FONT.heading, fontWeight: 700, fontSize: 13, color: "var(--t-text)" }}>
            {photo ? "Отправить фото?" : "Камера"}
          </span>
          <div className="flex items-center gap-2">
            {!photo && ready && (
              <button onClick={flipCamera} style={{ color: "var(--t-text-dim)", background: "none", border: "none", cursor: "pointer" }} title="Перевернуть камеру">
                <Icon name="RefreshCw" size={16} />
              </button>
            )}
            <button onClick={onClose} style={{ color: "var(--t-text-dim)", background: "none", border: "none", cursor: "pointer" }}>
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="relative flex items-center justify-center" style={{ background: "#000", minHeight: 280 }}>
          {error ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <Icon name="CameraOff" size={32} style={{ color: "var(--t-text-dim)" }} />
              <span style={{ fontFamily: FONT.body, fontSize: 12, color: "var(--t-text-dim)" }}>{error}</span>
            </div>
          ) : photo ? (
            <img src={photo} alt="preview" style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }} />
          ) : (
            <video ref={videoRef} playsInline muted style={{ maxWidth: "100%", maxHeight: 360, display: "block" }} />
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 px-4 py-4 border-t" style={{ borderColor: "var(--t-border)" }}>
          {photo ? (
            <>
              <button onClick={retake}
                className="px-4 py-2 rounded-xl text-xs"
                style={{ fontFamily: FONT.mono, border: "1px solid var(--t-border)", color: "var(--t-text-dim)", background: "none", cursor: "pointer" }}>
                ПОВТОРИТЬ
              </button>
              <button onClick={send}
                className="px-5 py-2 rounded-xl text-xs flex items-center gap-2"
                style={{ fontFamily: FONT.mono, background: "var(--t-accent)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 700 }}>
                <Icon name="Send" size={13} style={{ color: "#fff" }} /> ОТПРАВИТЬ
              </button>
            </>
          ) : (
            <button onClick={capture} disabled={!ready}
              className="flex items-center justify-center rounded-full disabled:opacity-40"
              style={{
                width: 60, height: 60,
                background: "var(--t-accent)",
                border: "4px solid color-mix(in srgb, var(--t-accent) 40%, transparent)",
                cursor: ready ? "pointer" : "default",
                boxShadow: "0 0 20px color-mix(in srgb, var(--t-accent) 50%, transparent)",
              }}>
              <Icon name="Camera" size={24} style={{ color: "#fff" }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
