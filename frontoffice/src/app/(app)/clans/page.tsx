import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Shield } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ClanCard } from "@/components/clans/clan-card";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Clans — Clutcher",
};

export default async function ClansPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const clans = await prisma.clan.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true } } },
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Squad up"
        title="Find your"
        accentWord="Clan"
        subtitle="Join a team, or start your own once you hit level 20."
        action={
          <Link
            href="/clans/new"
            className="btn-neon inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow"
          >
            <Plus size={16} />
            Create clan
          </Link>
        }
      />

      {clans.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised text-center text-sm text-muted">
          <Shield size={28} className="text-muted/50" />
          No clans yet — be the first to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clans.map((clan, i) => (
            <Reveal key={clan.id} delay={Math.min(i * 0.05, 0.3)}>
              <ClanCard
                clan={{
                  id: clan.id,
                  name: clan.name,
                  tag: clan.tag,
                  description: clan.description,
                  logoUrl: clan.logoUrl,
                  bannerUrl: clan.bannerUrl,
                  visibility: clan.visibility,
                  minLevel: clan.minLevel,
                  maxMembers: clan.maxMembers,
                  memberCount: clan._count.members,
                }}
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
