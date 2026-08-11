import { z } from "zod";

export const MARKETPLACE_CATEGORIES = ["ACCOUNT", "IN_GAME_ITEM", "BOOST_SERVICE", "GEAR", "OTHER"] as const;

export const MARKETPLACE_PRICE_TYPES = ["FREE", "POINTS", "MONEY"] as const;

export const marketplaceListingSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  category: z.enum(MARKETPLACE_CATEGORIES, { error: "Pick a category" }),
  priceType: z.enum(MARKETPLACE_PRICE_TYPES, { error: "Pick a price type" }),
  price: z.coerce.number().int().min(0).max(1_000_000),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type MarketplaceListingInput = z.infer<typeof marketplaceListingSchema>;
