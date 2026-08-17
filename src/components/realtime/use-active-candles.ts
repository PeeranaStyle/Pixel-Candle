"use client";

import { useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { STUDY_ROOM_CHANNEL } from "@/lib/realtime/channel";
import type { PresenceSession } from "@/types/database";

type PresenceValue = PresenceSession | { presences?: PresenceSession[] };

function countPresence(state: Record<string, PresenceValue[]>) {
  const sessions = new Set<string>();

  Object.values(state).forEach((metas) => {
    metas.forEach((meta) => {
      if ("sessionId" in meta) {
        sessions.add(meta.sessionId);
        return;
      }

      meta.presences?.forEach((presence) => sessions.add(presence.sessionId));
    });
  });

  return sessions.size;
}

export function useActiveCandles() {
  const [count, setCount] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) return;

    const channel = supabase.channel(STUDY_ROOM_CHANNEL, {
      config: { presence: { key: "landing" } },
    });

    channel.on("presence", { event: "sync" }, () => {
      setCount(countPresence(channel.presenceState() as Record<string, PresenceValue[]>));
    });

    channel.subscribe((status) => {
      setIsConnected(status === "SUBSCRIBED");
      if (status === "SUBSCRIBED") {
        setCount(countPresence(channel.presenceState() as Record<string, PresenceValue[]>));
      }
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return useMemo(() => ({ count, isConnected }), [count, isConnected]);
}

export function useCandlePresence(presence: PresenceSession | null) {
  useEffect(() => {
    if (!presence) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    let channel: RealtimeChannel | null = supabase.channel(STUDY_ROOM_CHANNEL, {
      config: { presence: { key: presence.sessionId } },
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED" && channel) {
        await channel.track(presence);
      }
    });

    return () => {
      if (channel) {
        void channel.untrack();
        void supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [presence]);
}
