import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { buildTournamentsHref } from "@/lib/tournaments-query";
import { AddTournamentModal } from "@/components/tournaments/add-tournament-modal";
import { TournamentCard } from "@/components/tournaments/tournament-card";
import { TournamentDetailModal } from "@/components/tournaments/tournament-detail-modal";

export const metadata: Metadata = {
  title: "Tournaments — Back Office",
};

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TournamentsPage(props: PageProps<"/tournaments">) {
  const searchParams = await props.searchParams;
  const tournamentId = firstParam(searchParams.tournamentId);

  const [tournaments, games, selectedTournament, participants] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: { startAt: "desc" },
      include: { game: true, _count: { select: { participants: true } } },
    }),
    prisma.game.findMany({ orderBy: { name: "asc" } }),
    tournamentId
      ? prisma.tournament.findUnique({ where: { id: tournamentId }, include: { game: true } })
      : Promise.resolve(null),
    tournamentId
      ? prisma.tournamentParticipant.findMany({
          where: { tournamentId },
          include: { user: { select: { username: true } } },
          orderBy: { joinedAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const gameOptions = games.map((game) => ({ id: game.id, name: game.name }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <AddTournamentModal games={gameOptions} />
      </div>

      {tournaments.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-border bg-surface-raised text-sm text-muted">
          No tournaments yet — create the first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              href={buildTournamentsHref({ tournamentId: tournament.id })}
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
                entryCost: tournament.entryCost,
                registeredCount: tournament._count.participants,
                startAtLabel: formatDateTime(tournament.startAt),
              }}
            />
          ))}
        </div>
      )}

      {selectedTournament && (
        <TournamentDetailModal
          closeHref="/tournaments"
          games={gameOptions}
          tournament={{
            id: selectedTournament.id,
            title: selectedTournament.title,
            description: selectedTournament.description,
            additionalInfo: selectedTournament.additionalInfo,
            status: selectedTournament.status,
            gameId: selectedTournament.gameId,
            gameName: selectedTournament.game.name,
            entryCost: selectedTournament.entryCost,
            prizePool: selectedTournament.prizePool,
            participationType: selectedTournament.participationType,
            backgroundImageUrl: selectedTournament.backgroundImageUrl,
            logoImageUrl: selectedTournament.logoImageUrl,
            startAtLabel: formatDateTime(selectedTournament.startAt),
            startAtLocal: toDatetimeLocalValue(selectedTournament.startAt),
          }}
          participants={participants.map((participant) => ({
            id: participant.id,
            username: participant.user.username,
            teamName: participant.teamName,
            joinedLabel: formatDateTime(participant.joinedAt),
          }))}
        />
      )}
    </div>
  );
}
