"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { isRestrictionActive } from "@/lib/restrictions";
import { saveUploadedImage } from "@/lib/uploads";
import { marketplaceListingSchema } from "@/lib/validation/marketplace-listing";
import { syncUserBadges } from "@/lib/award-badges";
import { MARKETPLACE_MIN_LEVEL } from "@/lib/marketplace";

export type SubmitListingState = { error?: string; success?: boolean };
export type BuyListingState = { error?: string; success?: boolean };

async function resolveGameId(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim() === "") return { value: undefined as string | undefined };
  const game = await prisma.game.findUnique({ where: { id: raw } });
  if (!game) return { error: "Pick a valid game." };
  return { value: raw };
}

// Listings submitted here start PENDING — this is the "user submits, admin
// approves/declines" path the back office's Marketplace moderation queue was
// built for (see backoffice/src/app/(app)/marketplace/actions.ts).
export async function submitListing(
  _prevState: SubmitListingState,
  formData: FormData,
): Promise<SubmitListingState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.level < MARKETPLACE_MIN_LEVEL) {
    return { error: `Reach Level ${MARKETPLACE_MIN_LEVEL} to sell on the marketplace.` };
  }
  if (isRestrictionActive(user.marketBlocked, user.marketBlockedUntil)) {
    return { error: "Your account is currently blocked from the marketplace." };
  }

  const parsed = marketplaceListingSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    priceType: formData.get("priceType"),
    price: formData.get("price"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const game = await resolveGameId(formData.get("gameId"));
  if ("error" in game) return { error: game.error };

  const image = formData.get("image");
  let imageUrl: string | undefined;
  if (image instanceof File) {
    const result = await saveUploadedImage(image, "marketplace");
    if (result && "error" in result) return { error: result.error };
    imageUrl = result?.url;
  }

  await prisma.marketplaceListing.create({
    data: {
      title: parsed.data.title,
      category: parsed.data.category,
      priceType: parsed.data.priceType,
      price: parsed.data.price,
      description: parsed.data.description,
      gameId: game.value,
      sellerId: userId,
      status: "PENDING",
      imageUrl,
    },
  });

  revalidatePath("/marketplace");
  revalidatePath("/marketplace/mine");
  return { success: true };
}

export async function cancelListing(listingId: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  // Once sold, the listing is a completed transaction record (buyer, price,
  // sold date) — not something the seller can retroactively delete.
  await prisma.marketplaceListing.deleteMany({
    where: { id: listingId, sellerId: userId, status: { not: "SOLD" } },
  });

  revalidatePath("/marketplace");
  revalidatePath("/marketplace/mine");
  redirect("/marketplace/mine");
}

// There's no payment processor in this app (same tradeoff as MONEY-entry
// tournaments), so only FREE/POINTS listings are actually purchasable here —
// MONEY listings stay "contact the seller" only. Buying a POINTS listing
// moves points peer-to-peer (buyer -> seller), same currency joining a
// tournament spends, rather than vanishing into "the house".
export async function buyListing(
  listingId: string,
  _prevState: BuyListingState,
  _formData: FormData,
): Promise<BuyListingState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const [buyer, listing] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.marketplaceListing.findUnique({ where: { id: listingId } }),
  ]);

  if (!listing || listing.status !== "APPROVED") return { error: "This listing is no longer available." };
  if (listing.sellerId === userId) return { error: "You can't buy your own listing." };
  if (buyer.level < MARKETPLACE_MIN_LEVEL) {
    return { error: `Reach Level ${MARKETPLACE_MIN_LEVEL} to buy on the marketplace.` };
  }
  if (isRestrictionActive(buyer.marketBlocked, buyer.marketBlockedUntil)) {
    return { error: "Your account is currently blocked from the marketplace." };
  }
  if (listing.priceType === "MONEY") {
    return { error: "Money listings aren't self-serve yet — contact the seller directly." };
  }
  if (listing.priceType === "POINTS" && buyer.points < listing.price) {
    return { error: `You need ${listing.price} points to buy this — you have ${buyer.points}.` };
  }

  const now = new Date();
  const markSold = prisma.marketplaceListing.updateMany({
    // Re-checking status: "APPROVED" inside the transaction avoids a double-sale
    // race if two buyers click at once — only the first one flips the row.
    where: { id: listingId, status: "APPROVED" },
    data: { status: "SOLD", buyerId: userId, soldAt: now },
  });

  const [updateResult] =
    listing.priceType === "POINTS" && listing.price > 0
      ? await prisma.$transaction([
          markSold,
          prisma.user.update({ where: { id: userId }, data: { points: { decrement: listing.price } } }),
          prisma.user.update({ where: { id: listing.sellerId }, data: { points: { increment: listing.price } } }),
        ])
      : await prisma.$transaction([markSold]);

  if (updateResult.count === 0) return { error: "This listing was just sold to someone else." };

  await Promise.all([syncUserBadges(userId), syncUserBadges(listing.sellerId)]);

  revalidatePath("/marketplace");
  revalidatePath("/marketplace/mine");
  return { success: true };
}
