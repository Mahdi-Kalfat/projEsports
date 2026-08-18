import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ShopGrid } from "@/components/shop/shop-grid";
import { ShopBalance } from "@/components/shop/shop-balance";
import { PageHeader } from "@/components/ui/page-header";
import { GuestBanner } from "@/components/ui/guest-banner";

export const metadata: Metadata = {
  title: "Shop — Clutcher",
};

// Puts the cc bundles first, then the cc-to-points listings, then boosts —
// everything else (no grantsItem, or an effect type outside this map) sorts
// last, in whatever order it was fetched.
const GROUP_ORDER: Record<string, number> = {
  CC_GRANT: 0,
  POINTS_GRANT: 1,
  XP_BOOST: 2,
  POINTS_BOOST: 3,
};

export default async function ShopPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [items, user] = await Promise.all([
    prisma.shopItem.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: { game: true, grantsItem: { select: { effectType: true } } },
    }),
    userId
      ? prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { ccCoins: true, points: true } })
      : null,
  ]);

  const sortedItems = [...items].sort((a, b) => {
    const rankA = GROUP_ORDER[a.grantsItem?.effectType ?? ""] ?? 99;
    const rankB = GROUP_ORDER[b.grantsItem?.effectType ?? ""] ?? 99;
    return rankA - rankB;
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Gear up"
        title="The"
        accentWord="Shop"
        subtitle="Buy cc, points, and boosts — some are instant, others need an admin's confirmation."
        action={user ? <ShopBalance ccCoins={user.ccCoins} points={user.points} /> : undefined}
      />

      {!user && <GuestBanner message="Create a free account to buy cc, points, and boosts." />}

      <ShopGrid
        isGuest={!user}
        items={sortedItems.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          priceType: item.priceType,
          price: item.price,
          stock: item.stock,
          gameName: item.game?.name ?? null,
          purchasable: item.grantsItemId !== null,
          imageUrl: item.imageUrl,
          grantsItemEffectType: item.grantsItem?.effectType ?? null,
        }))}
      />
    </div>
  );
}
