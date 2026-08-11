import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserClanMembership, MIN_LEVEL_TO_CREATE_CLAN } from "@/lib/clans";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { CreateClanForm } from "@/components/clans/create-clan-form";

export const metadata: Metadata = {
  title: "Create a clan — Esports Tournament Platform",
};

export default async function NewClanPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [user, existingMembership] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    getUserClanMembership(userId),
  ]);

  const eligible = user.level >= MIN_LEVEL_TO_CREATE_CLAN && !existingMembership;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <PageHeader
        eyebrow="Squad up"
        title="Create a"
        accentWord="Clan"
        subtitle="Rally your squad under one banner."
      />

      <Reveal delay={0.1}>
        <div className="glass-panel rounded-2xl border border-border p-6 shadow-2xl sm:p-8">
          {eligible ? (
            <CreateClanForm />
          ) : (
            <p className="rounded-md bg-warning/10 px-4 py-3 text-center text-sm text-warning">
              {existingMembership
                ? "You're already in a clan — leave it before creating a new one."
                : `You need to be level ${MIN_LEVEL_TO_CREATE_CLAN} or above to create a clan. You're currently level ${user.level}.`}
            </p>
          )}
        </div>
      </Reveal>
    </div>
  );
}
