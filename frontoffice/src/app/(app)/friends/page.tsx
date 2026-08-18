import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFriends } from "@/lib/friends";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { FriendsSearchList } from "@/components/friends/friends-search-list";
import { IncomingRequests, OutgoingRequests } from "@/components/friends/pending-requests";
import { AddFriendForm } from "@/components/friends/add-friend-form";

export const metadata: Metadata = {
  title: "Friends — Clutcher",
};

export default async function FriendsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = session.user.id;

  const [me, friends, incoming, outgoing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { friendCode: true } }),
    getFriends(userId),
    prisma.friendRequest.findMany({
      where: { receiverId: userId, status: "PENDING" },
      include: { sender: { select: { username: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendRequest.findMany({
      where: { senderId: userId, status: "PENDING" },
      include: { receiver: { select: { username: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Connect"
        title="My"
        accentWord="Friends"
        subtitle="See who's online, manage invites, and add players by their friend code."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <IncomingRequests
            requests={incoming.map((r) => ({
              requestId: r.id,
              username: r.sender.username,
              avatarUrl: r.sender.avatarUrl,
            }))}
          />

          <Reveal>
            <div className="rounded-2xl border border-border bg-surface-raised p-5">
              <FriendsSearchList friends={friends} />
            </div>
          </Reveal>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <Reveal delay={0.05}>
            <AddFriendForm ownCode={me?.friendCode ?? null} />
          </Reveal>

          <OutgoingRequests
            requests={outgoing.map((r) => ({
              requestId: r.id,
              username: r.receiver.username,
              avatarUrl: r.receiver.avatarUrl,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
