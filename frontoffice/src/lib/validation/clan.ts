import { z } from "zod";

export const CLAN_TAG_REGEX = /^[A-Z0-9]{2,6}$/;

export const clanSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(40),
  tag: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .refine((v) => CLAN_TAG_REGEX.test(v), "Tag must be 2-6 letters/numbers"),
  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined)),
  visibility: z.enum(["PUBLIC", "PRIVATE"], { error: "Pick a visibility" }),
  minLevel: z.coerce.number().int().min(1).max(999),
  maxMembers: z.coerce.number().int().min(2).max(500),
});

export type ClanInput = z.infer<typeof clanSchema>;
