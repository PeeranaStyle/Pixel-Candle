"use client";

import { useEffect, useMemo, useState } from "react";
import { sendRoomMessage } from "@/lib/multiplayer/service";
import type { ChatMode } from "@/types/database";
import type { RoomMessageView } from "@/lib/multiplayer/service";

export function RoomChat({
  roomId,
  chatMode,
  messages,
  currentUserId,
  onSent,
}: {
  roomId: string;
  chatMode: ChatMode;
  messages: RoomMessageView[];
  currentUserId?: string;
  onSent: () => void;
}) {
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(0);
  const lastOwnMessage = useMemo(
    () => [...messages].reverse().find((item) => item.user_id === currentUserId),
    [currentUserId, messages],
  );
  const nextMessageAt = lastOwnMessage ? new Date(lastOwnMessage.created_at).getTime() + 60_000 : 0;
  const secondsLeft = Math.max(0, Math.ceil((nextMessageAt - now) / 1000));

  useEffect(() => {
    queueMicrotask(() => setNow(performance.timeOrigin + performance.now()));
    const interval = window.setInterval(() => setNow(performance.timeOrigin + performance.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (chatMode === "off") {
    return <p className="pixel-text text-xs text-[color:var(--muted)]">messages are off</p>;
  }

  async function submit() {
    if (!message.trim()) {
      return;
    }

    const result = await sendRoomMessage(roomId, message);
    if (!result.ok) {
      setNotice(secondsLeft > 0 ? `next message in ${secondsLeft}s` : result.error ?? "message failed");
      return;
    }

    setMessage("");
    setNotice("");
    onSent();
  }

  return (
    <div className="pixel-text flex w-full max-w-xl flex-col gap-4 text-left">
      <div className="flex max-h-44 flex-col gap-2 overflow-y-auto border-y border-[rgba(39,32,25,0.16)] py-4">
        {messages.length === 0 && <p className="text-xs text-[color:var(--muted)]">quiet room</p>}
        {messages.map((item) => (
          <p key={item.id} className="text-xs text-[color:var(--foreground)]">
            <span className="text-[color:var(--muted)]">{item.profiles?.display_name ?? "flame"}: </span>
            {item.message}
          </p>
        ))}
      </div>
      <div className="flex items-end gap-3">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value.slice(0, 280))}
          className="min-h-16 flex-1 resize-none border border-[rgba(39,32,25,0.18)] bg-[color:var(--paper)] px-3 py-2 text-xs outline-none"
          placeholder={secondsLeft > 0 ? `next message in ${secondsLeft}s` : "say something quiet"}
          aria-label="room message"
        />
        <button
          type="button"
          onClick={submit}
          className="pb-2 text-xs text-[color:var(--foreground)] transition hover:text-[color:var(--ember)]"
        >
          send
        </button>
      </div>
      {notice && <p className="text-xs text-[color:var(--muted)]">{notice}</p>}
    </div>
  );
}
