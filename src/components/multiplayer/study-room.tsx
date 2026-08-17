"use client";

import { useEffect, useMemo, useState } from "react";
import { PixelCandle } from "@/components/candle/pixel-candle";
import { useRoomPresence, useStudyRoom } from "@/components/multiplayer/hooks";
import { RoomChat } from "@/components/multiplayer/room-chat";
import { getCandleProgress } from "@/lib/candle/config";
import { leaveRoom } from "@/lib/multiplayer/service";
import type { PresenceSession } from "@/types/database";
import type { PublicProfile } from "@/lib/profile/auth";

export function StudyRoom({
  roomId,
  profile,
  onLeave,
}: {
  roomId: string;
  profile: PublicProfile;
  onLeave: () => void;
}) {
  const { room, members, messages, refresh } = useStudyRoom(roomId);
  const [now, setNow] = useState(0);
  const ownMember = members.find((member) => member.user_id === profile.id);
  const ownSession = ownMember?.candle_sessions;
  const presence: PresenceSession | null = ownSession
    ? {
        userId: profile.id,
        sessionId: ownSession.id,
        candleType: ownSession.candle_type,
        startedAt: new Date(ownSession.started_at).getTime(),
        duration: ownSession.duration_ms,
        status: ownMember.status,
        displayName: profile.display_name,
        avatarId: profile.avatar_id,
      }
    : null;
  const online = useRoomPresence(roomId, presence);
  const onlineIds = useMemo(() => new Set(online.map((item) => item.userId)), [online]);

  useEffect(() => {
    queueMicrotask(() => setNow(performance.timeOrigin + performance.now()));
    const interval = window.setInterval(() => setNow(performance.timeOrigin + performance.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  async function leave() {
    await leaveRoom(roomId);
    onLeave();
  }

  if (!room) {
    return <p className="pixel-text text-xs text-[color:var(--muted)]">entering room</p>;
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="pixel-text flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-[color:var(--foreground)]">study room</p>
        <p className="text-xs text-[color:var(--muted)]">{members.length} people studying</p>
        <p className="text-xs text-[color:var(--muted)]">room {room.id.slice(0, 8)}</p>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4">
        {members.map((member) => {
          const session = member.candle_sessions;
          const progress = session
            ? getCandleProgress(new Date(session.started_at).getTime(), session.duration_ms, now)
            : 0;
          const onlineNow = onlineIds.has(member.user_id);

          return (
            <div key={member.user_id} className="pixel-text flex flex-col items-center gap-3 text-center">
              <PixelCandle
                progress={progress}
                candleType={session?.candle_type ?? "medium"}
                seed={session?.id ?? member.user_id}
                lit={member.status !== "left"}
                extinguished={progress >= 1 || member.status === "completed"}
              />
              <div>
                <p className="text-xs text-[color:var(--foreground)]">
                  {member.profiles?.display_name ?? "quiet flame"}
                </p>
                <p className="text-xs text-[color:var(--muted)]">{onlineNow ? "online" : "away"}</p>
              </div>
            </div>
          );
        })}
      </div>

      <RoomChat
        roomId={roomId}
        chatMode={room.chat_mode}
        messages={messages}
        currentUserId={profile.id}
        onSent={refresh}
      />

      <button
        type="button"
        onClick={leave}
        className="pixel-text text-xs text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
      >
        leave room
      </button>
    </div>
  );
}
