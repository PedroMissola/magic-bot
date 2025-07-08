import axios from 'axios';

const data = {
  name: 'magia',
  description: 'Pesquisa uma magia do D&D 5e',
  options: [
    {
      name: 'nome',
      type: 3, // STRING
      description: 'Nome da magia (em inglês)',
      required: true
    }
  ]
};

async function execute(interaction) {
  console.log('Comando /magia executado');
  await interaction.deferReply({ ephemeral: true }); // resposta privada

  const nomeUsuario = interaction.options.getString('nome').toLowerCase();
  console.log(`Nome recebido do usuário: "${nomeUsuario}"`);

  try {
    const listaRes = await axios.get('https://www.dnd5eapi.co/api/spells');
    const spells = listaRes.data.results;

    const nomeFormatado = nomeUsuario.replace(/\s+/g, '');
    const magiaEncontrada = spells.find(spell =>
      spell.index.replace(/-/g, '') === nomeFormatado ||
      spell.name.toLowerCase().replace(/\s+/g, '') === nomeFormatado
    );

    if (!magiaEncontrada) {
      return interaction.editReply({
        content: '❌ Magia não encontrada. Tente escrever corretamente em inglês (ex: fireball)'
      });
    }

    const { data } = await axios.get(`https://www.dnd5eapi.co/api/spells/${magiaEncontrada.index}`);

    await interaction.editReply({
      embeds: [
        {
          title: data.name,
          description: data.desc.join('\n\n'),
          color: 0x0099ff,
          footer: { text: 'Fonte: dnd5eapi.co' }
        }
      ]
    });

  } catch (err) {
    console.error('Erro no comando /magia:', err);
    await interaction.editReply({
      content: '❌ Ocorreu um erro ao buscar a magia. Tente novamente mais tarde.'
    });
  }
}

export default { data, execute };
