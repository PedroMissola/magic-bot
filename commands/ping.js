import { EmbedBuilder } from 'discord.js';

export const data = {
  name: 'ping',
  description: 'Mostra a latência do bot',
};

export async function execute(interaction) {
  const sent = await interaction.reply({ content: 'Pingando...', fetchReply: true });
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  const websocket = Math.round(interaction.client.ws.ping);

  const embed = new EmbedBuilder()
    .setTitle('🏓 Pong!')
    .setColor(0x5865f2)
    .addFields(
      { name: 'Latência da API', value: `${latency}ms`, inline: true },
      { name: 'Latência do WebSocket', value: `${websocket}ms`, inline: true },
      { name: 'Status', value: websocket < 200 ? '🟢 Estável' : websocket < 400 ? '🟡 Médio' : '🔴 Alto', inline: true }
    )
    .setTimestamp();

  await interaction.editReply({ content: null, embeds: [embed] });
}
