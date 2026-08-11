"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Lock, Check } from "lucide-react";
import { unlockPremium, type UnlockPremiumState } from "@/app/(app)/battle-pass/actions";
import { formatCompactNumber } from "@/lib/format";

function SubmitButton({ cost }: { cost: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-neon flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-white transition hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Lock size={12} />
      {pending ? "Unlocking…" : `Unlock Premium — ${formatCompactNumber(cost)} points`}
    </button>
  );
}

const initialState: UnlockPremiumState = {};

export function UnlockPremiumButton({
  battlePassId,
  cost,
  alreadyUnlocked,
}: {
  battlePassId: string;
  cost: number;
  alreadyUnlocked: boolean;
}) {
  const boundAction = unlockPremium.bind(null, battlePassId);
  const [state, formAction] = useActionState(boundAction, initialState);

  if (alreadyUnlocked || state.success) {
    return (
      <p className="inline-flex items-center gap-1.5 rounded-md bg-success/15 px-4 py-2 text-xs font-medium uppercase tracking-wide text-success">
        <Check size={12} />
        Premium Unlocked
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <SubmitButton cost={cost} />
      {state.error && <p className="text-xs text-primary-glow">{state.error}</p>}
    </form>
  );
}
