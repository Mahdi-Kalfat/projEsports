"use client";

import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Crown, ShieldCheck, ChevronUp, ChevronDown, UserX } from "lucide-react";
import { promoteToAdmin, demoteToMember, kickMember } from "@/app/(app)/clans/actions";
import type { ClanMemberData } from "./types";

function MemberRow({
  clanId,
  member,
  viewerIsOwner,
  viewerId,
}: {
  clanId: string;
  member: ClanMemberData;
  viewerIsOwner: boolean;
  viewerId: string;
}) {
  const isSelf = member.user.id === viewerId;
  const showOwnerActions = viewerIsOwner && !isSelf && member.role !== "OWNER";

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <Link href={`/profile/${member.user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-display text-xs font-semibold text-primary">
          {member.user.avatarUrl ? (
            <Image src={member.user.avatarUrl} alt="" width={36} height={36} unoptimized className="object-cover" />
          ) : (
            member.user.username.slice(0, 1).toUpperCase()
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{member.user.username}</p>
          <p className="text-xs text-muted">Level {member.user.level}</p>
        </div>
      </Link>

      {showOwnerActions && (
        <div className="flex items-center gap-1">
          {member.role === "MEMBER" ? (
            <form action={promoteToAdmin.bind(null, clanId, member.user.id)}>
              <button
                type="submit"
                aria-label="Promote to admin"
                title="Promote to admin"
                className="rounded-md border border-border p-1.5 text-muted transition hover:border-accent hover:text-accent"
              >
                <ChevronUp size={14} />
              </button>
            </form>
          ) : (
            <form action={demoteToMember.bind(null, clanId, member.user.id)}>
              <button
                type="submit"
                aria-label="Demote to member"
                title="Demote to member"
                className="rounded-md border border-border p-1.5 text-muted transition hover:border-warning hover:text-warning"
              >
                <ChevronDown size={14} />
              </button>
            </form>
          )}
          <form action={kickMember.bind(null, clanId, member.user.id)}>
            <button
              type="submit"
              aria-label="Kick from clan"
              title="Kick from clan"
              className="rounded-md border border-border p-1.5 text-muted transition hover:border-primary hover:text-primary"
            >
              <UserX size={14} />
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

function MemberGroup({
  clanId,
  label,
  icon: Icon,
  members,
  viewerIsOwner,
  viewerId,
}: {
  clanId: string;
  label: string;
  icon?: LucideIcon;
  members: ClanMemberData[];
  viewerIsOwner: boolean;
  viewerId: string;
}) {
  if (members.length === 0) return null;
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
        {Icon && <Icon size={13} />}
        {label}
      </p>
      <ul className="mt-2 flex flex-col gap-2">
        {members.map((member) => (
          <MemberRow key={member.id} clanId={clanId} member={member} viewerIsOwner={viewerIsOwner} viewerId={viewerId} />
        ))}
      </ul>
    </div>
  );
}

export function MemberList({
  clanId,
  members,
  viewerIsOwner,
  viewerId,
}: {
  clanId: string;
  members: ClanMemberData[];
  viewerIsOwner: boolean;
  viewerId: string;
}) {
  const owner = members.filter((m) => m.role === "OWNER");
  const admins = members.filter((m) => m.role === "ADMIN");
  const regular = members.filter((m) => m.role === "MEMBER");

  return (
    <div className="flex flex-col gap-4">
      <MemberGroup clanId={clanId} label="Owner" icon={Crown} members={owner} viewerIsOwner={viewerIsOwner} viewerId={viewerId} />
      <MemberGroup
        clanId={clanId}
        label={`Admins (${admins.length})`}
        icon={ShieldCheck}
        members={admins}
        viewerIsOwner={viewerIsOwner}
        viewerId={viewerId}
      />
      <MemberGroup
        clanId={clanId}
        label={`Members (${regular.length})`}
        members={regular}
        viewerIsOwner={viewerIsOwner}
        viewerId={viewerId}
      />
    </div>
  );
}
