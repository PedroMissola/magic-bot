import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

const filePath = path.resolve('deuses.json');

let deuses = {};
try {
  const jsonData = fs.readFileSync(filePath, 'utf8');
  const deusesArray = JSON.parse(jsonData);
  deuses = deusesArray.reduce((acc, deus) => {
    acc[deus.id] = deus;
    return acc;
  }, {});
} catch (err) {
  console.error('Erro ao ler deuses.json:', err);
}

const choices = Object.values(deuses).map(deus => ({
  name: deus.nome,
  value: deus.id
}));

export const data = new SlashCommandBuilder()
  .setName('deus')
  .setDescription('Mostra informações de um deus específico de Valkyrie')
  .addStringOption(option =>
    option
      .setName('nome')
      .setDescription('Nome do deus')
      .setRequired(true)
      .addChoices(...choices)
  );

export async function execute(interaction) {
  const nome = interaction.options.getString('nome');
  const deus = deuses[nome];

  if (!deus) {
    return interaction.reply({
      content: '❌ Deus não encontrado.',
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`${deus.nome} — ${deus.titulo}`)
    .setDescription(deus.descricao)
    .setColor(0xffaa00)
    .setFooter({ text: 'Mundo de Valkyrie' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
