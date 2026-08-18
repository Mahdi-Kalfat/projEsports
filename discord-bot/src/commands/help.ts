import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction, MessageFlags } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show what this bot does and the list of commands");

// Kept as a curated list (not derived from each command's own
// .setDescription()) so the explanations here can be a bit richer than the
// one-liner Discord shows in its native command picker — update both when a
// command's behavior changes.
const COMMANDS: { usage: string; description: string }[] = [
  {
    usage: "/link <code>",
    description:
      "Link your Discord account to your Clutcher account. Get the code from the \"Discord\" card on your Clutcher profile page — it's valid for 10 minutes. If a Verified role is configured, you'll get it automatically.",
  },
  {
    usage: "/profile",
    description:
      "Post your linked Clutcher profile as an embed — rank, level, an XP progress bar, points, CC coins, and member-since date — with your site avatar and banner.",
  },
  {
    usage: "/leaderboard",
    description: "Show the top 10 Clutcher players ranked by level (XP as tiebreaker).",
  },
  {
    usage: "/trackactivity",
    description:
      "Opt in to tracking what games you play on Discord and for how long, shown on your Clutcher profile. Off by default and fully opt-in — run it again any time to turn it back off.",
  },
  {
    usage: "/daily",
    description:
      "Claim your Clutcher daily reward, same ladder and streak rules as the site — one claim per day, and missing a day resets your streak to Day 1.",
  },
  {
    usage: "/spin",
    description:
      "Spin the Clutcher Lucky Wheel — first spin each day is free, further spins cost cc. Whatever you win goes straight to your inventory on the site.",
  },
  {
    usage: "/help",
    description: "Show this message.",
  },
];

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0xff1e3c)
    .setAuthor({ name: "Clutcher" })
    .setTitle("🎮 Clutcher Bot")
    .setDescription(
      "Clutcher is an esports platform — tournaments, events, clans, a shop, and player profiles with ranks and levels. " +
        "This bot links your Discord account to your Clutcher account and brings a few of the site's features into the server.",
    )
    .addFields(COMMANDS.map((c) => ({ name: c.usage, value: c.description, inline: false })))
    .setFooter({ text: "Start with /link — most other commands need a linked account first." });

  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}
