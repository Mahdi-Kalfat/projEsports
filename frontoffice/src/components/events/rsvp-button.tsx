"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { rsvpEvent, type RsvpEventState } from "@/app/(app)/events/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon w-full rounded-md bg-primary py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "RSVPing…" : "RSVP"}
    </button>
  );
}

const initialState: RsvpEventState = {};

export function RsvpButton({ eventId }: { eventId: string }) {
  const boundAction = rsvpEvent.bind(null, eventId);
  const [state, formAction] = useActionState(boundAction, initialState);

  if (state.success) {
    return (
      <p className="rounded-md bg-success/15 px-3 py-2.5 text-center text-sm font-medium text-success">
        You&apos;re on the list!
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
