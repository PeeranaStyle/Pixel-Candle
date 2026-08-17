import { NextRequest, NextResponse } from "next/server";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const attempts = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 3;

function isRateLimited(key: string) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  attempts.set(key, recent);

  return recent.length > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "local";

  if (isRateLimited(key)) {
    return NextResponse.json({ error: "Too many messages." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (message.length < 2 || message.length > 600) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      return NextResponse.json({ error: "Could not create session." }, { status: 401 });
    }
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Could not identify user." }, { status: 401 });
  }

  const { error } = await supabase.from("feedback").insert({ user_id: userId, message });

  if (error) {
    return NextResponse.json({ error: "Could not save feedback." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
