"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Users, X } from "lucide-react";
import { deleteTournament, setTournamentStatus } from "@/app/(app)/tournaments/actions";
import { EditTournamentModal } from "./edit-tournament-modal";
import type { GameOption, TournamentFormDefaults } from "./tournament-form-fields";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "REGISTRATION", label: "Registration open" },
  { value: "CHECK_IN", label: "Check-in" },
  { value: "LIVE", label: "Live" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
];

const SELECT_CLASS =
  "mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary";

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

function StatusSelect({ tournamentId, status }: { tournamentId: string; status: string }) {
  return (
    <form action={setTournamentStatus.bind(null, tournamentId)}>
      <label className="text-xs text-muted">
        Status
        <select
          key={status}
          name="status"
          defaultValue={status}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className={SELECT_CLASS}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}

function DeleteConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

function DeleteConfirmPrompt({
  tournamentId,
  title,
  onClose,
}: {
  tournamentId: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />

      <form
        action={deleteTournament.bind(null, tournamentId)}
        className="relative z-10 w-full max-w-xs rounded-xl border border-border bg-surface-raised p-5 shadow-2xl"
      >
        <h3 className="font-display text-sm font-semibold text-foreground">Delete &ldquo;{title}&rdquo;?</h3>
        <p className="mt-1 text-xs text-muted">This can&apos;t be undone.</p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            Cancel
          </button>
          <DeleteConfirmButton />
        </div>
      </form>
    </div>
  );
}

export type ParticipantEntry = {
  id: string;
  username: string;
  teamName: string | null;
  joinedLabel: string;
};

export type TournamentDetail = {
  id: string;
  title: string;
  description: string | null;
  additionalInfo: string | null;
  status: string;
  gameId: string;
  gameName: string;
  entryCost: number;
  prizePool: number;
  participationType: string;
  backgroundImageUrl: string | null;
  logoImageUrl: string | null;
  startAtLabel: string;
  startAtLocal: string;
};

export function TournamentDetailModal({
  tournament,
  games,
  participants,
  closeHref,
}: {
  tournament: TournamentDetail;
  games: GameOption[];
  participants: ParticipantEntry[];
  closeHref: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (confirmingDelete) {
        setConfirmingDelete(false);
      } else if (editing) {
        setEditing(false);
      } else {
        router.push(closeHref);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmingDelete, editing, closeHref, router]);

  const editDefaults: TournamentFormDefaults = {
    title: tournament.title,
    startAtLocal: tournament.startAtLocal,
    gameId: tournament.gameId,
    description: tournament.description ?? "",
    additionalInfo: tournament.additionalInfo ?? "",
    prizePool: tournament.prizePool,
    entryCost: tournament.entryCost,
    participationType: tournament.participationType,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close"
        onClick={() => router.push(closeHref)}
        className="absolute inset-0 bg-black/70"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface-raised p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {tournament.logoImageUrl && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
                <Image
                  src={tournament.logoImageUrl}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="object-contain"
                />
              </span>
            )}
            <div>
              <h2 className="font-display text-base font-bold text-foreground">{tournament.title}</h2>
              <p className="text-xs text-muted">{tournament.gameName}</p>
            </div>
          </div>
          <Link href={closeHref} aria-label="Close" className="text-muted transition hover:text-foreground">
            <X size={20} />
          </Link>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <InfoField label="Date & time" value={tournament.startAtLabel} />
          <InfoField
            label="Who can join"
            value={tournament.participationType === "TEAM" ? "Teams only" : "Single player"}
          />
          <InfoField label="Prize pool" value={`${tournament.prizePool.toLocaleString("en-US")} DT`} />
          <InfoField
            label="Entry price"
            value={tournament.entryCost > 0 ? `${tournament.entryCost.toLocaleString("en-US")} DT` : "Free"}
          />
        </dl>

        {tournament.description && (
          <p className="mt-3 text-sm text-muted">{tournament.description}</p>
        )}
        {tournament.additionalInfo && (
          <div className="mt-3 rounded-md border border-border bg-surface px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Additional information</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{tournament.additionalInfo}</p>
          </div>
        )}

        <div className="mt-4 max-w-[10rem]">
          <StatusSelect tournamentId={tournament.id} status={tournament.status} />
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            <Users size={14} />
            Participants ({participants.length})
          </div>
          <div className="mt-2 max-h-48 overflow-y-auto">
            {participants.length === 0 ? (
              <p className="text-sm text-muted">No participants yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {participants.map((participant) => (
                  <li
                    key={participant.id}
                    className="flex items-center justify-between border-b border-border/60 pb-2 text-sm last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">{participant.username}</p>
                      {participant.teamName && (
                        <p className="text-xs text-muted">Team: {participant.teamName}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted">{participant.joinedLabel}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-5 flex gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            <Pencil size={14} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <EditTournamentModal
          tournamentId={tournament.id}
          games={games}
          defaults={editDefaults}
          currentBackgroundImageUrl={tournament.backgroundImageUrl}
          currentLogoImageUrl={tournament.logoImageUrl}
          onClose={() => setEditing(false)}
        />
      )}

      {confirmingDelete && (
        <DeleteConfirmPrompt
          tournamentId={tournament.id}
          title={tournament.title}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
