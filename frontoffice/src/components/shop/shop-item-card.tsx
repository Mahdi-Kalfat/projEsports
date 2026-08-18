"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { formatPriceByType } from "@/lib/format";
import { getItemEffectImage } from "@/lib/item-effects";
import { NoArtFallback } from "@/components/ui/no-art-fallback";
import { LockedButton } from "@/components/ui/locked-button";
import { SignInToContinueButton } from "@/components/ui/sign-in-button";
import { BuyShopItemButton } from "./buy-shop-item-button";

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
  purchasable: boolean;
  imageUrl: string | null;
  // Effect type of the Item this shop listing grants on approval (cc/points/xp
  // bundles) — used to pick stock artwork when the listing has no imageUrl of
  // its own. null for cosmetic/non-granting listings (avatars, badges, merch).
  grantsItemEffectType: string | null;
};

export function ShopItemCard({ item, isGuest = false }: { item: ShopItemCardData; isGuest?: boolean }) {
  const soldOut = item.stock !== null && item.stock <= 0;
  const imageSrc =
    item.imageUrl ?? (item.grantsItemEffectType ? getItemEffectImage(item.grantsItemEffectType) : undefined);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="hover-glow group h-full overflow-hidden rounded-2xl border border-border bg-surface-raised transition-colors hover:border-accent/50"
    >
      <div className="relative h-24 w-full overflow-hidden bg-gradient-to-br from-surface to-surface-raised">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            unoptimized
            className="object-contain p-3 transition duration-500 group-hover:scale-110"
          />
        ) : (
          <NoArtFallback gameName={item.gameName} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-surface-raised/10 to-transparent" />
        <span className="absolute right-2 top-2 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent ring-1 ring-accent/30 backdrop-blur-sm">
          {CATEGORY_LABEL[item.category] ?? item.category}
        </span>
      </div>

      <div className="p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{item.gameName ?? "All games"}</p>
        <h3 className="mt-0.5 font-display text-sm font-bold text-foreground">{item.title}</h3>
        {item.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{item.description}</p>}

        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs">
          <div>
            <p className="text-muted">Price</p>
            <p className="font-semibold text-foreground">{formatPriceByType(item.priceType, item.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted">Stock</p>
            <p className="font-semibold text-foreground">
              {item.stock === null ? "Unlimited" : soldOut ? "Sold out" : `${item.stock} left`}
            </p>
          </div>
        </div>

        <div className="mt-3">
          {item.purchasable && !soldOut ? (
            isGuest ? (
              <SignInToContinueButton label="Sign in to buy" className="w-full" />
            ) : (
              <BuyShopItemButton shopItemId={item.id} />
            )
          ) : (
            <LockedButton label={item.purchasable && soldOut ? "Sold out" : "Coming soon"} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
