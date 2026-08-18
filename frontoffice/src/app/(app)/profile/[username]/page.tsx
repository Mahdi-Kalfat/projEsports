import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Trophy, CalendarDays, MessageSquareText } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getFriendshipStatus, getFriends, type FriendshipStatus } from "@/lib/friends";
import { getInventory, canViewInventory } from "@/lib/inventory";
import { ProfileHeader } from "@/components/profile/profile-header";
import { FriendAction } from "@/components/profile/friend-action";
import { FriendsPreview } from "@/components/profile/friends-preview";
import { InventoryPreview } from "@/components/profile/inventory-preview";
import { EditProfileButton } from "@/components/profile/edit-profile-button";
import { DiscordLinkCard } from "@/components/profile/discord-link-card";
import { GameActivityCard } from "@/components/profile/game-activity-card";
import { ClanWidget } from "@/components/profile/clan-widget";
import { HistoryList, type HistoryEntry } from "@/components/profile/history-list";
import { BadgesShowcase } from "@/components/profile/badges-showcase";
import { ProfileWall } from "@/components/profile/profile-wall";
import { CreatePostForm } from "@/components/posts/create-post-form";
import { PostCard } from "@/components/posts/post-card";
import type { PostData } from "@/components/posts/types";
import { Reveal } from "@/components/ui/reveal";
import { syncUserBadges, getBadgeBoard } from "@/lib/award-badges";
import { getRequiredXp } from "@/lib/level-xp";
import { formatElapsedSince } from "@/lib/format";

export async function generateMetadata(props: PageProps<"/profile/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  return { title: `${username} — Clutcher` };
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { dateStyle: "medium" });
}

const AUTHOR_SELECT = { id: true, username: true, avatarUrl: true } as const;

export default async function ProfilePage(props: PageProps<"/profile/[username]">) {
  const { username } = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  const viewerId = session.user.id;

  // participations/eventAttendances are fetched without a nested include on
  // tournament/event: both are required relations in the schema, but Mongo
  // has no real FK enforcement, so a row can still end up pointing at a
  // tournament/event that's since been deleted outside the app's own cascade
  // — Prisma throws instead of returning null for a missing required
  // relation. Fetching the targets separately and joining in JS (dropping
  // anything that no longer resolves) keeps this page rendering regardless.
  const profile = await prisma.user.findUnique({
    where: { username },
    include: {
      participations: { orderBy: { joinedAt: "desc" }, take: 10 },
      eventAttendances: { orderBy: { joinedAt: "desc" }, take: 10 },
    },
  });

  if (!profile) notFound();

  const isSelf = profile.id === viewerId;
  const canViewInv = canViewInventory(isSelf, profile.inventoryPublic);

  // Only sync on your own visit — account-age tiers have no dedicated trigger
  // event, so this is what catches a birthday or a newly-added catalog tier.
  // Must resolve before getBadgeBoard reads so a freshly-earned badge shows
  // as earned in the same render, not one visit later.
  if (isSelf) await syncUserBadges(profile.id);

  const [friendshipStatus, friends, inventoryItems, clanMembership, rawPosts, badges, viewerRepostRows, wallComments, levelXpRules, rankOverrides, tournaments, events, gameActivity] =
    await Promise.all([
      isSelf ? Promise.resolve<FriendshipStatus>({ kind: "SELF" }) : getFriendshipStatus(viewerId, profile.id),
      getFriends(profile.id),
      canViewInv ? getInventory(profile.id) : Promise.resolve([]),
      prisma.clanMembership.findUnique({ where: { userId: profile.id }, include: { clan: true } }),
      prisma.post.findMany({
        where: { authorId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          author: { select: AUTHOR_SELECT },
          likes: { select: { userId: true } },
          comments: {
            orderBy: { createdAt: "asc" },
            take: 50,
            include: { author: { select: AUTHOR_SELECT } },
          },
          repostOf: {
            include: {
              author: { select: AUTHOR_SELECT },
              _count: { select: { reposts: true } },
            },
          },
          _count: { select: { reposts: true } },
        },
      }),
      getBadgeBoard(profile.id),
      // What has the viewer already reposted? Used below to mark each post's
      // repost button as active — keyed by the flattened target id, same as
      // toggleRepost uses when creating/removing a repost.
      prisma.post.findMany({ where: { authorId: viewerId, repostOfId: { not: null } }, select: { repostOfId: true } }),
      prisma.profileComment.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: "asc" },
        take: 100,
        include: { author: { select: AUTHOR_SELECT } },
      }),
      prisma.levelXpRule.findMany({ select: { tier: true, xpPerLevel: true } }),
      prisma.rankTier.findMany(),
      prisma.tournament.findMany({
        where: { id: { in: profile.participations.map((p) => p.tournamentId) } },
        include: { game: true },
      }),
      prisma.event.findMany({
        where: { id: { in: profile.eventAttendances.map((a) => a.eventId) } },
        include: { game: true },
      }),
      prisma.gameActivity.findMany({
        where: { userId: profile.id },
        orderBy: { totalSeconds: "desc" },
        take: 5,
        select: { gameName: true, totalSeconds: true },
      }),
    ]);

  const viewerRepostedIds = new Set(viewerRepostRows.map((r) => r.repostOfId));
  const requiredXp = getRequiredXp(profile.level, levelXpRules);
  const currentGameElapsedLabel = profile.currentGameStartedAt
    ? formatElapsedSince(profile.currentGameStartedAt)
    : null;

  const posts: PostData[] = rawPosts.map((post) => {
    const targetId = post.repostOfId ?? post.id;
    const repostCount = post.repostOfId ? (post.repostOf?._count.reposts ?? 0) : post._count.reposts;
    return {
      id: post.id,
      body: post.body,
      mediaType: post.mediaType,
      mediaUrl: post.mediaUrl,
      createdAt: post.createdAt,
      author: post.author,
      likeCount: post.likes.length,
      likedByViewer: post.likes.some((like) => like.userId === viewerId),
      views: post.views,
      comments: post.comments,
      repostOfId: post.repostOfId,
      repostOf: post.repostOf,
      repostCount,
      repostedByViewer: viewerRepostedIds.has(targetId),
    };
  });

  const tournamentsById = new Map(tournaments.map((t) => [t.id, t]));
  const eventsById = new Map(events.map((e) => [e.id, e]));

  const tournamentEntries: HistoryEntry[] = profile.participations
    .map((p) => {
      const tournament = tournamentsById.get(p.tournamentId);
      if (!tournament) return null;
      return {
        id: p.id,
        title: tournament.title,
        subtitle: tournament.game.name,
        dateLabel: formatDate(tournament.startAt),
        href: `/tournaments/${tournament.id}`,
      };
    })
    .filter((entry): entry is HistoryEntry => entry !== null);

  const eventEntries: HistoryEntry[] = profile.eventAttendances
    .map((a) => {
      const event = eventsById.get(a.eventId);
      if (!event) return null;
      return {
        id: a.id,
        title: event.title,
        subtitle: event.game?.name ?? "All games",
        dateLabel: formatDate(event.startAt),
        href: `/events/${event.id}`,
      };
    })
    .filter((entry): entry is HistoryEntry => entry !== null);

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <ProfileHeader
          profile={{
            username: profile.username,
            fullName: profile.fullName,
            bio: profile.bio,
            avatarUrl: profile.avatarUrl,
            bannerImageUrl: profile.bannerImageUrl,
            profileTheme: profile.profileTheme,
            level: profile.level,
            points: profile.points,
            ccCoins: profile.ccCoins,
            xp: profile.xp,
            requiredXp,
            createdAt: profile.createdAt,
            lastLoginAt: profile.lastLoginAt,
          }}
          rankOverrides={rankOverrides}
          action={
            isSelf ? (
              <EditProfileButton
                defaultFullName={profile.fullName ?? ""}
                defaultPhone={profile.phone ?? ""}
                defaultBio={profile.bio ?? ""}
                defaultTheme={profile.profileTheme}
                defaultInventoryPublic={profile.inventoryPublic}
              />
            ) : (
              <FriendAction status={friendshipStatus} targetUserId={profile.id} targetUsername={profile.username} />
            )
          }
        />
      </Reveal>

      {isSelf && (
        <Reveal delay={0.05}>
          <div className="rounded-2xl border border-border bg-surface-raised p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Your friend code</p>
            <p className="mt-1 font-display text-lg font-bold tracking-wider text-accent">
              {profile.friendCode ?? "—"}
            </p>
            <p className="mt-1 text-xs text-muted">Share this so other players can add you.</p>
          </div>
        </Reveal>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {isSelf && (
            <Reveal delay={0.1}>
              <CreatePostForm username={profile.username} />
            </Reveal>
          )}

          {posts.length === 0 ? (
            <Reveal delay={0.1}>
              <div className="flex min-h-[20vh] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised p-8 text-center text-sm text-muted">
                <MessageSquareText size={24} className="text-muted/50" />
                {isSelf ? "You haven't posted anything yet." : `${profile.username} hasn't posted anything yet.`}
              </div>
            </Reveal>
          ) : (
            posts.map((post, i) => (
              <Reveal key={post.id} delay={Math.min(0.1 + i * 0.03, 0.3)}>
                <PostCard post={post} username={profile.username} viewerId={viewerId} />
              </Reveal>
            ))
          )}
        </div>

        <div className="flex flex-col gap-6 lg:col-span-1">
          <Reveal delay={0.1}>
            <ClanWidget
              clan={
                clanMembership
                  ? {
                      id: clanMembership.clan.id,
                      name: clanMembership.clan.name,
                      tag: clanMembership.clan.tag,
                      logoUrl: clanMembership.clan.logoUrl,
                      role: clanMembership.role,
                    }
                  : null
              }
              isSelf={isSelf}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <DiscordLinkCard
              isSelf={isSelf}
              discordUsername={profile.discordUsername}
              discordGlobalName={profile.discordGlobalName}
              discordAvatarUrl={profile.discordAvatarUrl}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <GameActivityCard
              isSelf={isSelf}
              currentGame={profile.currentGame}
              currentGameElapsedLabel={currentGameElapsedLabel}
              games={gameActivity}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <FriendsPreview
              friends={friends.slice(0, 8)}
              total={friends.length}
              viewAllHref={isSelf ? "/friends" : undefined}
              rankOverrides={rankOverrides}
            />
          </Reveal>

          <Reveal delay={0.1}>
            <InventoryPreview
              items={canViewInv ? inventoryItems.slice(0, 8) : []}
              total={canViewInv ? inventoryItems.length : 0}
              viewAllHref={`/inventory/${profile.username}`}
              canView={canViewInv}
            />
          </Reveal>

          <BadgesShowcase badges={badges} isSelf={isSelf} />

          {isSelf && (
            <>
              <HistoryList
                title="Tournaments joined"
                icon={Trophy}
                entries={tournamentEntries}
                emptyLabel="You haven't joined any tournaments yet."
              />
              <HistoryList
                title="Events attending"
                icon={CalendarDays}
                entries={eventEntries}
                emptyLabel="You haven't RSVP'd to any events yet."
              />
            </>
          )}
        </div>
      </div>

      <ProfileWall
        profileId={profile.id}
        username={profile.username}
        comments={wallComments}
        viewerId={viewerId}
      />
    </div>
  );
}
