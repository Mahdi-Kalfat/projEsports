import "dotenv/config";
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
} from "discord.js";
import * as linkCommand from "./commands/link.js";
import * as profileCommand from "./commands/profile.js";
import * as leaderboardCommand from "./commands/leaderboard.js";
import * as trackActivityCommand from "./commands/trackactivity.js";
import * as helpCommand from "./commands/help.js";
import * as dailyCommand from "./commands/daily.js";
import * as spinCommand from "./commands/spin.js";
import { pollAnnouncements } from "./lib/announcements.js";
import { handlePresenceUpdate, reconcilePresences } from "./lib/activity-tracking.js";

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("DISCORD_TOKEN must be set (see .env.example).");

// A single failed API call anywhere (a Discord request, a DB query) becomes
// an unhandled rejection/exception if some code path doesn't catch it — by
// default Node exits the whole process for that, taking every user's
// tracking/commands down with it over one bad interaction. Log and keep
// running instead; every command handler and background loop already has
// its own try/catch, so this is only a backstop for what slips through.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

interface BotCommand {
  data: { name: string };
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

const commands = new Collection<string, BotCommand>();
for (const command of [
  linkCommand,
  profileCommand,
  leaderboardCommand,
  trackActivityCommand,
  helpCommand,
  dailyCommand,
  spinCommand,
]) {
  commands.set(command.data.name, command);
}

const ANNOUNCEMENT_POLL_INTERVAL_MS = 60_000;

// GuildPresences and GuildMembers are PRIVILEGED intents — they only work
// once you've turned on "Presence Intent" and "Server Members Intent" for
// this application in the Discord Developer Portal (Bot tab -> Privileged
// Gateway Intents). Without that, login below fails outright (see the
// friendly error message on client.login). They're needed for
// /trackactivity: GuildPresences is what lets the bot see "member X is
// playing game Y" at all, and GuildMembers is what keeps a resolvable
// member/presence cache so PresenceUpdate events actually fire.
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);

  reconcilePresences(readyClient).catch((err) => console.error("Presence reconciliation failed:", err));

  if (process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID) {
    const runPoll = () => pollAnnouncements(readyClient).catch((err) => console.error("Announcement poll failed:", err));
    runPoll();
    setInterval(runPoll, ANNOUNCEMENT_POLL_INTERVAL_MS);
  }
});

client.on(Events.PresenceUpdate, (oldPresence, newPresence) => {
  handlePresenceUpdate(oldPresence ?? null, newPresence ?? null).catch((err) =>
    console.error("Presence tracking failed:", err),
  );
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error running /${interaction.commandName}:`, error);
    const payload: InteractionReplyOptions = {
      content: "Something went wrong running that command.",
      flags: MessageFlags.Ephemeral,
    };
    // Best-effort: if the interaction already expired (e.g. the command
    // itself failed because it blew past Discord's 3-second window), this
    // reply attempt fails too — swallow that instead of letting a second
    // failure become an unhandled rejection that takes the whole process
    // down with it.
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    } catch (reportError) {
      console.error(`Could not report the error for /${interaction.commandName} back to Discord:`, reportError);
    }
  }
});

client.login(token).catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("disallowed intents") || message.includes("Used disallowed intents")) {
    console.error(
      "Login failed: disallowed intents. Go to https://discord.com/developers/applications -> your application -> " +
        "Bot -> Privileged Gateway Intents, and turn ON both 'Presence Intent' and 'Server Members Intent' " +
        "(required for /trackactivity), then restart the bot.",
    );
    process.exit(1);
  }
  throw err;
});
