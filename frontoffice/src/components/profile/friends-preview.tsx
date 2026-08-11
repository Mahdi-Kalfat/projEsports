import Image from "next/image";
import Link from "next/link";
import { Users } from "lucide-react";
import { formatLastSeen, isRecentlyOnline } from "@/lib/format";
import { getRank } from "@/lib/rank";

export type FriendPreviewData = {
  id: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  lastLoginAt: Date | null;
};

export function FriendsPreview({
  friends,
  total,
  viewAllHref,
}: {
  friends: FriendPreviewData[];
  total: number;
  viewAllHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-raised p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-primary" />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
            Friends {total}
          </h3>
        </div>
        {viewAllHref && total > 0 && (
          <Link href={viewAllHref} className="text-xs font-medium text-accent transition hover:text-foreground">
            View all
          </Link>
        )}
      </div>

      {friends.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No friends yet.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1">
          {friends.map((friend) => {
            const online = isRecentlyOnline(friend.lastLoginAt);
            const rank = getRank(friend.level);
            const isChampion = rank.name === "Champion";
            return (
              <li key={friend.id}>
                <Link
                  href={`/profile/${friend.username}`}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition hover:bg-surface"
                >
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-display text-xs font-semibold text-primary">
                    {friend.avatarUrl ? (
                      <Image src={friend.avatarUrl} alt="" width={32} height={32} unoptimized className="object-cover" />
                    ) : (
                      friend.username.slice(0, 1).toUpperCase()
                    )}
                    {online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-raised bg-success" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{friend.username}</p>
                    <p className="text-xs text-muted">{formatLastSeen(friend.lastLoginAt)}</p>
                  </div>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      isChampion ? "bg-primary/20 text-primary" : "bg-accent/15 text-accent"
                    }`}
                  >
                    {friend.level}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
