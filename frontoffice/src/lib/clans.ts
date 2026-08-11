import { prisma } from "@/lib/prisma";
import { ClanMemberRole, ClanJoinRequestStatus } from "@/generated/prisma";

export const MIN_LEVEL_TO_CREATE_CLAN = 20;

// A user can only ever belong to one clan (owner counts as belonging) — this is
// the single source of truth every clan action checks against, enforced at the
// DB level by ClanMembership.userId being @unique.
export async function getUserClanMembership(userId: string) {
  return prisma.clanMembership.findUnique({
    where: { userId },
    include: { clan: true },
  });
}

export type ClanRelationStatus =
  | { kind: "OWNER" }
  | { kind: "ADMIN" }
  | { kind: "MEMBER" }
  | { kind: "PENDING_REQUEST"; requestId: string }
  | { kind: "IN_OTHER_CLAN" }
  | { kind: "NONE" };

export async function getClanRelation(userId: string, clanId: string): Promise<ClanRelationStatus> {
  const membership = await getUserClanMembership(userId);
  if (membership) {
    if (membership.clanId !== clanId) return { kind: "IN_OTHER_CLAN" };
    if (membership.role === ClanMemberRole.OWNER) return { kind: "OWNER" };
    if (membership.role === ClanMemberRole.ADMIN) return { kind: "ADMIN" };
    return { kind: "MEMBER" };
  }

  const pending = await prisma.clanJoinRequest.findFirst({
    where: { clanId, userId, status: ClanJoinRequestStatus.PENDING },
  });
  if (pending) return { kind: "PENDING_REQUEST", requestId: pending.id };

  return { kind: "NONE" };
}
