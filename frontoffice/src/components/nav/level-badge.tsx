import Image from "next/image";
import { getRank } from "@/lib/rank";

export function LevelBadge({ level, size = 28 }: { level: number; size?: number }) {
  const rank = getRank(level);
  return (
    <span className="flex items-center gap-1.5" title={rank.name}>
      <Image src={rank.image} alt={rank.name} width={size} height={size} unoptimized className="object-contain" />
      <span className="font-display text-xs font-semibold text-foreground">Lvl {level}</span>
    </span>
  );
}
