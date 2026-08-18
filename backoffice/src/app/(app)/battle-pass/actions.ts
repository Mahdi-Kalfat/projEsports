"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { battlePassSchema, battlePassTierRewardSchema } from "@/lib/validation/battle-pass";
import { BattlePassStatus } from "@/generated/prisma";

export type BattlePassFormState = { error?: string; success?: boolean };

function parseBattlePassForm(formData: FormData) {
  return battlePassSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    premiumPointsCost: formData.get("premiumPointsCost"),
    startAt: formData.get("startAt"),
    endAt: formData.get("endAt"),
  });
}

// Redirects straight into the new season's detail page on success (unlike
// createShopItem, which stays on the list) — the next admin action is
// always "add tiers", so this saves a click.
export async function createBattlePass(
  _prevState: BattlePassFormState,
  formData: FormData,
): Promise<BattlePassFormState> {
  await requireBackofficeSession();

  const parsed = parseBattlePassForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const created = await prisma.battlePass.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      premiumPointsCost: parsed.data.premiumPointsCost,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt,
    },
  });

  revalidatePath("/battle-pass");
  redirect(`/battle-pass/${created.id}`);
}

export async function updateBattlePass(
  battlePassId: string,
  _prevState: BattlePassFormState,
  formData: FormData,
): Promise<BattlePassFormState> {
  await requireBackofficeSession();

  const existing = await prisma.battlePass.findUnique({ where: { id: battlePassId } });
  if (!existing) return { error: "That battle pass no longer exists." };

  const parsed = parseBattlePassForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  await prisma.battlePass.update({
    where: { id: battlePassId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      premiumPointsCost: parsed.data.premiumPointsCost,
      startAt: parsed.data.startAt,
      endAt: parsed.data.endAt,
    },
  });

  revalidatePath(`/battle-pass/${battlePassId}`);
  revalidatePath("/battle-pass");
  return { success: true };
}

export async function deleteBattlePass(battlePassId: string, _formData: FormData) {
  await requireBackofficeSession();

  await prisma.battlePassTier.deleteMany({ where: { battlePassId } });
  await prisma.battlePass.deleteMany({ where: { id: battlePassId } });

  revalidatePath("/battle-pass");
  redirect("/battle-pass");
}

const ASSIGNABLE_STATUSES: string[] = [
  BattlePassStatus.DRAFT,
  BattlePassStatus.ACTIVE,
  BattlePassStatus.ARCHIVED,
];

export async function setBattlePassStatus(battlePassId: string, formData: FormData) {
  await requireBackofficeSession();

  const status = formData.get("status");
  if (typeof status !== "string" || !ASSIGNABLE_STATUSES.includes(status)) return;

  await prisma.battlePass.update({
    where: { id: battlePassId },
    data: { status: status as BattlePassStatus },
  });
  revalidatePath(`/battle-pass/${battlePassId}`);
  revalidatePath("/battle-pass");
}

// --- Tier actions (mirrors levels/actions.ts) ---

export type BattlePassTierActionState = { error?: string; success?: boolean };

export async function upsertBattlePassTier(
  battlePassId: string,
  tier: number,
  _prevState: BattlePassTierActionState,
  formData: FormData,
): Promise<BattlePassTierActionState> {
  await requireBackofficeSession();

  if (!Number.isInteger(tier) || tier < 1) {
    return { error: "Invalid tier." };
  }

  const parsed = battlePassTierRewardSchema.safeParse({
    freeItemId: formData.get("freeItemId"),
    premiumItemId: formData.get("premiumItemId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const [freeItem, premiumItem] = await Promise.all([
    parsed.data.freeItemId ? prisma.item.findUnique({ where: { id: parsed.data.freeItemId } }) : null,
    parsed.data.premiumItemId ? prisma.item.findUnique({ where: { id: parsed.data.premiumItemId } }) : null,
  ]);
  if (parsed.data.freeItemId && !freeItem) return { error: "Pick a valid free-tier item." };
  if (parsed.data.premiumItemId && !premiumItem) return { error: "Pick a valid premium-tier item." };

  await prisma.battlePassTier.upsert({
    where: { battlePassId_tier: { battlePassId, tier } },
    update: { freeItemId: parsed.data.freeItemId ?? null, premiumItemId: parsed.data.premiumItemId ?? null },
    create: { battlePassId, tier, freeItemId: parsed.data.freeItemId, premiumItemId: parsed.data.premiumItemId },
  });

  revalidatePath(`/battle-pass/${battlePassId}`);
  return { success: true };
}

export async function deleteBattlePassTier(battlePassId: string, tier: number, _formData: FormData) {
  await requireBackofficeSession();
  await prisma.battlePassTier.deleteMany({ where: { battlePassId, tier } });
  revalidatePath(`/battle-pass/${battlePassId}`);
}

// Separate from upsertBattlePassTier: binds straight to a plain <form
// action> (no useActionState), so its remaining signature after binding
// battlePassId/tier must be exactly (formData) — no prevState slot. Used by
// the "Add tier" button, where rewards start unset and the admin picks items
// via the row's own save form afterward (mirrors addLevelXpTier).
export async function addBattlePassTier(battlePassId: string, tier: number, _formData: FormData) {
  await requireBackofficeSession();
  await prisma.battlePassTier.upsert({
    where: { battlePassId_tier: { battlePassId, tier } },
    update: {},
    create: { battlePassId, tier },
  });
  revalidatePath(`/battle-pass/${battlePassId}`);
}
