import type { Metadata } from "next";
import { Medal } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { RankTierRow } from "@/components/ranks/rank-tier-row";
import { DEFAULT_RANK_TIERS } from "@/lib/rank-tiers";

export const metadata: Metadata = {
  title: "Rank settings — Back Office",
};

export default async function RankSettingsPage() {
  const overrides = await prisma.rankTier.findMany();
  const overrideByTier = new Map(overrides.map((o) => [o.tier, o]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Medal size={22} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Rank settings</h2>
          <p className="max-w-xl text-sm text-muted">
            Every 5 levels is a rank, from Iron 1 up to Champion — that ladder is fixed, but you can rename any
            rank or replace its image. Leave a rank untouched to keep the default.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <div className="flex flex-col gap-2">
          {DEFAULT_RANK_TIERS.map((base, tier) => {
            const override = overrideByTier.get(tier);
            return (
              <RankTierRow
                key={tier}
                tier={tier}
                defaultName={base.name}
                defaultImage={base.image}
                name={override?.name ?? null}
                imageUrl={override?.imageUrl ?? null}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
