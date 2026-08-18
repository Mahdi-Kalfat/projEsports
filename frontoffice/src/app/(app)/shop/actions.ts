"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { formatPriceByType } from "@/lib/format";

export type BuyShopItemState = { error?: string };

// Only items with grantsItemId set are purchasable right now (currently the
// cc bundles, the cc-to-points listings, and points-priced boosts). Two
// flows depending on the listing's needsConfirmation flag: true (default) —
// buying opens a DEPOSIT_REQUEST ticket for an admin to approve (see
// backoffice's approveShopPurchase), same "no real payment processor"
// tradeoff as MONEY tournament entries and marketplace listings. false — the
// item is granted the moment someone buys it, no admin step.
//
// CC and POINTS are backed by real, enforced balances (unlike MONEY, which
// is paid out of band and only verified by an admin) — so unlike MONEY,
// buying a CC- or POINTS-priced listing actually checks and deducts the
// matching balance here, regardless of which flow above applies.
export async function buyShopItem(
  shopItemId: string,
  _prevState: BuyShopItemState,
  _formData: FormData,
): Promise<BuyShopItemState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const shopItem = await prisma.shopItem.findUnique({ where: { id: shopItemId } });
  if (!shopItem || shopItem.status !== "ACTIVE" || !shopItem.grantsItemId) {
    return { error: "This item isn't purchasable right now." };
  }
  if (shopItem.stock !== null && shopItem.stock <= 0) {
    return { error: "This item is sold out." };
  }

  const spendsCc = shopItem.priceType === "CC" && shopItem.price > 0;
  const spendsPoints = shopItem.priceType === "POINTS" && shopItem.price > 0;
  if (spendsCc || spendsPoints) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (spendsCc && user.ccCoins < shopItem.price) {
      return { error: `Not enough cc — you need ${shopItem.price.toLocaleString("en-US")} cc.` };
    }
    if (spendsPoints && user.points < shopItem.price) {
      return { error: `Not enough points — you need ${shopItem.price.toLocaleString("en-US")} points.` };
    }
  }

  const balanceUpdate = spendsCc
    ? [prisma.user.update({ where: { id: userId }, data: { ccCoins: { decrement: shopItem.price } } })]
    : spendsPoints
      ? [prisma.user.update({ where: { id: userId }, data: { points: { decrement: shopItem.price } } })]
      : [];

  if (!shopItem.needsConfirmation) {
    await prisma.$transaction([
      prisma.userItem.upsert({
        where: { userId_itemId: { userId, itemId: shopItem.grantsItemId } },
        create: { userId, itemId: shopItem.grantsItemId, quantity: 1 },
        update: { quantity: { increment: 1 } },
      }),
      ...balanceUpdate,
      ...(shopItem.stock !== null
        ? [prisma.shopItem.update({ where: { id: shopItem.id }, data: { stock: { decrement: 1 } } })]
        : []),
    ]);

    revalidatePath("/shop");
    revalidatePath(`/inventory/${session!.user.username}`);
    redirect(`/inventory/${session!.user.username}`);
  }

  const report = await prisma.contactRequest.create({
    data: { userId, subject: `Buy: ${shopItem.title}`, type: "DEPOSIT_REQUEST", shopItemId: shopItem.id },
  });

  let body = `Requested to buy "${shopItem.title}" for ${formatPriceByType(shopItem.priceType, shopItem.price)}.`;
  // MONEY is the one priceType with no in-system balance to check — it's
  // paid out of band, so the buyer needs to know where to actually send it.
  // See backoffice's /payment-methods, which admins manage this list from.
  if (shopItem.priceType === "MONEY") {
    const methods = await prisma.paymentMethod.findMany({ orderBy: { createdAt: "asc" } });
    if (methods.length > 0) {
      const list = methods.map((method) => `- ${method.name}: ${method.details}`).join("\n");
      body += `\n\nSend payment to one of:\n${list}`;
    }
    body += "\n\nPlease respond with a proof of payment.";
  }

  await prisma.$transaction([
    prisma.contactMessage.create({
      data: {
        contactRequestId: report.id,
        // isAdmin: true even though authorId is the buyer — this is
        // system-generated instructional content (price, where to pay), not
        // something the buyer said, so it displays on the "Admin" side of
        // the thread rather than looking like the buyer typed it themselves.
        authorId: userId,
        isAdmin: true,
        body,
      },
    }),
    ...balanceUpdate,
    ...(shopItem.stock !== null
      ? [prisma.shopItem.update({ where: { id: shopItem.id }, data: { stock: { decrement: 1 } } })]
      : []),
  ]);

  revalidatePath("/shop");
  revalidatePath("/contact");
  redirect(`/contact/${report.id}`);
}
