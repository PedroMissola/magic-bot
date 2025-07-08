export default async function handleRollMessage(message) {
  if (message.author.bot) return;

  const input = message.content.toLowerCase().replace(/\s+/g, '');
  const match = input.match(/^(\d+)d(\d+)([\+\-](\d+|vantagem|desvantagem))?$/);
  if (!match) return;

  const quantidade = parseInt(match[1]);
  const dado = parseInt(match[2]);
  const modificadorRaw = match[3];

  if (quantidade > 100 || dado > 1000) {
    return message.reply('❌ Calma aí! Esse dado é grande demais. Máximo: 100 dados de até 1000 lados.');
  }

  let resultadoFinal = 0;
  let detalhes = '';

  if (modificadorRaw === '+vantagem' || modificadorRaw === '+desvantagem') {
    const r1 = Math.floor(Math.random() * dado) + 1;
    const r2 = Math.floor(Math.random() * dado) + 1;
    const escolhido = modificadorRaw === '+vantagem' ? Math.max(r1, r2) : Math.min(r1, r2);
    resultadoFinal = escolhido;
    detalhes = `(${r1} e ${r2} → **${escolhido}** com ${modificadorRaw.slice(1)})`;
  } else {
    const modificador = modificadorRaw ? parseInt(modificadorRaw) : 0;
    const rolagens = [];
    for (let i = 0; i < quantidade; i++) rolagens.push(Math.floor(Math.random() * dado) + 1);
    const soma = rolagens.reduce((a, b) => a + b, 0);
    resultadoFinal = soma + modificador;
    detalhes = `${rolagens.join(' + ')} ${modificador >= 0 ? `+ ${modificador}` : `- ${Math.abs(modificador)}`}`;
  }

  await message.reply({
    embeds: [
      {
        title: `🎲 Rolagem: \`${input}\``,
        description: `**Resultado:** ${resultadoFinal}\n**Detalhes:** ${detalhes}`,
        color: 0x5865f2
      }
    ]
  });
}
