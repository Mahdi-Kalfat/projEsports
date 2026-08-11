import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Trophy,
  CalendarDays,
  ShoppingBag,
  Store,
  Gauge,
  Rocket,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Tournaments", href: "/tournaments", icon: Trophy },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Battle Pass", href: "/battle-pass", icon: Rocket },
  { label: "Level Settings", href: "/levels", icon: Gauge },
];
