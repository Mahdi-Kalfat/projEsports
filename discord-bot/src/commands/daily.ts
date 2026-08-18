import { SlashCommandBuilder, type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { prisma } from "../prisma.js";
import { utcDayDiff } from "../lib/daily-cycle.js";

export const data = new SlashCommandBuilder()
  .setName("daily")
  .setDescription("Claim your Clutcher daily reward, if you haven't already today");

// Exact mirror of frontoffice/src/app/(app)/rewards/actions.ts's
// claimDailyReward — same eligibility rules, same streak-reset behavior,
// same transaction. Only grants the item into inventory; a player still
// has to "Use" it from the site to get whatever it actually grants.
export async function execute(interaction: ChatInputCommandInteraction) {
  // Defer before any DB work — several sequential queries below can add up
  // to more than Discord's 3-second reply window (especially right after a
  // restart, before the connection pool has warmed up), and a reply that
  // arrives late fails with "Unknown interaction" instead of just being slow.
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const user = await prisma.user.findFirst({ where: { discordId: interaction.user.id }, select: { id: true } });
  if (!user) {
    await interaction.editReply({
      content: "Your Discord account isn't linked yet. Run `/link` with the code from your Clutcher profile page first.",
    });
    return;
  }

  const [progress, days] = await Promise.all([
    prisma.userDailyReward.findUnique({ where: { userId: user.id } }),
    prisma.dailyRewardDay.findMany({ orderBy: { day: "asc" }, include: { item: true } }),
  ]);

  if (days.length === 0) {
    await interaction.editReply({ content: "Daily rewards aren't set up yet." });
    return;
  }

  const now = new Date();
  let currentDay = progress?.currentDay ?? 1;

  if (progress?.lastClaimedAt) {
    const diff = utcDayDiff(progress.lastClaimedAt, now);
    if (diff < 1) {
      await interaction.editReply({ content: "You've already claimed your daily reward today — come back tomorrow." });
      return;
    }
    // More than one day since the last claim means at least one day was
    // missed — the streak resets to Day 1.
    if (diff > 1) currentDay = 1;
  }

  const maxDay = days[days.length - 1].day;
  // The ladder may have shrunk (admin deleted trailing days) since this
  // player's last claim — fall back to the start rather than erroring.
  if (currentDay > maxDay) currentDay = 1;

  const today = days.find((d) => d.day === currentDay);
  if (!today || !today.itemId) {
    await interaction.editReply({
      content: `Day ${currentDay}'s reward isn't configured yet — check back once an admin sets it up.`,
    });
    return;
  }

  const nextDay = currentDay >= maxDay ? 1 : currentDay + 1;

  await prisma.$transaction([
    prisma.userDailyReward.upsert({
      where: { userId: user.id },
      create: { userId: user.id, currentDay: nextDay, lastClaimedAt: now },
      update: { currentDay: nextDay, lastClaimedAt: now },
    }),
    prisma.userItem.upsert({
      where: { userId_itemId: { userId: user.id, itemId: today.itemId } },
      create: { userId: user.id, itemId: today.itemId, quantity: 1 },
      update: { quantity: { increment: 1 } },
    }),
  ]);

  await interaction.editReply({
    content: `🎁 Day ${currentDay} claimed — you got **${today.item?.name ?? "a reward"}**! Check your inventory on Clutcher to use it.`,
  });
}
