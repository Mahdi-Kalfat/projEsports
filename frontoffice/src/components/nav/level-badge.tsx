import Image from "next/image";
import { getRank, type RankOverride } from "@/lib/rank";

export function LevelBadge({
  level,
  rankOverrides = [],
  size = 28,
}: {
  level: number;
  rankOverrides?: RankOverride[];
  size?: number;
}) {
  const rank = getRank(level, rankOverrides);
  return (
    <span className="flex items-center gap-1.5" title={rank.name}>
      <Image src={rank.image} alt={rank.name} width={size} height={size} unoptimized className="object-contain" />
      <span className="font-display text-xs font-semibold text-foreground">Lvl {level}</span>
    </span>
  );
}
