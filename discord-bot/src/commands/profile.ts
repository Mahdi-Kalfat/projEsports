import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction, MessageFlags, type AttachmentBuilder } from "discord.js";
import { prisma } from "../prisma.js";
import { getRequiredXp } from "../lib/level-xp.js";
import { getRank } from "../lib/rank.js";
import { getProfileThemeColor } from "../lib/profile-theme.js";
import { fetchImageAttachment } from "../lib/fetch-image.js";

export const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("Show your linked Clutcher profile");

// avatarUrl/bannerImageUrl are stored as relative paths (e.g.
// "/uploads/avatars/x.png") — resolve against SITE_URL into something
// fetchable.
function resolveSiteUrl(siteUrl: string | undefined, path: string): string | undefined {
  if (!siteUrl) return undefined;
  if (path.startsWith("http")) return path;
  return `${siteUrl.replace(/\/$/, "")}${path}`;
}

function progressBar(current: number, total: number, length = 14): string {
  if (total <= 0) return "▰".repeat(length);
  const filled = Math.round((Math.min(Math.max(current, 0), total) / total) * length);
  return "▰".repeat(filled) + "▱".repeat(Math.max(length - filled, 0));
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const user = await prisma.user.findFirst({ where: { discordId: interaction.user.id } });
  if (!user) {
    await interaction.reply({
      content: "Your Discord account isn't linked yet. Run `/link` with the code from your Clutcher profile page first.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Fetching the avatar/banner as attachments is slower than Discord's
  // 3-second initial-response window, so acknowledge first.
  await interaction.deferReply();

  const [levelXpRules, rankOverrides] = await Promise.all([prisma.levelXpRule.findMany(), prisma.rankTier.findMany()]);
  const requiredXp = getRequiredXp(user.level, levelXpRules);
  const rank = getRank(user.level, rankOverrides);

  const siteUrl = process.env.SITE_URL;
  const [avatarAttachment, bannerAttachment] = await Promise.all([
    fetchImageAttachment(user.avatarUrl ? resolveSiteUrl(siteUrl, user.avatarUrl) : undefined, "avatar"),
    fetchImageAttachment(user.bannerImageUrl ? resolveSiteUrl(siteUrl, user.bannerImageUrl) : undefined, "banner"),
  ]);
  const files = [avatarAttachment, bannerAttachment].filter((a): a is AttachmentBuilder => a !== null);

  const thumbnailUrl = avatarAttachment
    ? `attachment://${avatarAttachment.name}`
    : interaction.user.displayAvatarURL({ size: 256 });
  const profileUrl = siteUrl ? `${siteUrl.replace(/\/$/, "")}/profile/${user.username}` : undefined;
  const memberSince = user.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" });

  const embed = new EmbedBuilder()
    .setColor(getProfileThemeColor(user.profileTheme))
    .setAuthor({ name: "Clutcher" })
    .setTitle(user.username)
    .setThumbnail(thumbnailUrl)
    .addFields(
      { name: "🏆 Rank", value: rank.name, inline: true },
      { name: "⭐ Level", value: `${user.level}`, inline: true },
      { name: "📅 Member Since", value: memberSince, inline: true },
      // Discord packs inline field rows tightly with no gap — a blank,
      // full-width field between groups is the standard trick to force
      // breathing room between them.
      { name: "​", value: "​", inline: false },
      { name: "💰 Points", value: user.points.toLocaleString(), inline: true },
      { name: "🪙 CC Coins", value: user.ccCoins.toLocaleString(), inline: true },
      { name: "​", value: "​", inline: false },
      { name: "✨ XP", value: `${progressBar(user.xp, requiredXp)}  ${user.xp}/${requiredXp}`, inline: false },
    );

  if (bannerAttachment) embed.setImage(`attachment://${bannerAttachment.name}`);
  if (profileUrl) embed.setURL(profileUrl);

  await interaction.editReply({ embeds: [embed], files });
}
