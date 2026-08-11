"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import {
  upsertLevelXpRule,
  deleteLevelXpRule,
  type LevelXpRuleActionState,
} from "@/app/(app)/levels/actions";

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

const initialState: LevelXpRuleActionState = {};

export function LevelXpRuleRow({
  tier,
  levelStart,
  levelEnd,
  xpPerLevel,
  canDelete,
}: {
  tier: number;
  levelStart: number;
  levelEnd: number;
  xpPerLevel: number;
  canDelete: boolean;
}) {
  const boundUpsert = upsertLevelXpRule.bind(null, tier);
  const [state, formAction] = useActionState(boundUpsert, initialState);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <div className="w-28 shrink-0">
        <p className="font-display text-sm font-semibold text-foreground">
          Levels {levelStart}–{levelEnd}
        </p>
        <p className="text-[11px] text-muted">Tier {tier}</p>
      </div>

      <form action={formAction} className="flex flex-1 items-center gap-2">
        <label className="flex flex-1 items-center gap-2 text-xs text-muted">
          XP per level
          <input
            key={xpPerLevel}
            type="number"
            name="xpPerLevel"
            min={1}
            defaultValue={xpPerLevel}
            className="w-32 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <SaveButton />
        {state.error && <span className="text-xs text-primary-glow">{state.error}</span>}
        {state.success && <span className="text-xs text-success">Saved</span>}
      </form>

      {canDelete && (
        <form action={deleteLevelXpRule.bind(null, tier)}>
          <DeleteButton />
        </form>
      )}
    </div>
  );
}
