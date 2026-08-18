import type { ReactNode } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { countPendingReceived } from "@/lib/friends";
import { countUnreadMessages } from "@/lib/messages";
import { getNavItemConfigs } from "@/lib/nav-items";
import { Navbar } from "@/components/nav/navbar";
import { Footer } from "@/components/nav/footer";
import { AmbientBackground } from "@/components/ui/ambient-background";

// Pages under (app)/ are a mix of guest-browsable (home, tournaments, shop,
// marketplace, battle-pass, rewards) and account-only (profile, inventory,
// friends, messages, clans, contact, marketplace/new, marketplace/mine) —
// so this layout no longer gates on auth itself. Each account-only page
// does its own `if (!session?.user) redirect("/login")` instead. What this
// layout still does for everyone is resolve the Navbar into either its
// authenticated form (cc/level/username dropdown) or its guest form (Sign
// in/Join now) — see Navbar's `user: NavbarUser | null` prop.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const userId = session?.user?.id;

  // Points/level/avatar change from user actions (joining a paid tournament, editing
  // a profile picture) — fetched live here rather than trusted from the JWT, same
  // "query it live" approach the back office uses for anything that isn't static.
  const [userRow, pendingFriendRequests, unreadMessages, rankOverrides, navConfigs] = await Promise.all([
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { username: true, level: true, avatarUrl: true, ccCoins: true },
        })
      : null,
    userId ? countPendingReceived(userId) : 0,
    userId ? countUnreadMessages(userId) : 0,
    prisma.rankTier.findMany(),
    getNavItemConfigs(),
  ]);

  // A session can outlive the user it points at (JWT sessions aren't
  // invalidated when the row is deleted) — fall back to guest rendering
  // rather than crashing on a stale session.
  const navbarUser = userRow
    ? {
        username: userRow.username,
        level: userRow.level,
        avatarUrl: userRow.avatarUrl,
        ccCoins: userRow.ccCoins,
        pendingFriendRequests,
        initialUnreadMessages: unreadMessages,
      }
    : null;

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AmbientBackground />
      <Navbar user={navbarUser} rankOverrides={rankOverrides} navConfigs={navConfigs} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 lg:px-6">{children}</main>
      <Footer />
    </div>
  );
}
