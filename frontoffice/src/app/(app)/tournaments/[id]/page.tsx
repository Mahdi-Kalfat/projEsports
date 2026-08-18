import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Users, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCompactCurrency, formatPriceByType } from "@/lib/format";
import { registeredCount, isTournamentFull, formatCapacityLabel } from "@/lib/tournament-capacity";
import { Reveal } from "@/components/ui/reveal";
import { JoinForm } from "@/components/tournaments/join-form";
import { TeamRegistrationButton } from "@/components/tournaments/team-registration-button";
import { TeamRosterButton } from "@/components/tournaments/team-roster-button";
import { ExpandableDescription } from "@/components/tournaments/expandable-description";
import { TournamentBracket } from "@/components/tournaments/tournament-bracket";
import { NoArtFallback } from "@/components/ui/no-art-fallback";
import { BackLink } from "@/components/ui/back-link";
import { SignInToContinueButton } from "@/components/ui/sign-in-button";

export async function generateMetadata(props: PageProps<"/tournaments/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const tournament = await prisma.tournament.findUnique({ where: { id }, select: { title: true } });
  return { title: tournament ? `${tournament.title} — Tournaments` : "Tournament" };
}

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  REGISTRATION: "Registration open",
  CHECK_IN: "Check-in",
  LIVE: "Live",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const STATUS_TONE: Record<string, string> = {
  REGISTRATION: "bg-accent/15 text-accent ring-1 ring-accent/30",
  CHECK_IN: "bg-warning/15 text-warning ring-1 ring-warning/30",
  LIVE: "bg-success/15 text-success ring-1 ring-success/30",
  COMPLETED: "bg-primary/15 text-primary ring-1 ring-primary/30",
  ARCHIVED: "bg-muted/15 text-muted ring-1 ring-muted/20",
};

function InfoField({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className={big ? "font-display text-xl font-bold text-foreground" : "font-medium text-foreground"}>
        {value}
      </dd>
    </div>
  );
}

export default async function TournamentDetailPage(props: PageProps<"/tournaments/[id]">) {
  const { id } = await props.params;
  const session = await auth();
  const userId = session?.user?.id;

  const [tournament, myRegistrations, approvedRegistrations] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id },
      include: {
        game: true,
        participants: {
          include: { user: { select: { username: true, avatarUrl: true } } },
          orderBy: { joinedAt: "asc" },
        },
      },
    }),
    userId
      ? prisma.tournamentRegistration.findMany({
          where: { tournamentId: id, members: { some: { userId } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.tournamentRegistration.findMany({
      where: { tournamentId: id, status: "APPROVED" },
      select: { id: true, teamName: true, teamTag: true, teamLogoUrl: true, bracketSlot: true },
    }),
  ]);

  if (!tournament || tournament.status === "DRAFT") notFound();

  const myEntry = tournament.participants.find((p) => p.userId === userId);
  const isJoined = !!myEntry;
  const pendingRegistration = myRegistrations.find((r) => r.status === "PENDING");
  const lastRejectedRegistration = !pendingRegistration
    ? myRegistrations.find((r) => r.status === "REJECTED")
    : undefined;

  const full = isTournamentFull(tournament.participationType, tournament.participants, tournament.capacity);
  const canJoin =
    tournament.status === "REGISTRATION" && tournament.entryType !== "MONEY" && !full && !pendingRegistration;

  const registered = registeredCount(tournament.participationType, tournament.participants);

  // TEAM tournaments create one TournamentParticipant row per roster member
  // (see joinTournament/approveTournamentRegistration) — group them back into
  // one entry per team for display, instead of repeating the same team name
  // once per player.
  const isTeamTournament = tournament.participationType === "TEAM";
  const teamGroups = isTeamTournament
    ? Array.from(
        tournament.participants
          .reduce((map, p) => {
            const key = p.teamTag ?? p.teamName ?? p.id;
            const existing = map.get(key);
            const member = { id: p.id, username: p.user.username, avatarUrl: p.user.avatarUrl };
            if (existing) {
              existing.members.push(member);
            } else {
              map.set(key, {
                tag: p.teamTag ?? "—",
                name: p.teamName ?? "Unnamed team",
                logoUrl: p.teamLogoUrl,
                members: [member],
              });
            }
            return map;
          }, new Map<string, { tag: string; name: string; logoUrl: string | null; members: { id: string; username: string; avatarUrl: string | null }[] }>())
          .entries(),
      )
    : [];

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/tournaments" label="All tournaments" />

      <Reveal>
        <div className="relative h-72 overflow-hidden rounded-2xl border border-border sm:h-96">
          {tournament.backgroundImageUrl ? (
            <Image src={tournament.backgroundImageUrl} alt="" fill unoptimized priority className="object-cover" />
          ) : (
            <NoArtFallback gameName={tournament.game.name} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

          <span
            className={`absolute right-5 top-5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm ${
              STATUS_TONE[tournament.status] ?? "bg-muted/15 text-muted ring-1 ring-muted/20"
            }`}
          >
            {STATUS_LABEL[tournament.status] ?? tournament.status}
          </span>

          <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-6 sm:p-10">
            {tournament.logoImageUrl && (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-white/20 bg-surface shadow-2xl sm:h-20 sm:w-20">
                <Image src={tournament.logoImageUrl} alt="" width={64} height={64} unoptimized className="object-contain" />
              </span>
            )}
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                {tournament.game.name}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold uppercase text-white sm:text-4xl">
                {tournament.title}
              </h1>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="glass-panel relative z-10 mx-auto -mt-10 w-full max-w-3xl rounded-2xl border border-border p-6 shadow-2xl sm:-mt-14 sm:p-8">
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <InfoField label="Prize pool" value={formatCompactCurrency(tournament.prizePool)} big />
            <InfoField label="Entry" value={formatPriceByType(tournament.entryType, tournament.entryCost)} big />
            <InfoField label="Format" value={tournament.participationType === "TEAM" ? "Teams" : "Solo"} />
            <InfoField label="Starts" value={formatDateTime(tournament.startAt)} />
            <InfoField
              label="Registered"
              value={formatCapacityLabel(tournament.participationType, registered, tournament.capacity)}
            />
            {tournament.region && <InfoField label="Region" value={tournament.region} />}
          </dl>

          {tournament.description && <ExpandableDescription text={tournament.description} />}
          {tournament.additionalInfo && (
            <div className="mt-4 rounded-md border border-border bg-surface px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Additional information</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{tournament.additionalInfo}</p>
            </div>
          )}

          <div className="mt-6 border-t border-border pt-5">
            {isJoined ? (
              <div className="rounded-md bg-success/15 px-3 py-2.5 text-center text-sm font-medium text-success">
                You&apos;re registered{myEntry?.teamName ? ` as "${myEntry.teamName}"` : ""}. Good luck!
              </div>
            ) : pendingRegistration ? (
              <div className="rounded-md bg-warning/15 px-3 py-2.5 text-center text-sm font-medium text-warning">
                &ldquo;{pendingRegistration.teamName}&rdquo; [{pendingRegistration.teamTag}] is pending admin
                approval.
              </div>
            ) : canJoin ? (
              <div className="flex flex-col gap-2">
                {!userId ? (
                  <SignInToContinueButton label="Sign in to register" className="w-full" />
                ) : (
                  <>
                    {lastRejectedRegistration && (
                      <p className="text-center text-xs text-muted">
                        Your previous registration (&ldquo;{lastRejectedRegistration.teamName}&rdquo;) was declined —
                        you can submit a new one below.
                      </p>
                    )}
                    {tournament.participationType === "TEAM" ? (
                      <TeamRegistrationButton tournamentId={tournament.id} maxTeamSize={tournament.maxTeamSize} />
                    ) : (
                      <JoinForm tournamentId={tournament.id} requiresTeamName={false} />
                    )}
                  </>
                )}
              </div>
            ) : full ? (
              <p className="rounded-md bg-warning/10 px-3 py-2.5 text-center text-sm text-warning">
                This tournament is full.
              </p>
            ) : tournament.entryType === "MONEY" ? (
              <p className="rounded-md bg-warning/10 px-3 py-2.5 text-center text-sm text-warning">
                This tournament requires a money entry fee — contact an admin to register.
              </p>
            ) : (
              <p className="rounded-md bg-muted/10 px-3 py-2.5 text-center text-sm text-muted">
                Registration is not open for this tournament.
              </p>
            )}
          </div>
        </div>
      </Reveal>

      {isTeamTournament && (approvedRegistrations.length > 0 || tournament.capacity !== null) && (
        <Reveal delay={0.125}>
          <div className="mx-auto w-full max-w-6xl rounded-2xl border border-border bg-surface-raised p-6">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              <Trophy size={14} />
              Bracket
            </div>
            <div className="mt-4">
              <TournamentBracket registrations={approvedRegistrations} capacity={tournament.capacity} />
            </div>
          </div>
        </Reveal>
      )}

      <Reveal delay={0.15}>
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              <Users size={14} />
              {isTeamTournament ? `Teams (${registered})` : `Participants (${tournament.participants.length})`}
            </div>
            {tournament.averageRankName && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted">Average rank</p>
                {tournament.averageRankImageUrl && (
                  <Image
                    src={tournament.averageRankImageUrl}
                    alt={tournament.averageRankName}
                    width={24}
                    height={24}
                    unoptimized
                    className="object-contain"
                  />
                )}
                <p className="text-xs font-semibold text-foreground">{tournament.averageRankName}</p>
              </div>
            )}
          </div>
          {tournament.participants.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No one has registered yet — be the first.</p>
          ) : isTeamTournament ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {teamGroups.map(([key, team]) => (
                <TeamRosterButton key={key} team={team} />
              ))}
            </div>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {tournament.participants.map((p) => (
                <li
                  key={p.id}
                  className="rounded-full border border-border px-3 py-1 text-xs text-foreground"
                >
                  {p.user.username}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>
    </div>
  );
}
