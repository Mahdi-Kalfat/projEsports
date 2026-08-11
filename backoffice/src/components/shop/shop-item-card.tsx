import Image from "next/image";
import Link from "next/link";
import { formatPriceByType } from "@/lib/format";

export const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-muted/15 text-muted",
  ACTIVE: "bg-success/15 text-success",
  ARCHIVED: "bg-muted/15 text-muted",
};

export const CATEGORY_LABEL: Record<string, string> = {
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
  status: string;
  category: string;
  priceType: string;
  price: number;
  stock: number | null;
  gameName: string | null;
  imageUrl: string | null;
};

export function ShopItemCard({ item, href }: { item: ShopItemCardData; href: string }) {
  const soldOut = item.stock !== null && item.stock <= 0;

  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-xl border border-border bg-surface-raised transition hover:border-primary/60"
    >
      <div className="relative h-28 w-full bg-gradient-to-br from-surface to-surface-raised">
        {item.imageUrl && (
          <Image src={item.imageUrl} alt="" fill unoptimized className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-transparent to-black/30" />
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${
            STATUS_TONE[item.status] ?? "bg-muted/15 text-muted"
          }`}
        >
          {STATUS_LABEL[item.status] ?? item.status}
        </span>
      </div>

      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {CATEGORY_LABEL[item.category] ?? item.category} · {item.gameName ?? "All games"}
        </p>
        <h3 className="mt-1 font-display text-base font-bold text-foreground">{item.title}</h3>
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{item.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            <p className="text-xs text-muted">Price</p>
            <p className="font-semibold text-foreground">{formatPriceByType(item.priceType, item.price)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Stock</p>
            <p className="font-semibold text-foreground">
              {item.stock === null ? "Unlimited" : soldOut ? "Sold out" : `${item.stock} left`}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
