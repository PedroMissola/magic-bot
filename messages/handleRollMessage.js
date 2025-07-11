import { EmbedBuilder } from 'discord.js';

export default async function handleRollMessage(message) {
  if (message.author.bot) return;

  const content = message.content.trim().toLowerCase();

  // Regex para encontrar rolagens de dados (NdN), modificadores (+-N) e palavras-chave
  const regex = /(\d+d\d+)|(\+\d+)|(-\d+)|(vantagem)|(desvantagem)/g;
  const matches = [...content.matchAll(regex)];

  if (matches.length === 0) {
    // Se a mensagem não contém nenhum dado de rolagem, ignora
    return;
  }

  let total = 0;
  const rolagensDetalhes = [];
  let isAdvantage = false;
  let isDisadvantage = false;
  let hasRolledD20 = false;
  let erro = null;

  // Primeiro loop: Identifica as flags de vantagem/desvantagem
  // e verifica se o d20 está presente.
  for (const match of matches) {
    if (match[0] === 'vantagem') {
      isAdvantage = true;
    } else if (match[0] === 'desvantagem') {
      isDisadvantage = true;
    }
  }

  // Segundo loop: Realiza as rolagens e cálculos
  for (const match of matches) {
    const token = match[0];
    
    if (token.includes('d')) {
      const [qtd, lados] = token.split('d').map(Number);
      
      if (qtd > 100 || lados > 1000) {
        erro = 'Valores de rolagem muito altos (máx: 100d1000).';
        break;
      }

      if (lados === 20 && qtd === 1 && (isAdvantage || isDisadvantage) && !hasRolledD20) {
        // Lógica para d20 com Vantagem/Desvantagem
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;
        const chosenRoll = isAdvantage ? Math.max(roll1, roll2) : Math.min(roll1, roll2);
        
        total += chosenRoll;
        rolagensDetalhes.push(`🎲 **1d20 (${isAdvantage ? 'Vantagem' : 'Desvantagem'})**: [${roll1}, ${roll2}] → **${chosenRoll}**`);
        hasRolledD20 = true; // Garante que a lógica do d20 só seja executada uma vez
      } else {
        // Rolagem de dados normal
        const rolls = [];
        for (let i = 0; i < qtd; i++) {
          rolls.push(Math.floor(Math.random() * lados) + 1);
        }
        const sum = rolls.reduce((a, b) => a + b, 0);
        total += sum;
        rolagensDetalhes.push(`🎲 **${token}**: [${rolls.join(', ')}] = ${sum}`);
      }
    } else if (token.startsWith('+') || token.startsWith('-')) {
      // Modificador numérico
      const value = parseInt(token);
      total += value;
      rolagensDetalhes.push(`➕ **Modificador**: ${value > 0 ? `+${value}` : value}`);
    }
  }
  
  if (erro) {
    return message.reply({ content: `❌ Erro na sua rolagem: ${erro}` });
  }

  // Se nenhuma rolagem foi feita, o bot não responde
  if (rolagensDetalhes.length === 0) {
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎲 Rolagem: \`${content}\``)
    .setDescription(`**Resultado Final:** ${total}`)
    .addFields({ name: 'Detalhes da Rolagem', value: rolagensDetalhes.join('\n') || 'N/A' })
    .setColor(0x5865f2);

  await message.reply({ embeds: [embed] });
}