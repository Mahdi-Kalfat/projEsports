import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { FRONTOFFICE_NAV_ITEMS } from "@/lib/frontoffice-nav-items";
import { NavItemRow } from "@/components/navigation/nav-item-row";

export const metadata: Metadata = {
  title: "Navigation — Back Office",
};

function resolveGroup(
  group: "main" | "account",
  rows: { key: string; enabled: boolean; order: number; badge: "HOT" | "NEW" | null }[],
) {
  const groupItems = FRONTOFFICE_NAV_ITEMS.filter((item) => item.group === group);
  const rowByKey = new Map(rows.map((row) => [row.key, row]));

  return groupItems
    .map((item, i) => ({
      ...item,
      enabled: rowByKey.get(item.key)?.enabled ?? true,
      order: rowByKey.get(item.key)?.order ?? i,
      badge: rowByKey.get(item.key)?.badge ?? null,
    }))
    .sort((a, b) => a.order - b.order);
}

export default async function NavigationPage() {
  const rows = await prisma.navItemConfig.findMany();
  const mainItems = resolveGroup("main", rows);
  const accountItems = resolveGroup("account", rows);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Compass size={22} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Navigation</h2>
          <p className="max-w-xl text-sm text-muted">
            Show, hide, and reorder the front office header&apos;s links. &ldquo;Main navigation&rdquo; is the flat
            row of links; &ldquo;Account menu&rdquo; is the group under a player&apos;s own username.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Main navigation</h3>
        <div className="flex flex-col gap-2">
          {mainItems.map((item, i) => (
            <NavItemRow
              key={item.key}
              itemKey={item.key}
              label={item.label}
              group="main"
              enabled={item.enabled}
              badge={item.badge}
              isFirst={i === 0}
              isLast={i === mainItems.length - 1}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Account menu</h3>
        <div className="flex flex-col gap-2">
          {accountItems.map((item, i) => (
            <NavItemRow
              key={item.key}
              itemKey={item.key}
              label={item.label}
              group="account"
              enabled={item.enabled}
              badge={item.badge}
              isFirst={i === 0}
              isLast={i === accountItems.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
