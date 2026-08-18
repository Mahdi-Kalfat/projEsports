export const ITEM_EFFECT_LABEL: Record<string, string> = {
  XP_BOOST: "XP Boost",
  POINTS_BOOST: "Points Boost",
  CC_GRANT: "CC Grant",
  POINTS_GRANT: "Points Grant",
};

// CC_GRANT and POINTS_GRANT's effectValue is a flat amount, not a
// percentage — see the ItemEffectType enum comment in schema.prisma.
export function describeItemEffect(effectType: string, effectValue: number): string {
  if (effectType === "CC_GRANT") return `+${effectValue} cc`;
  if (effectType === "POINTS_GRANT") return `+${effectValue} points`;
  const label = ITEM_EFFECT_LABEL[effectType] ?? effectType;
  return `${label} +${effectValue}%`;
}
