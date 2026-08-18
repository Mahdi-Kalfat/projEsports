import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { utcDayDiff, nextUtcMidnight } from "@/lib/daily-cycle";
import { SPIN_COSTS, MAX_SPINS_PER_DAY } from "@/lib/lucky-wheel";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { DailyRewardTrack } from "@/components/rewards/daily-reward-track";
import { LuckyWheel } from "@/components/rewards/lucky-wheel";
import { GuestBanner } from "@/components/ui/guest-banner";

export const metadata: Metadata = {
  title: "Rewards — Clutcher",
};

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function RewardsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [days, slots, dailyProgress, wheelSpin, user] = await Promise.all([
    prisma.dailyRewardDay.findMany({ orderBy: { day: "asc" }, include: { item: true } }),
    prisma.luckyWheelSlot.findMany({ orderBy: { createdAt: "asc" }, include: { item: true } }),
    userId ? prisma.userDailyReward.findUnique({ where: { userId } }) : null,
    userId ? prisma.userWheelSpin.findUnique({ where: { userId } }) : null,
    userId ? prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { ccCoins: true } }) : null,
  ]);

  const now = new Date();
  const currentDay = dailyProgress?.currentDay ?? 1;
  const canClaimDaily = !dailyProgress?.lastClaimedAt || utcDayDiff(dailyProgress.lastClaimedAt, now) >= 1;
  const nextClaimAtLabel =
    !canClaimDaily && dailyProgress?.lastClaimedAt
      ? formatDateTime(nextUtcMidnight(dailyProgress.lastClaimedAt))
      : null;

  // Same "day boundary" reasoning as spinWheel itself (see rewards/actions.ts)
  // — spinsToday only counts for the UTC day it was recorded on.
  const isNewSpinDay = !wheelSpin || utcDayDiff(wheelSpin.lastSpinAt, now) >= 1;
  const spinsUsedToday = isNewSpinDay ? 0 : wheelSpin!.spinsToday;
  const canSpin = spinsUsedToday < MAX_SPINS_PER_DAY;
  const nextSpinCost = SPIN_COSTS[spinsUsedToday] ?? 0;
  const nextSpinAtLabel = !canSpin && wheelSpin ? formatDateTime(nextUtcMidnight(wheelSpin.lastSpinAt)) : null;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Come back daily"
        title="Daily"
        accentWord="Rewards"
        subtitle="Claim your daily login reward and spin the Lucky Wheel — first spin free, up to 4 a day."
      />

      {!userId && (
        <GuestBanner message="Create a free account to claim daily rewards and spin the Lucky Wheel." />
      )}

      <Reveal>
        <DailyRewardTrack
          days={days.map((d) => ({
            day: d.day,
            item: d.item
              ? { id: d.item.id, name: d.item.name, effectType: d.item.effectType, effectValue: d.item.effectValue }
              : null,
          }))}
          currentDay={currentDay}
          canClaim={canClaimDaily}
          nextClaimAtLabel={nextClaimAtLabel}
          isGuest={!userId}
        />
      </Reveal>

      <Reveal delay={0.1}>
        <LuckyWheel
          slots={slots.map((s) => ({
            id: s.id,
            weight: s.weight,
            item: {
              id: s.item.id,
              name: s.item.name,
              effectType: s.item.effectType,
              effectValue: s.item.effectValue,
              imageUrl: s.item.imageUrl,
            },
          }))}
          canSpin={canSpin}
          nextSpinAtLabel={nextSpinAtLabel}
          spinsUsedToday={spinsUsedToday}
          nextSpinCost={nextSpinCost}
          ccCoins={user?.ccCoins ?? 0}
          isGuest={!userId}
        />
      </Reveal>
    </div>
  );
}
