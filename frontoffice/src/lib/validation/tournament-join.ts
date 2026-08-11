import { z } from "zod";

export const tournamentJoinSchema = z.object({
  teamName: z
    .string()
    .trim()
    .min(1, "Enter a team name")
    .max(60)
    .optional(),
});

export type TournamentJoinInput = z.infer<typeof tournamentJoinSchema>;
