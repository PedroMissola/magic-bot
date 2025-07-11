import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

// Carregar e processar os dados dos deuses no carregamento do módulo
const filePath = path.resolve('deuses.json');
let deuses = {};
let choices = [];

try {
  const jsonData = fs.readFileSync(filePath, 'utf8');
  const deusesArray = JSON.parse(jsonData);
  deuses = deusesArray.reduce((acc, deus) => {
    acc[deus.id] = deus;
    return acc;
  }, {});
  choices = Object.values(deuses).map(deus => ({
    name: deus.nome,
    value: deus.id
  }));
} catch (err) {
  console.error('Erro ao ler deuses.json:', err);
}

export const data = new SlashCommandBuilder()
  .setName('deus')
  .setDescription('Mostra informações de um deus específico de Valkyrie')
  .addStringOption(option =>
    option.setName('nome')
      .setDescription('Nome do deus')
      .setRequired(true)
      .addChoices(...choices)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const nome = interaction.options.getString('nome');
  const deus = deuses[nome];

  if (!deus) {
    return await interaction.editReply({
      content: '❌ Deus não encontrado. Verifique o nome.',
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`🌟 ${deus.nome}`)
    .setDescription(deus.descricao || 'Sem descrição.')
    .setColor(0xffd700) // Cor dourada para deuses
    .addFields(
      { name: '✨ Domínios', value: deus.dominios.join(', ') || 'Nenhum', inline: true },
      { name: '📜 Símbolo Sagrado', value: deus.simbolo || 'Nenhum', inline: true },
      { name: '🙏 Devotos', value: deus.devotos || 'Nenhum', inline: true },
      { name: '🏛️ Templo Principal', value: deus.templo || 'Nenhum', inline: true },
      { name: '⚔️ Arma Preferida', value: deus.arma || 'Nenhuma', inline: true }
    )
    .setFooter({ text: 'Informações do cenário Valkyrie.' });

  await interaction.editReply({ embeds: [embed] });
}