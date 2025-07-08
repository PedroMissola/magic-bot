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
  await interaction.deferReply({ ephemeral: true }); // resposta privada
  const tipo = interaction.options.getString('tipo');

  try {
    const res = await axios.get(`https://www.dnd5eapi.co/api/damage-types/${tipo}`);
    const dano = res.data;

    const embed = new EmbedBuilder()
      .setTitle(`💥 Tipo de Dano: ${dano.name}`)
      .setDescription(dano.desc.join('\n\n'))
      .setColor(0xe67e22);

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error('Erro ao buscar tipo de dano:', err);
    await interaction.editReply({ content: '❌ Tipo de dano não encontrado. Verifique o nome.' });
  }
}