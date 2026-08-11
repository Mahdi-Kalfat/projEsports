import { prisma } from "@/lib/prisma";

// Best-effort: the audit trail must never be able to block the moderation action
// it's recording. A write here failing (e.g. a stale session referencing a user id
// that no longer exists) should not surface as an error on the ban/block/etc. itself.
export async function logUserAction(params: {
  targetUserId: string;
  actorId: string;
  actorUsername: string;
  action: string;
  details?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        targetUserId: params.targetUserId,
        actorId: params.actorId,
        actorUsername: params.actorUsername,
        action: params.action,
        details: params.details,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log entry:", error);
  }
}
