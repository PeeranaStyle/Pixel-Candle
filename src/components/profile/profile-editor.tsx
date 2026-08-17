"use client";

import { useState } from "react";
import { updateProfile, type PublicProfile } from "@/lib/profile/auth";

const avatars = ["ember", "wax", "wick", "glow"];

export function ProfileEditor({
  profile,
  onChange,
}: {
  profile: PublicProfile | null;
  onChange: (profile: PublicProfile) => void;
}) {
  const [name, setName] = useState(profile?.display_name ?? "");

  async function save() {
    const nextProfile = await updateProfile({ displayName: name || "quiet flame", avatarId: profile?.avatar_id });
    if (nextProfile) {
      onChange(nextProfile);
    }
  }

  if (!profile) {
    return <p className="pixel-text text-xs text-[color:var(--muted)]">setting up profile</p>;
  }

  return (
    <div className="pixel-text flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-[color:var(--ember)]">{profile.avatar_id}</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value.slice(0, 32))}
          onBlur={save}
          className="w-48 border-b border-[color:var(--muted)] bg-transparent px-1 py-1 text-center text-sm outline-none"
          aria-label="display name"
        />
      </div>
      <div className="flex gap-3">
        {avatars.map((avatar) => (
          <button
            key={avatar}
            type="button"
            onClick={async () => {
              const nextProfile = await updateProfile({ displayName: name || profile.display_name, avatarId: avatar });
              if (nextProfile) {
                onChange(nextProfile);
              }
            }}
            className={`text-xs transition ${
              profile.avatar_id === avatar
                ? "text-[color:var(--foreground)] underline underline-offset-4"
                : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            }`}
          >
            {avatar}
          </button>
        ))}
      </div>
    </div>
  );
}
