// Mirror of frontoffice's lib/lucky-wheel.ts — used by /spin so the cost
// curve and odds match the site exactly.
export const SPIN_COSTS = [0, 75, 150, 300];
export const MAX_SPINS_PER_DAY = SPIN_COSTS.length;

export type WheelSlotLike = { weight: number };

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
