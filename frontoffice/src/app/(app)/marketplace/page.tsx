import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ListChecks, Store } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/marketplace/listing-card";
import { BuyButton } from "@/components/marketplace/buy-button";
import { Reveal } from "@/components/ui/reveal";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Marketplace — Esports Tournament Platform",
};

export default async function MarketplacePage() {
  const session = await auth();
  const viewerId = session!.user.id;

  const listings = await prisma.marketplaceListing.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: { game: true, seller: { select: { id: true, username: true } } },
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Trade"
        title="The"
        accentWord="Marketplace"
        subtitle="Buy and sell accounts, items, and boosts with other players — every listing is reviewed before it goes live."
        action={
          <div className="flex gap-2">
            <Link
              href="/marketplace/mine"
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
            >
              <ListChecks size={16} />
              My listings
            </Link>
            <Link
              href="/marketplace/new"
              className="btn-neon inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow"
            >
              <Plus size={16} />
              Sell something
            </Link>
          </div>
        }
      />

      {listings.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised text-center text-sm text-muted">
          <Store size={28} className="text-muted/50" />
          No listings yet — be the first to sell something.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing, i) => (
            <Reveal key={listing.id} delay={Math.min(i * 0.05, 0.3)}>
              <ListingCard
                listing={{
                  id: listing.id,
                  title: listing.title,
                  description: listing.description,
                  status: listing.status,
                  category: listing.category,
                  priceType: listing.priceType,
                  price: listing.price,
                  gameName: listing.game?.name ?? null,
                  sellerUsername: listing.seller.username,
                  imageUrl: listing.imageUrl,
                }}
                action={
                  <BuyButton
                    listingId={listing.id}
                    isOwn={listing.seller.id === viewerId}
                    priceType={listing.priceType}
                  />
                }
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
