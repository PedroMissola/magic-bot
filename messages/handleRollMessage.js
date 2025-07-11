import { EmbedBuilder } from 'discord.js';
import { db } from '../firebase.js'; // Seu firebase-admin configurado
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

const iniciativas = new Map();

function formatarDataHoje() {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = String(agora.getFullYear()).slice(-2);
  return `${dia}_${mes}_${ano}`;
}

async function salvarRolagem(guildId, userId, conteudo, resultado, detalhes) {
  const dataHoje = formatarDataHoje();

  const ref = db
    .collection(guildId)
    .doc('Rolagens')
    .collection(userId)
    .doc(dataHoje);

  const novaRolagem = {
    timestamp: Timestamp.now(),
    input: conteudo,
    total: resultado,
    detalhes,
  };

  await ref.set(
    {
      rolagens: FieldValue.arrayUnion(novaRolagem),
    },
    { merge: true }
  );
}

export default async function handleRollMessage(message) {
  if (message.author.bot) return;

  const content = message.content.trim().toLowerCase();

  // Comando especial de iniciativa
  const iniciativaMatch = content.match(/^iniciativa\(([-+]?\d+)\)$/);
  if (iniciativaMatch) {
    const modificador = parseInt(iniciativaMatch[1]);
    const guildId = message.guild.id;
    const userId = message.author.id;

    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + modificador;

    const detalhes = [
      `🎲 **1d20**: [${roll}]`,
      `➕ **Modificador**: ${modificador >= 0 ? `+${modificador}` : modificador}`,
    ];

    if (!iniciativas.has(guildId)) {
      iniciativas.set(guildId, []);
    }

    iniciativas.get(guildId).push({
      user: message.author,
      valor: total,
    });

    const listaOrdenada = [...iniciativas.get(guildId)]
      .sort((a, b) => b.valor - a.valor)
      .map((item, i) => `${i + 1}º - ${item.user} (${item.valor})`);

    const embed = new EmbedBuilder()
      .setTitle(`📋 Ordem das Iniciativas`)
      .setDescription(listaOrdenada.join('\n'))
      .setColor(0x00b0f4);

    await salvarRolagem(guildId, userId, `iniciativa(${modificador})`, total, detalhes);

    return await message.reply({ embeds: [embed] });
  }

  // Regex para rolagens puras, suportando múltiplos dados e modificadores
  const rollRegex = /^([a-z0-9d+\- ]+)$/;
  if (!rollRegex.test(content)) return;

  // Usa regex para separar todos os tokens da rolagem
  const tokens = content
    .replace(/\s+/g, '')
    .match(/(vantagem|desvantagem)|([+-]?[\d]*d\d+)|([+-]?\d+)/g);

  if (!tokens || tokens.length === 0) return;

  let total = 0;
  const detalhes = [];
  let erro = null;
  let d20ComVantagemUsado = false;

  const isAdvantage = tokens.includes('vantagem');
  const isDisadvantage = tokens.includes('desvantagem');

  for (const token of tokens) {
    // Ignora as palavras-chave, pois elas são tratadas no loop
    if (token === 'vantagem' || token === 'desvantagem') continue;

    if (token.includes('d')) {
      const sinal = token.startsWith('-') ? -1 : 1;
      const cleanToken = token.replace(/^[-+]/, '');
      const [qtdStr, ladosStr] = cleanToken.split('d');
      const qtd = parseInt(qtdStr) || 1;
      const lados = parseInt(ladosStr);

      if (qtd > 100 || lados > 1000) {
        erro = `❌ Rolagem inválida: limite de até 100 dados de 1000 lados. (${qtd}d${lados})`;
        break;
      }

      // Aplica a lógica de vantagem/desvantagem apenas no primeiro 1d20
      if (lados === 20 && qtd === 1 && (isAdvantage || isDisadvantage) && !d20ComVantagemUsado) {
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;
        const final = isAdvantage ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
        total += final * sinal;
        detalhes.push(`🎲 **1d20 (${isAdvantage ? 'Vantagem' : 'Desvantagem'})**: [${roll1}, ${roll2}] → **${final}**`);
        d20ComVantagemUsado = true;
      } else {
        const rolls = Array.from({ length: qtd }, () => Math.floor(Math.random() * lados) + 1);
        const sum = rolls.reduce((a, b) => a + b, 0) * sinal;
        total += sum;
        detalhes.push(`🎲 **${sinal < 0 ? '-' : ''}${qtd}d${lados}**: [${rolls.join(', ')}] = ${sum}`);
      }

    } else {
      const valor = parseInt(token);
      total += valor;
      detalhes.push(`➕ **Modificador**: ${valor > 0 ? `+${valor}` : valor}`);
    }
  }

  if (erro) {
    return message.reply({ content: erro });
  }

  if (detalhes.length === 0) return;

  const embed = new EmbedBuilder()
    .setTitle(`🎲 Rolagem: \`${content}\``)
    .setDescription(`**Resultado Final:** ${total}`)
    .addFields({ name: 'Detalhes da Rolagem', value: detalhes.join('\n') })
    .setColor(0x5865f2);

  await message.reply({ embeds: [embed] });

  await salvarRolagem(
    message.guild.id,
    message.author.id,
    content,
    total,
    detalhes
  );
}