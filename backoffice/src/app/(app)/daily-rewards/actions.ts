"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { dailyRewardDaySchema } from "@/lib/validation/daily-reward";

export type DailyRewardDayState = { error?: string; success?: boolean };

// Mirrors addBattlePassTier: binds straight to a plain <form action> (no
// useActionState), so its signature after binding `day` must stay exactly
// (formData). Adds a blank day — the admin picks its item via the row's own
// save form afterward.
export async function addDailyRewardDay(day: number, _formData: FormData) {
  await requireBackofficeSession();
  await prisma.dailyRewardDay.upsert({
    where: { day },
    update: {},
    create: { day },
  });
  revalidatePath("/daily-rewards");
}

export async function updateDailyRewardDay(
  day: number,
  _prevState: DailyRewardDayState,
  formData: FormData,
): Promise<DailyRewardDayState> {
  await requireBackofficeSession();

  const parsed = dailyRewardDaySchema.safeParse({ itemId: formData.get("itemId") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  if (parsed.data.itemId) {
    const item = await prisma.item.findUnique({ where: { id: parsed.data.itemId } });
    if (!item) return { error: "Pick a valid item." };
  }

  await prisma.dailyRewardDay.upsert({
    where: { day },
    update: { itemId: parsed.data.itemId ?? null },
    create: { day, itemId: parsed.data.itemId },
  });

  revalidatePath("/daily-rewards");
  return { success: true };
}

export async function deleteDailyRewardDay(day: number, _formData: FormData) {
  await requireBackofficeSession();
  await prisma.dailyRewardDay.deleteMany({ where: { day } });
  revalidatePath("/daily-rewards");
}
