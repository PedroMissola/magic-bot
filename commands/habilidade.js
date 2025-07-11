import axios from 'axios';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('habilidade')
  .setDescription('Busca habilidades ou magias do D&D 5e')
  .addSubcommand(sub =>
    sub.setName('magia')
      .setDescription('Busca uma magia pelo nome (em inglês).')
      .addStringOption(opt =>
        opt.setName('nome')
          .setDescription('Nome da magia')
          .setRequired(true)))
  .addSubcommand(sub =>
    sub.setName('feature')
      .setDescription('Busca uma feature (habilidade de classe) pelo nome.')
      .addStringOption(opt =>
        opt.setName('nome')
          .setDescription('Nome da feature')
          .setRequired(true)));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const sub = interaction.options.getSubcommand();
  const nomeRaw = interaction.options.getString('nome').toLowerCase().replace(/\s+/g, '-');

  try {
    if (sub === 'magia') {
      const { data: magia } = await axios.get(`https://www.dnd5eapi.co/api/spells/${nomeRaw}`);

      const desc = magia.desc?.join('\n\n') || 'Sem descrição.';
      const higherLevel = magia.higher_level?.join('\n') || 'Sem efeitos de nível superior.';
      const componentes = magia.components?.join(', ') || 'Nenhum';

      const embed = new EmbedBuilder()
        .setTitle(`✨ ${magia.name} (Nível ${magia.level})`)
        .setDescription(desc)
        .setColor(0x3498db)
        .addFields(
          { name: '⏱️ Tempo de Conjuração', value: magia.casting_time || '---', inline: true },
          { name: '🎯 Alcance', value: magia.range || '---', inline: true },
          { name: '⏳ Duração', value: magia.duration || '---', inline: true },
          { name: '🧩 Componentes', value: componentes, inline: true },
          { name: '📚 Escola', value: magia.school?.name || '---', inline: true },
          { name: '➡️ Efeitos em Níveis Superiores', value: higherLevel }
        )
        .setFooter({ text: 'Fonte: dnd5eapi.co' });

      await interaction.editReply({ embeds: [embed] });

    } else if (sub === 'feature') {
      const { data: feature } = await axios.get(`https://www.dnd5eapi.co/api/features/${nomeRaw}`);

      const desc = feature.desc?.join('\n\n') || 'Sem descrição disponível.';
      const embed = new EmbedBuilder()
        .setTitle(`🛡️ Feature: ${feature.name}`)
        .setDescription(desc)
        .setColor(0x2ecc71)
        .setFooter({ text: 'Fonte: dnd5eapi.co' });

      if (feature.class) {
        embed.addFields({ name: 'Classe', value: feature.class.name, inline: true });
      }
      if (feature.level !== undefined) {
        embed.addFields({ name: 'Nível da Feature', value: feature.level.toString(), inline: true });
      }
      if (feature.prerequisites && feature.prerequisites.length > 0) {
        const prereqs = feature.prerequisites.map(p => {
          if (p.type === 'level') return `Nível ${p.level} de ${p.prerequisite_level.name}`;
          return `${p.name}`;
        }).join(', ');
        embed.addFields({ name: 'Pré-requisitos', value: prereqs });
      }
      if (feature.parent) {
        embed.addFields({ name: 'Depende de', value: feature.parent.name });
      }

      await interaction.editReply({ embeds: [embed] });
    }
  } catch (err) {
    if (err.response && err.response.status === 404) {
      const tipo = sub === 'magia' ? 'Magia' : 'Feature';
      return await interaction.editReply(`❌ ${tipo} não encontrada. Verifique o nome/index.`);
    }
    console.error(`Erro ao buscar ${sub}:`, err);
    await interaction.editReply(`❌ Ocorreu um erro ao buscar a ${sub}.`);
  }
}