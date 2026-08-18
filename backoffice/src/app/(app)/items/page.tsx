import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildItemsHref } from "@/lib/items-query";
import { AddItemModal } from "@/components/items/add-item-modal";
import { ItemCard } from "@/components/items/item-card";
import { ItemDetailModal } from "@/components/items/item-detail-modal";

export const metadata: Metadata = {
  title: "Items — Back Office",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ItemsPage(props: PageProps<"/items">) {
  const searchParams = await props.searchParams;
  const itemId = firstParam(searchParams.itemId);

  const [items, selectedItem] = await Promise.all([
    prisma.item.findMany({ orderBy: { createdAt: "desc" } }),
    itemId ? prisma.item.findUnique({ where: { id: itemId } }) : Promise.resolve(null),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddItemModal />
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-border bg-surface-raised text-sm text-muted">
          No items yet — create the first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              href={buildItemsHref({ itemId: item.id })}
              item={{
                id: item.id,
                name: item.name,
                description: item.description,
                status: item.status,
                effectType: item.effectType,
                effectValue: item.effectValue,
                imageUrl: item.imageUrl,
              }}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <ItemDetailModal
          closeHref="/items"
          item={{
            id: selectedItem.id,
            name: selectedItem.name,
            description: selectedItem.description,
            status: selectedItem.status,
            effectType: selectedItem.effectType,
            effectValue: selectedItem.effectValue,
            imageUrl: selectedItem.imageUrl,
          }}
        />
      )}
    </div>
  );
}
