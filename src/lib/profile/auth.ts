import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type PublicProfile = Database["public"]["Tables"]["profiles"]["Row"];

const avatarIds = ["ember", "wax", "wick", "glow"];

function createDisplayName(userId: string) {
  return `flame ${userId.slice(0, 4)}`;
}

export async function ensureAnonymousUser() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    return data.user.id;
  }

  const { data: authData, error } = await supabase.auth.signInAnonymously();
  if (error) {
    return null;
  }

  return authData.user?.id ?? null;
}

export async function ensureProfile() {
  const supabase = getSupabaseBrowserClient();
  const userId = await ensureAnonymousUser();

  if (!supabase || !userId) {
    return null;
  }

  const { data: existing } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (existing) {
    return existing;
  }

  const avatarId = avatarIds[Math.abs(userId.charCodeAt(0) + userId.charCodeAt(1)) % avatarIds.length];
  const { data } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      display_name: createDisplayName(userId),
      avatar_id: avatarId,
    })
    .select("*")
    .single();

  return data ?? null;
}

export async function updateProfile(input: { displayName: string; avatarId?: string }) {
  const supabase = getSupabaseBrowserClient();
  const userId = await ensureAnonymousUser();

  if (!supabase || !userId) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName.trim().slice(0, 32),
      avatar_id: input.avatarId,
    })
    .eq("id", userId)
    .select("*")
    .single();

  return data ?? null;
}
