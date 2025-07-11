import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

const MAX_DESC_LENGTH = 4000;

const abilityChecksTextPT = `
Quando seu personagem tenta fazer algo que não seja um ataque, como pular um buraco, abrir uma porta trancada, ou convencer um guarda, o Mestre de Jogo (**GM**) pode pedir um **teste de habilidade**. Isso testa a capacidade natural ou o treinamento do seu personagem para ter sucesso na ação.

## Como Funciona

Para cada teste, o GM escolhe uma das seis habilidades principais (Força, Destreza, Constituição, Inteligência, Sabedoria ou Carisma) e define um número de dificuldade, chamado **Classe de Dificuldade (CD)**. Quanto mais difícil a ação, maior a CD.

Veja alguns exemplos de CD:

| Dificuldade | CD |
|---|---|
| Muito fácil | 5 |
| Fácil | 10 |
| Média | 15 |
| Difícil | 20 |
| Muito difícil | 25 |
| Quase impossível| 30 |

Para fazer o teste, role um dado de 20 lados (**d20**), adicione o modificador da habilidade escolhida e outros bônus ou penalidades. Se o resultado final for **igual ou maior** que a CD, você conseguiu! Se for menor, você falhou.

## Perícias (Skills)

Cada habilidade tem várias **perícias** que são conhecimentos ou treinamentos mais específicos. Por exemplo, a perícia **Furtividade** faz parte da habilidade **Destreza**.

Quando o GM pede um teste de perícia (por exemplo, "faça um teste de **Inteligência (História)**"), você usa o modificador da habilidade (Inteligência) e, se o seu personagem for treinado nessa perícia, você pode somar um bônus especial chamado **bônus de proficiência**.

Veja as perícias de cada habilidade:

* **Força:** Atletismo
* **Destreza:** Acrobacia, Furtividade, Prestidigitação
* **Inteligência:** Arcanismo, História, Investigação, Natureza, Religião
* **Sabedoria:** Adestrar Animais, Intuição, Medicina, Percepção, Sobrevivência
* **Carisma:** Atuação, Enganação, Intimidação, Persuasão

## Situações Especiais

### Testes Opostos

Às vezes, um personagem tenta fazer algo **contra** outro. Por exemplo, um personagem tenta pegar um item no chão ao mesmo tempo que outro. Nesses casos, os dois fazem um teste de habilidade, e **quem tiver o resultado mais alto vence**. Se houver um empate, nada muda.

### Usando Perícias com Outras Habilidades

Em certas situações, o GM pode permitir que você use uma perícia com uma habilidade diferente daquela que ela normalmente usa. Por exemplo, nadar contra uma correnteza forte pode ser um teste de **Constituição (Atletismo)** em vez de Força (Atletismo). Se for o caso, o GM vai te avisar.
`;

const pages = splitText(abilityChecksTextPT, MAX_DESC_LENGTH);

function splitText(text, maxLength) {
  const parts = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxLength;
    if (end < text.length) {
      const lastNewLine = text.lastIndexOf('\n', end);
      if (lastNewLine > start) end = lastNewLine;
    }
    parts.push(text.slice(start, end));
    start = end;
  }
  return parts;
}

function createEmbed(pageIndex, totalPages) {
  return new EmbedBuilder()
    .setTitle('Testes de Habilidade')
    .setDescription(pages[pageIndex])
    .setFooter({ text: `Página ${pageIndex + 1} de ${totalPages}` })
    .setColor(0x0099ff);
}

function createButtons(pageIndex, totalPages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('checagem_prev')
      .setLabel('Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageIndex === 0),
    new ButtonBuilder()
      .setCustomId('checagem_next')
      .setLabel('Próximo')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pageIndex === totalPages - 1)
  );
}

export const data = new SlashCommandBuilder()
  .setName('checagem')
  .setDescription('Mostra a regra completa de Checagens de Habilidade paginada.');

export async function execute(interaction) {
  let paginaAtual = 0;
  const totalPaginas = pages.length;

  const embed = createEmbed(paginaAtual, totalPaginas);
  const botoes = createButtons(paginaAtual, totalPaginas);

  const mensagem = await interaction.reply({
    embeds: [embed],
    components: [botoes],
    ephemeral: true,
    fetchReply: true
  });

  const collector = mensagem.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120000,
  });

  collector.on('collect', async i => {
    if (i.customId === 'checagem_next') {
      paginaAtual = Math.min(paginaAtual + 1, totalPaginas - 1);
    } else if (i.customId === 'checagem_prev') {
      paginaAtual = Math.max(paginaAtual - 1, 0);
    }

    const novoEmbed = createEmbed(paginaAtual, totalPaginas);
    const novosBotoes = createButtons(paginaAtual, totalPaginas);

    await i.update({ embeds: [novoEmbed], components: [novosBotoes] });
  });

  collector.on('end', async () => {
    try {
      await interaction.editReply({ components: [] });
    } catch (error) {
      console.error('Erro ao desabilitar botões de checagem:', error);
    }
  });
}