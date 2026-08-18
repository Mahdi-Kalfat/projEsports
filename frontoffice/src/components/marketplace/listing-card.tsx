"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { formatPriceByType } from "@/lib/format";
import { NoArtFallback } from "@/components/ui/no-art-fallback";

const CATEGORY_LABEL: Record<string, string> = {
  ACCOUNT: "Account",
  IN_GAME_ITEM: "In-game item",
  BOOST_SERVICE: "Boost / service",
  GEAR: "Gear",
  OTHER: "Other",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  DECLINED: "Declined",
  ARCHIVED: "Archived",
  SOLD: "Sold",
};

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-warning/15 text-warning ring-1 ring-warning/30",
  APPROVED: "bg-success/15 text-success ring-1 ring-success/30",
  DECLINED: "bg-primary/15 text-primary ring-1 ring-primary/30",
  ARCHIVED: "bg-muted/15 text-muted ring-1 ring-muted/20",
  SOLD: "bg-accent/15 text-accent ring-1 ring-accent/30",
};

export type ListingCardData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category: string;
  priceType: string;
  price: number;
  gameName: string | null;
  sellerUsername: string;
  imageUrl: string | null;
};

export function ListingCard({
  listing,
  showStatus = false,
  action,
}: {
  listing: ListingCardData;
  showStatus?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="hover-glow group h-full overflow-hidden rounded-2xl border border-border bg-surface-raised transition-colors hover:border-accent/50"
    >
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-surface to-surface-raised">
        {listing.imageUrl ? (
          <Image
            src={listing.imageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <NoArtFallback gameName={listing.gameName} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-surface-raised/10 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent ring-1 ring-accent/30 backdrop-blur-sm">
          {CATEGORY_LABEL[listing.category] ?? listing.category}
        </span>
        {showStatus && (
          <span
            className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${
              STATUS_TONE[listing.status] ?? "bg-muted/15 text-muted ring-1 ring-muted/20"
            }`}
          >
            {STATUS_LABEL[listing.status] ?? listing.status}
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{listing.gameName ?? "All games"}</p>
        <h3 className="mt-1 font-display text-lg font-bold text-foreground">{listing.title}</h3>
        {listing.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{listing.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
          <div>
            <p className="text-xs text-muted">Price</p>
            <p className="font-semibold text-foreground">{formatPriceByType(listing.priceType, listing.price)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Seller</p>
            <p className="font-semibold text-foreground">{listing.sellerUsername}</p>
          </div>
        </div>

        {action && <div className="mt-4">{action}</div>}
      </div>
    </motion.div>
  );
}
