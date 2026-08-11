"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { levelXpRuleSchema } from "@/lib/validation/level-xp-rule";
import { MAX_LEVEL, LEVELS_PER_TIER } from "@/lib/level-xp";

export type LevelXpRuleActionState = { error?: string; success?: boolean };

export async function upsertLevelXpRule(
  tier: number,
  _prevState: LevelXpRuleActionState,
  formData: FormData,
): Promise<LevelXpRuleActionState> {
  await requireBackofficeSession();

  const maxTier = Math.ceil(MAX_LEVEL / LEVELS_PER_TIER);
  if (!Number.isInteger(tier) || tier < 1 || tier > maxTier) {
    return { error: "Invalid tier." };
  }

  const parsed = levelXpRuleSchema.safeParse({ xpPerLevel: formData.get("xpPerLevel") });
  if (!parsed.success) {
    return { error: "Enter a whole number of at least 1." };
  }

  await prisma.levelXpRule.upsert({
    where: { tier },
    update: { xpPerLevel: parsed.data.xpPerLevel },
    create: { tier, xpPerLevel: parsed.data.xpPerLevel },
  });

  revalidatePath("/levels");
  return { success: true };
}

export async function deleteLevelXpRule(tier: number, _formData: FormData) {
  await requireBackofficeSession();
  await prisma.levelXpRule.deleteMany({ where: { tier } });
  revalidatePath("/levels");
}

// Separate from upsertLevelXpRule: this one binds straight to a plain <form
// action> (no useActionState), so its remaining signature after binding
// tier/xpPerLevel must be exactly (formData) — there's no prevState slot.
// Used by the "Add tier" button, where the value is a known-valid default
// rather than admin-entered input, so there's nothing to validate/error on.
export async function addLevelXpTier(tier: number, xpPerLevel: number, _formData: FormData) {
  await requireBackofficeSession();
  await prisma.levelXpRule.upsert({
    where: { tier },
    update: {},
    create: { tier, xpPerLevel },
  });
  revalidatePath("/levels");
}
