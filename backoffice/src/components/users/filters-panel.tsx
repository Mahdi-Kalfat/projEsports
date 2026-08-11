"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

export function FiltersPanel({
  children,
  hasActiveFilters,
}: {
  children: ReactNode;
  hasActiveFilters: boolean;
}) {
  // Closed by default — except when filters are already active on load (e.g. a
  // bookmarked or shared link), so the admin isn't left wondering why the list
  // looks narrowed without an obvious reason.
  const [open, setOpen] = useState(hasActiveFilters);

  return (
    <div className="rounded-xl border border-border bg-surface-raised">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-muted" />
          Filters
          {hasActiveFilters && (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
              Active
            </span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Kept mounted (just visually hidden) rather than unmounted when collapsed —
          the checkboxes/sliders inside still need to submit their values with the
          rest of the form even while the panel is retracted. */}
      <div className={open ? "border-t border-border p-4" : "hidden"}>{children}</div>
    </div>
  );
}
