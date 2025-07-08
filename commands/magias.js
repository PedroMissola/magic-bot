import axios from 'axios';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

const MAGIAS_POR_PAGINA = 20;

export const data = {
  name: 'magias',
  description: 'Lista magias do D&D 5e filtrando por nível e escola',
  options: [
    {
      name: 'nivel',
      description: 'Nível da magia (0-9)',
      type: 4, // integer
      required: false
    },
    {
      name: 'escola',
      description: 'Escola da magia',
      type: 3, // string
      required: false,
      choices: [
        { name: 'Abjuração', value: 'abjuration' },
        { name: 'Adivinhação', value: 'divination' },
        { name: 'Conjuração', value: 'conjuration' },
        { name: 'Encantamento', value: 'enchantment' },
        { name: 'Evocação', value: 'evocation' },
        { name: 'Ilusão', value: 'illusion' },
        { name: 'Necromancia', value: 'necromancy' },
        { name: 'Transmutação', value: 'transmutation' }
      ]
    }
  ]
};

async function buscarMagias(nivel, escola) {
  let url = 'https://www.dnd5eapi.co/api/spells';

  const params = [];
  if (nivel !== undefined && nivel !== null) params.push(`level=${nivel}`);
  if (escola) params.push(`school=${escola}`);

  if (params.length > 0) url += '?' + params.join('&');

  const res = await axios.get(url);
  return res.data.results;
}

function criarEmbedPagina(magias, paginaAtual, totalPaginas) {
  const embed = new EmbedBuilder()
    .setTitle(`Magias do D&D 5e - Página ${paginaAtual + 1} de ${totalPaginas}`)
    .setColor(0x0099ff)
    .setFooter({ text: 'Use /magia name:{nome} para detalhes da magia' });

  const inicio = paginaAtual * MAGIAS_POR_PAGINA;
  const fim = inicio + MAGIAS_POR_PAGINA;
  const magiasPagina = magias.slice(inicio, fim);

  embed.setDescription(
    magiasPagina
      .map(m => `• **${m.name}**`)
      .join('\n')
  );

  return embed;
}

function criarBotoes(paginaAtual, totalPaginas) {
  const voltar = new ButtonBuilder()
    .setCustomId('voltar_pag')
    .setLabel('⬅️ Anterior')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(paginaAtual === 0);

  const avancar = new ButtonBuilder()
    .setCustomId('avancar_pag')
    .setLabel('Próxima ➡️')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(paginaAtual === totalPaginas - 1);

  return new ActionRowBuilder().addComponents(voltar, avancar);
}

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const nivel = interaction.options.getInteger('nivel');
  const escola = interaction.options.getString('escola');

  let magias;
  try {
    magias = await buscarMagias(nivel, escola);
    if (!magias || magias.length === 0) {
      return interaction.editReply('❌ Nenhuma magia encontrada com esses filtros.');
    }
  } catch (err) {
    console.error('Erro ao buscar magias:', err);
    return interaction.editReply('❌ Erro ao buscar magias. Tente novamente mais tarde.');
  }

  const totalPaginas = Math.ceil(magias.length / MAGIAS_POR_PAGINA);
  let paginaAtual = 0;

  const embed = criarEmbedPagina(magias, paginaAtual, totalPaginas);
  const botoes = criarBotoes(paginaAtual, totalPaginas);

  const mensagem = await interaction.editReply({ embeds: [embed], components: [botoes] });

  const filter = i =>
    (i.customId === 'voltar_pag' || i.customId === 'avancar_pag') &&
    i.user.id === interaction.user.id;

  const collector = mensagem.createMessageComponentCollector({ filter, time: 60000 });

  collector.on('collect', async i => {
    if (i.customId === 'voltar_pag') paginaAtual--;
    else if (i.customId === 'avancar_pag') paginaAtual++;

    const novoEmbed = criarEmbedPagina(magias, paginaAtual, totalPaginas);
    const novosBotoes = criarBotoes(paginaAtual, totalPaginas);

    await i.update({ embeds: [novoEmbed], components: [novosBotoes] });
  });

  collector.on('end', async () => {
    const embedFinal = criarEmbedPagina(magias, paginaAtual, totalPaginas);
    await interaction.editReply({ embeds: [embedFinal], components: [] });
  });
}
