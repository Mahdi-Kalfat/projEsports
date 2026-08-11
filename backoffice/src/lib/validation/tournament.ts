import { z } from "zod";

export const tournamentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  startAt: z.coerce.date({ error: "Enter a valid date & time" }),
  gameId: z.string().trim().min(1, "Pick a game"),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  additionalInfo: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
  prizePool: z.coerce.number().int().min(0).max(1_000_000),
  entryCost: z.coerce.number().int().min(0).max(1_000_000),
  participationType: z.enum(["SOLO", "TEAM"], { error: "Pick who can join" }),
});

export type TournamentInput = z.infer<typeof tournamentSchema>;
