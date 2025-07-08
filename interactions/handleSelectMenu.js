import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { EmbedBuilder } from 'discord.js';

export default async function handleSelectMenu(interaction) {
  const { customId, values, user } = interaction;

  // Monstro selecionado
  if (customId === 'selecionar_monstro') {
    const monstroSelecionado = values[0];

    try {
      const res = await axios.get(`https://www.dnd5eapi.co/api/monsters/${monstroSelecionado}`);
      const m = res.data;

      const embed = new EmbedBuilder()
        .setTitle(`🧟 ${m.name}`)
        .setDescription(`**Tipo:** ${m.type}\n**Alinhamento:** ${m.alignment}\n**PV:** ${m.hit_points}\n**CA:** ${m.armor_class}\n**Deslocamento:** ${m.speed.walk || 'N/A'}`)
        .setColor(0x9b59b6)
        .setFooter({ text: 'Fonte: dnd5eapi.co' });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error('Erro ao buscar detalhes do monstro:', err);
      await interaction.reply({ content: '❌ Erro ao buscar detalhes do monstro.', ephemeral: true });
    }
  }

  // Deus selecionado
  else if (customId === 'selecionar_deus') {
    const deusSelecionado = values[0];
    const filePath = path.resolve('data/deuses.json');
    const deuses = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const deus = deuses.find(d => d.id === deusSelecionado);

    if (!deus) {
      return await interaction.reply({ content: '❌ Deus não encontrado.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle(`🛐 ${deus.nome}`)
      .setDescription(`_${deus.titulo}_\n\n${deus.descricao}`)
      .setColor(0xFFD700)
      .setFooter({ text: 'Mundo de Valkyrie' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Magia selecionada (exemplo de uso, adapte conforme seu /magias)
  else if (customId === 'selecionar_magia') {
    const magiaSelecionada = values[0];

    try {
      const res = await axios.get(`https://www.dnd5eapi.co/api/spells/${magiaSelecionada}`);
      const magia = res.data;

      const descricao = Array.isArray(magia.desc) ? magia.desc.join('\n\n') : magia.desc;

      const embed = new EmbedBuilder()
        .setTitle(`✨ ${magia.name}`)
        .setDescription(descricao)
        .setColor(0x0099ff)
        .setFooter({ text: 'Fonte: dnd5eapi.co' });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error('Erro ao buscar detalhes da magia:', err);
      await interaction.reply({ content: '❌ Erro ao buscar detalhes da magia.', ephemeral: true });
    }
  }

  // Caso não seja nenhum dos customIds esperados
  else {
    await interaction.reply({ content: '❌ Ação inválida.', ephemeral: true });
  }
}
