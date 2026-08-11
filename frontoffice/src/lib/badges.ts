export type BadgeCategory = "ACCOUNT_AGE" | "TOURNAMENT" | "EVENT" | "MARKETPLACE";

// Visual tier language reused across categories — same bronze→diamond
// progression regardless of what's being counted, so the profile grid reads
// consistently at a glance.
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export type BadgeDef = {
  key: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: "CalendarClock" | "Trophy" | "CalendarDays" | "Coins" | "ShoppingBag";
  tier: BadgeTier;
  goal: number;
};

export const TIER_STYLES: Record<BadgeTier, { ring: string; glow: string; text: string }> = {
  bronze: { ring: "ring-amber-700/50", glow: "shadow-amber-700/30", text: "text-amber-600" },
  silver: { ring: "ring-slate-300/50", glow: "shadow-slate-300/30", text: "text-slate-300" },
  gold: { ring: "ring-yellow-400/50", glow: "shadow-yellow-400/30", text: "text-yellow-400" },
  platinum: { ring: "ring-cyan-300/50", glow: "shadow-cyan-300/30", text: "text-cyan-300" },
  diamond: { ring: "ring-fuchsia-400/50", glow: "shadow-fuchsia-400/30", text: "text-fuchsia-400" },
};

export const BADGE_CATALOG: BadgeDef[] = [
  // Account age — years since registration.
  { key: "veteran-1y", name: "1 Year Veteran", description: "Registered for 1 year", category: "ACCOUNT_AGE", icon: "CalendarClock", tier: "bronze", goal: 1 },
  { key: "veteran-2y", name: "2 Year Veteran", description: "Registered for 2 years", category: "ACCOUNT_AGE", icon: "CalendarClock", tier: "silver", goal: 2 },
  { key: "veteran-3y", name: "3 Year Veteran", description: "Registered for 3 years", category: "ACCOUNT_AGE", icon: "CalendarClock", tier: "gold", goal: 3 },
  { key: "veteran-5y", name: "5 Year Veteran", description: "Registered for 5 years", category: "ACCOUNT_AGE", icon: "CalendarClock", tier: "platinum", goal: 5 },
  { key: "veteran-10y", name: "10 Year Veteran", description: "Registered for 10 years", category: "ACCOUNT_AGE", icon: "CalendarClock", tier: "diamond", goal: 10 },

  // Tournament participation — total tournaments joined.
  { key: "tournament-1", name: "First Blood", description: "Joined your first tournament", category: "TOURNAMENT", icon: "Trophy", tier: "bronze", goal: 1 },
  { key: "tournament-5", name: "Bracket Regular", description: "Joined 5 tournaments", category: "TOURNAMENT", icon: "Trophy", tier: "silver", goal: 5 },
  { key: "tournament-10", name: "Bracket Veteran", description: "Joined 10 tournaments", category: "TOURNAMENT", icon: "Trophy", tier: "gold", goal: 10 },
  { key: "tournament-25", name: "Tournament Grinder", description: "Joined 25 tournaments", category: "TOURNAMENT", icon: "Trophy", tier: "platinum", goal: 25 },
  { key: "tournament-50", name: "Tournament Legend", description: "Joined 50 tournaments", category: "TOURNAMENT", icon: "Trophy", tier: "diamond", goal: 50 },

  // Event attendance — total events RSVP'd.
  { key: "event-1", name: "First Appearance", description: "Attended your first event", category: "EVENT", icon: "CalendarDays", tier: "bronze", goal: 1 },
  { key: "event-5", name: "Regular Attendee", description: "Attended 5 events", category: "EVENT", icon: "CalendarDays", tier: "silver", goal: 5 },
  { key: "event-10", name: "Event Veteran", description: "Attended 10 events", category: "EVENT", icon: "CalendarDays", tier: "gold", goal: 10 },
  { key: "event-25", name: "Event Enthusiast", description: "Attended 25 events", category: "EVENT", icon: "CalendarDays", tier: "platinum", goal: 25 },
  { key: "event-50", name: "Event Legend", description: "Attended 50 events", category: "EVENT", icon: "CalendarDays", tier: "diamond", goal: 50 },

  // Marketplace — one-off milestones, not tiered.
  { key: "market-first-sale", name: "First Sale", description: "Sold your first item on the marketplace", category: "MARKETPLACE", icon: "Coins", tier: "bronze", goal: 1 },
  { key: "market-first-purchase", name: "First Purchase", description: "Bought your first item on the marketplace", category: "MARKETPLACE", icon: "ShoppingBag", tier: "bronze", goal: 1 },
];

export const BADGE_BY_KEY: ReadonlyMap<string, BadgeDef> = new Map(BADGE_CATALOG.map((b) => [b.key, b]));

export const CATEGORY_LABEL: Record<BadgeCategory, string> = {
  ACCOUNT_AGE: "Account age",
  TOURNAMENT: "Tournaments",
  EVENT: "Events",
  MARKETPLACE: "Marketplace",
};
