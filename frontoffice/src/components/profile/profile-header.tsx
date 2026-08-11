import type { ReactNode } from "react";
import Image from "next/image";
import { getRank } from "@/lib/rank";
import { formatCompactNumber, formatLastSeen } from "@/lib/format";
import { getProfileTheme } from "@/lib/profile-theme";

export type ProfileHeaderData = {
  username: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerImageUrl: string | null;
  profileTheme: string;
  level: number;
  points: number;
  xp: number;
  requiredXp: number;
  createdAt: Date;
  lastLoginAt: Date | null;
};

export function ProfileHeader({ profile, action }: { profile: ProfileHeaderData; action?: ReactNode }) {
  const rank = getRank(profile.level);
  const theme = getProfileTheme(profile.profileTheme);
  const xpPct = profile.requiredXp > 0 ? Math.min(100, Math.round((profile.xp / profile.requiredXp) * 100)) : 100;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
      <div className="relative h-32 overflow-hidden sm:h-40">
        {profile.bannerImageUrl ? (
          <>
            <Image src={profile.bannerImageUrl} alt="" fill unoptimized className="object-cover" />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(to bottom right, ${theme.hex}33, transparent 60%)` }}
            />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to bottom right, ${theme.hex}40, var(--surface-raised) 55%, ${theme.hex}22)` }}
          />
        )}
        <div className="bg-grid absolute inset-0 opacity-50" />
      </div>

      <div className="relative px-6 pb-6 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-end sm:text-left">
            <div
              className="relative -mt-16 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-surface-raised bg-primary/15 font-display text-4xl font-bold text-primary"
              style={{ boxShadow: `0 0 0 4px ${theme.hex}66, 0 0 28px 6px ${theme.glow}` }}
            >
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt="" width={112} height={112} unoptimized className="object-cover" />
              ) : (
                profile.username.slice(0, 1).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">{profile.username}</h1>
              {profile.fullName && <p className="text-sm text-muted">{profile.fullName}</p>}
              <p className="mt-1 font-display text-xs font-semibold uppercase tracking-wide" style={{ color: theme.hex }}>
                {rank.name}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 sm:items-end">
            <div className="w-full min-w-44 rounded-xl border border-border bg-surface px-3.5 py-2">
              <div className="flex items-center gap-2.5">
                <Image src={rank.image} alt={rank.name} width={36} height={36} unoptimized className="object-contain" />
                <div className="text-left">
                  <p className="text-xs text-muted">Level</p>
                  <p className="font-display text-lg font-bold leading-none text-foreground">{profile.level}</p>
                </div>
              </div>
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-[11px] text-muted">
                  {formatCompactNumber(profile.xp)} / {formatCompactNumber(profile.requiredXp)} XP
                </p>
              </div>
            </div>
            {action}
          </div>
        </div>

        {profile.bio && (
          <p className="mt-5 whitespace-pre-wrap rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
            {profile.bio}
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center sm:text-left">
          <div>
            <p className="text-xs text-muted">Points</p>
            <p className="font-display text-lg font-bold text-foreground">{formatCompactNumber(profile.points)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Member since</p>
            <p className="font-display text-lg font-bold text-foreground">{profile.createdAt.getFullYear()}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Status</p>
            <p className="font-display text-lg font-bold text-foreground">{formatLastSeen(profile.lastLoginAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
