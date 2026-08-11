import type { Metadata } from "next";
import { Gauge, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { addLevelXpTier } from "./actions";
import { LevelXpRuleRow } from "@/components/levels/level-xp-rule-row";
import { DEFAULT_XP_PER_LEVEL, MAX_LEVEL, LEVELS_PER_TIER, tierLevelRange } from "@/lib/level-xp";

export const metadata: Metadata = {
  title: "Level settings — Back Office",
};

export default async function LevelSettingsPage() {
  const rules = await prisma.levelXpRule.findMany({ orderBy: { tier: "asc" } });

  const maxTier = Math.ceil(MAX_LEVEL / LEVELS_PER_TIER);
  const highestConfiguredTier = rules.length > 0 ? rules[rules.length - 1].tier : 0;
  const nextTier = Math.min(highestConfiguredTier + 1, maxTier);
  const nextTierDefault = rules.length > 0 ? rules[rules.length - 1].xpPerLevel : DEFAULT_XP_PER_LEVEL;
  const canAddMore = highestConfiguredTier < maxTier;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Gauge size={22} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Level settings</h2>
          <p className="max-w-xl text-sm text-muted">
            Set how much XP a player needs per level, in bands of {LEVELS_PER_TIER} levels. A level beyond your
            highest configured tier uses that tier&apos;s rate — you don&apos;t have to configure every tier up to{" "}
            {MAX_LEVEL}.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised p-4">
        {rules.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            No tiers configured yet — every level currently costs the platform default of {DEFAULT_XP_PER_LEVEL}{" "}
            XP. Add a tier below to customize it.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {rules.map((rule) => {
              const range = tierLevelRange(rule.tier);
              return (
                <LevelXpRuleRow
                  key={rule.tier}
                  tier={rule.tier}
                  levelStart={range.start}
                  levelEnd={range.end}
                  xpPerLevel={rule.xpPerLevel}
                  canDelete
                />
              );
            })}
          </div>
        )}

        {canAddMore && (
          <form action={addLevelXpTier.bind(null, nextTier, nextTierDefault)} className="mt-3">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-2 text-xs font-medium text-muted transition hover:border-primary hover:text-primary"
            >
              <Plus size={14} />
              Add tier {nextTier} (levels {tierLevelRange(nextTier).start}–{tierLevelRange(nextTier).end})
            </button>
          </form>
        )}

        {rules.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            Levels {tierLevelRange(highestConfiguredTier).end + 1}+ currently cost{" "}
            {rules[rules.length - 1].xpPerLevel} XP/level — the rate from tier {highestConfiguredTier}, your
            highest configured one.
          </p>
        )}
      </div>
    </div>
  );
}
