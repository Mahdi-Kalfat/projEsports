"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { saveUploadedImage } from "@/lib/uploads";
import { itemSchema } from "@/lib/validation/item";
import { ItemStatus } from "@/generated/prisma";

export type CreateItemState = { error?: string; success?: boolean };

function parseItemForm(formData: FormData) {
  return itemSchema.safeParse({
    name: formData.get("name"),
    effectType: formData.get("effectType"),
    effectValue: formData.get("effectValue"),
    description: formData.get("description"),
  });
}

export async function createItem(
  _prevState: CreateItemState,
  formData: FormData,
): Promise<CreateItemState> {
  await requireBackofficeSession();

  const parsed = parseItemForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const image = formData.get("image");
  let imageUrl: string | undefined;
  if (image instanceof File) {
    const result = await saveUploadedImage(image, "items");
    if (result && "error" in result) return { error: result.error };
    imageUrl = result?.url;
  }

  await prisma.item.create({
    data: {
      name: parsed.data.name,
      effectType: parsed.data.effectType,
      effectValue: parsed.data.effectValue,
      description: parsed.data.description,
      imageUrl,
    },
  });

  revalidatePath("/items");
  return { success: true };
}

export async function updateItem(
  itemId: string,
  _prevState: CreateItemState,
  formData: FormData,
): Promise<CreateItemState> {
  await requireBackofficeSession();

  const existing = await prisma.item.findUnique({ where: { id: itemId } });
  if (!existing) return { error: "That item no longer exists." };

  const parsed = parseItemForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const image = formData.get("image");
  let imageUrl = existing.imageUrl;
  if (image instanceof File) {
    const result = await saveUploadedImage(image, "items");
    if (result && "error" in result) return { error: result.error };
    if (result) imageUrl = result.url;
  }

  await prisma.item.update({
    where: { id: itemId },
    data: {
      name: parsed.data.name,
      effectType: parsed.data.effectType,
      effectValue: parsed.data.effectValue,
      description: parsed.data.description ?? null,
      imageUrl,
    },
  });

  revalidatePath("/items");
  return { success: true };
}

export async function deleteItem(itemId: string, _formData: FormData) {
  await requireBackofficeSession();

  await prisma.item.deleteMany({ where: { id: itemId } });

  revalidatePath("/items");
  redirect("/items");
}

const ASSIGNABLE_STATUSES: string[] = [ItemStatus.DRAFT, ItemStatus.ACTIVE, ItemStatus.ARCHIVED];

export async function setItemStatus(itemId: string, formData: FormData) {
  await requireBackofficeSession();

  const status = formData.get("status");
  if (typeof status !== "string" || !ASSIGNABLE_STATUSES.includes(status)) return;

  await prisma.item.update({
    where: { id: itemId },
    data: { status: status as ItemStatus },
  });
  revalidatePath("/items");
}
