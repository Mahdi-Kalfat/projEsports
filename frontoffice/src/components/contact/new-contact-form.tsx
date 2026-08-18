"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { openContactRequest, type NewContactState } from "@/app/(app)/contact/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Sending…" : "Send to admins"}
    </button>
  );
}

const initialState: NewContactState = {};

export function NewContactForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(openContactRequest, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-neon w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow"
      >
        Contact an admin
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-5">
      <input
        type="text"
        name="subject"
        maxLength={150}
        placeholder="Subject"
        autoFocus
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
      <textarea
        name="body"
        rows={4}
        maxLength={2000}
        placeholder="Describe what you need…"
        className="resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
      <div className="flex items-center gap-2">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
