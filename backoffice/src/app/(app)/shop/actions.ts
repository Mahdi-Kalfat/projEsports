"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { saveUploadedImage } from "@/lib/uploads";
import { shopItemSchema } from "@/lib/validation/shop-item";
import { ShopItemStatus } from "@/generated/prisma";

export type CreateShopItemState = { error?: string; success?: boolean };

function parseShopItemForm(formData: FormData) {
  return shopItemSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    priceType: formData.get("priceType"),
    price: formData.get("price"),
    description: formData.get("description"),
  });
}

function parseOptionalStock(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim() === "") return { value: undefined as number | undefined };
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return { error: "Stock must be a positive whole number." };
  return { value };
}

async function resolveGameId(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim() === "") return { value: undefined as string | undefined };
  const game = await prisma.game.findUnique({ where: { id: raw } });
  if (!game) return { error: "Pick a valid game." };
  return { value: raw };
}

export async function createShopItem(
  _prevState: CreateShopItemState,
  formData: FormData,
): Promise<CreateShopItemState> {
  await requireBackofficeSession();

  const parsed = parseShopItemForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const game = await resolveGameId(formData.get("gameId"));
  if ("error" in game) return { error: game.error };

  const stock = parseOptionalStock(formData.get("stock"));
  if ("error" in stock) return { error: stock.error };

  const image = formData.get("image");
  let imageUrl: string | undefined;
  if (image instanceof File) {
    const result = await saveUploadedImage(image, "shop");
    if (result && "error" in result) return { error: result.error };
    imageUrl = result?.url;
  }

  await prisma.shopItem.create({
    data: {
      title: parsed.data.title,
      category: parsed.data.category,
      priceType: parsed.data.priceType,
      price: parsed.data.price,
      description: parsed.data.description,
      gameId: game.value,
      stock: stock.value,
      imageUrl,
    },
  });

  revalidatePath("/shop");
  return { success: true };
}

export async function updateShopItem(
  itemId: string,
  _prevState: CreateShopItemState,
  formData: FormData,
): Promise<CreateShopItemState> {
  await requireBackofficeSession();

  const existing = await prisma.shopItem.findUnique({ where: { id: itemId } });
  if (!existing) return { error: "That item no longer exists." };

  const parsed = parseShopItemForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const game = await resolveGameId(formData.get("gameId"));
  if ("error" in game) return { error: game.error };

  const stock = parseOptionalStock(formData.get("stock"));
  if ("error" in stock) return { error: stock.error };

  const image = formData.get("image");
  let imageUrl = existing.imageUrl;
  if (image instanceof File) {
    const result = await saveUploadedImage(image, "shop");
    if (result && "error" in result) return { error: result.error };
    if (result) imageUrl = result.url;
  }

  await prisma.shopItem.update({
    where: { id: itemId },
    data: {
      title: parsed.data.title,
      category: parsed.data.category,
      priceType: parsed.data.priceType,
      price: parsed.data.price,
      description: parsed.data.description ?? null,
      gameId: game.value ?? null,
      stock: stock.value ?? null,
      imageUrl,
    },
  });

  revalidatePath("/shop");
  return { success: true };
}

export async function deleteShopItem(itemId: string, _formData: FormData) {
  await requireBackofficeSession();

  await prisma.shopItem.deleteMany({ where: { id: itemId } });

  revalidatePath("/shop");
  redirect("/shop");
}

const ASSIGNABLE_STATUSES: string[] = [ShopItemStatus.DRAFT, ShopItemStatus.ACTIVE, ShopItemStatus.ARCHIVED];

export async function setShopItemStatus(itemId: string, formData: FormData) {
  await requireBackofficeSession();

  const status = formData.get("status");
  if (typeof status !== "string" || !ASSIGNABLE_STATUSES.includes(status)) return;

  await prisma.shopItem.update({
    where: { id: itemId },
    data: { status: status as ShopItemStatus },
  });
  revalidatePath("/shop");
}
