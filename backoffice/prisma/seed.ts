import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { Role, TournamentStatus, EntryType } from "../src/generated/prisma";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(randomInt(0, 23), randomInt(0, 59), 0, 0);
  return d;
}

function pick<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function randomItem<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

// Fisher-Yates shuffle, then slice — used to pick a random, non-repeating
// subset of users as a tournament's participants.
function sample<T>(items: T[], count: number): T[] {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

const FIRST_NAMES = [
  "Ahmed",
  "Yassine",
  "Mehdi",
  "Sami",
  "Karim",
  "Wassim",
  "Nour",
  "Amine",
  "Rania",
  "Salma",
  "Lina",
  "Aziz",
  "Firas",
  "Omar",
  "Ines",
];
const LAST_NAMES = [
  "Ben Ali",
  "Trabelsi",
  "Gharbi",
  "Jebali",
  "Bouazizi",
  "Sassi",
  "Cherif",
  "Mansour",
  "Khemiri",
  "Ayari",
];

function randomFullName() {
  return `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
}

function randomTunisianPhone() {
  const prefix = randomItem(["2", "4", "5", "9"]);
  const rest = Array.from({ length: 7 }, () => randomInt(0, 9)).join("");
  return `+216 ${prefix}${rest.slice(0, 1)} ${rest.slice(1, 4)} ${rest.slice(4, 7)}`;
}

// Same shape as frontoffice's src/lib/friend-code.ts. `friendCode` is
// `@unique` in the schema, and MongoDB's unique index rejects more than one
// document with a missing value — so every seeded user needs one, not just
// ones created through registration.
const FRIEND_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomFriendCode() {
  const segment = () =>
    Array.from({ length: 4 }, () => randomItem(FRIEND_CODE_ALPHABET.split(""))).join("");
  return `${segment()}-${segment()}`;
}
function uniqueFriendCodes(count: number): string[] {
  const codes = new Set<string>();
  while (codes.size < count) codes.add(randomFriendCode());
  return Array.from(codes);
}

async function seedOwner() {
  const email = process.env.SEED_OWNER_EMAIL;
  const username = process.env.SEED_OWNER_USERNAME;
  const password = process.env.SEED_OWNER_PASSWORD;

  if (!email || !username || !password) {
    throw new Error(
      "Set SEED_OWNER_EMAIL, SEED_OWNER_USERNAME and SEED_OWNER_PASSWORD before running the seed.",
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Owner ${email} already exists — skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const owner = await prisma.user.create({
    data: { email: email.toLowerCase(), username, passwordHash, role: Role.OWNER },
  });
  console.log(`Created OWNER account: ${owner.email} (${owner.username})`);
}

async function seedGames() {
  const games = [
    { slug: "valorant", name: "Valorant" },
    { slug: "rocket-league", name: "Rocket League" },
    { slug: "cs2", name: "CS2" },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      update: {},
      create: game,
    });
  }
  console.log(`Seeded ${games.length} games.`);
  return prisma.game.findMany();
}

async function seedDemoUsers() {
  const existingCount = await prisma.user.count({ where: { role: Role.USER } });
  if (existingCount >= 20) {
    console.log(`${existingCount} demo users already exist — skipping.`);
    return prisma.user.findMany({ where: { role: Role.USER }, select: { id: true } });
  }

  const sharedPasswordHash = await bcrypt.hash("Demo123!", 10);
  const total = 220;
  const friendCodes = uniqueFriendCodes(total);
  const users = Array.from({ length: total }, (_, i) => {
    const createdAt = daysAgo(randomInt(0, 29));
    // Roughly half of users logged in recently, so DAU/MAU has a real signal.
    const loginRoll = Math.random();
    const lastLoginAt =
      loginRoll < 0.35
        ? daysAgo(0)
        : loginRoll < 0.65
          ? daysAgo(randomInt(1, 29))
          : null;

    return {
      username: `player${i + 1}`,
      email: `player${i + 1}@demo.local`,
      fullName: randomFullName(),
      phone: randomTunisianPhone(),
      passwordHash: sharedPasswordHash,
      friendCode: friendCodes[i],
      role: pick([Role.USER, Role.MODERATOR, Role.ADMIN], [94, 5, 1]),
      banned: pick([false, true], [97, 3]),
      blocked: pick([false, true], [95, 5]),
      points: randomInt(0, 12000),
      level: randomInt(1, 45),
      createdAt,
      lastLoginAt,
    };
  });

  await prisma.user.createMany({ data: users });
  console.log(`Seeded ${users.length} demo users.`);
  return prisma.user.findMany({ where: { role: Role.USER }, select: { id: true } });
}

async function seedTournaments(games: { id: string }[], demoUsers: { id: string }[]) {
  const existingCount = await prisma.tournament.count();
  if (existingCount > 0) {
    console.log(`${existingCount} tournaments already exist — skipping.`);
    return;
  }

  const statuses = [
    TournamentStatus.COMPLETED,
    TournamentStatus.COMPLETED,
    TournamentStatus.COMPLETED,
    TournamentStatus.ARCHIVED,
    TournamentStatus.ARCHIVED,
    TournamentStatus.LIVE,
    TournamentStatus.LIVE,
    TournamentStatus.CHECK_IN,
    TournamentStatus.REGISTRATION,
    TournamentStatus.REGISTRATION,
    TournamentStatus.DRAFT,
  ];

  const tournaments = statuses.flatMap((status, i) =>
    games.map((game, gi) => ({
      title: `Weekly Cup #${i + 1}`,
      gameId: game.id,
      status,
      entryType: pick([EntryType.FREE, EntryType.POINTS, EntryType.MONEY], [60, 30, 10]),
      entryCost: randomInt(0, 50),
      // Skew target registrations by game index so the "top games" chart has
      // a real, non-uniform distribution — not because gi means anything else.
      targetParticipants: randomInt(10, 60) + (games.length - gi) * randomInt(5, 25),
      startAt: status === TournamentStatus.DRAFT ? daysAgo(-7) : daysAgo(randomInt(0, 20)),
    })),
  );

  // (title, gameId) is a unique combination across this seed's 33 tournaments
  // (11 distinct titles x 3 distinct games) — used below to look back up each
  // freshly-created tournament's intended participant count.
  const targetParticipantsByKey = new Map(
    tournaments.map((t) => [`${t.title}|${t.gameId}`, t.targetParticipants]),
  );

  await prisma.tournament.createMany({
    data: tournaments.map(({ targetParticipants, ...t }) => t),
  });
  console.log(`Seeded ${tournaments.length} tournaments.`);

  // registeredCount isn't a stored field — participant counts come from real
  // TournamentParticipant rows (see dashboard-data.ts's _count.participants),
  // so give each tournament an actual, randomly-picked set of participants.
  const createdTournaments = await prisma.tournament.findMany({
    select: { id: true, title: true, gameId: true },
  });
  const participants = createdTournaments.flatMap((t) => {
    const count = targetParticipantsByKey.get(`${t.title}|${t.gameId}`) ?? randomInt(10, 60);
    return sample(demoUsers, count).map((u) => ({
      tournamentId: t.id,
      userId: u.id,
      joinedAt: daysAgo(randomInt(0, 20)),
    }));
  });

  await prisma.tournamentParticipant.createMany({ data: participants });
  console.log(`Seeded ${participants.length} tournament participants.`);
}

async function seedTransactions() {
  const existingCount = await prisma.transaction.count();
  if (existingCount > 0) {
    console.log(`${existingCount} transactions already exist — skipping.`);
    return;
  }

  const transactions = Array.from({ length: 140 }, () => ({
    amount: randomInt(5, 150),
    createdAt: daysAgo(randomInt(0, 59)),
  }));

  await prisma.transaction.createMany({ data: transactions });
  console.log(`Seeded ${transactions.length} transactions.`);
}

async function main() {
  await seedOwner();
  const games = await seedGames();
  const demoUsers = await seedDemoUsers();
  await seedTournaments(games, demoUsers);
  await seedTransactions();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
