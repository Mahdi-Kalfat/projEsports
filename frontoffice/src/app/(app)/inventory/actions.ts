"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { getRequiredXp, normalizeLevelXp } from "@/lib/level-xp";

export type UseItemState = { error?: string; success?: boolean; message?: string };

// Consumes one unit of a granted item and applies its effect, decrementing
// quantity (deleting the UserItem row once it hits 0 — see the model comment
// in schema.prisma). XP_BOOST's base is the XP required for the user's
// *current* level rather than their raw xp: xp resets to a small number right
// after every level-up, so "+25% of current xp" would be tiny/erratic
// depending on when it's used, whereas "+25% of a level's worth" is a
// consistent, meaningful bump regardless of timing. POINTS_BOOST doesn't have
// that problem — points accumulate rather than resetting — so its base is
// simply the user's current balance.
export async function useItem(
  userItemId: string,
  _prevState: UseItemState,
  _formData: FormData,
): Promise<UseItemState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const userItem = await prisma.userItem.findUnique({
    where: { id: userItemId },
    include: { item: true },
  });
  if (!userItem || userItem.userId !== userId) {
    return { error: "That item isn't in your inventory." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const consume =
    userItem.quantity > 1
      ? prisma.userItem.update({ where: { id: userItem.id }, data: { quantity: { decrement: 1 } } })
      : prisma.userItem.delete({ where: { id: userItem.id } });

  if (userItem.item.effectType === "XP_BOOST") {
    const rules = await prisma.levelXpRule.findMany({ select: { tier: true, xpPerLevel: true } });
    const bonus = Math.round((getRequiredXp(user.level, rules) * userItem.item.effectValue) / 100);
    const { level, xp } = normalizeLevelXp(user.level, user.xp + bonus, rules);

    await prisma.$transaction([prisma.user.update({ where: { id: userId }, data: { level, xp } }), consume]);

    revalidatePath(`/inventory/${session!.user.username}`);
    return { success: true, message: `Used ${userItem.item.name} — +${bonus} XP.` };
  }

  if (userItem.item.effectType === "POINTS_BOOST") {
    const bonus = Math.round((user.points * userItem.item.effectValue) / 100);

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { points: { increment: bonus } } }),
      consume,
    ]);

    revalidatePath(`/inventory/${session!.user.username}`);
    return { success: true, message: `Used ${userItem.item.name} — +${bonus} points.` };
  }

  // Flat cc amount, not a percentage (unlike the two boosts above) — this is
  // how a shop cc-bundle purchase actually pays out, once its report is
  // approved and grants this item into the inventory (see backoffice's
  // approveShopPurchase).
  if (userItem.item.effectType === "CC_GRANT") {
    const bonus = userItem.item.effectValue;

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { ccCoins: { increment: bonus } } }),
      consume,
    ]);

    revalidatePath(`/inventory/${session!.user.username}`);
    return { success: true, message: `Used ${userItem.item.name} — +${bonus} cc.` };
  }

  // Flat points amount, not a percentage — same shape as CC_GRANT, but for
  // the cc-to-points shop listings (buyShopItem deducts the cc cost up
  // front, so this redemption never touches ccCoins).
  if (userItem.item.effectType === "POINTS_GRANT") {
    const bonus = userItem.item.effectValue;

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { points: { increment: bonus } } }),
      consume,
    ]);

    revalidatePath(`/inventory/${session!.user.username}`);
    return { success: true, message: `Used ${userItem.item.name} — +${bonus} points.` };
  }

  return { error: "This item's effect isn't supported yet." };
}
