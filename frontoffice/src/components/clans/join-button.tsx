"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus, Clock, X, LogOut, ShieldCheck } from "lucide-react";
import { joinClan, cancelJoinRequest, leaveClan, type ClanActionState } from "@/app/(app)/clans/actions";
import type { ClanRelationStatus } from "@/lib/clans";

function JoinSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      <UserPlus size={16} />
      {pending ? "…" : label}
    </button>
  );
}

const initialJoinState: ClanActionState = {};

function JoinForm({ clanId, isPrivate }: { clanId: string; isPrivate: boolean }) {
  const boundAction = joinClan.bind(null, clanId);
  const [state, formAction] = useActionState(boundAction, initialJoinState);

  if (state.success) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold ${
          isPrivate ? "bg-warning/15 text-warning" : "bg-success/15 text-success"
        }`}
      >
        {isPrivate ? <Clock size={16} /> : <ShieldCheck size={16} />}
        {isPrivate ? "Request sent" : "Joined!"}
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <JoinSubmitButton label={isPrivate ? "Request to join" : "Join clan"} />
      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
    </form>
  );
}

function LeaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted transition hover:border-primary hover:text-primary disabled:opacity-50"
    >
      <LogOut size={14} />
      {pending ? "…" : "Leave clan"}
    </button>
  );
}

export function JoinButton({
  clanId,
  status,
  isPrivate,
  eligible,
  minLevel,
  isFull,
}: {
  clanId: string;
  status: ClanRelationStatus;
  isPrivate: boolean;
  eligible: boolean;
  minLevel: number;
  isFull: boolean;
}) {
  if (status.kind === "OWNER") return null;

  if (status.kind === "ADMIN" || status.kind === "MEMBER") {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-success/15 px-4 py-2 text-sm font-semibold text-success">
          <ShieldCheck size={16} />
          {status.kind === "ADMIN" ? "Admin" : "Member"}
        </span>
        <form action={leaveClan.bind(null, clanId)}>
          <LeaveButton />
        </form>
      </div>
    );
  }

  if (status.kind === "PENDING_REQUEST") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-warning/15 px-4 py-2 text-sm font-semibold text-warning">
          <Clock size={16} />
          Request sent
        </span>
        <form action={cancelJoinRequest.bind(null, status.requestId)}>
          <button
            type="submit"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted transition hover:text-primary"
          >
            <X size={12} />
            Cancel request
          </button>
        </form>
      </div>
    );
  }

  if (status.kind === "IN_OTHER_CLAN") {
    return (
      <p className="max-w-[12rem] text-right text-xs text-muted">
        You&apos;re already in a clan — leave it to join a different one.
      </p>
    );
  }

  // NONE
  if (isFull) {
    return <p className="text-xs text-muted">This clan is full.</p>;
  }
  if (!eligible) {
    return <p className="max-w-[12rem] text-right text-xs text-muted">Requires level {minLevel} to join.</p>;
  }

  return <JoinForm clanId={clanId} isPrivate={isPrivate} />;
}
