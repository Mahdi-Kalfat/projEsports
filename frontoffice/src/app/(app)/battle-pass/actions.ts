"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";

export type UnlockPremiumState = { error?: string; success?: boolean };

// Points spent here vanish rather than moving peer-to-peer (unlike
// buyListing's marketplace purchases) — there's no seller for a battle pass
// unlock. Race-safety comes from the @@unique([userId, battlePassId])
// constraint: if two concurrent requests both pass the pre-checks below,
// only one create() inside the transaction succeeds; the other throws and
// its whole batch (including the points deduction) rolls back.
export async function unlockPremium(
  battlePassId: string,
  _prevState: UnlockPremiumState,
  _formData: FormData,
): Promise<UnlockPremiumState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const [buyer, battlePass, existing] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.battlePass.findUnique({ where: { id: battlePassId } }),
    prisma.userBattlePassUnlock.findUnique({ where: { userId_battlePassId: { userId, battlePassId } } }),
  ]);

  if (!battlePass || battlePass.status !== "ACTIVE") return { error: "This battle pass is no longer active." };
  if (existing) return { error: "You've already unlocked premium for this season." };
  if (buyer.points < battlePass.premiumPointsCost) {
    return { error: `You need ${battlePass.premiumPointsCost} points to unlock this — you have ${buyer.points}.` };
  }

  try {
    await prisma.$transaction([
      prisma.userBattlePassUnlock.create({ data: { userId, battlePassId } }),
      prisma.user.update({ where: { id: userId }, data: { points: { decrement: battlePass.premiumPointsCost } } }),
    ]);
  } catch {
    return { error: "You've already unlocked premium for this season." };
  }

  revalidatePath("/battle-pass");
  return { success: true };
}
