"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { formatPriceByType } from "@/lib/format";
import type { InventoryItemData } from "@/lib/inventory";

const CATEGORY_LABEL: Record<string, string> = {
  AVATAR: "Avatar",
  BADGE: "Badge",
  BOOST: "Boost",
  VOUCHER: "Voucher",
  MERCH: "Merch",
  OTHER: "Other",
};

function formatAcquiredDate(date: Date) {
  return date.toLocaleDateString("en-US", { dateStyle: "medium" });
}

export function InventoryItemCard({ item }: { item: InventoryItemData }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="hover-glow group h-full overflow-hidden rounded-2xl border border-border bg-surface-raised transition-colors hover:border-accent/50"
    >
      <div className="relative h-24 w-full overflow-hidden bg-gradient-to-br from-surface to-surface-raised">
        {item.shopItem.imageUrl && (
          <Image
            src={item.shopItem.imageUrl}
            alt=""
            fill
            unoptimized
            className="object-contain p-3 transition duration-500 group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-surface-raised/10 to-transparent" />
        <span className="absolute right-2 top-2 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent ring-1 ring-accent/30 backdrop-blur-sm">
          {CATEGORY_LABEL[item.shopItem.category] ?? item.shopItem.category}
        </span>
      </div>

      <div className="p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {item.shopItem.gameName ?? "All games"}
        </p>
        <h3 className="mt-0.5 font-display text-sm font-bold text-foreground">{item.shopItem.title}</h3>
        {item.shopItem.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted">{item.shopItem.description}</p>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
          <div>
            <p className="text-muted">Value</p>
            <p className="font-semibold text-foreground">
              {formatPriceByType(item.shopItem.priceType, item.shopItem.price)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted">Acquired</p>
            <p className="font-semibold text-foreground">{formatAcquiredDate(item.acquiredAt)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
