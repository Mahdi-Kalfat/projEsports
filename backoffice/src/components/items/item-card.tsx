import Image from "next/image";
import Link from "next/link";
import { describeItemEffect } from "@/lib/item-effects";

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

export type ItemCardData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  effectType: string;
  effectValue: number;
  imageUrl: string | null;
};

export function ItemCard({ item, href }: { item: ItemCardData; href: string }) {
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
          {describeItemEffect(item.effectType, item.effectValue)}
        </p>
        <h3 className="mt-1 font-display text-base font-bold text-foreground">{item.name}</h3>
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{item.description}</p>
        )}
      </div>
    </Link>
  );
}
