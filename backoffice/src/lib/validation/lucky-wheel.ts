import { z } from "zod";

export const luckyWheelSlotSchema = z.object({
  itemId: z.string().trim().min(1, "Pick an item"),
  weight: z.coerce.number().min(0.1, "Must be at least 0.1%").max(100, "Must be at most 100%"),
});

export type LuckyWheelSlotInput = z.infer<typeof luckyWheelSlotSchema>;
