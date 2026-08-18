"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Gift, Lock } from "lucide-react";
import { claimDailyReward, type ClaimDailyRewardState } from "@/app/(app)/rewards/actions";
import { describeItemEffect } from "@/lib/item-effects";
import { Confetti } from "@/components/ui/confetti";

export type DailyRewardDayData = {
  day: number;
  item: { id: string; name: string; effectType: string; effectValue: number } | null;
};

// Today's gift icon doubles as the claim button — see the `isToday` branch
// below — so it needs to live inside the <form> for useFormStatus/submit to
// reach it, unlike the plain, non-interactive icons on the other day cards.
function ClaimIconButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Claim today's reward"
      title="Claim today's reward"
      className="btn-neon flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white ring-2 ring-primary-glow/50 transition hover:scale-110 hover:bg-primary-glow active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    >
      <Gift size={18} className={pending ? "animate-pulse" : "animate-glow-pulse"} />
    </button>
  );
}

// Same circular slot as ClaimIconButton, but for a guest — a link to /login
// instead of a form submit, so the "tap the gift" affordance stays
// identical for everyone, guest or not.
function SignInIconLink() {
  return (
    <Link
      href="/login"
      aria-label="Sign in to claim today's reward"
      title="Sign in to claim today's reward"
      className="btn-neon flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white ring-2 ring-primary-glow/50 transition hover:scale-110 hover:bg-primary-glow active:scale-95"
    >
      <Gift size={18} className="animate-glow-pulse" />
    </Link>
  );
}

const initialState: ClaimDailyRewardState = {};

export function DailyRewardTrack({
  days,
  currentDay,
  canClaim,
  nextClaimAtLabel,
  isGuest = false,
}: {
  days: DailyRewardDayData[];
  currentDay: number;
  canClaim: boolean;
  nextClaimAtLabel: string | null;
  isGuest?: boolean;
}) {
  const [state, formAction] = useActionState(claimDailyReward, initialState);
  const [confettiBurst, setConfettiBurst] = useState(0);

  // `state` is a new object identity each time the action resolves, so this
  // fires exactly once per successful claim (not on every re-render).
  useEffect(() => {
    if (state.success) setConfettiBurst((b) => b + 1);
  }, [state]);

  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-6">
      <Confetti burst={confettiBurst} />
      <div className="flex items-center gap-2">
        <Gift size={18} className="text-primary" />
        <h2 className="font-display text-lg font-bold text-foreground">Daily Login Reward</h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        Come back every day to keep your streak going — miss a day and it resets to Day 1.
      </p>

      {days.length === 0 ? (
        <p className="mt-5 text-sm text-muted">Daily rewards aren&apos;t set up yet — check back soon.</p>
      ) : (
        <>
          <form action={formAction}>
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
              {days.map((d) => {
                const claimed = d.day < currentDay;
                const isToday = d.day === currentDay;
                return (
                  <div
                    key={d.day}
                    className={`flex w-32 shrink-0 flex-col items-center gap-2 rounded-xl border p-3 text-center ${
                      isToday
                        ? "border-primary bg-primary/10"
                        : claimed
                          ? "border-success/40 bg-success/5"
                          : "border-border bg-surface"
                    }`}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">Day {d.day}</p>
                    {isToday && isGuest ? (
                      <SignInIconLink />
                    ) : isToday && canClaim ? (
                      <ClaimIconButton />
                    ) : (
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          claimed
                            ? "bg-success/15 text-success"
                            : isToday
                              ? "bg-primary/15 text-primary"
                              : "bg-surface-raised text-muted"
                        }`}
                      >
                        {claimed ? <Check size={18} /> : isToday ? <Gift size={18} /> : <Lock size={16} />}
                      </span>
                    )}
                    <p className="line-clamp-2 text-xs font-medium text-foreground">{d.item?.name ?? "—"}</p>
                    {d.item && (
                      <p className="text-[11px] text-muted">
                        {describeItemEffect(d.item.effectType, d.item.effectValue)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </form>

          <div className="mt-5 border-t border-border pt-4">
            {canClaim ? (
              <>
                <p className="text-sm text-muted">Tap the gift on Day {currentDay} to claim today&apos;s reward.</p>
                {state.error && <p className="mt-1 text-xs text-primary-glow">{state.error}</p>}
              </>
            ) : (
              <div className="flex flex-col gap-1">
                {state.success && (
                  <p className="text-sm font-medium text-success">
                    You claimed Day {state.day}: {state.wonItemName}!
                  </p>
                )}
                <p className="text-sm text-muted">
                  {nextClaimAtLabel
                    ? `Already claimed today — come back after ${nextClaimAtLabel} for Day ${currentDay}.`
                    : "Already claimed today — come back tomorrow."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
