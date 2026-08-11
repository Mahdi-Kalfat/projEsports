import { z } from "zod";

export const userEconomySchema = z.object({
  points: z.coerce.number().int().min(0).max(1_000_000),
  level: z.coerce.number().int().min(1).max(999),
  xp: z.coerce.number().int().min(0).max(1_000_000),
});

export type UserEconomyInput = z.infer<typeof userEconomySchema>;
