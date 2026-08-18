import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { auth } from "@/auth";
import { getConversations } from "@/lib/messages";
import { isRecentlyOnline } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Messages — Clutcher",
};

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const viewerId = session.user.id;
  const conversations = await getConversations(viewerId);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Direct"
        title="My"
        accentWord="Messages"
        subtitle="Chat with your friends — pick up right where you left off."
      />

      {conversations.length === 0 ? (
        <Reveal>
          <div className="flex min-h-[20vh] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised p-8 text-center text-sm text-muted">
            <MessageCircle size={24} className="text-muted/50" />
            No conversations yet.
            <Link href="/friends" className="text-accent hover:text-foreground">
              Message a friend from their profile to start one.
            </Link>
          </div>
        </Reveal>
      ) : (
        <Reveal delay={0.05}>
          <ul className="flex flex-col gap-2">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.friend.username}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised p-3 transition hover:border-primary/40"
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-display text-sm font-semibold text-primary">
                    {c.friend.avatarUrl ? (
                      <Image src={c.friend.avatarUrl} alt="" width={40} height={40} unoptimized className="object-cover" />
                    ) : (
                      c.friend.username.slice(0, 1).toUpperCase()
                    )}
                    {isRecentlyOnline(c.friend.lastLoginAt) && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-raised bg-success" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{c.friend.username}</p>
                    <p className="truncate text-xs text-muted">
                      {c.lastMessage ? `${c.lastMessage.senderId === viewerId ? "You: " : ""}${c.lastMessage.body}` : "Say hi…"}
                    </p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </div>
  );
}
