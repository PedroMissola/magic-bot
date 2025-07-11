// commands/dano.js
import axios from 'axios';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('dano')
  .setDescription('Exibe detalhes sobre um tipo de dano do D&D')
  .addStringOption(option =>
    option.setName('tipo')
      .setDescription('Tipo de dano (em inglês)')
      .setRequired(true)
      .addChoices(
        { name: 'Ácido', value: 'acid' },
        { name: 'Contundente', value: 'bludgeoning' },
        { name: 'Frio', value: 'cold' },
        { name: 'Fogo', value: 'fire' },
        { name: 'Força', value: 'force' },
        { name: 'Elétrico', value: 'lightning' },
        { name: 'Necrótico', value: 'necrotic' },
        { name: 'Perfurante', value: 'piercing' },
        { name: 'Venenoso', value: 'poison' },
        { name: 'Psíquico', value: 'psychic' },
        { name: 'Radiante', value: 'radiant' },
        { name: 'Cortante', value: 'slashing' },
        { name: 'Trovoada', value: 'thunder' }
      )
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const tipo = interaction.options.getString('tipo');

  try {
    const { data: dano } = await axios.get(`https://www.dnd5eapi.co/api/damage-types/${tipo}`);

    if (!dano || !dano.name) {
      return await interaction.editReply('❌ Tipo de dano não encontrado. Verifique o nome.');
    }

    const desc = dano.desc?.join('\n\n') || 'Sem descrição.';
    const embed = new EmbedBuilder()
      .setTitle(`💥 Tipo de Dano: ${dano.name}`)
      .setDescription(desc)
      .setColor(0xfc3903)
      .setFooter({ text: 'Fonte: dnd5eapi.co' });

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    if (err.response && err.response.status === 404) {
      return await interaction.editReply('❌ Tipo de dano não encontrado. Verifique o nome.');
    }
    console.error('Erro ao buscar tipo de dano:', err);
    await interaction.editReply('❌ Ocorreu um erro ao buscar o tipo de dano.');
  }
}