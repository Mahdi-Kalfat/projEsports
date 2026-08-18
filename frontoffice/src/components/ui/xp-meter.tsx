import Image from "next/image";
import { getRank, type RankOverride } from "@/lib/rank";
import { formatCompactNumber } from "@/lib/format";

// The one XP-progress treatment for the whole app — thicker glow-filled bar
// and tabular numerals so it reads as a scoreboard stat, not a form field.
// Used on the homepage, profile, and (in a later pass) anywhere else level
// progress is shown, per design plan §11.
export function XpMeter({
  level,
  xp,
  requiredXp,
  rankOverrides = [],
  size = "md",
}: {
  level: number;
  xp: number;
  requiredXp: number;
  rankOverrides?: RankOverride[];
  size?: "md" | "lg";
}) {
  const rank = getRank(level, rankOverrides);
  const pct = requiredXp > 0 ? Math.min(100, Math.round((xp / requiredXp) * 100)) : 100;
  const barHeight = size === "lg" ? "h-3" : "h-2";
  const imageSize = size === "lg" ? 56 : 40;

  return (
    <div className="flex items-center gap-4">
      <Image
        src={rank.image}
        alt={rank.name}
        width={imageSize}
        height={imageSize}
        unoptimized
        className="shrink-0 object-contain drop-shadow-[0_0_12px_rgba(255,30,60,0.35)]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-accent">{rank.name}</p>
          <p className="font-display text-sm font-bold tabular-nums text-foreground">LVL {level}</p>
        </div>
        <div className={`mt-2 w-full overflow-hidden rounded-full bg-canvas ${barHeight}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow shadow-[0_0_10px_rgba(255,30,60,0.7)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-right text-[11px] tabular-nums text-muted">
          {formatCompactNumber(xp)} / {formatCompactNumber(requiredXp)} XP
        </p>
      </div>
    </div>
  );
}
