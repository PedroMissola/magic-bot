import { EmbedBuilder } from 'discord.js';

export const data = {
  name: 'tps',
  description: 'Mostra o tempo médio de processamento (simulado)',
};

export async function execute(interaction) {
  const start = Date.now();

  // Pequeno atraso simulado
  await new Promise(res => setTimeout(res, 100));

  const end = Date.now();
  const tempo = end - start;

  const embed = new EmbedBuilder()
    .setTitle('⏱️ Tempo de Processamento')
    .setColor(0x5865f2)
    .setDescription(`Tempo estimado de resposta do bot: **${tempo}ms**`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
