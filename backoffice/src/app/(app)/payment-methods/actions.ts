"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { paymentMethodSchema } from "@/lib/validation/payment-method";

export type PaymentMethodActionState = { error?: string; success?: boolean };

export async function createPaymentMethod(
  _prevState: PaymentMethodActionState,
  formData: FormData,
): Promise<PaymentMethodActionState> {
  await requireBackofficeSession();

  const parsed = paymentMethodSchema.safeParse({
    name: formData.get("name"),
    details: formData.get("details"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  await prisma.paymentMethod.create({ data: parsed.data });

  revalidatePath("/payment-methods");
  return { success: true };
}

export async function updatePaymentMethod(
  id: string,
  _prevState: PaymentMethodActionState,
  formData: FormData,
): Promise<PaymentMethodActionState> {
  await requireBackofficeSession();

  const parsed = paymentMethodSchema.safeParse({
    name: formData.get("name"),
    details: formData.get("details"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  await prisma.paymentMethod.update({ where: { id }, data: parsed.data });

  revalidatePath("/payment-methods");
  return { success: true };
}

export async function deletePaymentMethod(id: string, _formData: FormData) {
  await requireBackofficeSession();
  await prisma.paymentMethod.deleteMany({ where: { id } });
  revalidatePath("/payment-methods");
}
