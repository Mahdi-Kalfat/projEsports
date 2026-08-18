import { SlashCommandBuilder, type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { prisma } from "../prisma.js";

export const data = new SlashCommandBuilder()
  .setName("trackactivity")
  .setDescription("Toggle tracking what games you play on Discord, shown on your Clutcher profile");

export async function execute(interaction: ChatInputCommandInteraction) {
  // Defer before any DB work — up to three sequential calls below can add
  // up to more than Discord's 3-second reply window.
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const user = await prisma.user.findFirst({
    where: { discordId: interaction.user.id },
    select: { id: true, activityTrackingEnabled: true, currentGame: true, currentGameStartedAt: true },
  });
  if (!user) {
    await interaction.editReply({
      content: "Your Discord account isn't linked yet. Run `/link` with the code from your Clutcher profile page first.",
    });
    return;
  }

  const enabling = !user.activityTrackingEnabled;

  // Turning off mid-session: fold the in-progress session's elapsed time
  // into its running total rather than just discarding it, same as a
  // natural game-change would.
  if (!enabling && user.currentGame) {
    const elapsedSeconds = Math.floor((Date.now() - (user.currentGameStartedAt ?? new Date()).getTime()) / 1000);
    if (elapsedSeconds >= 5) {
      await prisma.gameActivity.upsert({
        where: { userId_gameName: { userId: user.id, gameName: user.currentGame } },
        update: { totalSeconds: { increment: elapsedSeconds }, lastPlayedAt: new Date() },
        create: { userId: user.id, gameName: user.currentGame, totalSeconds: elapsedSeconds, lastPlayedAt: new Date() },
      });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      activityTrackingEnabled: enabling,
      ...(enabling ? {} : { currentGame: null, currentGameStartedAt: null }),
    },
  });

  await interaction.editReply({
    content: enabling
      ? "✅ Activity tracking enabled — what you play on Discord (and for how long) will now show up on your Clutcher profile. Run `/trackactivity` again any time to turn it off."
      : "🛑 Activity tracking disabled. Time already recorded stays on your profile, but nothing new gets tracked from here.",
  });
}
