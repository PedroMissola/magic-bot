// index.js
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import magiaCommand from './commands/magia.js';
import * as deusCommand from './commands/deus.js';
import * as magiasCommand from './commands/magias.js';
import * as monstrosCommand from './commands/monstros.js';
import * as monstroCommand from './commands/monstro.js';
import * as condicaoCommand from './commands/condicao.js';
import * as danoCommand from './commands/dano.js';
import handleSelectMenu from './interactions/handleSelectMenu.js';
import handleRollMessage from './messages/handleRollMessage.js';
dotenv.config();

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
  console.log('Bot online!');
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'magia') {
      await magiaCommand.execute(interaction);
    } else if (interaction.commandName === 'monstros') {
      await monstrosCommand.execute(interaction);
    } else if (interaction.commandName === 'monstro') {
      await monstroCommand.execute(interaction);
    } else if (interaction.commandName === 'magias') {
      await magiasCommand.execute(interaction);
    } else if (interaction.commandName === 'condicao') {
      await condicaoCommand.execute(interaction);
    } else if (interaction.commandName === 'dano') {
      await danoCommand.execute(interaction);
    } else if (interaction.commandName === 'deus') {
      await deusCommand.execute(interaction);
    }
  } else if (interaction.isStringSelectMenu()) {
    await handleSelectMenu(interaction);
  }
});

client.on('messageCreate', async (message) => {
  await handleRollMessage(message);
});

const commands = [
  magiaCommand.data,
  magiasCommand.data,
  monstrosCommand.data,
  monstroCommand.data,
  condicaoCommand.data,
  danoCommand.data,
  deusCommand.data, 
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('Comandos registrados com sucesso!');
    await client.login(DISCORD_TOKEN);
  } catch (err) {
    console.error('Erro ao registrar comandos:', err);
  }
})();
