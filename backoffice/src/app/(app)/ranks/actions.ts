"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { saveUploadedImage } from "@/lib/uploads";

export type RankTierActionState = { error?: string; success?: boolean };

// Name/image are both optional overrides of a fixed default (see
// lib/rank-tiers.ts) — an empty name just means "keep the default name",
// same reasoning as Event's optional fields.
export async function upsertRankTier(
  tier: number,
  _prevState: RankTierActionState,
  formData: FormData,
): Promise<RankTierActionState> {
  await requireBackofficeSession();

  const rawName = formData.get("name");
  const name = typeof rawName === "string" && rawName.trim() ? rawName.trim().slice(0, 40) : null;

  const existing = await prisma.rankTier.findUnique({ where: { tier } });

  const image = formData.get("image");
  let imageUrl = existing?.imageUrl ?? null;
  if (image instanceof File) {
    const result = await saveUploadedImage(image, "ranks");
    if (result && "error" in result) return { error: result.error };
    if (result) imageUrl = result.url;
  }

  await prisma.rankTier.upsert({
    where: { tier },
    update: { name, imageUrl },
    create: { tier, name, imageUrl },
  });

  revalidatePath("/ranks");
  return { success: true };
}

export async function resetRankTier(tier: number, _formData: FormData) {
  await requireBackofficeSession();
  await prisma.rankTier.deleteMany({ where: { tier } });
  revalidatePath("/ranks");
}
