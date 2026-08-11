import { z } from "zod";

export const battlePassSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    description: z
      .string()
      .trim()
      .max(2000)
      .optional()
      .transform((v) => (v ? v : undefined)),
    premiumPointsCost: z.coerce.number().int().min(0).max(1_000_000),
    startAt: z.coerce.date({ error: "Enter a valid start date & time." }),
    endAt: z.coerce.date({ error: "Enter a valid end date & time." }),
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "End time must be after the start time.",
    path: ["endAt"],
  });

export type BattlePassInput = z.infer<typeof battlePassSchema>;

export const battlePassTierRewardSchema = z.object({
  freeReward: z.string().trim().min(1, "Enter what's in the free tier.").max(200),
  premiumReward: z.string().trim().min(1, "Enter what's in the premium tier.").max(200),
});

export type BattlePassTierRewardInput = z.infer<typeof battlePassTierRewardSchema>;
