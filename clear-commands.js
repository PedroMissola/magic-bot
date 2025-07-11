import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

// Adicione o ID do seu servidor aqui.
const GUILD_ID_TO_CLEAR = '1230675261419159562'; 

const { DISCORD_TOKEN, CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID_TO_CLEAR) {
  console.error('❌ Erro: Por favor, forneça DISCORD_TOKEN, CLIENT_ID e GUILD_ID_TO_CLEAR no seu arquivo .env.');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🚀 Iniciando a remoção de todos os comandos da guilda com ID ${GUILD_ID_TO_CLEAR}...`);
    
    // O PUT com um array vazio remove todos os comandos daquela guilda.
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID_TO_CLEAR),
      { body: [] }
    );
    
    console.log('✅ Todos os comandos foram removidos com sucesso dessa guilda!');
    console.log('Você pode agora deletar este arquivo e rodar seu bot novamente.');
  } catch (error) {
    console.error('❌ Erro ao remover comandos:', error);
  }
})();