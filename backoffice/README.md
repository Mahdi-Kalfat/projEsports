# Back Office

Admin back office for Clutcher. Next.js 16 (App Router) +
TypeScript, Prisma/MongoDB, Auth.js (NextAuth v5) credentials login.

There is no self-service sign-up here — accounts are provisioned directly in the
database (via the seed script for the first `OWNER`, later via a Users admin module).

## Roles

- Base roles: `OWNER`, `ADMIN`, `MODERATOR`, `USER`
- Sub-roles: `TRUSTED`, `COMMENTOR` (community perks, not back-office access)
- Only `OWNER` / `ADMIN` / `MODERATOR` can sign in to the back office — a `USER`
  account gets a clear "no access" error even with correct credentials. See
  `src/lib/roles.ts`.

## Getting started

1. Copy the env file and adjust if needed:

   ```bash
   cp .env.example .env
   ```

2. Start local MongoDB (requires Docker Desktop running):

   ```bash
   docker compose up -d
   ```

   This brings up a single-node **replica set** — Prisma's MongoDB connector requires
   one even for local dev (it uses transactions). The container's healthcheck
   initiates the replica set automatically on first boot.

3. Install dependencies, push the schema, and seed data:

   ```bash
   npm install
   npm run db:push
   npm run seed
   ```

   The seed creates the bootstrap `OWNER` account (from `SEED_OWNER_EMAIL` /
   `SEED_OWNER_USERNAME` / `SEED_OWNER_PASSWORD` in `.env` — change the password
   before using this anywhere but your machine), the 3 games, ~220 demo users with
   randomized signup/login dates, ~30 tournaments, and ~140 transactions — real rows
   the dashboard's queries aggregate, not numbers hardcoded in the frontend.

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000/login](http://localhost:3000/login).

## Scripts

- `npm run dev` / `build` / `start` — Next.js app
- `npm run db:push` — sync the Prisma schema to MongoDB (no migration history —
  Mongo doesn't have one; this is the Mongo equivalent of `migrate dev`)
- `npm run db:studio` — Prisma Studio, browse the DB
- `npm run seed` — idempotent: creates the `OWNER` account and demo data if missing,
  skips what's already there

## Notes on this setup

- **Next.js 16** renamed `middleware.ts` to `proxy.ts` (same behavior, new name/export) —
  route protection lives in `src/proxy.ts`.
- **MongoDB requires the classic `prisma-client-js` generator, not Prisma 7.** Prisma 7
  made driver adapters mandatory, and no MongoDB driver adapter exists yet — a plain
  `new PrismaClient()` throws `PrismaClientConstructorValidationError` on Prisma 7's
  default generator. `prisma`/`@prisma/client` are pinned to `6.19.3`, the last line with
  full non-adapter Mongo support; `prisma.config.ts` still supplies `DATABASE_URL` to the
  CLI, but the schema also keeps `url = env("DATABASE_URL")` (Prisma 6 requires it —
  the "no url in schema" rule is Prisma 7-only).
- **`src/auth.config.ts` vs `src/auth.ts`**: the Credentials provider's `authorize()`
  needs Prisma, but `proxy.ts` (middleware) only needs to read the already-signed JWT
  session — no DB access. Importing the full `auth.ts` from `proxy.ts` would drag
  Prisma's native query-engine binary into the middleware bundle, so `proxy.ts` builds
  its own lightweight `auth()` from `auth.config.ts` (providers-less) instead.
- **Dashboard data is 100% live**: `src/lib/dashboard-data.ts` aggregates the KPIs and
  charts from real `User` / `Tournament` / `Transaction` documents — no mock/static
  data file. Numbers will look sparse until you run `npm run seed`.
- Design tokens (black/red/neon palette, Chakra Petch + Inter fonts) live in
  `src/app/globals.css` and `src/app/layout.tsx`, matching the project's design system doc.
