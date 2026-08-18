"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { createPaymentMethod, type PaymentMethodActionState } from "@/app/(app)/payment-methods/actions";

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Plus size={16} />
      {pending ? "Adding…" : "Add"}
    </button>
  );
}

const initialState: PaymentMethodActionState = {};

export function AddPaymentMethodForm() {
  const [state, formAction] = useActionState(createPaymentMethod, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border p-4"
    >
      <label className="text-xs text-muted">
        Name
        <input
          type="text"
          name="name"
          required
          maxLength={60}
          placeholder="e.g. D17"
          className="mt-1 w-40 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>
      <label className="min-w-48 flex-1 text-xs text-muted">
        Details
        <input
          type="text"
          name="details"
          required
          maxLength={200}
          placeholder="e.g. 22688314"
          className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>
      <AddButton />
      {state.error && <p className="w-full text-xs text-primary-glow">{state.error}</p>}
    </form>
  );
}
