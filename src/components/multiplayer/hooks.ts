"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getRoomChannel, fetchRoom, fetchRoomMembers, fetchRoomMessages } from "@/lib/multiplayer/service";
import { ensureProfile, type PublicProfile } from "@/lib/profile/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { PresenceSession } from "@/types/database";
import type { RoomMemberView, RoomMessageView, StudyRoom } from "@/lib/multiplayer/service";

type RoomPresenceState = Record<string, PresenceSession[]>;

function flattenPresence(state: RoomPresenceState) {
  const users = new Map<string, PresenceSession>();

  Object.values(state).forEach((entries) => {
    entries.forEach((entry) => {
      if (entry.userId) {
        users.set(entry.userId, entry);
      }
    });
  });

  return Array.from(users.values());
}

export function useProfile() {
  const [profile, setProfile] = useState<PublicProfile | null>(null);

  useEffect(() => {
    let alive = true;
    void ensureProfile().then((nextProfile) => {
      if (alive) {
        setProfile(nextProfile);
      }
    });

    return () => {
      alive = false;
    };
  }, []);

  return profile;
}

export function useStudyRoom(roomId: string | null) {
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [members, setMembers] = useState<RoomMemberView[]>([]);
  const [messages, setMessages] = useState<RoomMessageView[]>([]);

  const refresh = useCallback(async () => {
    if (!roomId) {
      setRoom(null);
      setMembers([]);
      setMessages([]);
      return;
    }

    const [nextRoom, nextMembers, nextMessages] = await Promise.all([
      fetchRoom(roomId),
      fetchRoomMembers(roomId),
      fetchRoomMessages(roomId),
    ]);

    setRoom(nextRoom);
    setMembers(nextMembers);
    setMessages(nextMessages);
  }, [roomId]);

  useEffect(() => {
    queueMicrotask(() => void refresh());
  }, [refresh]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !roomId) {
      return;
    }

    const channel = supabase
      .channel(`postgres-room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, roomId]);

  return useMemo(() => ({ room, members, messages, refresh }), [members, messages, refresh, room]);
}

export function useRoomPresence(roomId: string | null, presence: PresenceSession | null) {
  const [online, setOnline] = useState<PresenceSession[]>([]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !roomId || !presence?.userId) {
      queueMicrotask(() => setOnline([]));
      return;
    }

    let channel: RealtimeChannel | null = supabase.channel(getRoomChannel(roomId), {
      config: { presence: { key: presence.userId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      if (!channel) {
        return;
      }

      setOnline(flattenPresence(channel.presenceState() as RoomPresenceState));
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED" && channel) {
        await channel.track(presence);
        setOnline(flattenPresence(channel.presenceState() as RoomPresenceState));
      }
    });

    return () => {
      if (channel) {
        void channel.untrack();
        void supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [presence, roomId]);

  return online;
}
