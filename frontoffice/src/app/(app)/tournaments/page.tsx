import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Trophy } from "lucide-react";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { Reveal } from "@/components/ui/reveal";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Tournaments — Esports Tournament Platform",
};

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default async function TournamentsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [tournaments, myParticipations] = await Promise.all([
    prisma.tournament.findMany({
      where: { status: { not: "DRAFT" } },
      orderBy: { startAt: "asc" },
      include: { game: true, _count: { select: { participants: true } } },
    }),
    prisma.tournamentParticipant.findMany({
      where: { userId },
      select: { tournamentId: true },
    }),
  ]);

  const joinedIds = new Set(myParticipations.map((p) => p.tournamentId));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Compete"
        title="Find your next"
        accentWord="fight"
        subtitle="Browse open brackets, register solo or with your squad, and climb the leaderboard."
      />

      {tournaments.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised text-center text-sm text-muted">
          <Trophy size={28} className="text-muted/50" />
          No tournaments are open right now — check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament, i) => (
            <Reveal key={tournament.id} delay={Math.min(i * 0.05, 0.3)}>
              <TournamentCard
                tournament={{
                  id: tournament.id,
                  title: tournament.title,
                  description: tournament.description,
                  status: tournament.status,
                  gameName: tournament.game.name,
                  participationType: tournament.participationType,
                  backgroundImageUrl: tournament.backgroundImageUrl,
                  logoImageUrl: tournament.logoImageUrl,
                  prizePool: tournament.prizePool,
                  entryType: tournament.entryType,
                  entryCost: tournament.entryCost,
                  registeredCount: tournament._count.participants,
                  startAtLabel: formatDateTime(tournament.startAt),
                  isJoined: joinedIds.has(tournament.id),
                }}
              />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
