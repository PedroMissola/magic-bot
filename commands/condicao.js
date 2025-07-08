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
  await interaction.deferReply({ ephemeral: true }); // deixa a resposta privada
  const nome = interaction.options.getString('nome');

  try {
    const res = await axios.get(`https://www.dnd5eapi.co/api/conditions/${nome}`);
    const condicao = res.data;

    const embed = new EmbedBuilder()
      .setTitle(`⚖️ Condição: ${condicao.name}`)
      .setDescription(condicao.desc.join('\n\n'))
      .setColor(0x3498db);

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error('Erro ao buscar condição:', err);
    await interaction.editReply({ content: '❌ Condição não encontrada. Verifique o nome.' });
  }
}
