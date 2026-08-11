import { prisma } from "@/lib/prisma";

export type FriendshipStatus =
  | { kind: "SELF" }
  | { kind: "FRIENDS"; requestId: string }
  | { kind: "PENDING_SENT"; requestId: string }
  | { kind: "PENDING_RECEIVED"; requestId: string }
  | { kind: "NONE" };

// A friendship is just an ACCEPTED FriendRequest row, checked in either
// direction — see the schema comment on FriendRequest for why there's no
// separate symmetric Friendship table.
export async function getFriendshipStatus(viewerId: string, targetId: string): Promise<FriendshipStatus> {
  if (viewerId === targetId) return { kind: "SELF" };

  const request = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: viewerId, receiverId: targetId },
        { senderId: targetId, receiverId: viewerId },
      ],
    },
  });

  if (!request || request.status === "DECLINED") return { kind: "NONE" };
  if (request.status === "ACCEPTED") return { kind: "FRIENDS", requestId: request.id };
  return request.senderId === viewerId
    ? { kind: "PENDING_SENT", requestId: request.id }
    : { kind: "PENDING_RECEIVED", requestId: request.id };
}

const FRIEND_SELECT = {
  id: true,
  username: true,
  avatarUrl: true,
  level: true,
  lastLoginAt: true,
} as const;

export async function getFriends(userId: string) {
  const requests = await prisma.friendRequest.findMany({
    where: { status: "ACCEPTED", OR: [{ senderId: userId }, { receiverId: userId }] },
    include: { sender: { select: FRIEND_SELECT }, receiver: { select: FRIEND_SELECT } },
    orderBy: { respondedAt: "desc" },
  });
  return requests.map((r) => (r.senderId === userId ? r.receiver : r.sender));
}

export async function countPendingReceived(userId: string): Promise<number> {
  return prisma.friendRequest.count({ where: { receiverId: userId, status: "PENDING" } });
}
