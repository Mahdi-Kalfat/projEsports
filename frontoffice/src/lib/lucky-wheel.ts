// Up to 4 spins per UTC calendar day: the 1st is free, each further spin
// costs more cc. Index = number of spins already used today, so
// SPIN_COSTS[spinsUsedToday] is the price of the *next* spin.
export const SPIN_COSTS = [0, 75, 150, 300];
export const MAX_SPINS_PER_DAY = SPIN_COSTS.length;

export type WheelSlotLike = { weight: number };

// Weighted-random pick over whatever slots + weights are currently
// configured — weights are admin-entered percentages but don't need to sum
// to exactly 100 (see the LuckyWheelSlot schema comment); this normalizes
// across the actual total either way. Returns the slot's index into `slots`,
// or null if there's nothing to spin (no slots, or all zero weight).
export function pickWeightedSlotIndex<T extends WheelSlotLike>(slots: T[], random: number): number | null {
  const total = slots.reduce((sum, slot) => sum + slot.weight, 0);
  if (total <= 0) return null;

  let roll = random * total;
  for (let i = 0; i < slots.length; i++) {
    roll -= slots[i].weight;
    if (roll < 0) return i;
  }
  return slots.length - 1;
}
