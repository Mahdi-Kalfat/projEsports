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
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-surface to-surface-raised">
        {item.shopItem.imageUrl && (
          <Image
            src={item.shopItem.imageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-surface-raised/10 to-transparent" />
        <span className="absolute right-3 top-3 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent ring-1 ring-accent/30 backdrop-blur-sm">
          {CATEGORY_LABEL[item.shopItem.category] ?? item.shopItem.category}
        </span>
      </div>

      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {item.shopItem.gameName ?? "All games"}
        </p>
        <h3 className="mt-1 font-display text-lg font-bold text-foreground">{item.shopItem.title}</h3>
        {item.shopItem.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{item.shopItem.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
          <div>
            <p className="text-xs text-muted">Value</p>
            <p className="font-semibold text-foreground">
              {formatPriceByType(item.shopItem.priceType, item.shopItem.price)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Acquired</p>
            <p className="font-semibold text-foreground">{formatAcquiredDate(item.acquiredAt)}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
