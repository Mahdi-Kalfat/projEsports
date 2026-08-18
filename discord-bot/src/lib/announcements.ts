import { EmbedBuilder, type Client, type AttachmentBuilder } from "discord.js";
import { prisma } from "../prisma.js";
import { fetchImageAttachment } from "./fetch-image.js";
import { formatCompactCurrency, formatCompactNumber, formatPriceByType } from "./format.js";

const BRAND_COLOR = 0xff1e3c;

// Statuses worth telling the server about. Tournaments get announced twice
// (once when registration opens, again when they go live); events and
// battle passes only once, when they become publicly visible/active.
const TOURNAMENT_STATUSES = ["REGISTRATION", "LIVE"];
const EVENT_STATUSES = ["SCHEDULED"];
const BATTLEPASS_STATUSES = ["ACTIVE"];

const EVENT_TYPE_LABELS: Record<string, string> = {
  COMMUNITY: "Community",
  NEWS: "News",
  MAINTENANCE: "Maintenance",
  GIVEAWAY: "Giveaway",
  ANNOUNCEMENT: "Announcement",
  PARTNERSHIP: "Partnership",
};

function resolveSiteUrl(siteUrl: string | undefined, path: string): string | undefined {
  if (!siteUrl || !path) return undefined;
  if (path.startsWith("http")) return path;
  return `${siteUrl.replace(/\/$/, "")}${path}`;
}

function dateLabel(date: Date): string {
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

async function buildTournamentMessage(
  t: { id: string; title: string; status: string; entryType: string; entryCost: number; prizePool: number; region: string | null; capacity: number | null; backgroundImageUrl: string | null; logoImageUrl: string | null; startAt: Date; game: { name: string } },
  siteUrl: string | undefined,
) {
  const [bannerAttachment, logoAttachment] = await Promise.all([
    fetchImageAttachment(resolveSiteUrl(siteUrl, t.backgroundImageUrl ?? ""), "banner"),
    fetchImageAttachment(resolveSiteUrl(siteUrl, t.logoImageUrl ?? ""), "logo"),
  ]);
  const files = [bannerAttachment, logoAttachment].filter((a): a is AttachmentBuilder => a !== null);

  const isLive = t.status === "LIVE";
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setAuthor({ name: "Clutcher" })
    .setTitle(isLive ? `🔴 LIVE NOW: ${t.title}` : `🆕 New Tournament: ${t.title}`)
    .addFields(
      { name: "🎮 Game", value: t.game.name, inline: true },
      { name: "🎟️ Entry", value: formatPriceByType(t.entryType, t.entryCost), inline: true },
      { name: "🏆 Prize Pool", value: formatCompactCurrency(t.prizePool), inline: true },
      ...(t.region ? [{ name: "🌍 Region", value: t.region, inline: true }] : []),
      ...(t.capacity ? [{ name: "👥 Capacity", value: `${t.capacity}`, inline: true }] : []),
    )
    .setFooter({ text: isLive ? "Starting now" : `Starts ${dateLabel(t.startAt)}` });

  if (logoAttachment) embed.setThumbnail(`attachment://${logoAttachment.name}`);
  if (bannerAttachment) embed.setImage(`attachment://${bannerAttachment.name}`);
  const url = resolveSiteUrl(siteUrl, `/tournaments/${t.id}`);
  if (url) embed.setURL(url);

  return { embed, files };
}

async function buildEventMessage(
  e: { id: string; title: string; type: string; location: string | null; backgroundImageUrl: string | null; logoImageUrl: string | null; startAt: Date; game: { name: string } | null },
  siteUrl: string | undefined,
) {
  const [bannerAttachment, logoAttachment] = await Promise.all([
    fetchImageAttachment(resolveSiteUrl(siteUrl, e.backgroundImageUrl ?? ""), "banner"),
    fetchImageAttachment(resolveSiteUrl(siteUrl, e.logoImageUrl ?? ""), "logo"),
  ]);
  const files = [bannerAttachment, logoAttachment].filter((a): a is AttachmentBuilder => a !== null);

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setAuthor({ name: "Clutcher" })
    .setTitle(`📅 New Event: ${e.title}`)
    .addFields(
      { name: "🎯 Type", value: EVENT_TYPE_LABELS[e.type] ?? e.type, inline: true },
      { name: "🎮 Game", value: e.game?.name ?? "All games", inline: true },
      ...(e.location ? [{ name: "📍 Location", value: e.location, inline: true }] : []),
    )
    .setFooter({ text: `Starts ${dateLabel(e.startAt)}` });

  if (logoAttachment) embed.setThumbnail(`attachment://${logoAttachment.name}`);
  if (bannerAttachment) embed.setImage(`attachment://${bannerAttachment.name}`);
  const url = resolveSiteUrl(siteUrl, `/events/${e.id}`);
  if (url) embed.setURL(url);

  return { embed, files };
}

// No image fields on BattlePass (unlike Tournament/Event), so this is
// text-only — no attachment fetching needed.
function buildBattlePassMessage(
  bp: { title: string; description: string | null; premiumPointsCost: number; startAt: Date; endAt: Date },
  siteUrl: string | undefined,
) {
  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setAuthor({ name: "Clutcher" })
    .setTitle(`🎫 New Battle Pass: ${bp.title}`)
    .addFields(
      { name: "💎 Premium", value: `${formatCompactNumber(bp.premiumPointsCost)} pts`, inline: true },
      { name: "🗓️ Ends", value: dateLabel(bp.endAt), inline: true },
    )
    .setFooter({ text: `Live now — started ${dateLabel(bp.startAt)}` });

  if (bp.description) embed.setDescription(bp.description);

  const url = resolveSiteUrl(siteUrl, "/battle-pass");
  if (url) embed.setURL(url);

  return { embed, files: [] as AttachmentBuilder[] };
}

// Polls for tournaments/events/battle passes in an announce-worthy status
// that haven't been posted yet. No webhook/event-bus exists between
// backoffice (where admins change status) and this always-running bot
// process, so polling the shared database on an interval is the simplest
// reliable way to notice a change — see index.ts for the interval setup.
export async function pollAnnouncements(client: Client): Promise<void> {
  const channelId = process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID;
  if (!channelId) return;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased() || !channel.isSendable()) {
    console.error("DISCORD_ANNOUNCEMENTS_CHANNEL_ID does not point at a channel the bot can send messages in.");
    return;
  }

  // First time this feature has ever run (the bookkeeping table is empty):
  // silently mark every currently-qualifying tournament/event as announced
  // instead of posting, so turning this on doesn't blast out everything
  // that already existed beforehand.
  const isBootstrap = (await prisma.announcement.count()) === 0;

  const announced = await prisma.announcement.findMany({ select: { kind: true, refId: true, status: true } });
  const announcedSet = new Set(announced.map((a) => `${a.kind}:${a.refId}:${a.status}`));
  const toMark: { kind: string; refId: string; status: string }[] = [];

  const siteUrl = process.env.SITE_URL;
  const roleId = process.env.DISCORD_ANNOUNCEMENTS_ROLE_ID;
  const mention = roleId ? `<@&${roleId}>` : undefined;

  const tournaments = await prisma.tournament.findMany({
    where: { status: { in: TOURNAMENT_STATUSES } },
    include: { game: true },
  });
  for (const t of tournaments) {
    if (announcedSet.has(`tournament:${t.id}:${t.status}`)) continue;
    if (!isBootstrap) {
      const { embed, files } = await buildTournamentMessage(t, siteUrl);
      await channel.send({ content: mention, embeds: [embed], files });
    }
    toMark.push({ kind: "tournament", refId: t.id, status: t.status });
  }

  const events = await prisma.event.findMany({
    where: { status: { in: EVENT_STATUSES } },
    include: { game: true },
  });
  for (const e of events) {
    if (announcedSet.has(`event:${e.id}:${e.status}`)) continue;
    if (!isBootstrap) {
      const { embed, files } = await buildEventMessage(e, siteUrl);
      await channel.send({ content: mention, embeds: [embed], files });
    }
    toMark.push({ kind: "event", refId: e.id, status: e.status });
  }

  const battlePasses = await prisma.battlePass.findMany({ where: { status: { in: BATTLEPASS_STATUSES } } });
  for (const bp of battlePasses) {
    if (announcedSet.has(`battlepass:${bp.id}:${bp.status}`)) continue;
    if (!isBootstrap) {
      const { embed, files } = buildBattlePassMessage(bp, siteUrl);
      await channel.send({ content: mention, embeds: [embed], files });
    }
    toMark.push({ kind: "battlepass", refId: bp.id, status: bp.status });
  }

  // No skipDuplicates — MongoDB's Prisma connector doesn't support it on
  // createMany, but polls only ever run one at a time (each setInterval
  // tick awaits the previous run's completion), so toMark can't contain
  // anything already in announcedSet by construction.
  if (toMark.length > 0) {
    await prisma.announcement.createMany({ data: toMark });
  }
}
