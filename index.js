import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import "colors";
import cors from "cors";
import express from "express";
import requestIp from "request-ip";
import { config } from "dotenv";
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import registerRoutes from "./handler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [GatewayIntentBits.GuildMembers, GatewayIntentBits.Guilds],
  partials: [Partials.User, Partials.GuildMember],
});

const app = express();

app.use(requestIp.mw());
app.use(cors({ origin: "*", methods: ["GET"] }));

config();
registerRoutes(app);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("[📡 EXPRESS SERVER]".bgMagenta, `Online: Port ${PORT}`.magenta);

  client.login(process.env?.bot_token).then(() => {
    console.log("[🤖 DISCORD BOT]".bgCyan, `Connected: ${client.user?.tag}`.cyan);
  }).catch(console.error);
});

process.on("unhandledRejection", (r) => {
  console.error(r);
});
process.on("uncaughtException", (e) => {
  console.error(e);
});
process.on("uncaughtExceptionMonitor", (e) => {
  console.error(e);
});

export { client };