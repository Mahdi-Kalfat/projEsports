import type { LucideIcon } from "lucide-react";
import { Home, Trophy, CalendarDays, ShoppingBag, Package, Store, Users, Shield, MessagesSquare, Rocket } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Tournaments", href: "/tournaments", icon: Trophy },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Battle Pass", href: "/battle-pass", icon: Rocket },
];

// Personal/account-scoped destinations — grouped under the username dropdown
// in the navbar (see Navbar's UserNavMenu) rather than sitting as flat
// top-level links, so the main nav stays to general site sections.
export const USER_MENU_ITEMS: NavItem[] = [
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Clans", href: "/clans", icon: Shield },
  { label: "Friends", href: "/friends", icon: Users },
  { label: "Messages", href: "/messages", icon: MessagesSquare },
];
