// commands/condicao.js
import axios from 'axios';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('condicao')
  .setDescription('Exibe detalhes sobre uma condição do D&D')
  .addStringOption(option =>
    option.setName('nome')
      .setDescription('Nome da condição (em inglês)')
      .setRequired(true)
      .addChoices(
        { name: 'Invisível', value: 'invisible' },
        { name: 'Cego', value: 'blinded' },
        { name: 'Enfeitiçado', value: 'charmed' },
        { name: 'Surdo', value: 'deafened' },
        { name: 'Exausto', value: 'exhaustion' },
        { name: 'Amedrontado', value: 'frightened' },
        { name: 'Agarrado', value: 'grappled' },
        { name: 'Incapacitado', value: 'incapacitated' },
        { name: 'Paralisado', value: 'paralyzed' },
        { name: 'Petrificado', value: 'petrified' },
        { name: 'Envenenado', value: 'poisoned' },
        { name: 'Caído', value: 'prone' },
        { name: 'Restrito', value: 'restrained' },
        { name: 'Atordoado', value: 'stunned' },
        { name: 'Inconsciente', value: 'unconscious' }
      )
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const nome = interaction.options.getString('nome');

  try {
    const { data: condicao } = await axios.get(`https://www.dnd5eapi.co/api/conditions/${nome}`);

    if (!condicao || !condicao.name) {
      return await interaction.editReply('❌ Condição não encontrada. Verifique o nome.');
    }

    const desc = condicao.desc?.join('\n\n') || 'Sem descrição.';
    const embed = new EmbedBuilder()
      .setTitle(`Condição: ${condicao.name}`)
      .setDescription(desc)
      .setColor(0xa6026c)
      .setFooter({ text: 'Fonte: dnd5eapi.co' });

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    if (err.response && err.response.status === 404) {
      return await interaction.editReply('❌ Condição não encontrada. Verifique o nome.');
    }
    console.error('Erro ao buscar condição:', err);
    await interaction.editReply('❌ Ocorreu um erro ao buscar a condição.');
  }
}