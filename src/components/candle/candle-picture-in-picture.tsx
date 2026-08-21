"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { getCandleProgress } from "@/lib/candle/config";
import type { CandleType } from "@/types/database";
import { PixelCandle } from "./pixel-candle";

type CandlePictureInPictureProps = {
  startedAt: number;
  duration: number;
  candleType: CandleType;
  seed: string;
};

type DocumentPictureInPicture = {
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
  window?: Window | null;
};

type PipMode = "document" | "video" | "none";

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

let pipRoot: Root | null = null;
let pipWindow: Window | null = null;

function copyPageStyles(targetDocument: Document) {
  Array.from(document.styleSheets).forEach((styleSheet) => {
    try {
      if (styleSheet.cssRules.length > 0) {
        const style = targetDocument.createElement("style");
        style.textContent = Array.from(styleSheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
        targetDocument.head.appendChild(style);
      }
    } catch {
      const ownerNode = styleSheet.ownerNode;
      if (ownerNode instanceof HTMLLinkElement) {
        targetDocument.head.appendChild(ownerNode.cloneNode(true));
      }
    }
  });
}

function PictureInPictureCandle({
  startedAt,
  duration,
  candleType,
  seed,
}: CandlePictureInPictureProps) {
  const [now, setNow] = useState(0);
  const progress = getCandleProgress(startedAt, duration, now);
  const extinguished = progress >= 1;

  useEffect(() => {
    queueMicrotask(() => setNow(Date.now()));
    const frame = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(frame);
  }, []);

  useEffect(() => {
    if (!extinguished || !pipWindow || pipWindow.closed) {
      return;
    }

    const closeWindow = window.setTimeout(() => pipWindow?.close(), 1800);
    return () => window.clearTimeout(closeWindow);
  }, [extinguished]);

  return (
    <main className="flex h-dvh min-h-80 flex-col items-center justify-center bg-[color:var(--background)] px-6 text-center">
      <PixelCandle
        progress={progress}
        candleType={candleType}
        seed={seed}
        lit={!extinguished}
        extinguished={extinguished}
        size="room"
      />
      <p className="pixel-text mt-10 text-xs text-[color:var(--muted)]">
        {extinguished ? "candle burned out." : "just you and the flame."}
      </p>
    </main>
  );
}

export function CandlePictureInPicture(props: CandlePictureInPictureProps) {
  const [pipMode, setPipMode] = useState<PipMode>("none");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const attemptedAutoOpenRef = useRef(false);
  const propsRef = useRef(props);

  function stopCanvasLoop() {
    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }

  const startCanvasLoop = useCallback((canvas: HTMLCanvasElement) => {
    stopCanvasLoop();
    const context = canvas.getContext("2d");
    if (!context) return;

    const draw = () => {
      drawCandleCanvas(context, canvas.width, canvas.height, propsRef.current);
      animationRef.current = window.requestAnimationFrame(draw);
    };

    draw();
  }, []);

  const openVideoPictureInPicture = useCallback(
    async (automatic: boolean) => {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (!canvas || !video || !("requestPictureInPicture" in video)) {
        setMessage("picture in picture unavailable");
        return;
      }

      startCanvasLoop(canvas);
      streamRef.current ??= canvas.captureStream(12);
      video.srcObject = streamRef.current;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      if (document.pictureInPictureElement === video) {
        return;
      }

      await video.requestPictureInPicture();
      setOpen(true);
      if (automatic) {
        setMessage("");
      }
    },
    [startCanvasLoop],
  );

  useEffect(() => {
    queueMicrotask(() => {
      if (window.documentPictureInPicture) {
        setPipMode("document");
        return;
      }

      if ("pictureInPictureEnabled" in document && document.pictureInPictureEnabled) {
        setPipMode("video");
        return;
      }

      setPipMode("none");
    });
  }, []);

  useEffect(() => {
    propsRef.current = props;

    if (!pipRoot || !pipWindow || pipWindow.closed) {
      return;
    }

    pipRoot.render(<PictureInPictureCandle {...props} />);
  }, [props]);

  useEffect(() => {
    const frame = window.setInterval(() => {
      setOpen(
        Boolean(pipWindow && !pipWindow.closed) ||
          document.pictureInPictureElement === videoRef.current,
      );
    }, 1200);

    return () => window.clearInterval(frame);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const handleLeavePictureInPicture = () => {
      setOpen(false);
      stopCanvasLoop();
    };

    video.addEventListener("leavepictureinpicture", handleLeavePictureInPicture);
    return () => video.removeEventListener("leavepictureinpicture", handleLeavePictureInPicture);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || pipMode === "none") {
      return;
    }

    startCanvasLoop(canvas);
    streamRef.current ??= canvas.captureStream(12);
    video.srcObject = streamRef.current;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;

    void video.play().catch(() => {
      setMessage("tap float candle once to allow pip");
    });

    return () => {
      if (document.pictureInPictureElement !== video) {
        stopCanvasLoop();
      }
    };
  }, [pipMode, startCanvasLoop]);

  useEffect(() => {
    if (pipMode !== "video" || !("mediaSession" in navigator)) {
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: "Pixel Candle",
      artist: "just you and the flame.",
    });

    const openFromMediaSession = () => {
      void openVideoPictureInPicture(true);
    };

    try {
      navigator.mediaSession.setActionHandler("enterpictureinpicture" as MediaSessionAction, openFromMediaSession);
    } catch {
      return;
    }

    return () => {
      try {
        navigator.mediaSession.setActionHandler("enterpictureinpicture" as MediaSessionAction, null);
      } catch {
        // Some browsers expose Media Session without this action.
      }
    };
  }, [openVideoPictureInPicture, pipMode]);

  useEffect(() => {
    if (pipMode !== "video") {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "hidden" || attemptedAutoOpenRef.current) {
        return;
      }

      attemptedAutoOpenRef.current = true;
      void openVideoPictureInPicture(true);
      window.setTimeout(() => {
        attemptedAutoOpenRef.current = false;
      }, 3000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [openVideoPictureInPicture, pipMode]);

  useEffect(() => {
    return () => {
      stopCanvasLoop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  async function openPictureInPicture() {
    setMessage("");

    try {
      if (pipMode === "document") {
        await openDocumentPictureInPicture();
        return;
      }

      if (pipMode === "video") {
        await openVideoPictureInPicture(false);
        return;
      }
    } catch {
      setMessage("picture in picture was blocked");
    }
  }

  async function openDocumentPictureInPicture() {
    if (!window.documentPictureInPicture) return;

    if (pipWindow && !pipWindow.closed) {
      pipWindow.focus();
      return;
    }

    const nextPipWindow = await window.documentPictureInPicture.requestWindow({
      width: 280,
      height: 360,
    });
    const pipDocument = nextPipWindow.document;

    pipDocument.title = "Pixel Candle";
    pipDocument.body.innerHTML = "";
    pipDocument.body.style.margin = "0";
    pipDocument.body.style.background = "var(--background)";
    copyPageStyles(pipDocument);

    const mount = pipDocument.createElement("div");
    mount.style.minHeight = "100vh";
    pipDocument.body.appendChild(mount);

    pipRoot = createRoot(mount);
    pipRoot.render(<PictureInPictureCandle {...propsRef.current} />);
    pipWindow = nextPipWindow;
    setOpen(true);

    nextPipWindow.addEventListener("pagehide", () => {
      pipRoot?.unmount();
      pipRoot = null;
      pipWindow = null;
      setOpen(false);
    });
  }

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} width={280} height={360} className="hidden" aria-hidden="true" />
      <video
        ref={videoRef}
        className="hidden"
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={openPictureInPicture}
        disabled={pipMode === "none"}
        className="pixel-text mt-6 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--foreground)] disabled:opacity-45"
        aria-label={open ? "Focus candle picture in picture" : "Open candle picture in picture"}
      >
        {open ? "candle is floating" : pipMode === "none" ? "pip unavailable" : "float candle"}
      </button>
      {message && (
        <p className="pixel-text mt-2 text-[10px] text-[color:var(--muted)]" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
}

function drawCandleCanvas(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  { startedAt, duration, candleType }: CandlePictureInPictureProps,
) {
  const progress = getCandleProgress(startedAt, duration);
  const extinguished = progress >= 1;
  const maxRows = candleType === "large" ? 15 : candleType === "medium" ? 13 : 11;
  const rows = Math.max(2, Math.round(maxRows - (maxRows - 2) * progress));
  const pixel = 12;
  const candleWidth = 8 * pixel;
  const left = Math.round((width - candleWidth) / 2);
  const baseY = 248;

  context.imageSmoothingEnabled = false;
  context.fillStyle = "#fbf3df";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(39,32,25,0.08)";
  context.fillRect(78, 290, 124, 10);

  if (!extinguished) {
    const flameShift = Math.sin(Date.now() / 180) * 2;
    context.fillStyle = "#d8562b";
    context.fillRect(width / 2 - 18 + flameShift, 68, 36, 36);
    context.fillStyle = "#ffd96a";
    context.fillRect(width / 2 - 12 - flameShift, 56, 24, 48);
    context.fillStyle = "#fff0a1";
    context.fillRect(width / 2 - 6, 72, 12, 24);
  } else {
    context.fillStyle = "#7c6f5d";
    context.fillRect(width / 2 - 5, 84, 10, 10);
  }

  context.fillStyle = "#211713";
  context.fillRect(width / 2 - 6, 110, 12, 24);

  for (let row = 0; row < rows; row += 1) {
    const y = baseY - row * pixel;
    for (let col = 0; col < 8; col += 1) {
      const edge = col === 0 || col === 7;
      const drip = (row === rows - 3 && col === 6) || (row === rows - 6 && col === 1);
      context.fillStyle = drip ? "#e4c981" : edge ? "#f4dfa8" : "#fff1c9";
      context.fillRect(left + col * pixel, y, pixel, pixel);
    }
  }

  context.fillStyle = "#352821";
  context.fillRect(left - pixel, baseY + pixel, candleWidth + pixel * 2, pixel);
  context.fillStyle = "#49362c";
  context.fillRect(left - pixel * 2, baseY + pixel * 2, candleWidth + pixel * 4, pixel);
  context.fillStyle = "#272019";
  context.font = "16px monospace";
  context.textAlign = "center";
  context.fillText(extinguished ? "candle burned out." : "just you and the flame.", width / 2, 330);
}
