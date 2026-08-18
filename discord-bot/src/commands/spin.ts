import { SlashCommandBuilder, type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { prisma } from "../prisma.js";
import { utcDayDiff } from "../lib/daily-cycle.js";
import { pickWeightedSlotIndex, SPIN_COSTS, MAX_SPINS_PER_DAY } from "../lib/lucky-wheel.js";

export const data = new SlashCommandBuilder()
  .setName("spin")
  .setDescription("Spin the Clutcher Lucky Wheel, if you have a spin left today");

// Exact mirror of frontoffice/src/app/(app)/rewards/actions.ts's spinWheel
// — same cost curve (1st spin free, each further spin costs more cc), same
// weighted-random pick, same transaction. Only grants the won item into
// inventory; a player still has to "Use" it from the site to get whatever
// it actually grants.
export async function execute(interaction: ChatInputCommandInteraction) {
  // Defer before any DB work — several sequential queries below can add up
  // to more than Discord's 3-second reply window (especially right after a
  // restart, before the connection pool has warmed up), and a reply that
  // arrives late fails with "Unknown interaction" instead of just being slow.
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const user = await prisma.user.findFirst({
    where: { discordId: interaction.user.id },
    select: { id: true, ccCoins: true },
  });
  if (!user) {
    await interaction.editReply({
      content: "Your Discord account isn't linked yet. Run `/link` with the code from your Clutcher profile page first.",
    });
    return;
  }

  const [spin, slots] = await Promise.all([
    prisma.userWheelSpin.findUnique({ where: { userId: user.id } }),
    prisma.luckyWheelSlot.findMany({ orderBy: { createdAt: "asc" }, include: { item: true } }),
  ]);

  const now = new Date();
  // spinsToday only means anything for the UTC day it was recorded on —
  // once `now` has rolled into a later day, today's count is implicitly
  // back to 0 without needing a write.
  const isNewDay = !spin || utcDayDiff(spin.lastSpinAt, now) >= 1;
  const spinsUsedToday = isNewDay ? 0 : spin!.spinsToday;

  if (spinsUsedToday >= MAX_SPINS_PER_DAY) {
    await interaction.editReply({ content: "You've used all your spins for today — come back tomorrow." });
    return;
  }

  const cost = SPIN_COSTS[spinsUsedToday];
  if (cost > 0 && user.ccCoins < cost) {
    await interaction.editReply({ content: `Not enough cc — this spin costs ${cost} cc and you have ${user.ccCoins} cc.` });
    return;
  }

  const index = pickWeightedSlotIndex(slots, Math.random());
  if (index === null) {
    await interaction.editReply({ content: "The wheel isn't set up yet." });
    return;
  }
  const won = slots[index];

  await prisma.$transaction([
    prisma.userWheelSpin.upsert({
      where: { userId: user.id },
      create: { userId: user.id, lastSpinAt: now, spinsToday: 1 },
      update: { lastSpinAt: now, spinsToday: spinsUsedToday + 1 },
    }),
    prisma.userItem.upsert({
      where: { userId_itemId: { userId: user.id, itemId: won.itemId } },
      create: { userId: user.id, itemId: won.itemId, quantity: 1 },
      update: { quantity: { increment: 1 } },
    }),
    ...(cost > 0 ? [prisma.user.update({ where: { id: user.id }, data: { ccCoins: { decrement: cost } } })] : []),
  ]);

  const costLabel = cost > 0 ? ` (cost ${cost} cc)` : " (free spin)";
  await interaction.editReply({
    content: `🎡 You won **${won.item.name}**${costLabel}! Check your inventory on Clutcher to use it.`,
  });
}
