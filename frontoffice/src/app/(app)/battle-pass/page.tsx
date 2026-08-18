import type { Metadata } from "next";
import { Rocket } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRequiredXp } from "@/lib/level-xp";
import { getActiveBattlePass, hasUnlockedPremium } from "@/lib/battle-pass";
import { describeItemEffect } from "@/lib/item-effects";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { UnlockPremiumButton } from "@/components/battle-pass/unlock-premium-button";
import { XpMeter } from "@/components/ui/xp-meter";
import { GuestBanner } from "@/components/ui/guest-banner";
import { SignInToContinueButton } from "@/components/ui/sign-in-button";

export const metadata: Metadata = {
  title: "Battle Pass — Clutcher",
};

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function BattlePassPage() {
  const session = await auth();
  const viewerId = session?.user?.id;

  const [battlePass, viewer, levelXpRules, rankOverrides] = await Promise.all([
    getActiveBattlePass(),
    viewerId
      ? prisma.user.findUniqueOrThrow({ where: { id: viewerId }, select: { level: true, xp: true } })
      : null,
    prisma.levelXpRule.findMany({ select: { tier: true, xpPerLevel: true } }),
    prisma.rankTier.findMany(),
  ]);
  const alreadyUnlocked = battlePass && viewerId ? await hasUnlockedPremium(viewerId, battlePass.id) : false;
  const requiredXp = viewer ? getRequiredXp(viewer.level, levelXpRules) : 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Season pass"
        title="Battle"
        accentWord="Pass"
        subtitle={battlePass?.description ?? "Climb the tiers to unlock free and premium rewards this season."}
      />

      {!viewerId && (
        <GuestBanner message="Create a free account to track your tier progress and unlock Premium rewards." />
      )}

      {!battlePass ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised text-center text-sm text-muted">
          <Rocket size={28} className="text-muted/50" />
          There&apos;s no active battle pass right now — check back soon.
        </div>
      ) : (
        <>
          <Reveal>
            <div className="glass-panel flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-border p-6">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">{battlePass.title}</h2>
                <p className="mt-1 text-sm text-muted">
                  {formatDateTime(battlePass.startAt)} – {formatDateTime(battlePass.endAt)}
                </p>
              </div>
              {viewer && (
                <div className="w-full max-w-xs sm:w-64">
                  <XpMeter level={viewer.level} xp={viewer.xp} requiredXp={requiredXp} rankOverrides={rankOverrides} />
                </div>
              )}
              {viewerId ? (
                <UnlockPremiumButton
                  battlePassId={battlePass.id}
                  cost={battlePass.premiumPointsCost}
                  alreadyUnlocked={alreadyUnlocked}
                />
              ) : (
                <SignInToContinueButton label="Sign in to unlock Premium" />
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
              <div className="grid grid-cols-[3rem_1fr_1fr] gap-px bg-border text-xs font-medium uppercase tracking-wide text-muted sm:grid-cols-[4rem_1fr_1fr]">
                <div className="bg-surface-raised px-3 py-2">Tier</div>
                <div className="bg-surface-raised px-3 py-2">Free</div>
                <div className="bg-surface-raised px-3 py-2 text-accent">Premium</div>
              </div>

              {battlePass.tiers.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted">
                  Tiers for this season haven&apos;t been configured yet.
                </p>
              ) : (
                battlePass.tiers.map((tier) => (
                  <div
                    key={tier.tier}
                    className="grid grid-cols-[3rem_1fr_1fr] gap-px bg-border text-sm sm:grid-cols-[4rem_1fr_1fr]"
                  >
                    <div className="bg-surface-raised px-3 py-3 font-display font-semibold text-foreground">
                      {tier.tier}
                    </div>
                    <div className="bg-surface-raised px-3 py-3 text-foreground">
                      {tier.freeItem ? (
                        <>
                          <p>{tier.freeItem.name}</p>
                          <p className="text-xs text-muted">
                            {describeItemEffect(tier.freeItem.effectType, tier.freeItem.effectValue)}
                          </p>
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div className="bg-surface-raised px-3 py-3 text-accent">
                      {tier.premiumItem ? (
                        <>
                          <p>{tier.premiumItem.name}</p>
                          <p className="text-xs text-muted">
                            {describeItemEffect(tier.premiumItem.effectType, tier.premiumItem.effectValue)}
                          </p>
                        </>
                      ) : (
                        "—"
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Reveal>
        </>
      )}
    </div>
  );
}
