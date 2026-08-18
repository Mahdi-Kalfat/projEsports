import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/ui/reveal";
import { PageHeader } from "@/components/ui/page-header";
import { LockedFeature } from "@/components/ui/locked-feature";
import { MARKETPLACE_MIN_LEVEL } from "@/lib/marketplace";
import { SubmitListingForm } from "@/components/marketplace/submit-listing-form";

export const metadata: Metadata = {
  title: "Sell something — Marketplace",
};

export default async function NewListingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { level: true } });
  const unlocked = user.level >= MARKETPLACE_MIN_LEVEL;

  const games = unlocked ? await prisma.game.findMany({ orderBy: { name: "asc" } }) : [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <PageHeader
        eyebrow="Trade"
        title="Sell"
        accentWord="something"
        subtitle="Your listing goes to an admin for review before it's shown in the marketplace."
      />

      {unlocked ? (
        <Reveal delay={0.1}>
          <div className="glass-panel rounded-2xl border border-border p-6 shadow-2xl sm:p-8">
            <SubmitListingForm games={games.map((g) => ({ id: g.id, name: g.name }))} />
          </div>
        </Reveal>
      ) : (
        <div className="min-h-[50vh]" />
      )}

      {!unlocked && (
        <LockedFeature
          title="Marketplace locked"
          message={`Reach Level ${MARKETPLACE_MIN_LEVEL} to sell here — you're currently Level ${user.level}.`}
        />
      )}
    </div>
  );
}
