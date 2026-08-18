"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { Check, X } from "lucide-react";
import {
  approveTournamentRegistration,
  rejectTournamentRegistration,
  type RegistrationActionState,
} from "@/app/(app)/tournaments/actions";

function ApproveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Approve registration"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-success/15 text-success transition hover:bg-success/25 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Check size={16} />
    </button>
  );
}

function RejectButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Reject registration"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-muted transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      <X size={16} />
    </button>
  );
}

export type PendingRegistrationData = {
  id: string;
  teamName: string;
  teamTag: string;
  teamLogoUrl: string | null;
  members: { id: string; username: string }[];
};

const initialState: RegistrationActionState = {};

export function PendingRegistrationRow({ registration }: { registration: PendingRegistrationData }) {
  const [approveState, approveAction] = useActionState(
    approveTournamentRegistration.bind(null, registration.id),
    initialState,
  );
  const [rejectState, rejectAction] = useActionState(
    rejectTournamentRegistration.bind(null, registration.id),
    initialState,
  );

  return (
    <li className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/15 font-display text-xs font-semibold text-primary">
          {registration.teamLogoUrl ? (
            <Image
              src={registration.teamLogoUrl}
              alt=""
              width={36}
              height={36}
              unoptimized
              className="object-contain"
            />
          ) : (
            registration.teamTag.slice(0, 2)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{registration.teamName}</p>
          <p className="text-xs text-muted">
            [{registration.teamTag}] · {registration.members.length}{" "}
            {registration.members.length === 1 ? "player" : "players"}
          </p>
        </div>
        <form action={approveAction}>
          <ApproveButton />
        </form>
        <form action={rejectAction}>
          <RejectButton />
        </form>
      </div>
      <p className="mt-2 truncate text-xs text-muted">{registration.members.map((m) => m.username).join(", ")}</p>
      {approveState.error && <p className="mt-1 text-xs text-primary-glow">{approveState.error}</p>}
      {rejectState.error && <p className="mt-1 text-xs text-primary-glow">{rejectState.error}</p>}
    </li>
  );
}
