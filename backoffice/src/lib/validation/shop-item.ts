import { z } from "zod";

export const SHOP_ITEM_CATEGORIES = ["AVATAR", "BADGE", "BOOST", "VOUCHER", "MERCH", "OTHER"] as const;

export const SHOP_ITEM_PRICE_TYPES = ["FREE", "POINTS", "MONEY"] as const;

export const shopItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  category: z.enum(SHOP_ITEM_CATEGORIES, { error: "Pick a category" }),
  priceType: z.enum(SHOP_ITEM_PRICE_TYPES, { error: "Pick a price type" }),
  price: z.coerce.number().int().min(0).max(1_000_000),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type ShopItemInput = z.infer<typeof shopItemSchema>;
