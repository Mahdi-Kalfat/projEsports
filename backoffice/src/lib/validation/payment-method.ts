import { z } from "zod";

export const paymentMethodSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  details: z.string().trim().min(1, "Details are required").max(200),
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
