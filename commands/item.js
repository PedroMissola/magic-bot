// commands/item.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';

export const data = new SlashCommandBuilder()
  .setName('item')
  .setDescription('Consulta itens, itens mágicos e categorias do D&D')
  .addSubcommand(sub =>
    sub.setName('info')
      .setDescription('Busca um item de equipamento (ex: longsword)')
      .addStringOption(opt =>
        opt.setName('nome')
          .setDescription('Nome do item (em inglês)')
          .setRequired(true)))
  .addSubcommand(sub =>
    sub.setName('magic')
      .setDescription('Busca um item mágico (ex: wand-of-fireballs)')
      .addStringOption(opt =>
        opt.setName('nome')
          .setDescription('Nome do item mágico (em inglês)')
          .setRequired(true)))
  .addSubcommand(sub =>
    sub.setName('categoria')
      .setDescription('Busca uma categoria de equipamento (ex: armor)')
      .addStringOption(opt =>
        opt.setName('nome')
          .setDescription('Nome da categoria (em inglês)')
          .setRequired(true)));

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const sub = interaction.options.getSubcommand();
  const nome = interaction.options.getString('nome').toLowerCase().replace(/\s+/g, '-');

  try {
    if (sub === 'info') {
      const { data: item } = await axios.get(`https://www.dnd5eapi.co/api/equipment/${nome}`);

      const embed = new EmbedBuilder()
        .setTitle(`🛡️ ${item.name}`)
        .setDescription(item.desc?.join('\n') || 'Sem descrição.')
        .setColor(0x95a5a6)
        .addFields(
          { name: 'Categoria', value: item.equipment_category?.name || 'Desconhecida', inline: true }
        )
        .setFooter({ text: 'Fonte: dnd5eapi.co' });

      if (item.weapon_category) {
        embed.addFields({ name: 'Tipo de Arma', value: item.weapon_category, inline: true });
      }
      if (item.armor_category) {
        embed.addFields({ name: 'Tipo de Armadura', value: item.armor_category, inline: true });
      }
      if (item.cost) {
        embed.addFields({ name: 'Preço', value: `${item.cost.quantity} ${item.cost.unit}`, inline: true });
      }
      if (item.weight) {
        embed.addFields({ name: 'Peso', value: `${item.weight} lb`, inline: true });
      }

      await interaction.editReply({ embeds: [embed] });
    }
    else if (sub === 'magic') {
      const { data: item } = await axios.get(`https://www.dnd5eapi.co/api/magic-items/${nome}`);

      const embed = new EmbedBuilder()
        .setTitle(`✨ ${item.name}`)
        .setColor(0xd35400)
        .setDescription(item.desc?.join('\n') || 'Sem descrição.')
        .addFields(
          { name: 'Categoria', value: item.equipment_category?.name || 'Mágico', inline: true }
        )
        .setFooter({ text: 'Fonte: dnd5eapi.co' });

      await interaction.editReply({ embeds: [embed] });
    }
    else if (sub === 'categoria') {
      const { data: cat } = await axios.get(`https://www.dnd5eapi.co/api/equipment-categories/${nome}`);

      const itemList = cat.equipment?.slice(0, 20).map(i => `• ${i.name}`).join('\n') || 'Sem itens nessa categoria.';

      const embed = new EmbedBuilder()
        .setTitle(`📂 Categoria: ${cat.name}`)
        .setColor(0x2980b9)
        .setDescription(itemList)
        .setFooter({ text: `Total: ${cat.equipment?.length || 0} itens. Exibindo os 20 primeiros.` });

      await interaction.editReply({ embeds: [embed] });
    }

  } catch (err) {
    if (err.response && err.response.status === 404) {
      return await interaction.editReply(`❌ Item ou categoria não encontrado. Verifique o nome.`);
    }
    console.error(`Erro ao buscar item ou categoria:`, err);
    await interaction.editReply(`❌ Ocorreu um erro ao buscar o item.`);
  }
}