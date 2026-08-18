import { prisma } from "@/lib/prisma";

// Front office only ever shows one season: whichever is ACTIVE. If an admin
// ever leaves more than one ACTIVE at once, the most recently started one
// wins — a minor edge case, not worth hard-preventing.
export function getActiveBattlePass() {
  return prisma.battlePass.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { startAt: "desc" },
    include: { tiers: { orderBy: { tier: "asc" }, include: { freeItem: true, premiumItem: true } } },
  });
}

export async function hasUnlockedPremium(userId: string, battlePassId: string): Promise<boolean> {
  const unlock = await prisma.userBattlePassUnlock.findUnique({
    where: { userId_battlePassId: { userId, battlePassId } },
  });
  return unlock !== null;
}
