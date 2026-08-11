import { prisma } from "@/lib/prisma";

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
