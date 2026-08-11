import Image from "next/image";
import Link from "next/link";
import { formatCompactCurrency } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  REGISTRATION: "Registration open",
  CHECK_IN: "Check-in",
  LIVE: "Live",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-muted/15 text-muted",
  REGISTRATION: "bg-accent/15 text-accent",
  CHECK_IN: "bg-warning/15 text-warning",
  LIVE: "bg-success/15 text-success",
  COMPLETED: "bg-primary/15 text-primary",
  ARCHIVED: "bg-muted/15 text-muted",
};

export type TournamentCardData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  gameName: string;
  participationType: string;
  backgroundImageUrl: string | null;
  logoImageUrl: string | null;
  prizePool: number;
  entryCost: number;
  registeredCount: number;
  startAtLabel: string;
};

export function TournamentCard({ tournament, href }: { tournament: TournamentCardData; href: string }) {
  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-xl border border-border bg-surface-raised transition hover:border-primary/60"
    >
      <div className="relative h-28 w-full bg-gradient-to-br from-surface to-surface-raised">
        {tournament.backgroundImageUrl && (
          <Image
            src={tournament.backgroundImageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-transparent to-black/30" />
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${
            STATUS_TONE[tournament.status] ?? "bg-muted/15 text-muted"
          }`}
        >
          {STATUS_LABEL[tournament.status] ?? tournament.status}
        </span>
        {tournament.logoImageUrl && (
          <span className="absolute -bottom-5 left-4 flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border-2 border-surface-raised bg-surface">
            <Image
              src={tournament.logoImageUrl}
              alt=""
              width={44}
              height={44}
              unoptimized
              className="object-contain"
            />
          </span>
        )}
      </div>

      <div className={tournament.logoImageUrl ? "p-4 pt-7" : "p-4"}>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {tournament.gameName} · {tournament.participationType === "TEAM" ? "Teams" : "Solo"}
        </p>
        <h3 className="mt-1 font-display text-base font-bold text-foreground">{tournament.title}</h3>
        {tournament.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{tournament.description}</p>
        )}

        <div className="mt-3 flex items-center justify-between text-sm">
          <div>
            <p className="text-xs text-muted">Prize pool</p>
            <p className="font-semibold text-foreground">{formatCompactCurrency(tournament.prizePool)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Entry</p>
            <p className="font-semibold text-foreground">
              {tournament.entryCost > 0 ? formatCompactCurrency(tournament.entryCost) : "Free"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Registered</p>
            <p className="font-semibold text-foreground">{tournament.registeredCount}</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted">{tournament.startAtLabel}</p>
      </div>
    </Link>
  );
}
