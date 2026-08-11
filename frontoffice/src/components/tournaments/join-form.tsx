"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { joinTournament, type JoinTournamentState } from "@/app/(app)/tournaments/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon w-full rounded-md bg-primary py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Joining…" : label}
    </button>
  );
}

const initialState: JoinTournamentState = {};

export function JoinForm({ tournamentId, requiresTeamName }: { tournamentId: string; requiresTeamName: boolean }) {
  const boundAction = joinTournament.bind(null, tournamentId);
  const [state, formAction] = useActionState(boundAction, initialState);

  if (state.success) {
    return <p className="rounded-md bg-success/15 px-3 py-2.5 text-center text-sm font-medium text-success">You&apos;re in! Good luck.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {requiresTeamName && (
        <label className="text-xs text-muted">
          Team name
          <input
            type="text"
            name="teamName"
            required
            maxLength={60}
            placeholder="Your squad's name"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
      )}
      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
      <SubmitButton label={requiresTeamName ? "Register team" : "Join tournament"} />
    </form>
  );
}
