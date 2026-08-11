"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { getOrCreateConversation } from "@/lib/messages";
import { messageSchema } from "@/lib/validation/message";

export type MessageActionState = { error?: string; success?: boolean };

export async function sendMessage(
  receiverId: string,
  friendUsername: string,
  _prevState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const session = await requireFrontOfficeSession();
  const senderId = session!.user.id;

  if (senderId === receiverId) return { error: "You can't message yourself." };

  const parsed = messageSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Write something first." };
  }

  // Re-checks friendship itself — this is the authoritative gate. Returns null
  // if senderId/receiverId are no longer friends (unfriended, or never were),
  // which is exactly what disables further sends after removeFriend deletes
  // the FriendRequest row.
  const conversation = await getOrCreateConversation(senderId, receiverId);
  if (!conversation) return { error: "You can only message friends." };

  await prisma.$transaction([
    // readAt: null is explicit, not just omitted — Prisma's MongoDB connector
    // only matches `where: { readAt: null }` (used by countUnreadMessages and
    // markConversationRead) against documents where the field is actually
    // present as BSON null, not merely absent. Omitting it here would make
    // every new message invisible to the unread-count query.
    prisma.message.create({
      data: { conversationId: conversation.id, senderId, receiverId, body: parsed.data.body, readAt: null },
    }),
    prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } }),
  ]);

  revalidatePath(`/messages/${friendUsername}`);
  revalidatePath("/messages");
  return { success: true };
}

// Deliberately NOT bound to a <form action> like every other delete action in
// this app (deleteComment, deleteProfileComment, removeFriend) — it's called
// directly from MessageThread's client code instead. The open thread keeps its
// own client-side `messages` state assembled by the poller, and a
// form-triggered Server Action only refreshes the *server* props — it does not
// reset that already-mounted client state. An imperative call lets the caller
// locally filter the deleted message out immediately. revalidatePath is still
// kept so a subsequent full reload/nav reflects the deletion too.
export async function deleteMessage(messageId: string, friendUsername: string): Promise<void> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const message = await prisma.message.findUnique({ where: { id: messageId }, select: { senderId: true } });
  if (!message) return;

  // Own-message-only — unlike deleteComment/deleteProfileComment (which also
  // let the wall/post *owner* moderate), a DM's other participant never gets
  // to delete something they didn't send; there's no "your own wall" here.
  if (message.senderId !== userId) return;

  await prisma.message.deleteMany({ where: { id: messageId, senderId: userId } });
  revalidatePath(`/messages/${friendUsername}`);
}
