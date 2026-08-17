"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSound } from "./sound-provider";

export function SoundToggle() {
  const { enabled, toggleSound } = useSound();

  return (
    <button
      type="button"
      onClick={toggleSound}
      className="inline-flex size-9 items-center justify-center text-[color:var(--foreground)] opacity-70 transition hover:opacity-100"
      aria-label={enabled ? "Turn ambient sound off" : "Turn ambient sound on"}
      title={enabled ? "sound on" : "sound off"}
    >
      {enabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
    </button>
  );
}
