import { prisma } from "@/lib/prisma";

export type ConsumableItemData = {
  id: string;
  quantity: number;
  acquiredAt: Date;
  item: {
    id: string;
    name: string;
    description: string | null;
    effectType: string;
    effectValue: number;
    imageUrl: string | null;
  };
};

// Admin-granted, usable items (see the Item/UserItem models) — distinct from
// getInventory below, which is one-time ShopItem ownership with nothing to
// "use". Consuming one via useItem (inventory/actions.ts) decrements/removes
// this row, so what's returned here is always the current holding, not a
// history of every grant.
export async function getConsumableItems(userId: string): Promise<ConsumableItemData[]> {
  const rows = await prisma.userItem.findMany({
    where: { userId },
    include: { item: true },
    orderBy: { acquiredAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    quantity: row.quantity,
    acquiredAt: row.acquiredAt,
    item: {
      id: row.item.id,
      name: row.item.name,
      description: row.item.description,
      effectType: row.item.effectType,
      effectValue: row.item.effectValue,
      imageUrl: row.item.imageUrl,
    },
  }));
}

export type InventoryItemData = {
  id: string;
  acquiredAt: Date;
  shopItem: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    priceType: string;
    price: number;
    imageUrl: string | null;
    gameName: string | null;
  };
};

export async function getInventory(userId: string): Promise<InventoryItemData[]> {
  const rows = await prisma.userInventoryItem.findMany({
    where: { userId },
    include: { shopItem: { include: { game: true } } },
    orderBy: { acquiredAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    acquiredAt: row.acquiredAt,
    shopItem: {
      id: row.shopItem.id,
      title: row.shopItem.title,
      description: row.shopItem.description,
      category: row.shopItem.category,
      priceType: row.shopItem.priceType,
      price: row.shopItem.price,
      imageUrl: row.shopItem.imageUrl,
      gameName: row.shopItem.game?.name ?? null,
    },
  }));
}

// The owner can always see their own inventory; anyone else only when the
// account has opted in via inventoryPublic. Mirrors the isSelf-gating
// precedent already used elsewhere on the profile page (ClanWidget, etc.).
export function canViewInventory(isSelf: boolean, inventoryPublic: boolean): boolean {
  return isSelf || inventoryPublic;
}
