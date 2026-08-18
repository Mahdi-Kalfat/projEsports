import { randomInt } from "crypto";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export const DISCORD_LINK_CODE_TTL_MINUTES = 10;

// Digits only, not friend-code's letter alphabet — this gets typed into a
// Discord slash command (often from a phone), so an OTP-style numeric code
// is the fastest to enter. 6 digits is 1,000,000 combinations per 10-minute
// window, plenty for a single-use code redeemed through the bot.
function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += randomInt(0, 10).toString();
  return code;
}

// One active code per user (upsert on userId, which is @unique on
// DiscordLinkCode) — requesting a new code invalidates whatever code was
// issued before it. Collisions on the code itself are checked and retried
// like createUniqueFriendCode, since two users briefly sharing a code would
// let one redeem the other's link.
export async function createDiscordLinkCode(userId: string) {
  const expiresAt = new Date(Date.now() + DISCORD_LINK_CODE_TTL_MINUTES * 60_000);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      return await prisma.discordLinkCode.upsert({
        where: { userId },
        update: { code, expiresAt },
        create: { userId, code, expiresAt },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
      throw err;
    }
  }
  throw new Error("Could not generate a unique code.");
}
