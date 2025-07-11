import axios from 'axios';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('monstro')
  .setDescription('Busca um monstro do D&D pelo nome (em inglês)')
  .addStringOption(option =>
    option.setName('nome')
      .setDescription('Nome do monstro (em inglês, ex: goblin)')
      .setRequired(true));

function truncate(text, max = 1024) {
  if (!text) return 'Nenhuma';
  return text.length > max ? text.slice(0, max - 3) + '...' : text;
}

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const nome = interaction.options.getString('nome').toLowerCase().replace(/\s+/g, '-');

  try {
    const { data: monstro } = await axios.get(`https://www.dnd5eapi.co/api/monsters/${nome}`);

    const armorClasses = monstro.armor_class?.map(ac => ac.value + (ac.type ? ` (${ac.type})` : '')).join(', ') || 'N/A';
    const speeds = Object.entries(monstro.speed || {}).map(([tipo, valor]) => `${tipo}: ${valor}`).join(', ') || 'N/A';
    const profs = monstro.proficiencies?.map(p => `${p.proficiency.name.replace('Skill: ', '')} +${p.value}`).join(', ') || 'Nenhuma';
    const especiais = monstro.special_abilities?.map(a => `**${a.name}:** ${a.desc}`).join('\n\n') || 'Nenhuma';
    const acoes = monstro.actions?.map(a => `**${a.name}:** ${a.desc}`).join('\n\n') || 'Nenhuma';

    const embed = new EmbedBuilder()
      .setTitle(`👹 ${monstro.name}`)
      .setColor(0xff5733)
      .addFields(
        { name: '💀 Tipo', value: `${monstro.size} ${monstro.type} (${monstro.alignment})`, inline: true },
        { name: '⚔️ CA (Classe de Armadura)', value: armorClasses, inline: true },
        { name: '❤️ PV (Pontos de Vida)', value: `${monstro.hit_points} (${monstro.hit_dice})`, inline: true },
        { name: '🎯 Deslocamento', value: speeds, inline: true },
        { name: '⭐ Nível de Desafio', value: `${monstro.challenge_rating} (XP: ${monstro.xp})`, inline: true },
        { name: '📚 Proficiências', value: truncate(profs, 1024), inline: true },
        { name: '✨ Habilidades Especiais', value: truncate(especiais, 1024) },
        { name: '🗡️ Ações', value: truncate(acoes, 1024) },
      )
      .setFooter({ text: 'Fonte: dnd5eapi.co' });

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    if (err.response && err.response.status === 404) {
      return await interaction.editReply('❌ Monstro não encontrado. Verifique o nome.');
    }
    console.error('Erro ao buscar monstro:', err);
    await interaction.editReply('❌ Ocorreu um erro ao buscar o monstro.');
  }
}