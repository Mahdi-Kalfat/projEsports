import { z } from "zod";

// Forgiving of how a human actually types a code: strips whitespace, uppercases,
// and re-inserts the dash if it's missing (matches the XXXX-XXXX shape from
// src/lib/friend-code.ts) so "ab3x9kpq" and "AB3X-9KPQ" both resolve the same.
export const friendCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Enter a friend code")
    .transform((v) => v.replace(/\s+/g, "").toUpperCase())
    .transform((v) => {
      const stripped = v.replace(/-/g, "");
      return stripped.length === 8 ? `${stripped.slice(0, 4)}-${stripped.slice(4)}` : v;
    }),
});

export type FriendCodeInput = z.infer<typeof friendCodeSchema>;
