import { prisma } from "@/lib/prisma";
import type { ContactType, ContactStatus } from "@/generated/prisma";

export type ContactMessageData = {
  id: string;
  body: string;
  imageUrl: string | null;
  isAdmin: boolean;
  createdAt: Date;
};

export type ContactRequestSummary = {
  id: string;
  subject: string;
  type: ContactType;
  status: ContactStatus;
  updatedAt: Date;
};

export async function getContactRequests(userId: string): Promise<ContactRequestSummary[]> {
  return prisma.contactRequest.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, subject: true, type: true, status: true, updatedAt: true },
  });
}

// Read-only, ownership-checked — returns null if the ticket doesn't belong to
// this user, so neither the detail page nor the polling route can leak
// another user's ticket.
export async function getOwnedContactRequest(id: string, userId: string) {
  const report = await prisma.contactRequest.findUnique({ where: { id } });
  if (!report || report.userId !== userId) return null;
  return report;
}

// since (optional) powers the polling Route Handler's "what's new" query;
// omit it for the initial full-thread server render.
export async function getContactMessages(contactRequestId: string, since?: Date): Promise<ContactMessageData[]> {
  return prisma.contactMessage.findMany({
    where: { contactRequestId, ...(since ? { createdAt: { gt: since } } : {}) },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, imageUrl: true, isAdmin: true, createdAt: true },
  });
}
