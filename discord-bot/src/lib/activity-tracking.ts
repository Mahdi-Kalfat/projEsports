import { ActivityType, type Client, type Presence } from "discord.js";
import { prisma } from "../prisma.js";

// Ignore sessions shorter than this — status blips (a presence update fires
// on ANY change, not just activity changes) shouldn't get recorded as a
// "session".
const MIN_SESSION_SECONDS = 5;

function getPlayingGameName(presence: Presence | null | undefined): string | null {
  if (!presence) return null;
  return presence.activities.find((a) => a.type === ActivityType.Playing)?.name ?? null;
}

// Folds the elapsed time of an in-progress session into that (user, game)
// pair's running total. Called both when a tracked user's game changes (the
// old session just ended) and when /trackactivity turns tracking off
// mid-session.
async function flushSession(userId: string, gameName: string, startedAt: Date, endedAt: Date): Promise<void> {
  const elapsedSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
  if (elapsedSeconds < MIN_SESSION_SECONDS) return;

  await prisma.gameActivity.upsert({
    where: { userId_gameName: { userId, gameName } },
    update: { totalSeconds: { increment: elapsedSeconds }, lastPlayedAt: endedAt },
    create: { userId, gameName, totalSeconds: elapsedSeconds, lastPlayedAt: endedAt },
  });
}

// The single place that reacts to "this tracked Discord user's current game
// is now X (or nothing)" — used both by the live PresenceUpdate listener and
// by the ready-time reconciliation pass, so a bot restart mid-session
// doesn't just silently lose that session's progress.
async function syncGame(user: { id: string; currentGame: string | null; currentGameStartedAt: Date | null }, newGame: string | null): Promise<void> {
  if (newGame === user.currentGame) return; // nothing changed

  const now = new Date();
  if (user.currentGame) {
    await flushSession(user.id, user.currentGame, user.currentGameStartedAt ?? now, now);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: newGame ? { currentGame: newGame, currentGameStartedAt: now } : { currentGame: null, currentGameStartedAt: null },
  });
}

export async function handlePresenceUpdate(oldPresence: Presence | null, newPresence: Presence | null): Promise<void> {
  const discordId = newPresence?.userId ?? oldPresence?.userId;
  if (!discordId) return;

  // Not linked, or hasn't opted in — don't even look at what they're
  // playing any further than this one lookup.
  const user = await prisma.user.findFirst({
    where: { discordId, activityTrackingEnabled: true },
    select: { id: true, currentGame: true, currentGameStartedAt: true },
  });
  if (!user) return;

  await syncGame(user, getPlayingGameName(newPresence));
}

// Presence updates only fire on a *change* — a bot that just restarted gets
// no event for "this member was already playing something" until the next
// actual change, which could be a long time. Called once on ready to catch
// tracked members already mid-session, using each guild's initial presence
// cache (populated by the GuildPresences intent).
export async function reconcilePresences(client: Client): Promise<void> {
  const trackedUsers = await prisma.user.findMany({
    where: { activityTrackingEnabled: true, discordId: { not: null } },
    select: { id: true, discordId: true, currentGame: true, currentGameStartedAt: true },
  });
  if (trackedUsers.length === 0) return;

  const byDiscordId = new Map(trackedUsers.map((u) => [u.discordId as string, u]));

  for (const guild of client.guilds.cache.values()) {
    // The gateway's initial GUILD_CREATE payload doesn't reliably include
    // every member's presence for a fresh connection — an explicit member
    // fetch with withPresences:true forces Discord to actually send them,
    // rather than relying on whatever happened to already be cached.
    const members = await guild.members.fetch({ withPresences: true }).catch(() => null);
    const presences = members ? members.map((m) => m.presence).filter((p) => p !== null) : guild.presences.cache.values();

    for (const presence of presences) {
      const user = byDiscordId.get(presence.userId);
      if (!user) continue;
      await syncGame(user, getPlayingGameName(presence));
    }
  }
}
