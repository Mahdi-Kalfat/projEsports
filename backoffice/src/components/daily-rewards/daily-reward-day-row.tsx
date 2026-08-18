"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import {
  updateDailyRewardDay,
  deleteDailyRewardDay,
  type DailyRewardDayState,
} from "@/app/(app)/daily-rewards/actions";

export type RewardItemOption = { id: string; name: string; status: string };

const NON_ACTIVE_LABEL: Record<string, string> = { DRAFT: "Draft", ARCHIVED: "Archived" };

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
      aria-label="Remove day"
      className="text-muted transition hover:text-primary disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  );
}

const initialState: DailyRewardDayState = {};

export function DailyRewardDayRow({
  day,
  itemId,
  items,
}: {
  day: number;
  itemId: string | null;
  items: RewardItemOption[];
}) {
  const boundUpdate = updateDailyRewardDay.bind(null, day);
  const [state, formAction] = useActionState(boundUpdate, initialState);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center">
      <div className="w-16 shrink-0">
        <p className="font-display text-sm font-semibold text-foreground">Day {day}</p>
      </div>

      <form action={formAction} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <select
          key={itemId ?? "none"}
          name="itemId"
          defaultValue={itemId ?? ""}
          className="w-full flex-1 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">— No reward —</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.status !== "ACTIVE" ? ` (${NON_ACTIVE_LABEL[item.status] ?? item.status})` : ""}
            </option>
          ))}
        </select>
        <div className="flex shrink-0 items-center gap-2">
          <SaveButton />
          {state.error && <span className="text-xs text-primary-glow">{state.error}</span>}
          {state.success && <span className="text-xs text-success">Saved</span>}
        </div>
      </form>

      <form action={deleteDailyRewardDay.bind(null, day)}>
        <DeleteButton />
      </form>
    </div>
  );
}
