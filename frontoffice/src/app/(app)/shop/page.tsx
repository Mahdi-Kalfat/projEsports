import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ShopItemCard } from "@/components/shop/shop-item-card";
import { Reveal } from "@/components/ui/reveal";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Shop — Esports Tournament Platform",
};

export default async function ShopPage() {
  const items = await prisma.shopItem.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: { game: true },
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Gear up"
        title="The"
        accentWord="Shop"
        subtitle="Redeem points for avatars, badges, and boosts. Purchases are coming in a future update."
      />

      {items.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised text-center text-sm text-muted">
          <ShoppingBag size={28} className="text-muted/50" />
          The shop is empty right now — check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={Math.min(i * 0.05, 0.3)}>
              <ShopItemCard
                item={{
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  category: item.category,
                  priceType: item.priceType,
                  price: item.price,
                  stock: item.stock,
                  gameName: item.game?.name ?? null,
                  imageUrl: item.imageUrl,
                }}
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
