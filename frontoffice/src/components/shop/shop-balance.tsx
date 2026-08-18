import { Coins, Sparkles } from "lucide-react";

export function ShopBalance({ ccCoins, points }: { ccCoins: number; points: number }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-raised px-4 py-2.5">
      <div className="flex items-center gap-2">
        <Coins size={16} className="text-accent" />
        <div>
          <p className="text-[11px] text-muted">Your cc</p>
          <p className="font-display text-sm font-bold text-foreground">{ccCoins.toLocaleString("en-US")}</p>
        </div>
      </div>
      <div className="h-8 w-px bg-border" />
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        <div>
          <p className="text-[11px] text-muted">Your points</p>
          <p className="font-display text-sm font-bold text-foreground">{points.toLocaleString("en-US")}</p>
        </div>
      </div>
    </div>
  );
}
