import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/ui/reveal";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitListingForm } from "@/components/marketplace/submit-listing-form";

export const metadata: Metadata = {
  title: "Sell something — Marketplace",
};

export default async function NewListingPage() {
  const games = await prisma.game.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <PageHeader
        eyebrow="Trade"
        title="Sell"
        accentWord="something"
        subtitle="Your listing goes to an admin for review before it's shown in the marketplace."
      />

      <Reveal delay={0.1}>
        <div className="glass-panel rounded-2xl border border-border p-6 shadow-2xl sm:p-8">
          <SubmitListingForm games={games.map((g) => ({ id: g.id, name: g.name }))} />
        </div>
      </Reveal>
    </div>
  );
}
