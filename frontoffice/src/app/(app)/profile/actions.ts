"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { saveUploadedImage } from "@/lib/uploads";
import { profileSchema } from "@/lib/validation/profile";
import { PROFILE_THEME_KEYS } from "@/lib/profile-theme";
import type { ProfileTheme } from "@/generated/prisma";

export type UpdateProfileState = { error?: string; success?: boolean };

export async function updateProfile(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const session = await requireFrontOfficeSession();

  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const themeRaw = formData.get("profileTheme");
  const profileTheme =
    typeof themeRaw === "string" && (PROFILE_THEME_KEYS as string[]).includes(themeRaw) ? themeRaw : undefined;

  // Unchecked checkboxes are omitted from FormData entirely, so "on" (the
  // implicit value browsers send when checked and no explicit value attribute
  // is set) is the only positive signal — anything else means false.
  const inventoryPublic = formData.get("inventoryPublic") === "on";

  const avatar = formData.get("avatar");
  let avatarUrl: string | undefined;
  if (avatar instanceof File) {
    const result = await saveUploadedImage(avatar, "avatars");
    if (result && "error" in result) return { error: result.error };
    avatarUrl = result?.url;
  }

  const banner = formData.get("banner");
  let bannerImageUrl: string | undefined;
  if (banner instanceof File) {
    const result = await saveUploadedImage(banner, "banners");
    if (result && "error" in result) return { error: result.error };
    bannerImageUrl = result?.url;
  }

  await prisma.user.update({
    where: { id: session!.user.id },
    data: {
      fullName: parsed.data.fullName ?? null,
      phone: parsed.data.phone ?? null,
      bio: parsed.data.bio ?? null,
      inventoryPublic,
      ...(profileTheme ? { profileTheme: profileTheme as ProfileTheme } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(bannerImageUrl ? { bannerImageUrl } : {}),
    },
  });

  revalidatePath(`/profile/${session!.user.username}`);
  revalidatePath(`/inventory/${session!.user.username}`);
  return { success: true };
}
