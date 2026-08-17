import { CANDLE_DURATIONS } from "@/lib/candle/config";
import { ensureProfile } from "@/lib/profile/auth";
import { STUDY_ROOM_CHANNEL } from "@/lib/realtime/channel";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CandleType, Database } from "@/types/database";

export const DEFAULT_ROOM_CHAT_MODE = "limited" as const;

export function getRoomChannel(roomId: string) {
  return `${STUDY_ROOM_CHANNEL}:room:${roomId}`;
}

export type StudyRoom = Database["public"]["Tables"]["study_rooms"]["Row"];
export type RoomMember = Database["public"]["Tables"]["room_members"]["Row"];
export type RoomMessage = Database["public"]["Tables"]["room_messages"]["Row"];
export type StudyMatch = Database["public"]["Tables"]["matches"]["Row"];
export type CandleSessionRow = Database["public"]["Tables"]["candle_sessions"]["Row"];

export type RoomMemberView = RoomMember & {
  profiles: Pick<Database["public"]["Tables"]["profiles"]["Row"], "display_name" | "avatar_id"> | null;
  candle_sessions: Pick<CandleSessionRow, "id" | "candle_type" | "started_at" | "duration_ms" | "status"> | null;
};

export type RoomMessageView = RoomMessage & {
  profiles: Pick<Database["public"]["Tables"]["profiles"]["Row"], "display_name" | "avatar_id"> | null;
};

export async function createCandleSession(candleType: CandleType, startedAt = new Date()) {
  const supabase = getSupabaseBrowserClient();
  const profile = await ensureProfile();

  if (!supabase || !profile) {
    return null;
  }

  const { data } = await supabase
    .from("candle_sessions")
    .insert({
      user_id: profile.id,
      candle_type: candleType,
      started_at: startedAt.toISOString(),
      duration_ms: CANDLE_DURATIONS[candleType],
      status: "active",
    })
    .select("*")
    .single();

  return data ?? null;
}

export async function createSharedRoom(candleType: CandleType) {
  const supabase = getSupabaseBrowserClient();
  const profile = await ensureProfile();

  if (!supabase || !profile) {
    return null;
  }

  const session = await createCandleSession(candleType);
  if (!session) {
    return null;
  }

  const { data: room } = await supabase
    .from("study_rooms")
    .insert({
      type: "shared",
      status: "active",
      chat_mode: DEFAULT_ROOM_CHAT_MODE,
      max_members: 8,
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (!room) {
    return null;
  }

  await supabase.from("room_members").insert({
    room_id: room.id,
    user_id: profile.id,
    session_id: session.id,
    status: "studying",
  });

  return { room, session };
}

export async function joinSharedRoom(roomId: string, candleType: CandleType) {
  const supabase = getSupabaseBrowserClient();
  const profile = await ensureProfile();

  if (!supabase || !profile) {
    return null;
  }

  const { data: room } = await supabase
    .from("study_rooms")
    .select("*")
    .eq("id", roomId)
    .eq("type", "shared")
    .in("status", ["waiting", "active"])
    .maybeSingle();

  if (!room) {
    return null;
  }

  const session = await createCandleSession(candleType);
  if (!session) {
    return null;
  }

  await supabase.from("room_members").upsert({
    room_id: room.id,
    user_id: profile.id,
    session_id: session.id,
    status: "studying",
    left_at: null,
  });

  return { room, session };
}

export async function leaveRoom(roomId: string) {
  const supabase = getSupabaseBrowserClient();
  const profile = await ensureProfile();

  if (!supabase || !profile) {
    return;
  }

  await supabase
    .from("room_members")
    .update({ status: "left", left_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", profile.id);
}

export async function fetchRoom(roomId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.from("study_rooms").select("*").eq("id", roomId).maybeSingle();
  return data ?? null;
}

export async function fetchRoomMembers(roomId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("room_members")
    .select("*, profiles(display_name, avatar_id), candle_sessions(id, candle_type, started_at, duration_ms, status)")
    .eq("room_id", roomId)
    .is("left_at", null)
    .order("joined_at", { ascending: true })
    .returns<RoomMemberView[]>();

  return data ?? [];
}

export async function fetchRoomMessages(roomId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("room_messages")
    .select("*, profiles(display_name, avatar_id)")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(30)
    .returns<RoomMessageView[]>();

  return data ?? [];
}

export async function sendRoomMessage(roomId: string, message: string) {
  const supabase = getSupabaseBrowserClient();
  await ensureProfile();

  if (!supabase) {
    return { ok: false, error: "supabase unavailable" };
  }

  const { error } = await supabase.rpc("send_room_message", {
    p_room_id: roomId,
    p_message: message,
  });

  return { ok: !error, error: error?.message };
}

export async function startMatchSearch(candleType: CandleType) {
  const supabase = getSupabaseBrowserClient();
  const profile = await ensureProfile();

  if (!supabase || !profile) {
    return null;
  }

  const { data: room } = await supabase
    .from("study_rooms")
    .insert({
      type: "match",
      status: "waiting",
      max_members: 2,
      chat_mode: "off",
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (!room) {
    return null;
  }

  const { data: match } = await supabase
    .from("matches")
    .insert({
      room_id: room.id,
      user_a: profile.id,
      duration_ms: CANDLE_DURATIONS[candleType],
      status: "searching",
    })
    .select("*")
    .single();

  await supabase.from("room_members").insert({
    room_id: room.id,
    user_id: profile.id,
    status: "joined",
  });

  return match ?? null;
}
