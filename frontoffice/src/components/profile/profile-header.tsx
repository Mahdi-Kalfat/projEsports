import type { ReactNode } from "react";
import Image from "next/image";
import { getRank, type RankOverride } from "@/lib/rank";
import { formatCompactNumber, formatLastSeen } from "@/lib/format";
import { getProfileTheme } from "@/lib/profile-theme";
import { XpMeter } from "@/components/ui/xp-meter";

export type ProfileHeaderData = {
  username: string;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerImageUrl: string | null;
  profileTheme: string;
  level: number;
  points: number;
  ccCoins: number;
  xp: number;
  requiredXp: number;
  createdAt: Date;
  lastLoginAt: Date | null;
};

export function ProfileHeader({
  profile,
  action,
  rankOverrides = [],
}: {
  profile: ProfileHeaderData;
  action?: ReactNode;
  rankOverrides?: RankOverride[];
}) {
  const rank = getRank(profile.level, rankOverrides);
  const theme = getProfileTheme(profile.profileTheme);

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
            <div className="w-full min-w-52 rounded-xl border border-border bg-surface px-4 py-3">
              <XpMeter
                level={profile.level}
                xp={profile.xp}
                requiredXp={profile.requiredXp}
                rankOverrides={rankOverrides}
              />
            </div>
            {action}
          </div>
        </div>

        {profile.bio && (
          <p className="mt-5 whitespace-pre-wrap rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
            {profile.bio}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-5 text-center sm:grid-cols-4 sm:text-left">
          <div>
            <p className="text-xs text-muted">Points</p>
            <p className="font-display text-lg font-bold text-foreground">{formatCompactNumber(profile.points)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">CC Coins</p>
            <p className="font-display text-lg font-bold text-foreground">{formatCompactNumber(profile.ccCoins)}</p>
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
