import { REST, Routes, SlashCommandBuilder, Events } from "discord.js";

export const commandsData = [
  new SlashCommandBuilder()
    .setName('setavatar')
    .setDescription('Altera o avatar do bot.')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('URL da imagem do novo avatar')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('setbanner')
    .setDescription('Altera o banner do bot.')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('URL da imagem do novo banner')
        .setRequired(true)),
];

export async function registerSlashCommands(client, token) {
  const rest = new REST({ version: '10' }).setToken(token);
  try {
    const CLIENT_ID = process.env.CLIENT_ID;

    if (!CLIENT_ID) {
      console.error('CLIENT_ID não especificado no .env! Os comandos não serão registrados globalmente.'.red);
      return;
    }

    const data = await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commandsData.map(cmd => cmd.toJSON()) },
    );
    console.log('[🤖 DISCORD BOT] Slash commands registrados globalmente!'.bgCyan);
  } catch (error) {
    console.error('[🤖 DISCORD BOT] Erro ao registrar comandos slash:'.red);
    console.error(error);
  }
}

export function handleSlashCommands(client) {
  const authorizedUsers = process.env.AUTHORIZED_USERS ? process.env.AUTHORIZED_USERS.split(',') : [];

  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (!authorizedUsers.includes(interaction.user.id)) {
      await interaction.reply({ content: 'Você não tem permissão para usar este comando.', ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    if (interaction.commandName === 'setavatar') {
      const url = interaction.options.getString('url');
      try {
        await client.user.setAvatar(url);
        await interaction.editReply({ content: 'Avatar do bot alterado com sucesso!' });
      } catch (err) {
        console.error('Erro ao alterar avatar:', err);
        await interaction.followUp({ content: 'Erro ao alterar avatar: ' + err.message, ephemeral: true });
      }
    }

    if (interaction.commandName === 'setbanner') {
      const url = interaction.options.getString('url');
      try {
        await client.user.setBanner(url);
        await interaction.editReply({ content: 'Banner do bot alterado com sucesso!' });
      } catch (err) {
        console.error('Erro ao alterar banner:', err);
        await interaction.followUp({ content: 'Erro ao alterar banner: ' + err.message, ephemeral: true });
      }
    }
  });
} 