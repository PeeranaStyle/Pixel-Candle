"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "pixel-candle:sound";
const MUSIC_SRC = "/Music/Velvet%20Keys%20(Lamp%20Lo-Fi%20Hip-Hop).mp3";
const MATCH_SRC = "/oxidvideos-lighting-a-match-465391.mp3";
const MUSIC_VOLUME = 0.06;
const CLICK_VOLUME = 0.16;
const MATCH_VOLUME = 0.32;

type SoundContextValue = {
  enabled: boolean;
  playMatch: () => void;
  toggleSound: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

function canClick(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest("button, a, input, textarea, select, [role='button'], [role='radio']"));
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const matchAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(false);

  const playMusic = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.volume = MUSIC_VOLUME;
    await audio.play();
  }, []);

  const playClick = useCallback(() => {
    if (!enabled) {
      return;
    }

    const AudioContextConstructor =
      window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    const context = audioContextRef.current ?? new AudioContextConstructor();
    audioContextRef.current = context;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(640, now);
    oscillator.frequency.exponentialRampToValueAtTime(360, now + 0.045);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(CLICK_VOLUME, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.06);
  }, [enabled]);

  const playMatch = useCallback(() => {
    if (!enabled) {
      return;
    }

    const audio = matchAudioRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    audio.volume = MATCH_VOLUME;
    void audio.play().catch(() => {});
  }, [enabled]);

  useEffect(() => {
    const audio = new Audio(MUSIC_SRC);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = MUSIC_VOLUME;
    audioRef.current = audio;

    const matchAudio = new Audio(MATCH_SRC);
    matchAudio.preload = "auto";
    matchAudio.volume = MATCH_VOLUME;
    matchAudioRef.current = matchAudio;

    queueMicrotask(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      setEnabled(stored === null ? true : stored === "on");
      setReady(true);
    });

    return () => {
      audio.pause();
      audioRef.current = null;
      matchAudio.pause();
      matchAudioRef.current = null;
      void audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");

    if (enabled) {
      void playMusic().catch(() => {
        // First gesture handler below will retry.
      });
      return;
    }

    audioRef.current?.pause();
  }, [enabled, playMusic, ready]);

  useEffect(() => {
    function resumeAfterGesture() {
      if (enabled) {
        void playMusic().catch(() => {});
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (canClick(event.target)) {
        playClick();
      }

      resumeAfterGesture();
    }

    window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("keydown", resumeAfterGesture);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("keydown", resumeAfterGesture);
    };
  }, [enabled, playClick, playMusic]);

  const value = useMemo(
    () => ({
      enabled,
      playMatch,
      toggleSound: () => setEnabled((current) => !current),
    }),
    [enabled, playMatch],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const value = useContext(SoundContext);

  if (!value) {
    throw new Error("useSound must be used within SoundProvider");
  }

  return value;
}
