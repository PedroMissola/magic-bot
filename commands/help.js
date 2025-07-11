import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

// Definição das categorias de comandos com os nomes e descrições corretos
const categorias = {
  gerais: {
    title: '📋 Comandos Gerais',
    description: 'Comandos básicos e utilitários do bot.',
    fields: [
      { name: '`/ping`', value: 'Mostra a latência da API e do WebSocket.' },
      { name: '`/tps`', value: 'Simula o tempo médio de processamento de tarefas.' },
      { name: '`/help`', value: 'Mostra esta lista de comandos.' },
    ],
  },
  regras: {
    title: '📜 Regras',
    description: 'Comandos para consultar regras e conceitos do D&D 5e e de Valkyrie.',
    fields: [
      { name: '`/checagem`', value: 'Mostra a regra completa de Checagens de Habilidade.' },
      { name: '`/condicao nome:<nome>`', value: 'Exibe detalhes sobre uma condição (ex: `paralyzed`).' },
      { name: '`/dano tipo:<tipo>`', value: 'Exibe detalhes sobre um tipo de dano (ex: `fire`, `slashing`).' },
    ],
  },
  personagem: {
    title: '🧙‍♂️ Personagem e Itens',
    description: 'Comandos para gerenciar dados do jogador e itens.',
    fields: [
      { name: '`/player status`', value: 'Mostra o status atual do seu personagem.' },
      { name: '`/player set campo:<campo> valor:<valor>`', value: 'Atualiza um campo dos seus dados. Ex: `vida`, `mana`, `xp`, `forca`.' },
      { name: '`/item info nome:<nome>`', value: 'Mostra informações detalhadas de um item de equipamento.' },
      { name: '`/item magic nome:<nome>`', value: 'Busca e mostra um item mágico.' },
      { name: '`/item categoria nome:<nome>`', value: 'Lista itens de uma categoria específica.' },
    ],
  },
  bestiario: {
    title: '👹 Bestiário e Mundo',
    description: 'Comandos para consultar informações sobre monstros e deuses.',
    fields: [
      { name: '`/monstros`', value: 'Lista todos os monstros disponíveis.' },
      { name: '`/monstro nome:<nome>`', value: 'Mostra detalhes de um monstro específico (nome em inglês, ex: `goblin`).' },
      { name: '`/deus nome:<nome>`', value: 'Mostra informações de um deus específico do cenário de Valkyrie.' },
    ],
  },
  habilidadesMagias: {
    title: '✨ Habilidades e Magias',
    description: 'Comandos para buscar habilidades de classe e magias do D&D 5e.',
    fields: [
      { name: '`/habilidade magia nome:<nome>`', value: 'Busca uma magia pelo nome (em inglês, ex: `fire-ball`).' },
      { name: '`/habilidade feature nome:<nome>`', value: 'Busca uma feature (habilidade) pelo nome/index.' },
      { name: '`/habilidades magia [filtros]`', value: 'Lista magias com filtros por nível e escola.' },
      { name: '`/habilidades feature classe:<classe>`', value: 'Lista as features de uma classe específica.' },
    ],
  },
};

const categoriaKeys = Object.keys(categorias);

function criarEmbed(categoriaKey) {
  const cat = categorias[categoriaKey];
  return new EmbedBuilder()
    .setTitle(cat.title)
    .setColor(0x5865f2)
    .setDescription(cat.description)
    .addFields(cat.fields)
    .setFooter({ text: 'Use os botões para navegar entre as categorias.' });
}

function criarBotoes(categoriaAtual) {
  const row = new ActionRowBuilder();
  categoriaKeys.forEach(key => {
    const cat = categorias[key];
    const label = cat.title.split(' ')[1]; // Pega a segunda palavra como label
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`help_${key}`)
        .setLabel(label)
        .setStyle(categoriaAtual === key ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );
  });
  return row;
}

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Mostra todos os comandos disponíveis');

export async function execute(interaction) {
  const categoriaInicial = 'gerais';
  const embed = criarEmbed(categoriaInicial);
  const botoes = criarBotoes(categoriaInicial);

  await interaction.reply({ embeds: [embed], components: [botoes], ephemeral: true });

  const filter = i => i.customId.startsWith('help_') && i.user.id === interaction.user.id;

  const collector = interaction.channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter,
    time: 120000,
  });

  collector.on('collect', async i => {
    const novaCategoria = i.customId.replace('help_', '');

    const novoEmbed = criarEmbed(novaCategoria);
    const novosBotoes = criarBotoes(novaCategoria);

    await i.update({ embeds: [novoEmbed], components: [novosBotoes] });
  });

  collector.on('end', async () => {
    try {
      // Remover os botões quando o coletor expirar
      await interaction.editReply({ components: [] });
    } catch (error) {
      console.error('Erro ao desabilitar botões do help:', error);
    }
  });
}