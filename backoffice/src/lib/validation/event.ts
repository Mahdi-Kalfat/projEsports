import { z } from "zod";

export const EVENT_TYPES = [
  "COMMUNITY",
  "NEWS",
  "MAINTENANCE",
  "GIVEAWAY",
  "ANNOUNCEMENT",
  "PARTNERSHIP",
] as const;

export const eventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  startAt: z.coerce.date({ error: "Enter a valid date & time" }),
  type: z.enum(EVENT_TYPES, { error: "Pick a type" }),
  location: z
    .string()
    .trim()
    .max(160)
    .optional()
    .transform((v) => (v ? v : undefined)),
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
});

export type EventInput = z.infer<typeof eventSchema>;
