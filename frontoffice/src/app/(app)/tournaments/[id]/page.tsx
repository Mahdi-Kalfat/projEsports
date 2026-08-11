import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCompactCurrency, formatPriceByType } from "@/lib/format";
import { Reveal } from "@/components/ui/reveal";
import { JoinForm } from "@/components/tournaments/join-form";

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
  const userId = session!.user.id;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      game: true,
      participants: {
        include: { user: { select: { username: true } } },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!tournament || tournament.status === "DRAFT") notFound();

  const myEntry = tournament.participants.find((p) => p.userId === userId);
  const isJoined = !!myEntry;
  const canJoin = tournament.status === "REGISTRATION" && tournament.entryType !== "MONEY";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/tournaments"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted transition hover:text-primary"
      >
        <ArrowLeft size={14} />
        All tournaments
      </Link>

      <Reveal>
        <div className="relative h-72 overflow-hidden rounded-2xl border border-border sm:h-96">
          {tournament.backgroundImageUrl ? (
            <Image src={tournament.backgroundImageUrl} alt="" fill unoptimized priority className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-raised" />
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
          </dl>

          {tournament.description && <p className="mt-5 text-sm text-muted">{tournament.description}</p>}
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
            ) : canJoin ? (
              <JoinForm tournamentId={tournament.id} requiresTeamName={tournament.participationType === "TEAM"} />
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

      <Reveal delay={0.15}>
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-surface-raised p-6">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            <Users size={14} />
            Participants ({tournament.participants.length})
          </div>
          {tournament.participants.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No one has registered yet — be the first.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {tournament.participants.map((p) => (
                <li
                  key={p.id}
                  className="rounded-full border border-border px-3 py-1 text-xs text-foreground"
                >
                  {p.teamName ?? p.user.username}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Reveal>
    </div>
  );
}
