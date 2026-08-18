import { z } from "zod";

export const reportReplySchema = z.object({
  body: z.string().trim().min(1, "Write something first").max(2000),
});

export type ReportReplyInput = z.infer<typeof reportReplySchema>;

// 1 cc = 1 DT — whole units only, same Int convention as points/economy.
export const depositAmountSchema = z.object({
  amount: z.coerce.number().int().min(1, "Enter at least 1 cc").max(100_000, "Enter at most 100,000 cc"),
});

export type DepositAmountInput = z.infer<typeof depositAmountSchema>;
