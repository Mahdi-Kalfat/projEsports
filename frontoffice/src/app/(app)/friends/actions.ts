"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { friendCodeSchema } from "@/lib/validation/friend-code";

export type FriendActionState = { error?: string; success?: boolean };

async function sendFriendRequest(senderId: string, receiverId: string): Promise<{ error?: string }> {
  if (senderId === receiverId) return { error: "You can't add yourself." };

  const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } });
  if (!receiver) return { error: "Player not found." };

  const alreadyFriends = await prisma.friendRequest.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });
  if (alreadyFriends) return { error: "You're already friends." };

  // They already sent a request the other way — accept it instead of creating a
  // second pending row, so two mutual "add" clicks just connect immediately.
  const theirPending = await prisma.friendRequest.findFirst({
    where: { senderId: receiverId, receiverId: senderId, status: "PENDING" },
  });
  if (theirPending) {
    await prisma.friendRequest.update({
      where: { id: theirPending.id },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
    return {};
  }

  // Upsert (not create) so re-sending after a decline resets the same row to
  // PENDING instead of colliding with the @@unique([senderId, receiverId]).
  await prisma.friendRequest.upsert({
    where: { senderId_receiverId: { senderId, receiverId } },
    update: { status: "PENDING", createdAt: new Date(), respondedAt: null },
    create: { senderId, receiverId },
  });
  return {};
}

export async function sendFriendRequestByCode(
  _prevState: FriendActionState,
  formData: FormData,
): Promise<FriendActionState> {
  const session = await requireFrontOfficeSession();

  const parsed = friendCodeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid code." };
  }

  const target = await prisma.user.findUnique({ where: { friendCode: parsed.data.code } });
  if (!target) return { error: "No player found with that code." };

  const result = await sendFriendRequest(session!.user.id, target.id);
  if (result.error) return { error: result.error };

  revalidatePath("/friends");
  return { success: true };
}

export async function sendFriendRequestToUser(
  targetUserId: string,
  _prevState: FriendActionState,
  _formData: FormData,
): Promise<FriendActionState> {
  const session = await requireFrontOfficeSession();
  const result = await sendFriendRequest(session!.user.id, targetUserId);
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function acceptFriendRequest(requestId: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  await prisma.friendRequest.updateMany({
    where: { id: requestId, receiverId: session!.user.id, status: "PENDING" },
    data: { status: "ACCEPTED", respondedAt: new Date() },
  });
  revalidatePath("/friends");
}

export async function declineFriendRequest(requestId: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  await prisma.friendRequest.updateMany({
    where: { id: requestId, receiverId: session!.user.id, status: "PENDING" },
    data: { status: "DECLINED", respondedAt: new Date() },
  });
  revalidatePath("/friends");
}

export async function removeFriend(friendUserId: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;
  await prisma.friendRequest.deleteMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: userId, receiverId: friendUserId },
        { senderId: friendUserId, receiverId: userId },
      ],
    },
  });
  revalidatePath("/friends");
}
