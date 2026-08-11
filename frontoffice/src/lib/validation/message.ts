import { z } from "zod";

export const messageSchema = z.object({
  body: z.string().trim().min(1, "Write something first").max(1000),
});

export type MessageInput = z.infer<typeof messageSchema>;
