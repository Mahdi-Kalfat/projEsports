"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { updateLuckyWheelSlotWeight, deleteLuckyWheelSlot } from "@/app/(app)/lucky-wheel/actions";
import { describeItemEffect } from "@/lib/item-effects";

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
      aria-label="Remove slot"
      className="text-muted transition hover:text-primary disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  );
}

export type LuckyWheelSlotData = {
  id: string;
  weight: number;
  item: { id: string; name: string; effectType: string; effectValue: number };
};

export function LuckyWheelSlotRow({ slot }: { slot: LuckyWheelSlotData }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="font-display text-sm font-semibold text-foreground">{slot.item.name}</p>
        <p className="text-xs text-muted">{describeItemEffect(slot.item.effectType, slot.item.effectValue)}</p>
      </div>

      <form action={updateLuckyWheelSlotWeight.bind(null, slot.id)} className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-muted">
          Chance (%)
          <input
            key={slot.weight}
            type="number"
            name="weight"
            min={0.1}
            max={100}
            step={0.1}
            defaultValue={slot.weight}
            className="w-20 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <SaveButton />
      </form>

      <form action={deleteLuckyWheelSlot.bind(null, slot.id)}>
        <DeleteButton />
      </form>
    </div>
  );
}
