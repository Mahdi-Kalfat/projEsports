"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Trophy, CalendarDays, Coins, ShoppingBag, ChevronRight, X, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { CATEGORY_LABEL, TIER_STYLES, type BadgeCategory } from "@/lib/badges";
import type { BadgeBoardEntry } from "@/lib/award-badges";

const ICONS: Record<BadgeBoardEntry["icon"], LucideIcon> = {
  CalendarClock,
  Trophy,
  CalendarDays,
  Coins,
  ShoppingBag,
};

const CATEGORY_ORDER: BadgeCategory[] = ["TOURNAMENT", "EVENT", "MARKETPLACE", "ACCOUNT_AGE"];

function BadgeTile({ badge, showProgress }: { badge: BadgeBoardEntry; showProgress: boolean }) {
  const Icon = ICONS[badge.icon];
  const tone = TIER_STYLES[badge.tier];

  const tooltip = badge.earned
    ? `${badge.name} — ${badge.description} (earned ${badge.earnedAt!.toLocaleDateString("en-US", { dateStyle: "medium" })})`
    : `${badge.name} — ${badge.description}${showProgress ? ` (${badge.progress}/${badge.goal})` : " (locked)"}`;

  return (
    <div className="flex flex-col items-center gap-1.5" title={tooltip}>
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-xl border transition ${
          badge.earned
            ? `border-transparent bg-surface ring-2 ${tone.ring} shadow-lg ${tone.glow}`
            : "border-border/60 bg-surface/50 opacity-40 grayscale"
        }`}
      >
        <Icon size={24} className={badge.earned ? tone.text : "text-muted"} />
      </div>
      <p className={`max-w-[4.5rem] text-center text-[11px] leading-tight ${badge.earned ? "text-foreground" : "text-muted"}`}>
        {badge.name}
      </p>
      {showProgress && !badge.earned && badge.goal > 1 && (
        <p className="text-[10px] text-muted">
          {badge.progress}/{badge.goal}
        </p>
      )}
    </div>
  );
}

function BadgeCategoryRow({
  category,
  badges,
  isSelf,
}: {
  category: BadgeCategory;
  badges: BadgeBoardEntry[];
  isSelf: boolean;
}) {
  const inCategory = badges.filter((b) => b.category === category);
  if (inCategory.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">{CATEGORY_LABEL[category]}</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
        {inCategory.map((badge) => (
          <BadgeTile key={badge.key} badge={badge} showProgress={isSelf} />
        ))}
      </div>
    </div>
  );
}

function AllBadgesModal({
  badges,
  isSelf,
  onClose,
}: {
  badges: BadgeBoardEntry[];
  isSelf: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4">
      <button aria-label="Close" onClick={onClose} className="fixed inset-0 bg-black/70" />

      <div className="relative z-10 mx-auto my-8 w-full max-w-lg rounded-xl border border-border bg-surface-raised p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">All badges</h2>
            <p className="text-xs text-muted">
              {earnedCount}/{badges.length} earned
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-muted transition hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {CATEGORY_ORDER.map((category) => (
            <BadgeCategoryRow key={category} category={category} badges={badges} isSelf={isSelf} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function BadgesShowcase({ badges, isSelf }: { badges: BadgeBoardEntry[]; isSelf: boolean }) {
  const [open, setOpen] = useState(false);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <Reveal delay={0.1}>
      <div className="rounded-2xl border border-border bg-surface-raised p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">Badges</h3>
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
            {earnedCount}/{badges.length}
          </span>
        </div>

        <div className="mt-4">
          <BadgeCategoryRow category="TOURNAMENT" badges={badges} isSelf={isSelf} />
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 flex w-full items-center justify-center gap-1 rounded-md border border-border py-2 text-xs font-medium text-muted transition hover:border-primary hover:text-primary"
        >
          See more
          <ChevronRight size={14} />
        </button>
      </div>

      {open && <AllBadgesModal badges={badges} isSelf={isSelf} onClose={() => setOpen(false)} />}
    </Reveal>
  );
}
