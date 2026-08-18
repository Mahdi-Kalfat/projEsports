import { z } from "zod";

export const ITEM_EFFECT_TYPES = ["XP_BOOST", "POINTS_BOOST", "CC_GRANT", "POINTS_GRANT"] as const;

export const itemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  effectType: z.enum(ITEM_EFFECT_TYPES, { error: "Pick an effect type" }),
  // Percentage for XP_BOOST/POINTS_BOOST, flat amount for CC_GRANT/POINTS_GRANT
  // — same field either way, see the ItemEffectType enum comment in schema.prisma.
  effectValue: z.coerce.number().int().min(1, "Value must be at least 1").max(100_000),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type ItemInput = z.infer<typeof itemSchema>;

export const grantItemSchema = z.object({
  itemId: z.string().min(1, "Pick an item"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1").max(99),
});

export type GrantItemInput = z.infer<typeof grantItemSchema>;
