"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { logUserAction } from "@/lib/audit-log";
import { reportReplySchema, depositAmountSchema } from "@/lib/validation/contact";
import { CONTACT_TYPES } from "@/lib/contact-types";
import { guardedTarget } from "@/app/(app)/users/actions";
import { ContactType } from "@/generated/prisma";

export type ReplyActionState = { error?: string; success?: boolean };

export async function replyToReport(
  reportId: string,
  _prevState: ReplyActionState,
  formData: FormData,
): Promise<ReplyActionState> {
  const session = await requireBackofficeSession();

  const parsed = reportReplySchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Write something first." };
  }

  const report = await prisma.contactRequest.findUnique({ where: { id: reportId } });
  if (!report) return { error: "This report no longer exists." };

  await prisma.$transaction([
    prisma.contactMessage.create({
      data: { contactRequestId: reportId, authorId: session!.user.id, isAdmin: true, body: parsed.data.body },
    }),
    prisma.contactRequest.update({ where: { id: reportId }, data: { updatedAt: new Date() } }),
  ]);

  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
  return { success: true };
}

export async function setReportType(reportId: string, formData: FormData) {
  await requireBackofficeSession();

  const type = formData.get("type");
  if (typeof type !== "string" || !CONTACT_TYPES.includes(type as ContactType)) return;

  await prisma.contactRequest.update({
    where: { id: reportId },
    data: { type: type as ContactType, updatedAt: new Date() },
  });
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
}

export async function closeReport(reportId: string, _formData: FormData) {
  await requireBackofficeSession();

  await prisma.contactRequest.update({
    where: { id: reportId },
    data: { status: "CLOSED", closedAt: new Date() },
  });
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
}

export async function reopenReport(reportId: string, _formData: FormData) {
  await requireBackofficeSession();

  await prisma.contactRequest.update({
    where: { id: reportId },
    data: { status: "OPEN", closedAt: null },
  });
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
}

export type DepositActionState = { error?: string; success?: boolean };

// The only place ccCoins ever gets credited — deliberately not part of the
// general economy edit (see users/actions.ts's updateEconomy, which never
// touches ccCoins) so every grant is tied to an open, deposit-triaged report.
export async function addCcCoins(
  reportId: string,
  _prevState: DepositActionState,
  formData: FormData,
): Promise<DepositActionState> {
  const session = await requireBackofficeSession();

  const report = await prisma.contactRequest.findUnique({ where: { id: reportId } });
  if (!report) return { error: "This report no longer exists." };
  if (report.status !== "OPEN") return { error: "This report is closed — reopen it first." };
  if (report.type !== "DEPOSIT_REQUEST") {
    return { error: "Set the contact type to Deposit Request first." };
  }

  const target = await guardedTarget(report.userId, session!.user.id);
  if (!target) return { error: "You can't credit this account." };

  const parsed = depositAmountSchema.safeParse({ amount: formData.get("amount") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid amount." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: report.userId }, data: { ccCoins: { increment: parsed.data.amount } } }),
    prisma.contactMessage.create({
      data: {
        contactRequestId: reportId,
        authorId: session!.user.id,
        isAdmin: true,
        body: `Added ${parsed.data.amount} cc to your balance.`,
      },
    }),
    prisma.contactRequest.update({ where: { id: reportId }, data: { updatedAt: new Date() } }),
  ]);

  await logUserAction({
    targetUserId: report.userId,
    actorId: session!.user.id,
    actorUsername: session!.user.username,
    action: "Granted CC coins",
    details: `${parsed.data.amount} cc via report ${reportId}`,
  });

  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
  revalidatePath("/users");
  return { success: true };
}

export type ShopPurchaseActionState = { error?: string; success?: boolean };

// The other place inventory ever gets granted from a report — approving a
// report opened by buyShopItem (frontoffice) adds the linked Item to the
// user's inventory. Using it (see frontoffice's useItem, CC_GRANT branch) is
// what actually credits ccCoins — approval only hands over the voucher.
export async function approveShopPurchase(
  reportId: string,
  _prevState: ShopPurchaseActionState,
  _formData: FormData,
): Promise<ShopPurchaseActionState> {
  const session = await requireBackofficeSession();

  const report = await prisma.contactRequest.findUnique({
    where: { id: reportId },
    include: { shopItem: { include: { grantsItem: true } } },
  });
  if (!report) return { error: "This report no longer exists." };
  if (report.status !== "OPEN") return { error: "This report is already decided." };
  if (!report.shopItem || !report.shopItem.grantsItem) {
    return { error: "This report isn't linked to a purchasable shop item." };
  }

  const target = await guardedTarget(report.userId, session!.user.id);
  if (!target) return { error: "You can't credit this account." };

  const item = report.shopItem.grantsItem;

  await prisma.$transaction([
    prisma.userItem.upsert({
      where: { userId_itemId: { userId: report.userId, itemId: item.id } },
      create: { userId: report.userId, itemId: item.id, quantity: 1 },
      update: { quantity: { increment: 1 } },
    }),
    prisma.contactMessage.create({
      data: {
        contactRequestId: reportId,
        authorId: session!.user.id,
        isAdmin: true,
        body: `Approved — added "${item.name}" to your inventory. Use it from your inventory to receive the cc.`,
      },
    }),
    prisma.contactRequest.update({
      where: { id: reportId },
      data: { status: "CLOSED", closedAt: new Date(), updatedAt: new Date() },
    }),
  ]);

  await logUserAction({
    targetUserId: report.userId,
    actorId: session!.user.id,
    actorUsername: session!.user.username,
    action: "Approved shop purchase",
    details: `${report.shopItem.title} → granted ${item.name}`,
  });

  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
  revalidatePath("/users");
  return { success: true };
}

export async function rejectShopPurchase(
  reportId: string,
  _prevState: ShopPurchaseActionState,
  _formData: FormData,
): Promise<ShopPurchaseActionState> {
  const session = await requireBackofficeSession();

  const report = await prisma.contactRequest.findUnique({
    where: { id: reportId },
    include: { shopItem: true },
  });
  if (!report) return { error: "This report no longer exists." };
  if (report.status !== "OPEN") return { error: "This report is already decided." };
  if (!report.shopItem) return { error: "This report isn't linked to a purchasable shop item." };

  // Restore the stock unit that was optimistically decremented at purchase
  // time (see buyShopItem) — a decline means the sale never happened. Same
  // logic for CC/POINTS-priced listings: buyShopItem deducts that balance up
  // front (they're real, unlike MONEY), so a decline has to refund it here
  // or the player just loses cc/points for nothing.
  await prisma.$transaction([
    prisma.contactMessage.create({
      data: {
        contactRequestId: reportId,
        authorId: session!.user.id,
        isAdmin: true,
        body: "Your purchase request was declined.",
      },
    }),
    prisma.contactRequest.update({
      where: { id: reportId },
      data: { status: "CLOSED", closedAt: new Date(), updatedAt: new Date() },
    }),
    ...(report.shopItem.stock !== null
      ? [prisma.shopItem.update({ where: { id: report.shopItem.id }, data: { stock: { increment: 1 } } })]
      : []),
    ...(report.shopItem.priceType === "CC" && report.shopItem.price > 0
      ? [prisma.user.update({ where: { id: report.userId }, data: { ccCoins: { increment: report.shopItem.price } } })]
      : []),
    ...(report.shopItem.priceType === "POINTS" && report.shopItem.price > 0
      ? [prisma.user.update({ where: { id: report.userId }, data: { points: { increment: report.shopItem.price } } })]
      : []),
  ]);

  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/reports");
  return { success: true };
}
