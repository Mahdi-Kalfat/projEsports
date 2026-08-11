"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Search, UserX } from "lucide-react";
import { formatLastSeen, isRecentlyOnline } from "@/lib/format";
import { removeFriend } from "@/app/(app)/friends/actions";

export type FriendRow = {
  id: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  lastLoginAt: Date | null;
};

function FriendCard({ friend }: { friend: FriendRow }) {
  const online = isRecentlyOnline(friend.lastLoginAt);
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-3 transition hover:border-primary/40">
      <Link href={`/profile/${friend.username}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-display text-sm font-semibold text-primary">
          {friend.avatarUrl ? (
            <Image src={friend.avatarUrl} alt="" width={40} height={40} unoptimized className="object-cover" />
          ) : (
            friend.username.slice(0, 1).toUpperCase()
          )}
          {online && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-raised bg-success" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{friend.username}</p>
          <p className="text-xs text-muted">{formatLastSeen(friend.lastLoginAt)}</p>
        </div>
      </Link>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
        {friend.level}
      </span>
      <Link href={`/messages/${friend.username}`} aria-label={`Message ${friend.username}`} className="text-muted transition hover:text-primary">
        <MessageCircle size={16} />
      </Link>
      <form action={removeFriend.bind(null, friend.id)}>
        <button
          type="submit"
          aria-label={`Remove ${friend.username}`}
          className="text-muted transition hover:text-primary"
        >
          <UserX size={16} />
        </button>
      </form>
    </li>
  );
}

function FriendGroup({ label, friends }: { label: string; friends: FriendRow[] }) {
  if (friends.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <ul className="mt-2 flex flex-col gap-2">
        {friends.map((friend) => (
          <FriendCard key={friend.id} friend={friend} />
        ))}
      </ul>
    </div>
  );
}

export function FriendsSearchList({ friends }: { friends: FriendRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => friends.filter((f) => f.username.toLowerCase().includes(query.trim().toLowerCase())),
    [friends, query],
  );

  const online = filtered.filter((f) => isRecentlyOnline(f.lastLoginAt));
  const offline = filtered.filter((f) => !isRecentlyOnline(f.lastLoginAt));

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search friends…"
          className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      {friends.length === 0 ? (
        <p className="text-sm text-muted">No friends yet — add one below.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">No friends match &ldquo;{query}&rdquo;.</p>
      ) : (
        <>
          <FriendGroup label={`Online (${online.length})`} friends={online} />
          <FriendGroup label={`Offline (${offline.length})`} friends={offline} />
        </>
      )}
    </div>
  );
}
