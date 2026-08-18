import type { LucideIcon } from "lucide-react";
import {
  Home,
  Trophy,
  CalendarDays,
  ShoppingBag,
  Package,
  Store,
  Users,
  Shield,
  MessagesSquare,
  Rocket,
  Gift,
  LifeBuoy,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export type NavBadge = "HOT" | "NEW";

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  // Admin-set from the back office's /navigation — null on the static
  // defaults below, filled in by resolveEnabledNav from NavItemConfig.
  badge?: NavBadge | null;
};

export const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", href: "/", icon: Home },
  { key: "tournaments", label: "Tournaments", href: "/tournaments", icon: Trophy },
  { key: "events", label: "Events", href: "/events", icon: CalendarDays },
  { key: "shop", label: "Shop", href: "/shop", icon: ShoppingBag },
  { key: "marketplace", label: "Marketplace", href: "/marketplace", icon: Store },
  { key: "battle-pass", label: "Battle Pass", href: "/battle-pass", icon: Rocket },
  { key: "rewards", label: "Rewards", href: "/rewards", icon: Gift },
];

// Personal/account-scoped destinations — grouped under the username dropdown
// in the navbar (see Navbar's UserNavMenu) rather than sitting as flat
// top-level links, so the main nav stays to general site sections.
export const USER_MENU_ITEMS: NavItem[] = [
  { key: "inventory", label: "Inventory", href: "/inventory", icon: Package },
  { key: "clans", label: "Clans", href: "/clans", icon: Shield },
  { key: "friends", label: "Friends", href: "/friends", icon: Users },
  { key: "messages", label: "Messages", href: "/messages", icon: MessagesSquare },
  { key: "contact", label: "Contact", href: "/contact", icon: LifeBuoy },
];

// Plain-data shape (no icon component) — safe to pass from a Server
// Component into a Client Component (Navbar) as a prop. Passing the
// resolved NavItem[] itself instead would try to serialize each item's
// LucideIcon function reference across that boundary and crash.
export type NavConfigEntry = { key: string; enabled: boolean; order: number; badge: NavBadge | null };

// A key with no NavItemConfig row just uses its static default (enabled, at
// its array index, no badge) — rows only exist once an admin overrides
// something from the back office's /navigation page.
export async function getNavItemConfigs(): Promise<NavConfigEntry[]> {
  const rows = await prisma.navItemConfig.findMany();
  return rows.map((row) => ({ key: row.key, enabled: row.enabled, order: row.order, badge: row.badge }));
}

export function resolveEnabledNav(items: NavItem[], configs: NavConfigEntry[]): NavItem[] {
  const configByKey = new Map(configs.map((c) => [c.key, c]));
  return items
    .map((item, i) => ({
      item,
      ...(configByKey.get(item.key) ?? { enabled: true, order: i, badge: null }),
    }))
    .filter((x) => x.enabled)
    .sort((a, b) => a.order - b.order)
    .map((x) => ({ ...x.item, badge: x.badge }));
}
