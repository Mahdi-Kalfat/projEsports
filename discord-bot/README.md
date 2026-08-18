# discord-bot

A small Discord bot that joins the server and links a member's Discord
account to their Clutcher account, via a one-time code generated from the
"Discord" card on their profile page (front office) and redeemed with the
bot's `/link` command.

It talks directly to the same MongoDB database as `frontoffice`/`backoffice`
(no HTTP API in between) — a successful `/link` shows up on the website
immediately, and disconnecting from the website takes effect immediately too.

## How linking works

1. On their Clutcher profile page, the user clicks **Connect Discord**. This
   generates a 6-digit code, valid for 10 minutes, stored in the
   `discord_link_codes` collection.
2. In the Discord server, the user runs `/link 123456`.
3. The bot looks up the code, and if it's valid and unexpired, sets
   `discordId` / `discordUsername` / `discordGlobalName` / `discordLinkedAt`
   on that user's account and deletes the code.
4. If `DISCORD_VERIFIED_ROLE_ID` is set, the bot also gives the member that
   role right away.

## /help

Posts an ephemeral embed (only the caller sees it) describing the project
and every command below, with a slightly longer explanation than each
command's own one-line Discord description. The command list is a curated
array in `src/commands/help.ts`, not derived automatically — update it
alongside this README when a command's behavior changes.

## /profile

Once linked, a member can run `/profile` to post an embed of their Clutcher
account — rank, level, an XP progress bar, points, CC coins, and member-since
date — with their site avatar and banner. Avatar/banner are fetched by the
bot itself and re-uploaded as attachments rather than linked by URL, so they
render correctly even when `SITE_URL` points at `localhost` (Discord's own
servers can't reach that, but the bot process on the same machine can).

## /leaderboard

Posts the top 10 players ranked by level (XP as tiebreaker) as an embed,
publicly in the channel. Highlights the caller's own row if their Discord is
linked.

## /trackactivity

Opt-in game tracking — watching what someone plays is more invasive than the
rest of what this bot does, so it's off by default and only ever turns on
when a linked member explicitly runs this command themselves (running it
again turns it back off). Once on, the bot watches that member's Discord
presence for a "Playing X" activity and accumulates total time per game in
the `game_activities` collection, shown on their Clutcher profile alongside
a live "Playing X — 42m" indicator while a tracked session is in progress.

Requires the `GuildPresences` and `GuildMembers` privileged intents (see
setup step 2 below) — without them the bot can't see anyone's activity at
all, tracked or not. A bot restart doesn't lose an in-progress session: on
ready, it reconciles against each guild's current presence cache before
resuming normal event-driven tracking.

## /daily and /spin

Exact mirrors of frontoffice's own claim/spin server actions
(`src/app/(app)/rewards/actions.ts`) — same eligibility rules, same streak
and cost logic, operating on the same collections, so a claim/spin made here
and one made on the site share one state. `/daily` enforces one claim per
UTC calendar day (missing a day resets the streak to Day 1); `/spin` enforces
up to 4 spins per UTC day, the first free and each further one costing more
cc, picked with the same weighted-random logic as the site's wheel. Both
only grant the won item into inventory — using it to actually get the
XP/points/cc it describes still happens on the site.

## Tournament, event & battle pass announcements

If `DISCORD_ANNOUNCEMENTS_CHANNEL_ID` is set, the bot checks every 60
seconds for tournaments that just entered `REGISTRATION` or `LIVE`, events
that just became `SCHEDULED`, and battle passes that just went `ACTIVE`, and
posts an embed for each one it hasn't posted before (tracked in its own
`bot_announcements` collection — not part of frontoffice/backoffice's
schema). There's no webhook or event bus between backoffice, where admins
change status, and this always-running bot process, so polling the shared
database is the simplest reliable way to notice a change.

Turning this on for the first time does **not** retroactively announce
everything already in `REGISTRATION`/`LIVE`/`SCHEDULED`/`ACTIVE` — the first
poll silently marks whatever already qualifies as "already announced" so you
don't get a spam-blast of old tournaments, and only genuinely new status
changes after that get posted.

Set `DISCORD_ANNOUNCEMENTS_ROLE_ID` too if you want each announcement to
@mention a role (e.g. one members opt into for tournament alerts).

## One-time setup (Discord Developer Portal)

1. Go to https://discord.com/developers/applications -> **New Application**.
2. **Bot** tab -> **Reset Token** -> copy it into `DISCORD_TOKEN` below. Then
   scroll to **Privileged Gateway Intents** and turn ON both **Presence
   Intent** and **Server Members Intent** — required for `/trackactivity`
   (this bot never reads message content, so that third toggle stays off).
   Login fails outright if these aren't on; the bot prints a reminder
   pointing back here if that happens.
3. **OAuth2 -> General** -> copy **Application ID** into `DISCORD_CLIENT_ID`.
4. **OAuth2 -> URL Generator**:
   - Scopes: `bot` and `applications.commands`.
   - Bot permissions: `Send Messages`, `Use Application Commands`, and
     `Manage Roles` (only needed if you're using `DISCORD_VERIFIED_ROLE_ID`).
   - Open the generated URL, pick your server, and authorize — this is what
     makes the bot join your server.
5. If you're assigning a role, go to **Server Settings -> Roles** and drag
   the bot's own role **above** the role it needs to assign (e.g. "Verified
   member"). Discord only lets a bot grant roles below its own highest role
   — this is the #1 reason role assignment silently fails even with Manage
   Roles granted.

## Running it

```bash
cd discord-bot
cp .env.example .env   # fill in DATABASE_URL, DISCORD_TOKEN, DISCORD_CLIENT_ID, ...
npm install
npm run db:generate       # generates the Prisma client
npm run register-commands # registers /link (set DISCORD_GUILD_ID first for instant, server-scoped registration)
npm run dev                # or: npm run build && npm start
```

Re-run `npm run register-commands` any time `src/commands/link.ts`'s command
definition changes (new options, description, etc.) — the bot process itself
only needs a restart for behavior changes.

The bot needs to stay running as a long-lived process (it holds a
persistent connection to Discord) — run it under something like `pm2`,
`systemd`, or a container in production, the same way you'd run any other
always-on Node service.

## Notes

- `prisma/schema.prisma` here only declares the collections this bot
  touches, not the full app schema. `users`, `discord_link_codes`,
  `level_xp_rules`, `rank_tiers`, `games`, `tournaments`, `events`,
  `game_activities`, `items`, `daily_reward_days`, `user_daily_rewards`,
  `lucky_wheel_slots`, `user_wheel_spins`, `user_items`, and `battle_passes`
  are all owned by frontoffice/backoffice — if you rename or remove fields this bot reads or
  writes on any of those models, update this schema **and** the mirrored
  logic in `commands/daily.ts`/`commands/spin.ts` to match frontoffice's
  `rewards/actions.ts`. `bot_announcements` is the one collection this bot
  owns outright.
- Role assignment is best-effort: if it fails (missing permission, role
  hierarchy, role deleted), the account still gets linked — the user just
  sees a note that the role couldn't be assigned automatically, and the
  error is logged server-side.
