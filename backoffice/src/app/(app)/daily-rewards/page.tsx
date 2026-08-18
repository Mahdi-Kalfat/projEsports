import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { addDailyRewardDay } from "./actions";
import { DailyRewardDayRow } from "@/components/daily-rewards/daily-reward-day-row";

export const metadata: Metadata = {
  title: "Daily Rewards — Back Office",
};

export default async function DailyRewardsPage() {
  const [days, items] = await Promise.all([
    prisma.dailyRewardDay.findMany({ orderBy: { day: "asc" } }),
    prisma.item.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, status: true } }),
  ]);

  const nextDay = days.length > 0 ? days[days.length - 1].day + 1 : 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <h3 className="font-display text-sm font-semibold text-foreground">Ladder</h3>
        <p className="mt-1 text-xs text-muted">
          Claiming past the last day loops back to Day 1 — a missed day resets a player back to Day 1 too.
        </p>

        {days.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            No days yet — add the first one below.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {days.map((day) => (
              <DailyRewardDayRow key={day.day} day={day.day} itemId={day.itemId} items={items} />
            ))}
          </div>
        )}

        <form action={addDailyRewardDay.bind(null, nextDay)} className="mt-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted transition hover:border-primary hover:text-primary"
          >
            <Plus size={14} />
            Add day {nextDay}
          </button>
        </form>
      </div>
    </div>
  );
}
