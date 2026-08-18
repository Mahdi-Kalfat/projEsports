import { z } from "zod";

export const newContactSchema = z.object({
  subject: z.string().trim().min(1, "Give it a short subject").max(150),
  body: z.string().trim().min(1, "Write your message").max(2000),
});

export type NewContactInput = z.infer<typeof newContactSchema>;

// body is optional here (unlike newContactSchema's) — a reply can be just an
// attached image (e.g. a proof-of-payment screenshot with no caption). The
// action still rejects a submission with neither.
export const contactMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
