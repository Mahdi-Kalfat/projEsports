"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBackofficeSession } from "@/lib/require-session";
import { logUserAction } from "@/lib/audit-log";
import { userEconomySchema } from "@/lib/validation/user-economy";
import { grantItemSchema } from "@/lib/validation/item";
import { normalizeLevelXp } from "@/lib/level-xp";
import { durationToMs, RESTRICTION_LOG_LABELS, type RestrictionKind } from "@/lib/restrictions";
import { Role, SubRole } from "@/generated/prisma";

const ASSIGNABLE_ROLES: string[] = [Role.ADMIN, Role.MODERATOR, Role.USER];
const ASSIGNABLE_SUB_ROLES: string[] = [SubRole.TRUSTED, SubRole.COMMENTOR];

// Guards against acting on your own account or on an OWNER account — the
// latter protects the top-level role from being locked out by a moderator/admin.
// Exported for reuse by other admin-on-user actions (e.g. reports/actions.ts's
// addCcCoins) that need the same protection.
export async function guardedTarget(userId: string, sessionUserId: string) {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.id === sessionUserId || target.role === "OWNER") {
    return null;
  }
  return target;
}

function formatDateTime(date: Date) {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

type RestrictionUpdate = {
  banned?: boolean;
  bannedUntil?: Date | null;
  blocked?: boolean;
  blockedUntil?: Date | null;
  marketBlocked?: boolean;
  marketBlockedUntil?: Date | null;
  shopBlocked?: boolean;
  shopBlockedUntil?: Date | null;
};

function restrictionUpdate(kind: RestrictionKind, active: boolean, until: Date | null): RestrictionUpdate {
  switch (kind) {
    case "ban":
      return { banned: active, bannedUntil: until };
    case "block":
      return { blocked: active, blockedUntil: until };
    case "market":
      return { marketBlocked: active, marketBlockedUntil: until };
    case "shop":
      return { shopBlocked: active, shopBlockedUntil: until };
  }
}

export type RestrictionActionState = { error?: string; success?: boolean };

export async function applyRestriction(
  userId: string,
  kind: RestrictionKind,
  _prevState: RestrictionActionState,
  formData: FormData,
): Promise<RestrictionActionState> {
  const session = await requireBackofficeSession();
  const target = await guardedTarget(userId, session!.user.id);
  if (!target) {
    return { error: "You can't moderate this account." };
  }

  const amount = Number(formData.get("amount"));
  const unit = String(formData.get("unit") ?? "");
  const ms = durationToMs(amount, unit);
  if (ms === null) {
    return { error: "Enter a duration of 1–3650, and pick a unit." };
  }

  const until = new Date(Date.now() + ms);
  await prisma.user.update({
    where: { id: userId },
    data: restrictionUpdate(kind, true, until),
  });
  await logUserAction({
    targetUserId: userId,
    actorId: session!.user.id,
    actorUsername: session!.user.username,
    action: RESTRICTION_LOG_LABELS[kind].applied,
    details: `${amount} ${unit} — until ${formatDateTime(until)}`,
  });
  revalidatePath("/users");
  return { success: true };
}

export async function liftRestriction(userId: string, kind: RestrictionKind, _formData: FormData) {
  const session = await requireBackofficeSession();
  const target = await guardedTarget(userId, session!.user.id);
  if (!target) return;

  await prisma.user.update({ where: { id: userId }, data: restrictionUpdate(kind, false, null) });
  await logUserAction({
    targetUserId: userId,
    actorId: session!.user.id,
    actorUsername: session!.user.username,
    action: RESTRICTION_LOG_LABELS[kind].lifted,
  });
  revalidatePath("/users");
}

export async function setRole(userId: string, formData: FormData) {
  const session = await requireBackofficeSession();
  const target = await guardedTarget(userId, session!.user.id);
  if (!target) return;

  const role = formData.get("role");
  if (typeof role !== "string" || !ASSIGNABLE_ROLES.includes(role) || role === target.role) return;

  await prisma.user.update({ where: { id: userId }, data: { role: role as Role } });
  await logUserAction({
    targetUserId: userId,
    actorId: session!.user.id,
    actorUsername: session!.user.username,
    action: "Changed role",
    details: `${target.role} → ${role}`,
  });
  revalidatePath("/users");
}

export async function setSubRole(userId: string, formData: FormData) {
  const session = await requireBackofficeSession();
  const target = await guardedTarget(userId, session!.user.id);
  if (!target) return;

  const value = formData.get("subRole");
  const subRoles =
    typeof value === "string" && ASSIGNABLE_SUB_ROLES.includes(value) ? [value as SubRole] : [];

  await prisma.user.update({ where: { id: userId }, data: { subRoles } });
  await logUserAction({
    targetUserId: userId,
    actorId: session!.user.id,
    actorUsername: session!.user.username,
    action: "Changed sub-role",
    details: `${target.subRoles.join(", ") || "None"} → ${subRoles.join(", ") || "None"}`,
  });
  revalidatePath("/users");
}

export type NoteActionState = { error?: string; success?: boolean };

const MAX_NOTE_LENGTH = 2000;

// Notes are commentary, not moderation — allowed on any account, including your
// own and OWNER accounts, unlike ban/block/role/economy (which use guardedTarget).
export async function addNote(
  userId: string,
  _prevState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  const session = await requireBackofficeSession();

  const body = String(formData.get("body") ?? "").trim();
  if (!body) {
    return { error: "Write something before saving." };
  }
  if (body.length > MAX_NOTE_LENGTH) {
    return { error: `Keep it under ${MAX_NOTE_LENGTH} characters.` };
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { error: "That account no longer exists." };
  }

  try {
    await prisma.note.create({
      data: {
        targetUserId: userId,
        authorId: session!.user.id,
        authorUsername: session!.user.username,
        body,
      },
    });
  } catch (error) {
    console.error("Failed to save note:", error);
    return { error: "Couldn't save the note. Try again." };
  }

  revalidatePath("/users");
  return { success: true };
}

export type EconomyActionState = { error?: string; success?: boolean };

export async function updateEconomy(
  userId: string,
  _prevState: EconomyActionState,
  formData: FormData,
): Promise<EconomyActionState> {
  const session = await requireBackofficeSession();
  const target = await guardedTarget(userId, session!.user.id);
  if (!target) {
    return { error: "You can't edit this account." };
  }

  const parsed = userEconomySchema.safeParse({
    points: formData.get("points"),
    level: formData.get("level"),
    xp: formData.get("xp"),
  });
  if (!parsed.success) {
    return { error: "Enter whole numbers — points ≥ 0, level ≥ 1, xp ≥ 0." };
  }

  // Whatever level/xp the admin submits gets normalized against the
  // configured XP curve — any xp overflow past the current level's
  // requirement carries into level-ups (possibly several at once), so the
  // two fields never drift out of sync with LevelXpRule.
  const rules = await prisma.levelXpRule.findMany({ select: { tier: true, xpPerLevel: true } });
  const { level, xp } = normalizeLevelXp(parsed.data.level, parsed.data.xp, rules);

  await prisma.user.update({
    where: { id: userId },
    data: { points: parsed.data.points, level, xp },
  });
  await logUserAction({
    targetUserId: userId,
    actorId: session!.user.id,
    actorUsername: session!.user.username,
    action: "Updated economy",
    details: `Points ${target.points} → ${parsed.data.points}, Level ${target.level} → ${level}, XP ${target.xp} → ${xp}`,
  });
  revalidatePath("/users");
  return { success: true };
}

export type GrantItemState = { error?: string; success?: boolean };

// Grants stack: granting an item a user already holds increments quantity
// rather than creating a duplicate UserItem row (see the model comment in
// schema.prisma). This is the only way an item currently reaches an
// inventory — there's no purchase/reward flow yet.
export async function grantItem(
  userId: string,
  _prevState: GrantItemState,
  formData: FormData,
): Promise<GrantItemState> {
  const session = await requireBackofficeSession();
  const target = await guardedTarget(userId, session!.user.id);
  if (!target) {
    return { error: "You can't edit this account." };
  }

  const parsed = grantItemSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Pick an item and a valid quantity." };
  }

  const item = await prisma.item.findUnique({ where: { id: parsed.data.itemId } });
  if (!item || item.status !== "ACTIVE") {
    return { error: "Pick an active item." };
  }

  await prisma.userItem.upsert({
    where: { userId_itemId: { userId, itemId: item.id } },
    create: { userId, itemId: item.id, quantity: parsed.data.quantity },
    update: { quantity: { increment: parsed.data.quantity } },
  });

  await logUserAction({
    targetUserId: userId,
    actorId: session!.user.id,
    actorUsername: session!.user.username,
    action: "Granted item",
    details: `${parsed.data.quantity}x ${item.name}`,
  });
  revalidatePath("/users");
  return { success: true };
}
