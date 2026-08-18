"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, X } from "lucide-react";
import { createItem, type CreateItemState } from "@/app/(app)/items/actions";
import { ItemFormFields } from "./item-form-fields";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Creating…" : "Create item"}
    </button>
  );
}

const initialState: CreateItemState = {};

export function AddItemModal() {
  const [open, setOpen] = useState(false);
  const [handledSuccess, setHandledSuccess] = useState(false);
  const [state, formAction] = useActionState(createItem, initialState);

  if (state.success && !handledSuccess) {
    setHandledSuccess(true);
    setOpen(false);
  }

  function openModal() {
    setHandledSuccess(false);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="btn-neon inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow"
      >
        <Plus size={16} />
        Add item
      </button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          <button aria-label="Close" onClick={() => setOpen(false)} className="fixed inset-0 bg-black/70" />

          <form
            action={formAction}
            className="relative z-10 mx-auto my-8 w-full max-w-lg rounded-xl border border-border bg-surface-raised p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Add item</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted transition hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4">
              <ItemFormFields />
            </div>

            {state.error && <p className="mt-3 text-xs text-primary-glow">{state.error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
              >
                Cancel
              </button>
              <SubmitButton />
            </div>
          </form>
        </div>
      )}
    </>
  );
}
