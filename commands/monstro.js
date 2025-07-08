import axios from 'axios';
import { EmbedBuilder } from 'discord.js';

export const data = {
  name: 'monstro',
  description: 'Busca um monstro do D&D pelo nome (em inglês)',
  options: [
    {
      name: 'nome',
      type: 3, // STRING
      description: 'Nome do monstro (em inglês, ex: goblin)',
      required: true
    }
  ]
};

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const nome = interaction.options.getString('nome').toLowerCase().replace(/\s+/g, '-');

  try {
    const { data } = await axios.get(`https://www.dnd5eapi.co/api/monsters/${nome}`);

    const embed = new EmbedBuilder()
      .setTitle(`👹 ${data.name}`)
      .setColor(0xff0000)
      .addFields(
        { name: '💀 Tipo', value: data.type, inline: true },
        { name: '📏 Tamanho', value: data.size, inline: true },
        { name: '⚔️ CA (Classe de Armadura)', value: `${data.armor_class}`, inline: true },
        { name: '❤️ Pontos de Vida', value: `${data.hit_points} (${data.hit_dice})`, inline: true },
        { name: '🎯 Deslocamento', value: Object.entries(data.speed).map(([k, v]) => `${k}: ${v}`).join(', '), inline: true },
        { name: '🧠 Alinhamento', value: data.alignment, inline: true },
      )
      .setFooter({ text: 'Fonte: dnd5eapi.co' });

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error('Erro ao buscar detalhes do monstro:', err);
    await interaction.editReply('❌ Monstro não encontrado. Verifique o nome exato (em inglês).');
  }
}
