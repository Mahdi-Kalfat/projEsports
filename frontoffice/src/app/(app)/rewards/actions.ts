"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { utcDayDiff } from "@/lib/daily-cycle";
import { pickWeightedSlotIndex, SPIN_COSTS, MAX_SPINS_PER_DAY } from "@/lib/lucky-wheel";

export type SpinWheelState = { error?: string; success?: boolean; wonItemName?: string; slotIndex?: number };

// The winning slot is picked server-side (never trust the client with the
// random roll) from the same createdAt-ordered list the page rendered the
// wheel with, so slotIndex lines up with the wheel the player is looking at.
// If an admin edits slots between page load and spin, the animation could
// land on the wrong-looking slice — a cosmetic edge case, not a correctness
// one, since the item actually granted always matches wonItemName.
export async function spinWheel(_prevState: SpinWheelState, _formData: FormData): Promise<SpinWheelState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const [spin, slots, user] = await Promise.all([
    prisma.userWheelSpin.findUnique({ where: { userId } }),
    prisma.luckyWheelSlot.findMany({ orderBy: { createdAt: "asc" }, include: { item: true } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { ccCoins: true } }),
  ]);

  const now = new Date();
  // spinsToday only means anything for the UTC day it was recorded on — once
  // `now` has rolled into a later day, today's count is implicitly back to 0
  // without needing a write (same "day boundary, not rolling window" pattern
  // as the daily reward ladder).
  const isNewDay = !spin || utcDayDiff(spin.lastSpinAt, now) >= 1;
  const spinsUsedToday = isNewDay ? 0 : spin!.spinsToday;

  if (spinsUsedToday >= MAX_SPINS_PER_DAY) {
    return { error: "You've used all your spins for today — come back tomorrow." };
  }

  const cost = SPIN_COSTS[spinsUsedToday];
  if (cost > 0 && user.ccCoins < cost) {
    return { error: `Not enough cc — this spin costs ${cost} cc and you have ${user.ccCoins} cc.` };
  }

  const index = pickWeightedSlotIndex(slots, Math.random());
  if (index === null) return { error: "The wheel isn't set up yet." };
  const won = slots[index];

  await prisma.$transaction([
    prisma.userWheelSpin.upsert({
      where: { userId },
      create: { userId, lastSpinAt: now, spinsToday: 1 },
      update: { lastSpinAt: now, spinsToday: spinsUsedToday + 1 },
    }),
    prisma.userItem.upsert({
      where: { userId_itemId: { userId, itemId: won.itemId } },
      create: { userId, itemId: won.itemId, quantity: 1 },
      update: { quantity: { increment: 1 } },
    }),
    ...(cost > 0 ? [prisma.user.update({ where: { id: userId }, data: { ccCoins: { decrement: cost } } })] : []),
  ]);

  revalidatePath("/rewards");
  return { success: true, wonItemName: won.item.name, slotIndex: index };
}

export type ClaimDailyRewardState = { error?: string; success?: boolean; wonItemName?: string; day?: number };

export async function claimDailyReward(
  _prevState: ClaimDailyRewardState,
  _formData: FormData,
): Promise<ClaimDailyRewardState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const [progress, days] = await Promise.all([
    prisma.userDailyReward.findUnique({ where: { userId } }),
    prisma.dailyRewardDay.findMany({ orderBy: { day: "asc" }, include: { item: true } }),
  ]);

  if (days.length === 0) return { error: "Daily rewards aren't set up yet." };

  const now = new Date();
  let currentDay = progress?.currentDay ?? 1;

  if (progress?.lastClaimedAt) {
    const diff = utcDayDiff(progress.lastClaimedAt, now);
    if (diff < 1) return { error: "You've already claimed today — come back tomorrow." };
    // More than one day since the last claim means at least one day was
    // missed — the streak resets to Day 1.
    if (diff > 1) currentDay = 1;
  }

  const maxDay = days[days.length - 1].day;
  // The ladder may have shrunk (admin deleted trailing days) since this
  // player's last claim — fall back to the start rather than erroring.
  if (currentDay > maxDay) currentDay = 1;

  const today = days.find((d) => d.day === currentDay);
  if (!today || !today.itemId) {
    return { error: `Day ${currentDay}'s reward isn't configured yet — check back once an admin sets it up.` };
  }

  const nextDay = currentDay >= maxDay ? 1 : currentDay + 1;

  await prisma.$transaction([
    prisma.userDailyReward.upsert({
      where: { userId },
      create: { userId, currentDay: nextDay, lastClaimedAt: now },
      update: { currentDay: nextDay, lastClaimedAt: now },
    }),
    prisma.userItem.upsert({
      where: { userId_itemId: { userId, itemId: today.itemId } },
      create: { userId, itemId: today.itemId, quantity: 1 },
      update: { quantity: { increment: 1 } },
    }),
  ]);

  revalidatePath("/rewards");
  return { success: true, wonItemName: today.item?.name ?? "Reward", day: currentDay };
}
