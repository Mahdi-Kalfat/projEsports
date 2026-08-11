"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { X } from "lucide-react";
import { updateTournament, type CreateTournamentState } from "@/app/(app)/tournaments/actions";
import {
  TournamentFormFields,
  type GameOption,
  type TournamentFormDefaults,
} from "./tournament-form-fields";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

const initialState: CreateTournamentState = {};

export function EditTournamentModal({
  tournamentId,
  games,
  defaults,
  currentBackgroundImageUrl,
  currentLogoImageUrl,
  onClose,
}: {
  tournamentId: string;
  games: GameOption[];
  defaults: TournamentFormDefaults;
  currentBackgroundImageUrl: string | null;
  currentLogoImageUrl: string | null;
  onClose: () => void;
}) {
  const boundAction = updateTournament.bind(null, tournamentId);
  const [state, formAction] = useActionState(boundAction, initialState);

  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto p-4">
      <button aria-label="Close" onClick={onClose} className="fixed inset-0 bg-black/70" />

      <form
        action={formAction}
        className="relative z-10 mx-auto my-8 w-full max-w-lg rounded-xl border border-border bg-surface-raised p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-foreground">Edit tournament</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted transition hover:text-foreground"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4">
          <TournamentFormFields
            games={games}
            defaults={defaults}
            currentBackgroundImageUrl={currentBackgroundImageUrl}
            currentLogoImageUrl={currentLogoImageUrl}
          />
        </div>

        {state.error && <p className="mt-3 text-xs text-primary-glow">{state.error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            Cancel
          </button>
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
