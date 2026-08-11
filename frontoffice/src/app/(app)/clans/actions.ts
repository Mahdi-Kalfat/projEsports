"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireFrontOfficeSession } from "@/lib/require-session";
import { saveUploadedImage } from "@/lib/uploads";
import { clanSchema } from "@/lib/validation/clan";
import { getUserClanMembership, MIN_LEVEL_TO_CREATE_CLAN } from "@/lib/clans";
import { ClanMemberRole, ClanVisibility, ClanJoinRequestStatus } from "@/generated/prisma";

export type ClanActionState = { error?: string; success?: boolean; clanId?: string };

function parseClanForm(formData: FormData) {
  return clanSchema.safeParse({
    name: formData.get("name"),
    tag: formData.get("tag"),
    description: formData.get("description"),
    visibility: formData.get("visibility"),
    minLevel: formData.get("minLevel"),
    maxMembers: formData.get("maxMembers"),
  });
}

export async function createClan(
  _prevState: ClanActionState,
  formData: FormData,
): Promise<ClanActionState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.level < MIN_LEVEL_TO_CREATE_CLAN) {
    return { error: `You need to be level ${MIN_LEVEL_TO_CREATE_CLAN} or above to create a clan.` };
  }

  const existing = await getUserClanMembership(userId);
  if (existing) return { error: "You're already in a clan — leave it first." };

  const parsed = parseClanForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const clash = await prisma.clan.findFirst({
    where: { OR: [{ name: parsed.data.name }, { tag: parsed.data.tag }] },
  });
  if (clash) {
    return { error: clash.name === parsed.data.name ? "That clan name is taken." : "That tag is taken." };
  }

  const logo = formData.get("logo");
  let logoUrl: string | undefined;
  if (logo instanceof File) {
    const result = await saveUploadedImage(logo, "clans");
    if (result && "error" in result) return { error: result.error };
    logoUrl = result?.url;
  }

  const banner = formData.get("banner");
  let bannerUrl: string | undefined;
  if (banner instanceof File) {
    const result = await saveUploadedImage(banner, "clans");
    if (result && "error" in result) return { error: result.error };
    bannerUrl = result?.url;
  }

  const clan = await prisma.clan.create({
    data: {
      name: parsed.data.name,
      tag: parsed.data.tag,
      description: parsed.data.description,
      visibility: parsed.data.visibility as ClanVisibility,
      minLevel: parsed.data.minLevel,
      maxMembers: parsed.data.maxMembers,
      ownerId: userId,
      logoUrl,
      bannerUrl,
    },
  });
  await prisma.clanMembership.create({
    data: { clanId: clan.id, userId, role: ClanMemberRole.OWNER },
  });

  revalidatePath("/clans");
  redirect(`/clans/${clan.id}`);
}

export async function updateClan(
  clanId: string,
  _prevState: ClanActionState,
  formData: FormData,
): Promise<ClanActionState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const clan = await prisma.clan.findUnique({ where: { id: clanId } });
  if (!clan) return { error: "Clan not found." };
  if (clan.ownerId !== userId) return { error: "Only the clan owner can edit clan settings." };

  const parsed = parseClanForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  if (parsed.data.name !== clan.name || parsed.data.tag !== clan.tag) {
    const clash = await prisma.clan.findFirst({
      where: { id: { not: clanId }, OR: [{ name: parsed.data.name }, { tag: parsed.data.tag }] },
    });
    if (clash) {
      return { error: clash.name === parsed.data.name ? "That clan name is taken." : "That tag is taken." };
    }
  }

  const currentMemberCount = await prisma.clanMembership.count({ where: { clanId } });
  if (parsed.data.maxMembers < currentMemberCount) {
    return { error: `The clan already has ${currentMemberCount} members — raise the cap or kick members first.` };
  }

  const logo = formData.get("logo");
  let logoUrl = clan.logoUrl;
  if (logo instanceof File) {
    const result = await saveUploadedImage(logo, "clans");
    if (result && "error" in result) return { error: result.error };
    if (result) logoUrl = result.url;
  }

  const banner = formData.get("banner");
  let bannerUrl = clan.bannerUrl;
  if (banner instanceof File) {
    const result = await saveUploadedImage(banner, "clans");
    if (result && "error" in result) return { error: result.error };
    if (result) bannerUrl = result.url;
  }

  await prisma.clan.update({
    where: { id: clanId },
    data: {
      name: parsed.data.name,
      tag: parsed.data.tag,
      description: parsed.data.description ?? null,
      visibility: parsed.data.visibility as ClanVisibility,
      minLevel: parsed.data.minLevel,
      maxMembers: parsed.data.maxMembers,
      logoUrl,
      bannerUrl,
    },
  });

  revalidatePath(`/clans/${clanId}`);
  return { success: true };
}

export async function joinClan(
  clanId: string,
  _prevState: ClanActionState,
  _formData: FormData,
): Promise<ClanActionState> {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const [user, clan, existingMembership] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.clan.findUnique({ where: { id: clanId }, include: { _count: { select: { members: true } } } }),
    getUserClanMembership(userId),
  ]);

  if (!clan) return { error: "Clan not found." };
  if (existingMembership) return { error: "You're already in a clan." };
  if (user.level < clan.minLevel) {
    return { error: `You need to be level ${clan.minLevel} or above to join this clan.` };
  }
  if (clan._count.members >= clan.maxMembers) return { error: "This clan is full." };

  if (clan.visibility === ClanVisibility.PRIVATE) {
    await prisma.clanJoinRequest.upsert({
      where: { clanId_userId: { clanId, userId } },
      update: { status: ClanJoinRequestStatus.PENDING, createdAt: new Date(), respondedAt: null },
      create: { clanId, userId },
    });
  } else {
    await prisma.clanMembership.create({ data: { clanId, userId, role: ClanMemberRole.MEMBER } });
  }

  revalidatePath(`/clans/${clanId}`);
  return { success: true };
}

export async function cancelJoinRequest(requestId: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const request = await prisma.clanJoinRequest.findUnique({ where: { id: requestId } });
  if (!request || request.userId !== userId) return;

  await prisma.clanJoinRequest.deleteMany({ where: { id: requestId, userId } });
  revalidatePath(`/clans/${request.clanId}`);
}

async function requireOwnerOrAdmin(clanId: string, userId: string) {
  const membership = await prisma.clanMembership.findUnique({ where: { userId } });
  if (!membership || membership.clanId !== clanId) return null;
  if (membership.role === ClanMemberRole.MEMBER) return null;
  return membership;
}

export async function approveJoinRequest(requestId: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const request = await prisma.clanJoinRequest.findUnique({
    where: { id: requestId },
    include: { clan: { include: { _count: { select: { members: true } } } } },
  });
  if (!request || request.status !== ClanJoinRequestStatus.PENDING) return;

  const actor = await requireOwnerOrAdmin(request.clanId, userId);
  if (!actor) return;

  // The requester might have joined a different clan since requesting, or this
  // clan might have filled up in the meantime — re-check both before approving.
  const requesterMembership = await getUserClanMembership(request.userId);
  if (requesterMembership || request.clan._count.members >= request.clan.maxMembers) {
    await prisma.clanJoinRequest.update({
      where: { id: requestId },
      data: { status: ClanJoinRequestStatus.DECLINED, respondedAt: new Date() },
    });
    revalidatePath(`/clans/${request.clanId}`);
    return;
  }

  await prisma.$transaction([
    prisma.clanMembership.create({
      data: { clanId: request.clanId, userId: request.userId, role: ClanMemberRole.MEMBER },
    }),
    prisma.clanJoinRequest.update({
      where: { id: requestId },
      data: { status: ClanJoinRequestStatus.APPROVED, respondedAt: new Date() },
    }),
    // They can only be in one clan — withdraw any other pending requests they'd sent.
    prisma.clanJoinRequest.updateMany({
      where: { userId: request.userId, status: ClanJoinRequestStatus.PENDING, id: { not: requestId } },
      data: { status: ClanJoinRequestStatus.DECLINED, respondedAt: new Date() },
    }),
  ]);

  revalidatePath(`/clans/${request.clanId}`);
}

export async function declineJoinRequest(requestId: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const request = await prisma.clanJoinRequest.findUnique({ where: { id: requestId } });
  if (!request || request.status !== ClanJoinRequestStatus.PENDING) return;

  const actor = await requireOwnerOrAdmin(request.clanId, userId);
  if (!actor) return;

  await prisma.clanJoinRequest.update({
    where: { id: requestId },
    data: { status: ClanJoinRequestStatus.DECLINED, respondedAt: new Date() },
  });
  revalidatePath(`/clans/${request.clanId}`);
}

export async function promoteToAdmin(clanId: string, targetUserId: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const clan = await prisma.clan.findUnique({ where: { id: clanId } });
  if (!clan || clan.ownerId !== userId) return;

  await prisma.clanMembership.updateMany({
    where: { clanId, userId: targetUserId, role: ClanMemberRole.MEMBER },
    data: { role: ClanMemberRole.ADMIN },
  });
  revalidatePath(`/clans/${clanId}`);
}

export async function demoteToMember(clanId: string, targetUserId: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const clan = await prisma.clan.findUnique({ where: { id: clanId } });
  if (!clan || clan.ownerId !== userId) return;

  await prisma.clanMembership.updateMany({
    where: { clanId, userId: targetUserId, role: ClanMemberRole.ADMIN },
    data: { role: ClanMemberRole.MEMBER },
  });
  revalidatePath(`/clans/${clanId}`);
}

// Kicking is owner-only (not delegated to admins) — see the schema/plan notes.
export async function kickMember(clanId: string, targetUserId: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const clan = await prisma.clan.findUnique({ where: { id: clanId } });
  if (!clan || clan.ownerId !== userId) return;
  if (targetUserId === userId) return;

  await prisma.clanMembership.deleteMany({ where: { clanId, userId: targetUserId } });
  revalidatePath(`/clans/${clanId}`);
}

export async function leaveClan(clanId: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const membership = await prisma.clanMembership.findUnique({ where: { userId } });
  if (!membership || membership.clanId !== clanId) return;
  if (membership.role === ClanMemberRole.OWNER) return;

  await prisma.clanMembership.deleteMany({ where: { clanId, userId } });
  revalidatePath(`/clans/${clanId}`);
  redirect("/clans");
}

export async function transferOwnership(clanId: string, formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const newOwnerUserId = formData.get("newOwnerId");
  if (typeof newOwnerUserId !== "string" || !newOwnerUserId) return;

  const clan = await prisma.clan.findUnique({ where: { id: clanId } });
  if (!clan || clan.ownerId !== userId) return;

  const targetMembership = await prisma.clanMembership.findUnique({ where: { userId: newOwnerUserId } });
  if (!targetMembership || targetMembership.clanId !== clanId) return;

  await prisma.$transaction([
    prisma.clan.update({ where: { id: clanId }, data: { ownerId: newOwnerUserId } }),
    prisma.clanMembership.update({ where: { userId: newOwnerUserId }, data: { role: ClanMemberRole.OWNER } }),
    prisma.clanMembership.update({ where: { userId }, data: { role: ClanMemberRole.ADMIN } }),
  ]);

  revalidatePath(`/clans/${clanId}`);
}

export async function disbandClan(clanId: string, _formData: FormData) {
  const session = await requireFrontOfficeSession();
  const userId = session!.user.id;

  const clan = await prisma.clan.findUnique({ where: { id: clanId } });
  if (!clan || clan.ownerId !== userId) return;

  await prisma.clanJoinRequest.deleteMany({ where: { clanId } });
  await prisma.clanMembership.deleteMany({ where: { clanId } });
  await prisma.clan.delete({ where: { id: clanId } });

  revalidatePath("/clans");
  redirect("/clans");
}
