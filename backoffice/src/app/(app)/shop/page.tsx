import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildShopHref } from "@/lib/shop-query";
import { AddShopItemModal } from "@/components/shop/add-shop-item-modal";
import { ShopItemCard } from "@/components/shop/shop-item-card";
import { ShopItemDetailModal } from "@/components/shop/shop-item-detail-modal";

export const metadata: Metadata = {
  title: "Shop — Back Office",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShopPage(props: PageProps<"/shop">) {
  const searchParams = await props.searchParams;
  const itemId = firstParam(searchParams.itemId);

  const [items, games, selectedItem] = await Promise.all([
    prisma.shopItem.findMany({
      orderBy: { createdAt: "desc" },
      include: { game: true },
    }),
    prisma.game.findMany({ orderBy: { name: "asc" } }),
    itemId
      ? prisma.shopItem.findUnique({ where: { id: itemId }, include: { game: true } })
      : Promise.resolve(null),
  ]);

  const gameOptions = games.map((game) => ({ id: game.id, name: game.name }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddShopItemModal games={gameOptions} />
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-border bg-surface-raised text-sm text-muted">
          No shop items yet — create the first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ShopItemCard
              key={item.id}
              href={buildShopHref({ itemId: item.id })}
              item={{
                id: item.id,
                title: item.title,
                description: item.description,
                status: item.status,
                category: item.category,
                priceType: item.priceType,
                price: item.price,
                stock: item.stock,
                gameName: item.game?.name ?? null,
                imageUrl: item.imageUrl,
              }}
            />
          ))}
        </div>
      )}

      {selectedItem && (
        <ShopItemDetailModal
          closeHref="/shop"
          games={gameOptions}
          item={{
            id: selectedItem.id,
            title: selectedItem.title,
            description: selectedItem.description,
            status: selectedItem.status,
            category: selectedItem.category,
            priceType: selectedItem.priceType,
            price: selectedItem.price,
            stock: selectedItem.stock,
            gameId: selectedItem.gameId,
            gameName: selectedItem.game?.name ?? null,
            imageUrl: selectedItem.imageUrl,
          }}
        />
      )}
    </div>
  );
}
