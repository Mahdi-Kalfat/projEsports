"use client";

import { ChevronUp, ChevronDown } from "lucide-react";
import { toggleNavItem, moveNavItem, setNavItemBadge } from "@/app/(app)/navigation/actions";

export function NavItemRow({
  itemKey,
  label,
  group,
  enabled,
  badge,
  isFirst,
  isLast,
}: {
  itemKey: string;
  label: string;
  group: "main" | "account";
  enabled: boolean;
  badge: "HOT" | "NEW" | null;
  isFirst: boolean;
  isLast: boolean;
}) {
  const boundSetBadge = setNavItemBadge.bind(null, itemKey, group);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3">
      <div className="flex flex-col">
        <form action={moveNavItem.bind(null, itemKey, group, "up")}>
          <button
            type="submit"
            disabled={isFirst}
            aria-label={`Move ${label} up`}
            className="text-muted transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>
        </form>
        <form action={moveNavItem.bind(null, itemKey, group, "down")}>
          <button
            type="submit"
            disabled={isLast}
            aria-label={`Move ${label} down`}
            className="text-muted transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>
        </form>
      </div>

      <p className={`flex-1 text-sm font-medium ${enabled ? "text-foreground" : "text-muted"}`}>{label}</p>

      <form action={boundSetBadge}>
        <select
          key={badge}
          name="badge"
          defaultValue={badge ?? ""}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          aria-label={`${label} badge`}
          className="rounded-md border border-border bg-surface-raised px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
        >
          <option value="">No badge</option>
          <option value="HOT">Hot</option>
          <option value="NEW">New</option>
        </select>
      </form>

      <form action={toggleNavItem.bind(null, itemKey, group)}>
        <button
          type="submit"
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            enabled ? "bg-success/15 text-success hover:bg-success/25" : "bg-muted/15 text-muted hover:bg-muted/25"
          }`}
        >
          {enabled ? "Visible" : "Hidden"}
        </button>
      </form>
    </div>
  );
}
