import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AddBattlePassModal } from "@/components/battle-pass/add-battle-pass-modal";

export const metadata: Metadata = {
  title: "Battle Pass — Back Office",
};

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

const STATUS_LABEL: Record<string, string> = { DRAFT: "Draft", ACTIVE: "Active", ARCHIVED: "Archived" };
const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-muted/15 text-muted",
  ACTIVE: "bg-success/15 text-success",
  ARCHIVED: "bg-muted/15 text-muted",
};

export default async function BattlePassPage() {
  const seasons = await prisma.battlePass.findMany({
    orderBy: { startAt: "desc" },
    include: { _count: { select: { tiers: true } } },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddBattlePassModal />
      </div>

      {seasons.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-border bg-surface-raised text-sm text-muted">
          No battle pass seasons yet — create the first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season) => (
            <Link
              key={season.id}
              href={`/battle-pass/${season.id}`}
              className="block rounded-xl border border-border bg-surface-raised p-4 transition hover:border-primary/60"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-base font-bold text-foreground">{season.title}</p>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[season.status] ?? "bg-muted/15 text-muted"}`}
                >
                  {STATUS_LABEL[season.status] ?? season.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {formatDateTime(season.startAt)} – {formatDateTime(season.endAt)}
              </p>
              <p className="mt-3 text-xs text-muted">
                {season._count.tiers} tier{season._count.tiers === 1 ? "" : "s"} · {season.premiumPointsCost} pts
                premium
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
