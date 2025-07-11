import { Client, GatewayIntentBits, REST, Routes, Collection, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Certifique-se de que este caminho está correto para o seu arquivo firebase.js
import { db } from './firebase.js';

// Handler para rolagens de dado em mensagens de texto
import handleRollMessage from './messages/handleRollMessage.js';

dotenv.config();

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();
const commandsToRegister = [];

// Carregar dinamicamente os arquivos de comando
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsPath = path.join(__dirname, 'commands');

try {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);

      // Adiciona o comando para registro, verificando se tem o método toJSON()
      if (typeof command.data.toJSON === 'function') {
        commandsToRegister.push(command.data.toJSON());
      } else {
        commandsToRegister.push(command.data);
      }

    } else {
      console.warn(`[AVISO] O comando em ${filePath} não possui as propriedades "data" ou "execute" necessárias.`);
    }
  }
} catch (error) {
  console.error(`❌ Erro ao carregar comandos. Verifique se a pasta "commands" existe e está acessível:`, error);
  // Opcional: Terminar o processo do bot se os comandos não puderem ser carregados
  // process.exit(1); 
}

// Lógica de inicialização do bot e registro de comandos
client.once('ready', async () => {
  console.log(`✅ Bot online como ${client.user.tag}!`);

  const commandsPath = path.join(__dirname, 'commands');
  let totalCommands = 0;
  try {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    totalCommands = commandFiles.length;
  } catch (error) {
    console.error('Erro ao contar comandos para o status:', error);
  }

  // Busca o número de jogadores no Firebase
  let totalPlayers = 0;
  try {
    const playersSnapshot = await db.collection('players').count().get();
    totalPlayers = playersSnapshot.data().count;
  } catch (err) {
    console.error('Erro ao buscar o número de jogadores:', err);
  }

  // Define a lista de status dinâmicos
  const statusList = [
    { name: '/ajuda para começar!', type: 0 }, // Playing
    { name: `Gerenciando ${totalPlayers} aventureiros`, type: 0 }, // Playing
    { name: `Com ${totalCommands} comandos disponíveis`, type: 0 }, // Playing
    { name: 'Rolando dados para o destino', type: 3 }, // Watching
    { name: 'Ouvindo histórias de heróis', type: 2 }, // Listening
  ];

  let statusIndex = 0;
  setInterval(() => {
    const status = statusList[statusIndex];
    client.user.setActivity(status.name, { type: status.type });
    statusIndex = (statusIndex + 1) % statusList.length;
  }, 15000); // O status muda a cada 15 segundos

  // Lógica de registro de comandos - Registra globalmente
  try {
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    console.log(`🚀 Iniciando o registro de ${commandsToRegister.length} comandos de aplicação globalmente.`);

    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commandsToRegister }
    );

    console.log('✅ Comandos registrados com sucesso globalmente!');
  } catch (error) {
    console.error('❌ Erro ao registrar comandos globalmente:', error);
  }
});

// Handler para todas as interações de barra (slash commands)
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isStringSelectMenu()) return;

  const command = client.commands.get(interaction.commandName);

  if (interaction.isChatInputCommand()) {
    if (!command) {
      console.error(`Comando não encontrado: ${interaction.commandName}`);
      return;
    }
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Erro ao executar o comando ${interaction.commandName}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'Ocorreu um erro ao executar este comando!', ephemeral: true });
      }
    }
  }
});

// Handler para rolagens de dado em mensagens de texto
client.on('messageCreate', async (message) => {
  try {
    await handleRollMessage(message);
  } catch (error) {
    console.error('Erro no evento messageCreate:', error);
  }
});

client.on('guildCreate', async (guild) => {
  try {
    // 1. Registra os comandos na nova guilda
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

    console.log(`🚀 Registrando comandos para a nova guilda: ${guild.name} (${guild.id})`);

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, guild.id),
      { body: commandsToRegister }
    );

    console.log(`✅ Comandos registrados com sucesso na guilda ${guild.name}!`);

    // 2. Envia um embed de boas-vindas
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`Obrigado por me adicionar a ${guild.name}!`)
      .setDescription('Olá, aventureiro! Sou um bot de D&D 5e e estou aqui para ajudar a sua mesa. Você pode usar meus comandos de barra (/) para consultar regras, monstros, magias e muito mais.')
      .setColor(0x0099ff)
      .addFields(
        { name: '✨ Por onde começar?', value: 'Use `/` para ver a lista de comandos disponíveis. Tente começar com `/player set` para registrar seu personagem ou `/monstro dragon` para ver as estatísticas de um dragão!' },
        { name: '📚 Regras', value: 'Você pode consultar regras como `/dano`, `/condicao` e `/checagem`.' }
      )
      .setFooter({ text: 'Divirta-se em suas aventuras!' });

    // Encontra um canal para enviar a mensagem
    const defaultChannel = guild.systemChannel || guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.members.me).has('SendMessages'));

    if (defaultChannel) {
      await defaultChannel.send({ embeds: [welcomeEmbed] });
      console.log(`✅ Mensagem de boas-vindas enviada para a guilda ${guild.name}.`);
    }

  } catch (error) {
    console.error(`❌ Erro ao entrar na guilda ${guild.name}:`, error);
  }
});

client.on('messageCreate', async (message) => {
  // Ignora mensagens de bots para evitar loops
  if (message.author.bot) return;

  // Verifica se o bot foi mencionado na mensagem
  if (message.mentions.has(client.user.id)) {
    const embed = new EmbedBuilder()
      .setTitle(`Olá, sou o ${client.user.username}!`)
      .setDescription(
        'Fui criado para ajudar nas suas mesas de D&D 5e! Eu respondo a comandos de barra (`/`).'
      )
      .setColor(0x0099ff)
      .addFields(
        {
          name: '🚀 Como começar?',
          value: 'Basta digitar `/` em qualquer chat para ver a lista completa dos meus comandos. Tente um destes:',
        },
        {
          name: '` /player status`',
          value: 'Para conferir o estado do seu personagem (status, vida, etc.).',
          inline: true
        },
        {
          name: '` /help `',
          value: 'Para saber sobre tipos de comandos que tenho disponível.',
          inline: true
        },
        {
          name: '🎲 Rolagem por Texto',
          value: `Além dos comandos, você pode rolar dados diretamente no chat.
          
**Sintaxe Básica:**
\`1d20+5\` ou \`3d6+2\`

**Vantagem/Desvantagem:**
Adicione \`vantagem\` ou \`desvantagem\` para rolar 1d20 com a regra.
\`1d20+3 vantagem\`

**Iniciativa:**
Use o comando especial para rolar a iniciativa e criar uma ordem de turnos.
\`iniciativa(modificador)\`
`,
          inline: false
        }
      )
      .setFooter({ text: 'Estou pronto para a aventura!' });

    // Envia o embed de resposta
    try {
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao enviar embed de menção:', error);
    }
  }

  // Executa o handler de rolagens de dado
  try {
    await handleRollMessage(message);
  } catch (error) {
    console.error('Erro no evento messageCreate:', error);
  }
});

client.login(DISCORD_TOKEN);