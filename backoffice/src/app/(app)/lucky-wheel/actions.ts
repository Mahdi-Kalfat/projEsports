"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { luckyWheelSlotSchema } from "@/lib/validation/lucky-wheel";

export type LuckyWheelSlotState = { error?: string; success?: boolean };

export async function addLuckyWheelSlot(
  _prevState: LuckyWheelSlotState,
  formData: FormData,
): Promise<LuckyWheelSlotState> {
  await requireBackofficeSession();

  const parsed = luckyWheelSlotSchema.safeParse({
    itemId: formData.get("itemId"),
    weight: formData.get("weight"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const item = await prisma.item.findUnique({ where: { id: parsed.data.itemId } });
  if (!item) return { error: "Pick a valid item." };

  const existing = await prisma.luckyWheelSlot.findUnique({ where: { itemId: parsed.data.itemId } });
  if (existing) return { error: `${item.name} is already on the wheel — edit its percentage instead.` };

  await prisma.luckyWheelSlot.create({
    data: { itemId: parsed.data.itemId, weight: parsed.data.weight },
  });

  revalidatePath("/lucky-wheel");
  return { success: true };
}

export async function updateLuckyWheelSlotWeight(slotId: string, formData: FormData) {
  await requireBackofficeSession();

  const weight = Number(formData.get("weight"));
  if (!Number.isFinite(weight) || weight < 0.1 || weight > 100) return;

  await prisma.luckyWheelSlot.update({ where: { id: slotId }, data: { weight } });
  revalidatePath("/lucky-wheel");
}

export async function deleteLuckyWheelSlot(slotId: string, _formData: FormData) {
  await requireBackofficeSession();
  await prisma.luckyWheelSlot.deleteMany({ where: { id: slotId } });
  revalidatePath("/lucky-wheel");
}
