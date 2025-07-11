import axios from 'axios';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, ComponentType } from 'discord.js';

const ITENS_POR_PAGINA = 20;

export const data = new SlashCommandBuilder()
  .setName('habilidades')
  .setDescription('Lista magias ou features de classes do D&D 5e')
  .addSubcommand(sub =>
    sub.setName('magia')
      .setDescription('Lista magias filtrando por nível e escola')
      .addIntegerOption(opt =>
        opt.setName('nivel')
          .setDescription('Nível da magia (0-9)')
          .setRequired(false))
      .addStringOption(opt =>
        opt.setName('escola')
          .setDescription('Escola da magia')
          .setRequired(false)
          .addChoices(
            { name: 'Abjuração', value: 'abjuration' },
            { name: 'Adivinhação', value: 'divination' },
            { name: 'Conjuração', value: 'conjuration' },
            { name: 'Encantamento', value: 'enchantment' },
            { name: 'Evocação', value: 'evocation' },
            { name: 'Ilusão', value: 'illusion' },
            { name: 'Necromancia', value: 'necromancy' },
            { name: 'Transmutação', value: 'transmutation' }
          )))
  .addSubcommand(sub =>
    sub.setName('features')
      .setDescription('Lista features de uma classe')
      .addStringOption(opt =>
        opt.setName('classe')
          .setDescription('Nome da classe')
          .setRequired(true)
          .addChoices(
            { name: 'Barbarian', value: 'barbarian' },
            { name: 'Bard', value: 'bard' },
            { name: 'Cleric', value: 'cleric' },
            { name: 'Druid', value: 'druid' },
            { name: 'Fighter', value: 'fighter' },
            { name: 'Monk', value: 'monk' },
            { name: 'Paladin', value: 'paladin' },
            { name: 'Ranger', value: 'ranger' },
            { name: 'Rogue', value: 'rogue' },
            { name: 'Sorcerer', value: 'sorcerer' },
            { name: 'Warlock', value: 'warlock' },
            { name: 'Wizard', value: 'wizard' }
          )));

function criarEmbedPagina(itens, paginaAtual, totalPaginas, tipo) {
  const embed = new EmbedBuilder()
    .setTitle(`${tipo} do D&D 5e - Página ${paginaAtual + 1} de ${totalPaginas}`)
    .setColor(0x0099ff);

  const inicio = paginaAtual * ITENS_POR_PAGINA;
  const fim = inicio + ITENS_POR_PAGINA;
  const itensPagina = itens.slice(inicio, fim);

  embed.setDescription(
    itensPagina.map(i => `• **${i.name}**`).join('\n')
  );

  if (tipo === 'Magias') {
    embed.setFooter({ text: 'Use /habilidade magia nome:{nome} para detalhes da magia' });
  } else {
    embed.setFooter({ text: 'Use /habilidade feature nome:{nome} para detalhes da feature' });
  }
  return embed;
}

function criarBotoes(paginaAtual, totalPaginas, tipo) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`habilidades_prev_${tipo}`)
      .setLabel('Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(paginaAtual === 0),
    new ButtonBuilder()
      .setCustomId(`habilidades_next_${tipo}`)
      .setLabel('Próxima')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(paginaAtual === totalPaginas - 1)
  );
  return row;
}

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const sub = interaction.options.getSubcommand();
  let listaCompleta = [];
  let tipo = '';

  try {
    if (sub === 'magia') {
      const nivel = interaction.options.getInteger('nivel');
      const escola = interaction.options.getString('escola');
      let url = 'https://www.dnd5eapi.co/api/spells';
      const params = [];
      if (nivel !== null) params.push(`level=${nivel}`);
      if (escola) params.push(`school=${escola}`);
      if (params.length) url += '?' + params.join('&');
      const res = await axios.get(url);
      listaCompleta = res.data.results;
      tipo = 'Magias';
    } else { // sub === 'features'
      const classe = interaction.options.getString('classe');
      const res = await axios.get(`https://www.dnd5eapi.co/api/classes/${classe}/features`);
      listaCompleta = res.data.results;
      tipo = 'Features';
    }
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return await interaction.editReply(`❌ Nenhum ${tipo.toLowerCase()} encontrada com esses filtros.`);
    }
    console.error(`Erro ao buscar ${tipo.toLowerCase()}:`, err);
    return await interaction.editReply(`❌ Ocorreu um erro ao buscar as ${tipo.toLowerCase()}.`);
  }

  if (listaCompleta.length === 0) {
    return await interaction.editReply(`❌ Nenhum ${tipo.toLowerCase()} encontrada com esses filtros.`);
  }

  let paginaAtual = 0;
  const totalPaginas = Math.ceil(listaCompleta.length / ITENS_POR_PAGINA);

  const embed = criarEmbedPagina(listaCompleta, paginaAtual, totalPaginas, tipo);
  const botoes = criarBotoes(paginaAtual, totalPaginas, tipo);

  const mensagem = await interaction.editReply({ embeds: [embed], components: [botoes], fetchReply: true });

  const filter = i =>
    (i.customId.startsWith('habilidades_prev_') || i.customId.startsWith('habilidades_next_')) &&
    i.user.id === interaction.user.id;

  const collector = mensagem.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter,
    time: 120000,
  });

  collector.on('collect', async i => {
    if (i.customId.startsWith('habilidades_prev_')) {
      paginaAtual = Math.max(paginaAtual - 1, 0);
    } else if (i.customId.startsWith('habilidades_next_')) {
      paginaAtual = Math.min(paginaAtual + 1, totalPaginas - 1);
    }

    const novoEmbed = criarEmbedPagina(listaCompleta, paginaAtual, totalPaginas, tipo);
    const novosBotoes = criarBotoes(paginaAtual, totalPaginas, tipo);

    await i.update({ embeds: [novoEmbed], components: [novosBotoes] });
  });

  collector.on('end', async () => {
    try {
      const embedFinal = criarEmbedPagina(listaCompleta, paginaAtual, totalPaginas, tipo);
      await interaction.editReply({ embeds: [embedFinal], components: [] });
    } catch (error) {
      console.error('Erro ao desabilitar botões de habilidades:', error);
    }
  });
}