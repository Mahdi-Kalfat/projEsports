import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFriendshipStatus } from "@/lib/friends";
import { findConversation, getMessages } from "@/lib/messages";
import { MessageThread } from "@/components/messages/message-thread";

export async function generateMetadata(props: PageProps<"/messages/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  return { title: `${username} — Messages` };
}

export default async function MessageThreadPage(props: PageProps<"/messages/[username]">) {
  const { username } = await props.params;
  const session = await auth();
  const viewerId = session!.user.id;

  const friend = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, avatarUrl: true, lastLoginAt: true },
  });
  if (!friend) notFound();

  if (friend.id === viewerId) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center text-center text-sm text-muted">
        You can&apos;t message yourself.
      </div>
    );
  }

  const [friendshipStatus, conversation] = await Promise.all([
    getFriendshipStatus(viewerId, friend.id),
    findConversation(viewerId, friend.id),
  ]);

  const canSend = friendshipStatus.kind === "FRIENDS";

  if (!conversation && !canSend) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 text-center text-sm text-muted">
        <p>You can only message friends.</p>
        <Link href={`/profile/${friend.username}`} className="text-accent hover:text-foreground">
          Visit {friend.username}&apos;s profile to add them.
        </Link>
      </div>
    );
  }

  const messages = conversation ? await getMessages(conversation.id, viewerId) : [];

  return (
    <div className="flex flex-col gap-4">
      <Link href="/messages" className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground">
        <ArrowLeft size={14} /> All conversations
      </Link>
      <MessageThread
        conversationId={conversation?.id ?? null}
        friend={friend}
        viewerId={viewerId}
        initialMessages={messages ?? []}
        canSend={canSend}
      />
    </div>
  );
}
