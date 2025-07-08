import axios from 'axios';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType } from 'discord.js';

export const data = {
  name: 'monstros',
  description: 'Mostra uma lista paginada de monstros do D&D'
};

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  let pagina = 0;
  const porPagina = 30;

  let listaCompleta = [];
  try {
    const res = await axios.get('https://www.dnd5eapi.co/api/monsters');
    listaCompleta = res.data.results;
  } catch (err) {
    console.error('Erro ao buscar monstros:', err);
    return interaction.editReply('❌ Erro ao buscar monstros.');
  }

  const totalPaginas = Math.ceil(listaCompleta.length / porPagina);

  const gerarEmbed = (pagina) => {
    const inicio = pagina * porPagina;
    const fim = inicio + porPagina;
    const monstrosPagina = listaCompleta.slice(inicio, fim);

    const descricao = monstrosPagina
      .map((monstro, i) => `\`${i + 1 + inicio}.\` **${monstro.name}** — \`${monstro.index}\``)
      .join('\n');

    return new EmbedBuilder()
      .setTitle('📚 Lista de Monstros (D&D 5e)')
      .setDescription(descricao)
      .setFooter({ text: `Página ${pagina + 1} de ${totalPaginas}` })
      .setColor(0x9b59b6);
  };

  const gerarBotoes = () => new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('anterior')
      .setLabel('⬅️ Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pagina === 0),

    new ButtonBuilder()
      .setCustomId('proximo')
      .setLabel('Próxima ➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pagina === totalPaginas - 1)
  );

  const msg = await interaction.editReply({
    embeds: [gerarEmbed(pagina)],
    components: [gerarBotoes()],
    fetchReply: true
  });

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000
  });

  collector.on('collect', async (btn) => {
    if (btn.user.id !== interaction.user.id) {
      return btn.reply({ content: '❌ Esse botão não é para você.', ephemeral: true });
    }

    if (btn.customId === 'anterior' && pagina > 0) {
      pagina--;
    } else if (btn.customId === 'proximo' && pagina < totalPaginas - 1) {
      pagina++;
    }

    await btn.update({
      embeds: [gerarEmbed(pagina)],
      components: [gerarBotoes()]
    });
  });

  collector.on('end', async () => {
    try {
      await msg.edit({ components: [] });
    } catch (err) {
      console.error('Erro ao desabilitar botões:', err);
    }
  });
}
