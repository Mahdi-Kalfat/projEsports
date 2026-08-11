import { prisma } from "@/lib/prisma";
import { getFriendshipStatus } from "@/lib/friends";

const PARTICIPANT_SELECT = { id: true, username: true, avatarUrl: true, level: true, lastLoginAt: true } as const;

export type MessageData = {
  id: string;
  body: string;
  senderId: string;
  createdAt: Date;
};

export type ConversationSummary = {
  id: string;
  friend: { id: string; username: string; avatarUrl: string | null; level: number; lastLoginAt: Date | null };
  lastMessage: { body: string; senderId: string; createdAt: Date } | null;
  unreadCount: number;
};

// Deterministic ordering so Conversation's compound unique key doesn't care who
// opened the thread first. Unlike FriendRequest (which stays directional on
// purpose — sender/receiver matters for pending requests), a DM thread has no
// direction of its own, so canonicalizing avoids an OR-query on every lookup.
function orderPair(userId: string, otherId: string): [string, string] {
  return userId < otherId ? [userId, otherId] : [otherId, userId];
}

// Read-only — does NOT create a row. Used by the thread page so simply
// *viewing* /messages/[username] (including a <Link> prefetch that fires
// before the user actually opens the page) never writes to the database.
export async function findConversation(userId: string, friendId: string) {
  const [userAId, userBId] = orderPair(userId, friendId);
  return prisma.conversation.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
}

// Creates the row on first send if it doesn't exist yet. Only ever called from
// sendMessage (a write path) — never from a page render, see findConversation
// above. Verifies friendship itself so no caller can accidentally skip the gate.
export async function getOrCreateConversation(userId: string, friendId: string) {
  const status = await getFriendshipStatus(userId, friendId);
  if (status.kind !== "FRIENDS") return null;

  const [userAId, userBId] = orderPair(userId, friendId);
  return prisma.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
  });
}

// since (optional) powers the polling Route Handler's "what's new" query;
// omit it for the initial full-thread server render.
export async function getMessages(
  conversationId: string,
  viewerId: string,
  since?: Date,
): Promise<MessageData[] | null> {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || (conversation.userAId !== viewerId && conversation.userBId !== viewerId)) return null;

  return prisma.message.findMany({
    where: { conversationId, ...(since ? { createdAt: { gt: since } } : {}) },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, senderId: true, createdAt: true },
  });
}

// List + last message preview + unread count, sorted by last activity — the
// inbox. Unread counts are grouped in JS rather than a Mongo aggregation
// pipeline (see the Conversation model comment); fine at this app's scale,
// the same tradeoff getFriends already makes by mapping in JS.
export async function getConversations(userId: string): Promise<ConversationSummary[]> {
  const [conversations, unread] = await Promise.all([
    prisma.conversation.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      orderBy: { lastMessageAt: "desc" },
      include: {
        userA: { select: PARTICIPANT_SELECT },
        userB: { select: PARTICIPANT_SELECT },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, senderId: true, createdAt: true } },
      },
    }),
    prisma.message.findMany({ where: { receiverId: userId, readAt: null }, select: { conversationId: true } }),
  ]);

  const unreadCounts = new Map<string, number>();
  for (const m of unread) unreadCounts.set(m.conversationId, (unreadCounts.get(m.conversationId) ?? 0) + 1);

  return conversations
    // Defensive: a Conversation can only be created inside sendMessage's flow
    // (see getOrCreateConversation), immediately followed by a Message create —
    // but the two aren't wrapped in one atomic transaction (see sendMessage), so
    // a crash in that tiny window could in theory leave a message-less row.
    // Filtering it out here just hides it from the inbox; low-stakes enough
    // that it isn't worth an interactive transaction to fully rule out.
    .filter((c) => c.messages.length > 0)
    .map((c) => ({
      id: c.id,
      friend: c.userAId === userId ? c.userB : c.userA,
      lastMessage: c.messages[0] ?? null,
      unreadCount: unreadCounts.get(c.id) ?? 0,
    }));
}

// Mirrors countPendingReceived's exact shape, for the navbar badge.
export async function countUnreadMessages(userId: string): Promise<number> {
  return prisma.message.count({ where: { receiverId: userId, readAt: null } });
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  await prisma.message.updateMany({
    where: { conversationId, receiverId: userId, readAt: null },
    data: { readAt: new Date() },
  });
}
