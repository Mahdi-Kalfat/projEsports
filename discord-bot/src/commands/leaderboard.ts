import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { prisma } from "../prisma.js";

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Show the top Clutcher players by level");

const MEDALS = ["🥇", "🥈", "🥉"];
const TOP_N = 10;

export async function execute(interaction: ChatInputCommandInteraction) {
  const topUsers = await prisma.user.findMany({
    orderBy: [{ level: "desc" }, { xp: "desc" }],
    take: TOP_N,
    select: { username: true, level: true, xp: true, discordId: true },
  });

  if (topUsers.length === 0) {
    await interaction.reply("No ranked players yet.");
    return;
  }

  const lines = topUsers.map((u, i) => {
    const rank = MEDALS[i] ?? `#${i + 1}`;
    const isCaller = u.discordId === interaction.user.id;
    const name = isCaller ? `**${u.username}** (you)` : u.username;
    return `${rank}  ${name} — Level ${u.level} (${u.xp.toLocaleString()} XP)`;
  });

  const embed = new EmbedBuilder()
    .setColor(0xff1e3c)
    .setAuthor({ name: "Clutcher" })
    .setTitle("🏆 Leaderboard")
    .setDescription(lines.join("\n"));

  await interaction.reply({ embeds: [embed] });
}
