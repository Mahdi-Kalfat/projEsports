import { Lock } from "lucide-react";

// Design plan §6: a locked/disabled action should look deliberately inert —
// not just `disabled` styling that could pass for a bug — so "not live yet"
// reads as a decision. Used wherever a real feature (purchases, paid entry)
// isn't wired up yet rather than hiding the affordance entirely.
export function LockedButton({ label = "Coming soon" }: { label?: string }) {
  return (
    <button
      type="button"
      disabled
      className="flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-md border border-border py-2 text-xs font-medium uppercase tracking-wide text-muted opacity-60"
    >
      <Lock size={12} />
      {label}
    </button>
  );
}
