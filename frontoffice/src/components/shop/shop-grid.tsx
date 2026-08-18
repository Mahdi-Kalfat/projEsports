"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { ShopItemCard, type ShopItemCardData } from "./shop-item-card";
import { Reveal } from "@/components/ui/reveal";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "CC_GRANT", label: "CC" },
  { key: "POINTS_GRANT", label: "Points" },
  { key: "XP_BOOST", label: "XP Boost" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export function ShopGrid({ items, isGuest = false }: { items: ShopItemCardData[]; isGuest?: boolean }) {
  const [filter, setFilter] = useState<FilterKey>("ALL");

  const visibleItems =
    filter === "ALL" ? items : items.filter((item) => item.grantsItemEffectType === filter);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              filter === f.key
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-surface-raised text-muted hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised text-center text-sm text-muted">
          <ShoppingBag size={28} className="text-muted/50" />
          Nothing in this category right now.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleItems.map((item, i) => (
            <Reveal key={item.id} delay={Math.min(i * 0.05, 0.3)}>
              <ShopItemCard item={item} isGuest={isGuest} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
