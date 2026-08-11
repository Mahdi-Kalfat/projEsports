"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createClan, type ClanActionState } from "@/app/(app)/clans/actions";
import { ClanFormFields } from "./clan-form-fields";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create clan"}
    </button>
  );
}

const initialState: ClanActionState = {};

export function CreateClanForm() {
  const [state, formAction] = useActionState(createClan, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <ClanFormFields />
      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
