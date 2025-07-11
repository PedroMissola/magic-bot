import axios from 'axios';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('monstros')
  .setDescription('Mostra uma lista paginada de monstros do D&D');

const ITENS_POR_PAGINA = 30;
let listaCompleta = [];

async function carregarMonstros() {
  if (listaCompleta.length === 0) {
    try {
      const res = await axios.get('https://www.dnd5eapi.co/api/monsters');
      listaCompleta = res.data.results;
    } catch (err) {
      console.error('Erro ao buscar monstros:', err);
      throw new Error('Erro ao carregar a lista de monstros.');
    }
  }
}

function gerarEmbed(pagina, totalPaginas) {
  const inicio = pagina * ITENS_POR_PAGINA;
  const fim = inicio + ITENS_POR_PAGINA;
  const monstrosPagina = listaCompleta.slice(inicio, fim);

  const descricao = monstrosPagina
    .map((monstro, i) => `\`${i + 1 + inicio}.\` **${monstro.name}** — \`${monstro.index}\``)
    .join('\n');

  return new EmbedBuilder()
    .setTitle('📚 Lista de Monstros (D&D 5e)')
    .setDescription(descricao)
    .setFooter({ text: `Página ${pagina + 1} de ${totalPaginas}` })
    .setColor(0x9b59b6);
}

function gerarBotoes(pagina, totalPaginas) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('monstros_prev')
      .setLabel('Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pagina === 0),

    new ButtonBuilder()
      .setCustomId('monstros_next')
      .setLabel('Próxima')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pagina === totalPaginas - 1)
  );
}

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    await carregarMonstros();
  } catch (err) {
    return await interaction.editReply(`❌ ${err.message}`);
  }

  let pagina = 0;
  const totalPaginas = Math.ceil(listaCompleta.length / ITENS_POR_PAGINA);
  if (totalPaginas === 0) {
    return await interaction.editReply('❌ Nenhuma monstro encontrada.');
  }

  const msg = await interaction.editReply({
    embeds: [gerarEmbed(pagina, totalPaginas)],
    components: [gerarBotoes(pagina, totalPaginas)],
    fetchReply: true
  });

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120000,
  });

  collector.on('collect', async (btn) => {
    if (btn.customId === 'monstros_prev' && pagina > 0) {
      pagina--;
    } else if (btn.customId === 'monstros_next' && pagina < totalPaginas - 1) {
      pagina++;
    }

    await btn.update({
      embeds: [gerarEmbed(pagina, totalPaginas)],
      components: [gerarBotoes(pagina, totalPaginas)]
    });
  });

  collector.on('end', async () => {
    try {
      await interaction.editReply({ components: [] });
    } catch (error) {
      console.error('Erro ao desabilitar botões de monstros:', error);
    }
  });
}