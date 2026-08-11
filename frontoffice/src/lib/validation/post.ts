import { z } from "zod";

export const postSchema = z.object({
  body: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type PostInput = z.infer<typeof postSchema>;

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Write something first").max(300),
});

export type CommentInput = z.infer<typeof commentSchema>;
