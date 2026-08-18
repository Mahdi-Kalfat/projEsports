"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { addLuckyWheelSlot, type LuckyWheelSlotState } from "@/app/(app)/lucky-wheel/actions";

export type AvailableItemOption = { id: string; name: string };

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Plus size={16} />
      {pending ? "Adding…" : "Add to wheel"}
    </button>
  );
}

const initialState: LuckyWheelSlotState = {};

export function AddLuckyWheelSlotForm({ items }: { items: AvailableItemOption[] }) {
  const [state, formAction] = useActionState(addLuckyWheelSlot, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
        Every active item is already on the wheel — create a new item on the Items page to add more.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="flex-1 text-xs text-muted">
        Item
        <select
          name="itemId"
          defaultValue=""
          className="mt-1 w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="" disabled>
            Pick an item…
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-muted">
        Chance (%)
        <input
          type="number"
          name="weight"
          min={0.1}
          max={100}
          step={0.1}
          defaultValue={10}
          className="mt-1 w-24 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
        />
      </label>
      <AddButton />
      {state.error && <span className="text-xs text-primary-glow">{state.error}</span>}
    </form>
  );
}
