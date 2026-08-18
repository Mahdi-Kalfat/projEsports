"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { getOwnedContactRequest } from "@/lib/contact";
import { newContactSchema, contactMessageSchema } from "@/lib/validation/contact";
import { saveContactProofImage } from "@/lib/uploads";

export type NewContactState = { error?: string };

export async function openContactRequest(
  _prevState: NewContactState,
  formData: FormData,
): Promise<NewContactState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const parsed = newContactSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Fill in the form first." };
  }

  const report = await prisma.contactRequest.create({ data: { userId, subject: parsed.data.subject } });
  await prisma.contactMessage.create({
    data: { contactRequestId: report.id, authorId: userId, isAdmin: false, body: parsed.data.body },
  });

  revalidatePath("/contact");
  redirect(`/contact/${report.id}`);
}

export type ContactMessageActionState = { error?: string; success?: boolean };

export async function sendContactMessage(
  reportId: string,
  _prevState: ContactMessageActionState,
  formData: FormData,
): Promise<ContactMessageActionState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const report = await getOwnedContactRequest(reportId, userId);
  if (!report) return { error: "This ticket no longer exists." };
  if (report.status !== "OPEN") return { error: "This ticket is closed." };

  const parsed = contactMessageSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Write something first." };
  }

  const image = formData.get("image");
  let imageUrl: string | undefined;
  if (image instanceof File) {
    const result = await saveContactProofImage(image);
    if (result && "error" in result) return { error: result.error };
    imageUrl = result?.url;
  }

  if (!parsed.data.body && !imageUrl) {
    return { error: "Write something or attach an image first." };
  }

  await prisma.$transaction([
    prisma.contactMessage.create({
      data: { contactRequestId: reportId, authorId: userId, isAdmin: false, body: parsed.data.body ?? "", imageUrl },
    }),
    prisma.contactRequest.update({ where: { id: reportId }, data: { updatedAt: new Date() } }),
  ]);

  revalidatePath(`/contact/${reportId}`);
  revalidatePath("/contact");
  return { success: true };
}
