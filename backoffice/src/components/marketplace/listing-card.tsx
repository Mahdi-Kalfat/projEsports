import Image from "next/image";
import Link from "next/link";
import { formatPriceByType } from "@/lib/format";

export const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  DECLINED: "Declined",
  ARCHIVED: "Archived",
  SOLD: "Sold",
};

const STATUS_TONE: Record<string, string> = {
  PENDING: "bg-warning/15 text-warning",
  APPROVED: "bg-success/15 text-success",
  DECLINED: "bg-primary/15 text-primary",
  ARCHIVED: "bg-muted/15 text-muted",
  SOLD: "bg-accent/15 text-accent",
};

export const CATEGORY_LABEL: Record<string, string> = {
  ACCOUNT: "Account",
  IN_GAME_ITEM: "In-game item",
  BOOST_SERVICE: "Boost / service",
  GEAR: "Gear",
  OTHER: "Other",
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

export function ListingCard({ listing, href }: { listing: ListingCardData; href: string }) {
  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-xl border border-border bg-surface-raised transition hover:border-primary/60"
    >
      <div className="relative h-28 w-full bg-gradient-to-br from-surface to-surface-raised">
        {listing.imageUrl && (
          <Image src={listing.imageUrl} alt="" fill unoptimized className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-transparent to-black/30" />
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${
            STATUS_TONE[listing.status] ?? "bg-muted/15 text-muted"
          }`}
        >
          {STATUS_LABEL[listing.status] ?? listing.status}
        </span>
      </div>

      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {CATEGORY_LABEL[listing.category] ?? listing.category} · {listing.gameName ?? "All games"}
        </p>
        <h3 className="mt-1 font-display text-base font-bold text-foreground">{listing.title}</h3>
        {listing.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{listing.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            <p className="text-xs text-muted">Price</p>
            <p className="font-semibold text-foreground">{formatPriceByType(listing.priceType, listing.price)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Seller</p>
            <p className="font-semibold text-foreground">{listing.sellerUsername}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
