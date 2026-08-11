import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClanRelation } from "@/lib/clans";
import { ClanHeader } from "@/components/clans/clan-header";
import { JoinButton } from "@/components/clans/join-button";
import { ClanSettingsButton } from "@/components/clans/clan-settings-button";
import { MemberList } from "@/components/clans/member-list";
import { JoinRequestsPanel } from "@/components/clans/join-requests-panel";
import { Reveal } from "@/components/ui/reveal";

export async function generateMetadata(props: PageProps<"/clans/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const clan = await prisma.clan.findUnique({ where: { id }, select: { name: true } });
  return { title: clan ? `${clan.name} — Clans` : "Clan" };
}

const MEMBER_SELECT = { id: true, username: true, avatarUrl: true, level: true } as const;

export default async function ClanDetailPage(props: PageProps<"/clans/[id]">) {
  const { id } = await props.params;
  const session = await auth();
  const viewerId = session!.user.id;

  const clan = await prisma.clan.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: MEMBER_SELECT } }, orderBy: { joinedAt: "asc" } },
      _count: { select: { members: true } },
    },
  });

  if (!clan) notFound();

  const [relation, viewer] = await Promise.all([
    getClanRelation(viewerId, clan.id),
    prisma.user.findUniqueOrThrow({ where: { id: viewerId }, select: { level: true } }),
  ]);

  const isOwner = relation.kind === "OWNER";
  const isOwnerOrAdmin = isOwner || relation.kind === "ADMIN";

  const joinRequests = isOwnerOrAdmin
    ? await prisma.clanJoinRequest.findMany({
        where: { clanId: clan.id, status: "PENDING" },
        include: { user: { select: MEMBER_SELECT } },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const members = clan.members.map((m) => ({ id: m.id, role: m.role, user: m.user }));

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/clans"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted transition hover:text-primary"
      >
        <ArrowLeft size={14} />
        All clans
      </Link>

      <Reveal>
        <ClanHeader
          clan={{
            id: clan.id,
            name: clan.name,
            tag: clan.tag,
            description: clan.description,
            logoUrl: clan.logoUrl,
            bannerUrl: clan.bannerUrl,
            visibility: clan.visibility,
            minLevel: clan.minLevel,
            maxMembers: clan.maxMembers,
            memberCount: clan._count.members,
          }}
          action={
            isOwner ? (
              <ClanSettingsButton
                clanId={clan.id}
                defaults={{
                  name: clan.name,
                  tag: clan.tag,
                  description: clan.description ?? "",
                  visibility: clan.visibility,
                  minLevel: clan.minLevel,
                  maxMembers: clan.maxMembers,
                }}
                currentLogoUrl={clan.logoUrl}
                currentBannerUrl={clan.bannerUrl}
                otherMembers={members.filter((m) => m.user.id !== viewerId)}
              />
            ) : (
              <JoinButton
                clanId={clan.id}
                status={relation}
                isPrivate={clan.visibility === "PRIVATE"}
                eligible={viewer.level >= clan.minLevel}
                minLevel={clan.minLevel}
                isFull={clan._count.members >= clan.maxMembers}
              />
            )
          }
        />
      </Reveal>

      {isOwnerOrAdmin && joinRequests.length > 0 && (
        <Reveal delay={0.05}>
          <JoinRequestsPanel requests={joinRequests.map((r) => ({ id: r.id, user: r.user }))} />
        </Reveal>
      )}

      <Reveal delay={0.1}>
        <div className="rounded-2xl border border-border bg-surface-raised p-5">
          <MemberList clanId={clan.id} members={members} viewerIsOwner={isOwner} viewerId={viewerId} />
        </div>
      </Reveal>
    </div>
  );
}
