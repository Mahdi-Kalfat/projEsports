"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Lock } from "lucide-react";
import { formatPriceByType } from "@/lib/format";

const CATEGORY_LABEL: Record<string, string> = {
  AVATAR: "Avatar",
  BADGE: "Badge",
  BOOST: "Boost",
  VOUCHER: "Voucher",
  MERCH: "Merch",
  OTHER: "Other",
};

export type ShopItemCardData = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priceType: string;
  price: number;
  stock: number | null;
  gameName: string | null;
  imageUrl: string | null;
};

export function ShopItemCard({ item }: { item: ShopItemCardData }) {
  const soldOut = item.stock !== null && item.stock <= 0;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="hover-glow group h-full overflow-hidden rounded-2xl border border-border bg-surface-raised transition-colors hover:border-accent/50"
    >
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-surface to-surface-raised">
        {item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-110"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-surface-raised/10 to-transparent" />
        <span className="absolute right-3 top-3 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent ring-1 ring-accent/30 backdrop-blur-sm">
          {CATEGORY_LABEL[item.category] ?? item.category}
        </span>
      </div>

      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{item.gameName ?? "All games"}</p>
        <h3 className="mt-1 font-display text-lg font-bold text-foreground">{item.title}</h3>
        {item.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{item.description}</p>}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
          <div>
            <p className="text-xs text-muted">Price</p>
            <p className="font-semibold text-foreground">{formatPriceByType(item.priceType, item.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Stock</p>
            <p className="font-semibold text-foreground">
              {item.stock === null ? "Unlimited" : soldOut ? "Sold out" : `${item.stock} left`}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-border py-2 text-xs font-medium uppercase tracking-wide text-muted"
        >
          <Lock size={12} />
          Coming soon
        </button>
      </div>
    </motion.div>
  );
}
