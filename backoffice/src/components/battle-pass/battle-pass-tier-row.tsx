"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import {
  upsertBattlePassTier,
  deleteBattlePassTier,
  type BattlePassTierActionState,
} from "@/app/(app)/battle-pass/actions";

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
      aria-label="Remove tier"
      className="text-muted transition hover:text-primary disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  );
}

export type RewardItemOption = { id: string; name: string; status: string };

const NON_ACTIVE_LABEL: Record<string, string> = { DRAFT: "Draft", ARCHIVED: "Archived" };

const SELECT_CLASS =
  "w-full rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary";

function RewardSelect({ name, itemId, items }: { name: string; itemId: string | null; items: RewardItemOption[] }) {
  return (
    <select key={itemId ?? "none"} name={name} defaultValue={itemId ?? ""} className={SELECT_CLASS}>
      <option value="">— No reward —</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name}
          {item.status !== "ACTIVE" ? ` (${NON_ACTIVE_LABEL[item.status] ?? item.status})` : ""}
        </option>
      ))}
    </select>
  );
}

const initialState: BattlePassTierActionState = {};

export function BattlePassTierRow({
  battlePassId,
  tier,
  freeItemId,
  premiumItemId,
  items,
}: {
  battlePassId: string;
  tier: number;
  freeItemId: string | null;
  premiumItemId: string | null;
  items: RewardItemOption[];
}) {
  const boundUpsert = upsertBattlePassTier.bind(null, battlePassId, tier);
  const [state, formAction] = useActionState(boundUpsert, initialState);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center">
      <div className="w-16 shrink-0">
        <p className="font-display text-sm font-semibold text-foreground">Tier {tier}</p>
      </div>

      <form action={formAction} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-2 text-xs text-muted">
          Free
          <RewardSelect name="freeItemId" itemId={freeItemId} items={items} />
        </label>
        <label className="flex flex-1 items-center gap-2 text-xs text-accent">
          Premium
          <RewardSelect name="premiumItemId" itemId={premiumItemId} items={items} />
        </label>
        <div className="flex shrink-0 items-center gap-2">
          <SaveButton />
          {state.error && <span className="text-xs text-primary-glow">{state.error}</span>}
          {state.success && <span className="text-xs text-success">Saved</span>}
        </div>
      </form>

      <form action={deleteBattlePassTier.bind(null, battlePassId, tier)}>
        <DeleteButton />
      </form>
    </div>
  );
}
