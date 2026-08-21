"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FeedbackDialog } from "@/components/feedback/feedback-dialog";
import { MultiplayerEntry } from "@/components/multiplayer/multiplayer-entry";
import { StudyRoom } from "@/components/multiplayer/study-room";
import { useProfile } from "@/components/multiplayer/hooks";
import { useCandlePresence } from "@/components/realtime/use-active-candles";
import { useSound } from "@/components/ui/sound-provider";
import { ensureAnonymousUser, type PublicProfile } from "@/lib/profile/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { CANDLE_DURATIONS, createSessionId, getCandleProgress } from "@/lib/candle/config";
import type { CandleType, PresenceSession } from "@/types/database";
import { CandlePictureInPicture } from "./candle-picture-in-picture";
import { CandleSelector } from "./candle-selector";
import { PixelCandle } from "./pixel-candle";

type StoredSession = PresenceSession & {
  duration: number;
  dbId?: string;
};

const STORAGE_KEY = "pixel-candle:active-session";
const MULTIPLAYER_ROOM_STORAGE_KEY = "pixel-candle:multiplayer-room";

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function CandleRoom() {
  const [selected, setSelected] = useState<CandleType>("medium");
  const [session, setSession] = useState<StoredSession | null>(null);
  const [mode, setMode] = useState<"solo" | "choose" | "multiplayer">("choose");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [lighting, setLighting] = useState(false);
  const loadedProfile = useProfile();
  const [profileOverride, setProfileOverride] = useState<PublicProfile | null>(null);
  const profile = profileOverride ?? loadedProfile;
  const { playMatch } = useSound();

  const progress = session ? getCandleProgress(session.startedAt, session.duration, now) : 0;
  const activePresence = session && !completed && progress < 1 ? session : null;

  useCandlePresence(activePresence);

  useEffect(() => {
    const storedRoomId = localStorage.getItem(MULTIPLAYER_ROOM_STORAGE_KEY);
    if (storedRoomId) {
      queueMicrotask(() => {
        setRoomId(storedRoomId);
        setMode("multiplayer");
      });
      return;
    }

    const stored = readStoredSession();
    if (!stored) {
      return;
    }

    const storedProgress = getCandleProgress(stored.startedAt, stored.duration);
    if (storedProgress >= 1) {
      queueMicrotask(() => setCompleted(true));
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    queueMicrotask(() => {
      setNow(Date.now());
      setSession(stored);
    });
  }, []);

  useEffect(() => {
    if (!session || completed) {
      return;
    }

    const frame = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(frame);
  }, [session, completed]);

  useEffect(() => {
    if (!session || completed || progress < 1) {
      return;
    }

    queueMicrotask(() => setCompleted(true));
    localStorage.removeItem(STORAGE_KEY);
    void completeDatabaseSession(session);
  }, [completed, progress, session]);

  async function lightCandle() {
    playMatch();
    setLighting(true);

    const nextSession: StoredSession = {
      sessionId: createSessionId(),
      candleType: selected,
      startedAt: Date.now(),
      duration: CANDLE_DURATIONS[selected],
    };

    const dbId = await createDatabaseSession(nextSession);
    const stored = { ...nextSession, dbId };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setNow(Date.now());
    setCompleted(false);
    setSession(stored);
    window.setTimeout(() => setLighting(false), 900);
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setCompleted(false);
    setNow(Date.now());
  }

  function enterRoom(nextRoomId: string) {
    localStorage.setItem(MULTIPLAYER_ROOM_STORAGE_KEY, nextRoomId);
    setRoomId(nextRoomId);
    setMode("multiplayer");
  }

  function leaveMultiplayer() {
    localStorage.removeItem(MULTIPLAYER_ROOM_STORAGE_KEY);
    setRoomId(null);
    setMode("choose");
  }

  const candleState = useMemo(() => {
    if (completed || progress >= 1) {
      return "done";
    }
    return session ? "burning" : "choosing";
  }, [completed, progress, session]);
  const visibleCandleType = session?.candleType ?? selected;

  return (
    <main className="grid min-h-dvh grid-rows-[1fr_auto_1fr] px-6 py-6 text-center">
      <section className="row-start-2 flex flex-col items-center">
        {mode !== "multiplayer" && (
          <div className="flex min-h-[22rem] items-center justify-center">
            <PixelCandle
              progress={candleState === "choosing" ? 0 : progress}
              candleType={visibleCandleType}
              seed={session?.sessionId ?? visibleCandleType}
              lit={candleState !== "choosing"}
              extinguished={candleState === "done"}
              lighting={lighting}
              size="room"
            />
          </div>
        )}

        <div className="mt-14 flex min-h-36 w-full justify-center">
          {mode === "choose" && candleState === "choosing" && (
            <div className="pixel-text flex flex-col items-center gap-8">
              <p className="text-sm text-[color:var(--foreground)]">light a candle</p>
              <div className="flex flex-col items-center gap-5">
                <button
                  type="button"
                  onClick={() => setMode("solo")}
                  className="text-sm text-[color:var(--foreground)] transition hover:text-[color:var(--ember)]"
                >
                  alone
                </button>
              </div>
            </div>
          )}

          {mode === "solo" && candleState === "choosing" && (
            <div className="flex flex-col items-center gap-8">
              <CandleSelector value={selected} onChange={setSelected} onLight={lightCandle} />
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="pixel-text text-xs text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
              >
                back
              </button>
            </div>
          )}

          {mode === "multiplayer" && !roomId && (
            <MultiplayerEntry
              profile={profile}
              onProfileChange={setProfileOverride}
              onRoom={enterRoom}
              onBack={() => setMode("choose")}
            />
          )}

          {mode === "multiplayer" && roomId && profile && (
            <StudyRoom roomId={roomId} profile={profile} onLeave={leaveMultiplayer} />
          )}

          {mode !== "multiplayer" && candleState === "done" && (
            <motion.div
              className="pixel-text flex flex-col items-center gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.8 }}
            >
              <p className="text-sm text-[color:var(--muted)]">candle burned out.</p>
              <button
                type="button"
                onClick={reset}
                className="text-sm text-[color:var(--foreground)] transition hover:text-[color:var(--ember)]"
              >
                light another
              </button>
            </motion.div>
          )}

          {mode !== "multiplayer" && candleState === "burning" && (
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={reset}
                className="pixel-text mt-10 text-xs text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
              >
                choose another candle
              </button>
              {session && (
                <CandlePictureInPicture
                  startedAt={session.startedAt}
                  duration={session.duration}
                  candleType={visibleCandleType}
                  seed={session.sessionId}
                />
              )}
            </div>
          )}
        </div>
      </section>

      <footer className="row-start-3 flex items-end justify-center">
        <FeedbackDialog />
      </footer>
    </main>
  );
}

async function createDatabaseSession(session: StoredSession) {
  const supabase = getSupabaseBrowserClient();
  const userId = await ensureAnonymousUser();

  if (!supabase || !userId) {
    return undefined;
  }

  const { data } = await supabase
    .from("candle_sessions")
    .insert({
      user_id: userId,
      candle_type: session.candleType,
      started_at: new Date(session.startedAt).toISOString(),
      duration_ms: session.duration,
      status: "active",
    })
    .select("id")
    .single();

  return data?.id;
}

async function completeDatabaseSession(session: StoredSession) {
  const supabase = getSupabaseBrowserClient();

  if (!supabase || !session.dbId) {
    return;
  }

  await supabase
    .from("candle_sessions")
    .update({ completed_at: new Date().toISOString(), status: "completed" })
    .eq("id", session.dbId);
}
