import "dotenv/config";
import { REST, Routes } from "discord.js";
import * as linkCommand from "./commands/link.js";
import * as profileCommand from "./commands/profile.js";
import * as leaderboardCommand from "./commands/leaderboard.js";
import * as trackActivityCommand from "./commands/trackactivity.js";
import * as helpCommand from "./commands/help.js";
import * as dailyCommand from "./commands/daily.js";
import * as spinCommand from "./commands/spin.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  throw new Error("DISCORD_TOKEN and DISCORD_CLIENT_ID must be set (see .env.example).");
}

const commands = [
  linkCommand.data.toJSON(),
  profileCommand.data.toJSON(),
  leaderboardCommand.data.toJSON(),
  trackActivityCommand.data.toJSON(),
  helpCommand.data.toJSON(),
  dailyCommand.data.toJSON(),
  spinCommand.data.toJSON(),
];
const rest = new REST().setToken(token);

// Guild-scoped registration (instant) when DISCORD_GUILD_ID is set — use
// this while developing. Leave it unset to register globally instead, which
// Discord can take up to an hour to propagate to every server.
const route = guildId ? Routes.applicationGuildCommands(clientId, guildId) : Routes.applicationCommands(clientId);

await rest.put(route, { body: commands });
console.log(`Registered ${commands.length} command(s)${guildId ? ` to guild ${guildId}` : " globally"}.`);
