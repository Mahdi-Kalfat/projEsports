"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { saveUploadedImage } from "@/lib/uploads";
import { marketplaceListingSchema } from "@/lib/validation/marketplace-listing";
import { MarketplaceStatus } from "@/generated/prisma";

export type CreateListingState = { error?: string; success?: boolean };

function parseListingForm(formData: FormData) {
  return marketplaceListingSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    priceType: formData.get("priceType"),
    price: formData.get("price"),
    description: formData.get("description"),
  });
}

async function resolveGameId(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim() === "") return { value: undefined as string | undefined };
  const game = await prisma.game.findUnique({ where: { id: raw } });
  if (!game) return { error: "Pick a valid game." };
  return { value: raw };
}

// Admin-added listings are authored by the admin's own account and are
// auto-approved — only listings submitted through the (future) front-end
// user flow start out PENDING and need review.
export async function createListing(
  _prevState: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  const session = await requireBackofficeSession();

  const parsed = parseListingForm(formData);
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
      sellerId: session!.user.id,
      status: MarketplaceStatus.APPROVED,
      imageUrl,
    },
  });

  revalidatePath("/marketplace");
  return { success: true };
}

export async function updateListing(
  listingId: string,
  _prevState: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  await requireBackofficeSession();

  const existing = await prisma.marketplaceListing.findUnique({ where: { id: listingId } });
  if (!existing) return { error: "That listing no longer exists." };

  const parsed = parseListingForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const game = await resolveGameId(formData.get("gameId"));
  if ("error" in game) return { error: game.error };

  const image = formData.get("image");
  let imageUrl = existing.imageUrl;
  if (image instanceof File) {
    const result = await saveUploadedImage(image, "marketplace");
    if (result && "error" in result) return { error: result.error };
    if (result) imageUrl = result.url;
  }

  await prisma.marketplaceListing.update({
    where: { id: listingId },
    data: {
      title: parsed.data.title,
      category: parsed.data.category,
      priceType: parsed.data.priceType,
      price: parsed.data.price,
      description: parsed.data.description ?? null,
      gameId: game.value ?? null,
      imageUrl,
    },
  });

  revalidatePath("/marketplace");
  return { success: true };
}

export async function deleteListing(listingId: string, _formData: FormData) {
  await requireBackofficeSession();

  await prisma.marketplaceListing.deleteMany({ where: { id: listingId } });

  revalidatePath("/marketplace");
  redirect("/marketplace");
}

const ASSIGNABLE_STATUSES: string[] = [
  MarketplaceStatus.PENDING,
  MarketplaceStatus.APPROVED,
  MarketplaceStatus.DECLINED,
  MarketplaceStatus.ARCHIVED,
];

export async function setListingStatus(listingId: string, formData: FormData) {
  await requireBackofficeSession();

  const status = formData.get("status");
  if (typeof status !== "string" || !ASSIGNABLE_STATUSES.includes(status)) return;

  await prisma.marketplaceListing.update({
    where: { id: listingId },
    data: { status: status as MarketplaceStatus },
  });
  revalidatePath("/marketplace");
}
