import { z } from "zod";

export const levelXpRuleSchema = z.object({
  xpPerLevel: z.coerce.number().int().min(1).max(1_000_000),
});

export type LevelXpRuleInput = z.infer<typeof levelXpRuleSchema>;
