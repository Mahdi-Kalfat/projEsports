import { z } from "zod";

export const dailyRewardDaySchema = z.object({
  itemId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type DailyRewardDayInput = z.infer<typeof dailyRewardDaySchema>;
