import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildMarketplaceHref } from "@/lib/marketplace-query";
import { AddListingModal } from "@/components/marketplace/add-listing-modal";
import { ListingCard } from "@/components/marketplace/listing-card";
import { ListingDetailModal } from "@/components/marketplace/listing-detail-modal";

export const metadata: Metadata = {
  title: "Marketplace — Back Office",
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const STATUS_SORT_PRIORITY: Record<string, number> = {
  PENDING: 0,
  APPROVED: 1,
  SOLD: 2,
  DECLINED: 3,
  ARCHIVED: 4,
};

export default async function MarketplacePage(props: PageProps<"/marketplace">) {
  const searchParams = await props.searchParams;
  const listingId = firstParam(searchParams.listingId);

  const [listings, games, selectedListing] = await Promise.all([
    prisma.marketplaceListing.findMany({
      orderBy: { createdAt: "desc" },
      include: { game: true, seller: { select: { username: true } } },
    }),
    prisma.game.findMany({ orderBy: { name: "asc" } }),
    listingId
      ? prisma.marketplaceListing.findUnique({
          where: { id: listingId },
          include: { game: true, seller: { select: { username: true } } },
        })
      : Promise.resolve(null),
  ]);

  // Pending listings need admin attention first — surface them at the top of
  // the grid instead of adding a separate queue view.
  const sortedListings = [...listings].sort(
    (a, b) => (STATUS_SORT_PRIORITY[a.status] ?? 99) - (STATUS_SORT_PRIORITY[b.status] ?? 99),
  );

  const gameOptions = games.map((game) => ({ id: game.id, name: game.name }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddListingModal games={gameOptions} />
      </div>

      {sortedListings.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-border bg-surface-raised text-sm text-muted">
          No listings yet — create the first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              href={buildMarketplaceHref({ listingId: listing.id })}
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
            />
          ))}
        </div>
      )}

      {selectedListing && (
        <ListingDetailModal
          closeHref="/marketplace"
          games={gameOptions}
          listing={{
            id: selectedListing.id,
            title: selectedListing.title,
            description: selectedListing.description,
            status: selectedListing.status,
            category: selectedListing.category,
            priceType: selectedListing.priceType,
            price: selectedListing.price,
            gameId: selectedListing.gameId,
            gameName: selectedListing.game?.name ?? null,
            sellerUsername: selectedListing.seller.username,
            imageUrl: selectedListing.imageUrl,
          }}
        />
      )}
    </div>
  );
}
