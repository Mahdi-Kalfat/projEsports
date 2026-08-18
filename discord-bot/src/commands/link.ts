import { SlashCommandBuilder, InteractionContextType, type ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Prisma } from "../generated/prisma/index.js";
import { prisma } from "../prisma.js";

export const data = new SlashCommandBuilder()
  .setName("link")
  .setDescription("Link your Discord account to your Clutcher account")
  .addStringOption((option) =>
    option.setName("code").setDescription("The code shown on your profile page").setRequired(true),
  )
  // Assigning a role only makes sense inside the server, so don't offer this
  // command in DMs or group DMs.
  .setContexts(InteractionContextType.Guild);

export async function execute(interaction: ChatInputCommandInteraction) {
  // Defer before any DB/Discord API work — this command can chain up to
  // four sequential DB calls plus a role-assignment API call before it has
  // anything to say, easily enough to blow past Discord's 3-second reply
  // window (a late reply fails outright with "Unknown interaction" rather
  // than just being slow).
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  if (!interaction.inCachedGuild()) {
    await interaction.editReply({ content: "Run this command in the server, not in a DM." });
    return;
  }

  const code = interaction.options.getString("code", true).trim();

  const linkCode = await prisma.discordLinkCode.findUnique({ where: { code } });
  if (!linkCode || linkCode.expiresAt < new Date()) {
    await interaction.editReply({
      content: "That code is invalid or has expired. Generate a new one from your profile page and try again.",
    });
    return;
  }

  const existingLink = await prisma.user.findFirst({ where: { discordId: interaction.user.id } });
  if (existingLink && existingLink.id !== linkCode.userId) {
    await interaction.editReply({
      content:
        "This Discord account is already linked to a different Clutcher account. Disconnect it from that account's profile page first.",
    });
    return;
  }

  try {
    await prisma.user.update({
      where: { id: linkCode.userId },
      data: {
        discordId: interaction.user.id,
        discordUsername: interaction.user.username,
        discordGlobalName: interaction.user.globalName ?? interaction.user.username,
        discordAvatarUrl: interaction.user.displayAvatarURL({ extension: "png", size: 128 }),
        discordLinkedAt: new Date(),
      },
    });
  } catch (err) {
    // P2025 means the code's user account no longer exists.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      await interaction.editReply({ content: "Couldn't link that account — please generate a fresh code and try again." });
      return;
    }
    throw err;
  }

  // Best-effort cleanup — the code is single-use in spirit (the account is
  // already linked at this point), so a failure to delete it isn't worth
  // surfacing to the user.
  await prisma.discordLinkCode.delete({ where: { code } }).catch(() => {});

  let content = "Your Discord account is now linked to your Clutcher account.";

  const verifiedRoleId = process.env.DISCORD_VERIFIED_ROLE_ID;
  if (verifiedRoleId) {
    try {
      await interaction.member.roles.add(verifiedRoleId);
      content += " You've been given the Verified member role.";
    } catch (err) {
      // Most common cause: the bot's own role sits below "Verified member" in
      // the server's role list, or it's missing Manage Roles — Discord
      // requires a role to be assignable, not just a permission bit.
      console.error("Could not assign the verified role:", err);
      content += " I couldn't assign the Verified member role automatically — let a staff member know.";
    }
  }

  await interaction.editReply({ content });
}
