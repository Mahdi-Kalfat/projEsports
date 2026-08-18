"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import {
  updatePaymentMethod,
  deletePaymentMethod,
  type PaymentMethodActionState,
} from "@/app/(app)/payment-methods/actions";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Remove payment method"
      className="text-muted transition hover:text-primary disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  );
}

const initialState: PaymentMethodActionState = {};

export function PaymentMethodRow({ id, name, details }: { id: string; name: string; details: string }) {
  const boundUpdate = updatePaymentMethod.bind(null, id);
  const [state, formAction] = useActionState(boundUpdate, initialState);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <form action={formAction} className="flex flex-1 flex-wrap items-center gap-2">
        <input
          key={name}
          type="text"
          name="name"
          defaultValue={name}
          maxLength={60}
          placeholder="e.g. D17"
          className="w-36 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-sm font-semibold text-foreground outline-none focus:border-primary"
        />
        <input
          key={details}
          type="text"
          name="details"
          defaultValue={details}
          maxLength={200}
          placeholder="e.g. 22688314"
          className="min-w-48 flex-1 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
        />
        <SaveButton />
        {state.error && <span className="text-xs text-primary-glow">{state.error}</span>}
        {state.success && <span className="text-xs text-success">Saved</span>}
      </form>

      <form action={deletePaymentMethod.bind(null, id)}>
        <DeleteButton />
      </form>
    </div>
  );
}
