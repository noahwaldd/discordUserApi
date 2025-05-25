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
import { REST, Routes, SlashCommandBuilder, Events } from "discord.js";
import { registerSlashCommands, handleSlashCommands } from "./commands/botCommands.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [GatewayIntentBits.GuildMembers, GatewayIntentBits.Guilds],
  partials: [Partials.User, Partials.GuildMember],
});

const app = express();

const allowedOrigins = [
  'http://localhost:3000', 
  'http://127.0.0.1:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permite requisições sem 'origin' (como apps mobile ou Postman) OU se a origem está na lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Acesso não permitido por CORS'));
    }
  },
  methods: ["GET"] // Mantém apenas os métodos que você realmente usa (GET neste caso)
};

app.use(requestIp.mw());
// Aplica o CORS com as opções restritas
app.use(cors(corsOptions)); 

config();
registerRoutes(app);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("[📡 EXPRESS SERVER]".bgMagenta, `Online: Port ${PORT}`.magenta);

  client.login(process.env?.bot_token).then(() => {
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

client.once('ready', async () => {
  console.log("[🤖 DISCORD BOT]".bgCyan, `Connected: ${client.user?.tag}`.cyan);

  // Definir status e atividade padrão do bot
  client.user.setPresence({
    status: 'dnd', // 'online', 'idle', 'dnd', 'invisible'
    activities: [{
      name: 'API v10', // Texto da atividade
      type: 3, // 0: Playing, 1: Streaming, 2: Listening, 3: Watching, 4: Custom, 5: Competing
    }],
  });

  try {
    await registerSlashCommands(client, process.env.bot_token);
    handleSlashCommands(client);
  } catch (error) {
    console.error(error);
  }
});

export { client };