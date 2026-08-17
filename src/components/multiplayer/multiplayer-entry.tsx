"use client";

import { useState } from "react";
import { ProfileEditor } from "@/components/profile/profile-editor";
import { CANDLE_LABELS } from "@/lib/candle/config";
import { createSharedRoom, joinSharedRoom, startMatchSearch } from "@/lib/multiplayer/service";
import type { CandleType } from "@/types/database";
import type { PublicProfile } from "@/lib/profile/auth";

const types = Object.keys(CANDLE_LABELS) as CandleType[];

export function MultiplayerEntry({
  profile,
  onProfileChange,
  onRoom,
  onBack,
}: {
  profile: PublicProfile | null;
  onProfileChange: (profile: PublicProfile) => void;
  onRoom: (roomId: string) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<CandleType>("medium");
  const [joinId, setJoinId] = useState("");
  const [status, setStatus] = useState("");

  async function createRoom() {
    setStatus("lighting room");
    const result = await createSharedRoom(selected);
    if (result) {
      onRoom(result.room.id);
      return;
    }

    setStatus("could not create room");
  }

  async function joinRoom() {
    if (!joinId.trim()) {
      return;
    }

    setStatus("joining room");
    const result = await joinSharedRoom(joinId.trim(), selected);
    if (result) {
      onRoom(result.room.id);
      return;
    }

    setStatus("room not found");
  }

  async function findMatch() {
    setStatus("searching");
    const match = await startMatchSearch(selected);
    setStatus(match ? "searching for another flame" : "could not start match");
  }

  return (
    <div className="pixel-text flex w-full max-w-xl flex-col items-center gap-8 text-center">
      <ProfileEditor profile={profile} onChange={onProfileChange} />

      <div className="flex items-center gap-4" role="radiogroup" aria-label="Choose multiplayer candle size">
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelected(type)}
            className={`px-2 py-1 text-sm transition ${
              selected === type
                ? "text-[color:var(--foreground)] underline underline-offset-8"
                : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            }`}
            role="radio"
            aria-checked={selected === type}
          >
            {CANDLE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="flex flex-col items-center gap-5">
        <button
          type="button"
          onClick={createRoom}
          className="text-sm text-[color:var(--foreground)] transition hover:text-[color:var(--ember)]"
        >
          shared room
        </button>

        <div className="flex w-full max-w-md items-end gap-3">
          <input
            value={joinId}
            onChange={(event) => setJoinId(event.target.value)}
            className="min-w-0 flex-1 border-b border-[color:var(--muted)] bg-transparent px-1 py-1 text-center text-xs outline-none"
            placeholder="room id"
            aria-label="room id"
          />
          <button
            type="button"
            onClick={joinRoom}
            className="text-xs text-[color:var(--foreground)] transition hover:text-[color:var(--ember)]"
          >
            join
          </button>
        </div>

        <button
          type="button"
          onClick={findMatch}
          className="text-sm text-[color:var(--foreground)] transition hover:text-[color:var(--ember)]"
        >
          find a match
        </button>
      </div>

      {status && <p className="text-xs text-[color:var(--muted)]">{status}</p>}

      <button
        type="button"
        onClick={onBack}
        className="text-xs text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
      >
        back
      </button>
    </div>
  );
}
