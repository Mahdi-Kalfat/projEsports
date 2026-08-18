"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { generateDiscordLinkCode, unlinkDiscord } from "@/app/(app)/profile/actions";

// Discord's own brand color ("blurple") — same per-brand-accent convention as
// lib/game-identity.ts (Valorant red, Rocket League cyan, etc.), applied via
// inline style since it's a one-off brand hex, not a theme token.
const DISCORD_BLURPLE = "#5865F2";

function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 127.14 96.36" fill="currentColor" aria-hidden="true">
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  );
}

// The linked member's own Discord avatar, with a small Discord glyph badge
// overlaid on the corner (same spot Discord itself uses for online-status
// dots) so it still reads as "this is the Discord connection" at a glance.
// Falls back to a plain blurple glyph badge for accounts linked before
// discordAvatarUrl started being captured.
function DiscordAvatar({ avatarUrl, size = 44 }: { avatarUrl: string | null; size?: number }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center rounded-full text-white"
          style={{ background: DISCORD_BLURPLE, boxShadow: `0 0 16px -4px ${DISCORD_BLURPLE}` }}
        >
          <DiscordIcon size={size * 0.45} />
        </span>
      )}
      <span
        className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white ring-2 ring-surface"
        style={{ background: DISCORD_BLURPLE }}
      >
        <DiscordIcon size={9} />
      </span>
    </span>
  );
}

export function DiscordLinkCard({
  isSelf,
  discordUsername,
  discordGlobalName,
  discordAvatarUrl,
}: {
  isSelf: boolean;
  discordUsername: string | null;
  discordGlobalName: string | null;
  discordAvatarUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [linkCode, setLinkCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateDiscordLinkCode();
      if ("error" in result) setError(result.error);
      else setLinkCode(result);
    });
  }

  function handleUnlink() {
    setError(null);
    startTransition(async () => {
      const result = await unlinkDiscord();
      if (result.error) setError(result.error);
      else setLinkCode(null);
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <div className="flex items-center gap-2">
        <span style={{ color: DISCORD_BLURPLE }}>
          <DiscordIcon size={16} />
        </span>
        <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">Discord</h3>
      </div>

      {discordUsername ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
          <DiscordAvatar avatarUrl={discordAvatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{discordGlobalName ?? discordUsername}</p>
            <p className="truncate text-xs text-muted">@{discordUsername}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Connected
          </span>
        </div>
      ) : isSelf && linkCode ? (
        <div className="mt-3 rounded-xl border border-dashed border-border bg-surface p-4 text-center">
          <p className="font-display text-2xl font-bold tracking-[0.3em] text-accent">{linkCode.code}</p>
          <p className="mt-2 text-xs text-muted">
            In your Discord server, run{" "}
            <span className="font-medium text-foreground">/link {linkCode.code}</span>
          </p>
          <p className="mt-1 text-[11px] text-muted">Expires in 10 minutes</p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">
          {isSelf ? "You haven't linked Discord yet." : "Hasn't linked Discord yet."}
        </p>
      )}

      {isSelf &&
        (discordUsername ? (
          <button
            type="button"
            onClick={handleUnlink}
            disabled={pending}
            className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={pending}
            style={{ background: DISCORD_BLURPLE }}
            className="mt-3 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DiscordIcon size={14} />
            {pending ? "Generating…" : linkCode ? "Generate a new code" : "Connect Discord"}
          </button>
        ))}

      {error && <p className="mt-2 text-xs text-primary-glow">{error}</p>}
    </div>
  );
}
