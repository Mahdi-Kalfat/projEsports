"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { formatCompactCurrency, formatPriceByType } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
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
  entryType: string;
  entryCost: number;
  registeredCount: number;
  startAtLabel: string;
  isJoined: boolean;
};

export function TournamentCard({ tournament }: { tournament: TournamentCardData }) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25, ease: "easeOut" }} className="h-full">
      <Link
        href={`/tournaments/${tournament.id}`}
        className="hover-glow group block h-full overflow-hidden rounded-2xl border border-border bg-surface-raised transition-colors hover:border-primary/50"
      >
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-surface to-surface-raised">
          {tournament.backgroundImageUrl && (
            <Image
              src={tournament.backgroundImageUrl}
              alt=""
              fill
              unoptimized
              className="object-cover transition duration-500 group-hover:scale-110"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-raised via-surface-raised/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />

          <span
            className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${
              STATUS_TONE[tournament.status] ?? "bg-muted/15 text-muted ring-1 ring-muted/20"
            }`}
          >
            {STATUS_LABEL[tournament.status] ?? tournament.status}
          </span>
          {tournament.isJoined && (
            <span className="absolute left-3 top-3 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-canvas shadow-[0_0_12px_rgba(40,255,139,0.5)]">
              Joined
            </span>
          )}

          <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
            {tournament.logoImageUrl && (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-surface-raised bg-surface shadow-lg">
                <Image src={tournament.logoImageUrl} alt="" width={44} height={44} unoptimized className="object-contain" />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                {tournament.gameName} · {tournament.participationType === "TEAM" ? "Teams" : "Solo"}
              </p>
              <h3 className="truncate font-display text-lg font-bold text-white">{tournament.title}</h3>
            </div>
          </div>
        </div>

        <div className="p-4">
          {tournament.description && (
            <p className="line-clamp-2 text-sm text-muted">{tournament.description}</p>
          )}

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-sm">
            <div>
              <p className="text-xs text-muted">Prize pool</p>
              <p className="font-semibold text-foreground">{formatCompactCurrency(tournament.prizePool)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Entry</p>
              <p className="font-semibold text-foreground">
                {formatPriceByType(tournament.entryType, tournament.entryCost)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Registered</p>
              <p className="font-semibold text-foreground">{tournament.registeredCount}</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted">{tournament.startAtLabel}</p>
        </div>
      </Link>
    </motion.div>
  );
}
