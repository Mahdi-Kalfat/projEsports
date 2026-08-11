import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { countPendingReceived } from "@/lib/friends";
import { countUnreadMessages } from "@/lib/messages";
import { Navbar } from "@/components/nav/navbar";
import { Footer } from "@/components/nav/footer";
import { AmbientBackground } from "@/components/ui/ambient-background";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Points/level/avatar change from user actions (joining a paid tournament, editing
  // a profile picture) — fetched live here rather than trusted from the JWT, same
  // "query it live" approach the back office uses for anything that isn't static.
  const [user, pendingFriendRequests, unreadMessages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, level: true, avatarUrl: true },
    }),
    countPendingReceived(session.user.id),
    countUnreadMessages(session.user.id),
  ]);
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AmbientBackground />
      <Navbar
        username={user.username}
        level={user.level}
        avatarUrl={user.avatarUrl}
        pendingFriendRequests={pendingFriendRequests}
        initialUnreadMessages={unreadMessages}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 lg:px-6">{children}</main>
      <Footer />
    </div>
  );
}
