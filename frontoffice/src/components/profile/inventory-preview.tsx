import Image from "next/image";
import Link from "next/link";
import { Lock, Package } from "lucide-react";
import { formatPriceByType } from "@/lib/format";
import type { InventoryItemData } from "@/lib/inventory";

export function InventoryPreview({
  items,
  total,
  viewAllHref,
  canView,
}: {
  items: InventoryItemData[];
  total: number;
  viewAllHref?: string;
  canView: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-primary" />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
            Inventory{canView ? ` ${total}` : ""}
          </h3>
        </div>
        {canView && viewAllHref && total > 0 && (
          <Link href={viewAllHref} className="text-xs font-medium text-accent transition hover:text-foreground">
            View all
          </Link>
        )}
      </div>

      {!canView ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted">
          <Lock size={14} className="shrink-0" />
          This inventory is private.
        </div>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No items yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1">
          {items.map((entry) => (
            <li key={entry.id} className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/15 font-display text-xs font-semibold text-primary">
                {entry.shopItem.imageUrl ? (
                  <Image
                    src={entry.shopItem.imageUrl}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  entry.shopItem.title.slice(0, 1).toUpperCase()
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{entry.shopItem.title}</p>
                <p className="text-xs text-muted">
                  {formatPriceByType(entry.shopItem.priceType, entry.shopItem.price)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
