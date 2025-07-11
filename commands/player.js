// commands/player.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { db } from '../firebase.js';

const camposDisponiveis = [
  { name: 'Nível', value: 'nivel', type: 'number', min: 1, max: 20, section: 'basico' },
  { name: 'Vida', value: 'vida', type: 'number', min: 0, section: 'basico' },
  { name: 'Moedas', value: 'moedas', type: 'number', min: 0, section: 'basico' },
  { name: 'CA', value: 'armadura', type: 'number', min: 0, section: 'basico' },
  { name: 'Força', value: 'forca', type: 'number', min: 1, max: 30, section: 'atributos' },
  { name: 'Destreza', value: 'destreza', type: 'number', min: 1, max: 30, section: 'atributos' },
  { name: 'Constituição', value: 'constituicao', type: 'number', min: 1, max: 30, section: 'atributos' },
  { name: 'Inteligência', value: 'inteligencia', type: 'number', min: 1, max: 30, section: 'atributos' },
  { name: 'Sabedoria', value: 'sabedoria', type: 'number', min: 1, max: 30, section: 'atributos' },
  { name: 'Carisma', value: 'carisma', type: 'number', min: 1, max: 30, section: 'atributos' }
];

const builder = new SlashCommandBuilder()
  .setName('player')
  .setDescription('Gerencia seus dados de jogador')
  .addSubcommand(sub =>
    sub.setName('status')
      .setDescription('Mostra seus dados salvos'));

// Adiciona dinamicamente as opções para o subcomando 'set'
const setSubcommand = sub => {
  sub.setName('set').setDescription('Atualiza um ou mais campos dos seus dados');
  camposDisponiveis.forEach(campo => {
    sub.addNumberOption(opt =>
      opt.setName(campo.value)
        .setDescription(`Novo valor para ${campo.name}`)
        .setRequired(false)
    );
  });
  return sub;
};

builder.addSubcommand(setSubcommand);

export const data = builder;

export async function execute(interaction) {
  // Impede que o comando seja usado em DMs
  if (!interaction.inGuild()) {
      return await interaction.reply({ content: '❌ Este comando só pode ser usado em um servidor.', ephemeral: true });
  }

  const sub = interaction.options.getSubcommand();
  
  // Ajusta a referência do documento para incluir o guild ID
  const playerRef = db.collection(interaction.guild.id).doc(interaction.user.id);

  if (sub === 'status') {
    const doc = await playerRef.get();
    if (!doc.exists) {
      return await interaction.reply({ content: '❌ Você ainda não tem dados salvos. Use `/player set` para começar.', ephemeral: true });
    }

    const dados = doc.data();
    const embed = new EmbedBuilder()
      .setTitle(`Status do Jogador: ${interaction.user.username}`)
      .setDescription('Use `/player set` para atualizar seus dados.')
      .setColor(0x3498db);
    
    // Filtra e adiciona campos de Atributos
    const atributosFields = camposDisponiveis
      .filter(c => c.section === 'atributos')
      .map(campo => ({
        name: campo.name,
        value: (dados[campo.value] || 'Não definido').toString(),
        inline: true
      }));

    // Filtra e adiciona campos Básicos
    const basicoFields = camposDisponiveis
      .filter(c => c.section === 'basico')
      .map(campo => ({
        name: campo.name,
        value: (dados[campo.value] || 'Não definido').toString(),
        inline: true
      }));

    embed.addFields(
      { name: 'Dados Básicos', value: '\u200B', inline: false },
      ...basicoFields,
      { name: '\u200B', value: '\u200B', inline: false },
      { name: 'Atributos', value: '\u200B', inline: false },
      ...atributosFields
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } else if (sub === 'set') {
    await interaction.deferReply({ ephemeral: true });

    const updates = {};
    let hasUpdates = false;

    for (const campo of camposDisponiveis) {
      const valor = interaction.options.getNumber(campo.value);
      
      if (valor !== null) {
        // Validação do valor
        if (valor < campo.min) {
          return await interaction.editReply({ content: `❌ Valor muito baixo. Mínimo para ${campo.name} é ${campo.min}.`, ephemeral: true });
        }
        if (campo.max !== undefined && valor > campo.max) {
          return await interaction.editReply({ content: `❌ Valor muito alto. Máximo para ${campo.name} é ${campo.max}.`, ephemeral: true });
        }
        updates[campo.value] = valor;
        hasUpdates = true;
      }
    }

    if (!hasUpdates) {
      return await interaction.editReply({ content: '❌ Você deve fornecer pelo menos um campo para atualizar.', ephemeral: true });
    }

    try {
      await playerRef.set(updates, { merge: true });

      const updatedFields = Object.keys(updates).map(key => {
        const campoInfo = camposDisponiveis.find(c => c.value === key);
        if (campoInfo) {
          return `**${campoInfo.name}**: ${updates[key]}`;
        }
        return null;
      }).filter(Boolean).join('\n');

      const embed = new EmbedBuilder()
        .setTitle(`✅ Campos Atualizados`)
        .setColor(0x28a745)
        .setDescription('Os seguintes campos foram atualizados:\n' + updatedFields);

      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error('Erro ao salvar no banco de dados:', err);
      await interaction.editReply({ content: '❌ Ocorreu um erro ao salvar seus dados.', ephemeral: true });
    }
  }
}