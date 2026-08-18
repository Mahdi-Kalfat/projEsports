import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ListChecks } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/marketplace/listing-card";
import { CancelListingButton } from "@/components/marketplace/cancel-listing-button";
import { Reveal } from "@/components/ui/reveal";
import { PageHeader } from "@/components/ui/page-header";
import { LockedFeature } from "@/components/ui/locked-feature";
import { MARKETPLACE_MIN_LEVEL } from "@/lib/marketplace";

export const metadata: Metadata = {
  title: "My listings — Marketplace",
};

export default async function MyListingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { level: true } });
  const unlocked = user.level >= MARKETPLACE_MIN_LEVEL;

  const listings = unlocked
    ? await prisma.marketplaceListing.findMany({
        where: { sellerId: userId },
        orderBy: { createdAt: "desc" },
        include: { game: true, seller: { select: { username: true } }, buyer: { select: { username: true } } },
      })
    : [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Trade"
        title="My"
        accentWord="listings"
        subtitle="Track your submissions and their review status."
        action={
          unlocked ? (
            <Link
              href="/marketplace/new"
              className="btn-neon inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow"
            >
              <Plus size={16} />
              Sell something
            </Link>
          ) : undefined
        }
      />

      {!unlocked ? (
        <div className="min-h-[40vh]" />
      ) : listings.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised text-center text-sm text-muted">
          <ListChecks size={28} className="text-muted/50" />
          You haven&apos;t listed anything yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing, i) => (
            <Reveal key={listing.id} delay={Math.min(i * 0.05, 0.3)}>
              <ListingCard
                showStatus
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
                  listing.status === "SOLD" ? (
                    <p className="text-center text-xs text-muted">Sold to {listing.buyer?.username ?? "a buyer"}</p>
                  ) : (
                    <CancelListingButton listingId={listing.id} />
                  )
                }
              />
            </Reveal>
          ))}
        </div>
      )}

      {!unlocked && (
        <LockedFeature
          title="Marketplace locked"
          message={`Reach Level ${MARKETPLACE_MIN_LEVEL} to sell here — you're currently Level ${user.level}.`}
        />
      )}
    </div>
  );
}
