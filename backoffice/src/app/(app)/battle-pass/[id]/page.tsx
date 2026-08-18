import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { addBattlePassTier } from "../actions";
import { BattlePassEditForm } from "@/components/battle-pass/battle-pass-edit-form";
import { BattlePassTierRow } from "@/components/battle-pass/battle-pass-tier-row";

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export async function generateMetadata(props: PageProps<"/battle-pass/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const battlePass = await prisma.battlePass.findUnique({ where: { id }, select: { title: true } });
  return { title: battlePass ? `${battlePass.title} — Back Office` : "Battle Pass" };
}

export default async function BattlePassDetailPage(props: PageProps<"/battle-pass/[id]">) {
  const { id } = await props.params;

  const [battlePass, items] = await Promise.all([
    prisma.battlePass.findUnique({
      where: { id },
      include: { tiers: { orderBy: { tier: "asc" } } },
    }),
    prisma.item.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, status: true } }),
  ]);
  if (!battlePass) notFound();

  const nextTier = battlePass.tiers.length > 0 ? battlePass.tiers[battlePass.tiers.length - 1].tier + 1 : 1;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/battle-pass"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted transition hover:text-primary"
      >
        <ArrowLeft size={14} />
        All seasons
      </Link>

      <BattlePassEditForm
        battlePassId={battlePass.id}
        status={battlePass.status}
        defaults={{
          title: battlePass.title,
          description: battlePass.description ?? "",
          premiumPointsCost: battlePass.premiumPointsCost,
          startAtLocal: toDatetimeLocalValue(battlePass.startAt),
          endAtLocal: toDatetimeLocalValue(battlePass.endAt),
        }}
      />

      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <h3 className="font-display text-sm font-semibold text-foreground">Tiers</h3>

        {battlePass.tiers.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            No tiers yet — add the first one below.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {battlePass.tiers.map((tier) => (
              <BattlePassTierRow
                key={tier.tier}
                battlePassId={battlePass.id}
                tier={tier.tier}
                freeItemId={tier.freeItemId}
                premiumItemId={tier.premiumItemId}
                items={items}
              />
            ))}
          </div>
        )}

        <form action={addBattlePassTier.bind(null, battlePass.id, nextTier)} className="mt-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted transition hover:border-primary hover:text-primary"
          >
            <Plus size={14} />
            Add tier {nextTier}
          </button>
        </form>
      </div>
    </div>
  );
}
