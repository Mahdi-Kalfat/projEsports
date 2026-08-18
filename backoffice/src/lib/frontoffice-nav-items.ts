// Mirrors frontoffice's lib/nav-items.ts (NAV_ITEMS + USER_MENU_ITEMS) —
// keys must match exactly, since NavItemConfig rows are keyed by these
// strings. No icons/hrefs needed here, just enough to label the admin list.
export type FrontofficeNavItem = { key: string; label: string; group: "main" | "account" };

export const FRONTOFFICE_NAV_ITEMS: FrontofficeNavItem[] = [
  { key: "home", label: "Home", group: "main" },
  { key: "tournaments", label: "Tournaments", group: "main" },
  { key: "events", label: "Events", group: "main" },
  { key: "shop", label: "Shop", group: "main" },
  { key: "marketplace", label: "Marketplace", group: "main" },
  { key: "battle-pass", label: "Battle Pass", group: "main" },
  { key: "rewards", label: "Rewards", group: "main" },
  { key: "inventory", label: "Inventory", group: "account" },
  { key: "clans", label: "Clans", group: "account" },
  { key: "friends", label: "Friends", group: "account" },
  { key: "messages", label: "Messages", group: "account" },
  { key: "contact", label: "Contact", group: "account" },
];
