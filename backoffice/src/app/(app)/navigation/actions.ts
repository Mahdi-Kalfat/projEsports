"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { FRONTOFFICE_NAV_ITEMS, type FrontofficeNavItem } from "@/lib/frontoffice-nav-items";
import { NavBadge } from "@/generated/prisma";

type ResolvedNavItem = FrontofficeNavItem & { enabled: boolean; order: number };

// Same "override, not full source of truth" resolution as frontoffice's
// resolveEnabledNav — a key with no NavItemConfig row defaults to enabled at
// its static array position within its group.
async function getResolvedGroup(group: "main" | "account"): Promise<ResolvedNavItem[]> {
  const groupItems = FRONTOFFICE_NAV_ITEMS.filter((item) => item.group === group);
  const rows = await prisma.navItemConfig.findMany({ where: { key: { in: groupItems.map((i) => i.key) } } });
  const rowByKey = new Map(rows.map((row) => [row.key, row]));

  return groupItems
    .map((item, i) => ({
      ...item,
      enabled: rowByKey.get(item.key)?.enabled ?? true,
      order: rowByKey.get(item.key)?.order ?? i,
    }))
    .sort((a, b) => a.order - b.order);
}

// Rewrites order 0..n-1 for the whole group on every move — cheap at this
// size (max 7 items) and avoids ever ending up with a partially-materialized,
// ambiguous order (some keys with DB rows, some falling back to static index)
// after repeated edits.
async function persistGroupOrder(resolved: ResolvedNavItem[]) {
  await prisma.$transaction(
    resolved.map((item, i) =>
      prisma.navItemConfig.upsert({
        where: { key: item.key },
        create: { key: item.key, enabled: item.enabled, order: i },
        update: { order: i },
      }),
    ),
  );
}

export async function toggleNavItem(key: string, group: "main" | "account") {
  await requireBackofficeSession();

  const resolved = await getResolvedGroup(group);
  const index = resolved.findIndex((item) => item.key === key);
  if (index === -1) return;

  const target = resolved[index];
  await prisma.navItemConfig.upsert({
    where: { key },
    create: { key, enabled: !target.enabled, order: index },
    update: { enabled: !target.enabled },
  });

  revalidatePath("/navigation");
}

export async function setNavItemBadge(key: string, group: "main" | "account", formData: FormData) {
  await requireBackofficeSession();

  const raw = formData.get("badge");
  const badge = raw === NavBadge.HOT || raw === NavBadge.NEW ? raw : null;

  const resolved = await getResolvedGroup(group);
  const index = resolved.findIndex((item) => item.key === key);
  if (index === -1) return;

  const target = resolved[index];
  await prisma.navItemConfig.upsert({
    where: { key },
    create: { key, enabled: target.enabled, order: index, badge },
    update: { badge },
  });

  revalidatePath("/navigation");
}

export async function moveNavItem(key: string, group: "main" | "account", direction: "up" | "down") {
  await requireBackofficeSession();

  const resolved = await getResolvedGroup(group);
  const index = resolved.findIndex((item) => item.key === key);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= resolved.length) return;

  [resolved[index], resolved[swapIndex]] = [resolved[swapIndex], resolved[index]];
  await persistGroupOrder(resolved);

  revalidatePath("/navigation");
}
