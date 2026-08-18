import type { LucideIcon } from "lucide-react";
import { Coins, Sparkles, Zap } from "lucide-react";

export const ITEM_EFFECT_LABEL: Record<string, string> = {
  XP_BOOST: "XP Boost",
  POINTS_BOOST: "Points Boost",
  CC_GRANT: "CC Grant",
  POINTS_GRANT: "Points Grant",
};

// Uniform vector icon per effect type — unlike the uploaded/default artwork
// below (real images with whatever aspect ratio they happen to have), these
// are guaranteed the same visual weight at any size. Used by the Lucky Wheel,
// where slices are small and fixed-size, so mismatched image proportions
// made some prizes look bigger than others for no real reason.
const ITEM_EFFECT_ICON: Record<string, LucideIcon> = {
  CC_GRANT: Coins,
  POINTS_GRANT: Sparkles,
  POINTS_BOOST: Sparkles,
  XP_BOOST: Zap,
};

export function getItemEffectIcon(effectType: string): LucideIcon | undefined {
  return ITEM_EFFECT_ICON[effectType];
}

// Stock artwork shown when an admin hasn't uploaded custom art for one of
// these effect types — keeps the shop/inventory from showing a blank card
// for the common case (cc/points/xp items rarely get bespoke art).
const ITEM_EFFECT_IMAGE: Record<string, string> = {
  XP_BOOST: "/items/xpboost.png",
  POINTS_BOOST: "/items/points.png",
  CC_GRANT: "/items/ccoin.png",
  POINTS_GRANT: "/items/points.png",
};

export function getItemEffectImage(effectType: string): string | undefined {
  return ITEM_EFFECT_IMAGE[effectType];
}

// CC_GRANT and POINTS_GRANT's effectValue is a flat amount, not a percentage
// — see the ItemEffectType enum comment in schema.prisma.
export function describeItemEffect(effectType: string, effectValue: number): string {
  if (effectType === "CC_GRANT") return `+${effectValue} cc`;
  if (effectType === "POINTS_GRANT") return `+${effectValue} points`;
  const label = ITEM_EFFECT_LABEL[effectType] ?? effectType;
  return `${label} +${effectValue}%`;
}
