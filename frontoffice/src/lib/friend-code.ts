import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

// Unambiguous uppercase alphanumeric alphabet — no 0/O or 1/I, so a code read
// aloud or hand-typed doesn't get misread.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}

export function generateFriendCode(): string {
  return `${randomSegment(4)}-${randomSegment(4)}`;
}

// Collisions are astronomically unlikely (33^8 possible codes) but checked and
// retried anyway rather than trusted blindly, since a signup is the one place a
// silent collision would actually corrupt data (two users sharing a code).
export async function createUniqueFriendCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateFriendCode();
    const existing = await prisma.user.findUnique({ where: { friendCode: code }, select: { id: true } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique friend code.");
}
