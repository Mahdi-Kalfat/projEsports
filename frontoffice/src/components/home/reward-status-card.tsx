import Link from "next/link";
import type { LucideIcon } from "lucide-react";

// Compact daily-cadence status chip for the homepage — surfaces the same
// claim/spin state the /rewards page computes (see design plan §13: unclaimed
// reward state should be visible from the homepage, not only on its own page).
export function RewardStatusCard({
  icon: Icon,
  label,
  configured,
  ready,
  readyLabel,
  waitingLabel,
  notConfiguredLabel,
}: {
  icon: LucideIcon;
  label: string;
  configured: boolean;
  ready: boolean;
  readyLabel: string;
  waitingLabel: string;
  notConfiguredLabel: string;
}) {
  const state = !configured ? "empty" : ready ? "ready" : "waiting";

  return (
    <Link
      href="/rewards"
      className={`flex h-full flex-1 flex-col justify-between gap-4 rounded-xl border px-4 py-4 transition ${
        state === "ready"
          ? "border-success/40 bg-success/10 hover:border-success/70"
          : "border-border bg-surface-raised hover:border-primary/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            state === "ready" ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
          }`}
        >
          <Icon size={18} />
        </span>
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      <span
        className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-medium ${
          state === "ready" ? "bg-success/15 text-success" : "bg-surface text-muted"
        }`}
      >
        {state === "empty" ? notConfiguredLabel : state === "ready" ? readyLabel : waitingLabel}
      </span>
    </Link>
  );
}
