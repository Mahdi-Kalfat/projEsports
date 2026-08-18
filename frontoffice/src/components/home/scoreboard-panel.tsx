import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Swords } from "lucide-react";
import { XpMeter } from "@/components/ui/xp-meter";
import { formatCompactNumber } from "@/lib/format";
import type { RankOverride } from "@/lib/rank";

export type NextMatch = {
  href: string;
  title: string;
  gameName: string;
  statusLabel: string;
  whenLabel: string;
} | null;

// First-viewport "thesis" of the logged-in homepage: this is the one panel that
// has to prove personalization exists at all (see design plan §13 — the prior
// homepage rendered the identical marketing pitch to a Level 43 player as to an
// anonymous visitor).
export function ScoreboardPanel({
  username,
  avatarUrl,
  level,
  xp,
  requiredXp,
  points,
  nextMatch,
  rankOverrides = [],
}: {
  username: string;
  avatarUrl: string | null;
  level: number;
  xp: number;
  requiredXp: number;
  points: number;
  nextMatch: NextMatch;
  rankOverrides?: RankOverride[];
}) {
  return (
    <div className="glass-panel relative h-full overflow-hidden rounded-2xl border border-border p-6 sm:p-8">
      <div
        className="bg-grid absolute inset-0 opacity-30"
        style={{ maskImage: "linear-gradient(to bottom, black, transparent)" }}
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-display text-2xl font-bold text-primary ring-2 ring-primary/30">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" width={64} height={64} unoptimized className="object-cover" />
            ) : (
              username.slice(0, 1).toUpperCase()
            )}
          </span>
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              Welcome back
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">{username}</h1>
          </div>
        </div>

        <div className="shrink-0 sm:text-right">
          <p className="text-xs text-muted">Points</p>
          <p className="font-display text-2xl font-bold tabular-nums text-foreground">
            {formatCompactNumber(points)}
          </p>
        </div>
      </div>

      <div className="relative mt-7 max-w-md">
        <XpMeter level={level} xp={xp} requiredXp={requiredXp} rankOverrides={rankOverrides} size="lg" />
      </div>

      <div className="relative mt-7 border-t border-border pt-5">
        {nextMatch ? (
          <Link
            href={nextMatch.href}
            className="group flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 transition hover:border-primary/60 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <Swords size={18} className="shrink-0 text-primary" />
              <div>
                <p className="text-xs text-muted">
                  {nextMatch.gameName} · {nextMatch.statusLabel}
                </p>
                <p className="font-display text-sm font-bold text-foreground">{nextMatch.title}</p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
              {nextMatch.whenLabel}
              <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : (
          <Link
            href="/tournaments"
            className="btn-neon inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-glow"
          >
            Browse tournaments
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
