import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Trophy,
  CalendarDays,
  ShoppingBag,
  Store,
  Gauge,
  Medal,
  Rocket,
  Sparkles,
  Dices,
  Gift,
  Inbox,
  Wallet,
  Compass,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Reports", href: "/reports", icon: Inbox },
  { label: "Tournaments", href: "/tournaments", icon: Trophy },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
  { label: "Items", href: "/items", icon: Sparkles },
  { label: "Payment Methods", href: "/payment-methods", icon: Wallet },
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Battle Pass", href: "/battle-pass", icon: Rocket },
  { label: "Lucky Wheel", href: "/lucky-wheel", icon: Dices },
  { label: "Daily Rewards", href: "/daily-rewards", icon: Gift },
  { label: "Level Settings", href: "/levels", icon: Gauge },
  { label: "Rank Settings", href: "/ranks", icon: Medal },
  { label: "Navigation", href: "/navigation", icon: Compass },
];
