"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { getRank } from "@/lib/rank";

export type UserListItem = {
  id: string;
  username: string;
  email: string;
  role: string;
  level: number;
  points: number;
  banned: boolean;
  blocked: boolean;
  marketBlocked: boolean;
  shopBlocked: boolean;
  joinedLabel: string;
  lastLoginLabel: string;
};

function StatusBadges({
  banned,
  blocked,
  marketBlocked,
  shopBlocked,
}: {
  banned: boolean;
  blocked: boolean;
  marketBlocked: boolean;
  shopBlocked: boolean;
}) {
  if (!banned && !blocked && !marketBlocked && !shopBlocked) {
    return <span className="text-xs font-medium text-success">Active</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {banned && (
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
          Banned
        </span>
      )}
      {blocked && (
        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
          Blocked
        </span>
      )}
      {marketBlocked && (
        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
          Market blocked
        </span>
      )}
      {shopBlocked && (
        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
          Shop blocked
        </span>
      )}
    </div>
  );
}

export function UserRow({ user, href }: { user: UserListItem; href: string }) {
  const router = useRouter();
  const rank = getRank(user.level);

  return (
    <tr
      onClick={() => router.push(href)}
      className="cursor-pointer border-b border-border/60 transition last:border-0 hover:bg-surface/60"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center">
            <Image
              src={rank.image}
              alt={rank.name}
              width={32}
              height={32}
              unoptimized
              className="object-contain"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{user.username}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-muted">{user.role}</td>
      <td className="px-4 py-3 text-foreground">{user.level}</td>
      <td className="px-4 py-3 text-foreground">{user.points.toLocaleString("en-US")}</td>
      <td className="px-4 py-3">
        <StatusBadges
          banned={user.banned}
          blocked={user.blocked}
          marketBlocked={user.marketBlocked}
          shopBlocked={user.shopBlocked}
        />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-muted">{user.joinedLabel}</td>
      <td className="px-4 py-3 whitespace-nowrap text-muted">{user.lastLoginLabel}</td>
    </tr>
  );
}
