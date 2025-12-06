// Teste rápido para validar a conexão ao Supabase
const estoqueService = require('./src/services/estoqueService');

async function teste() {
  try {
    console.log('🔍 Testando conexão ao Supabase...');
    const dados = await estoqueService.buscarTodosEstoques();
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Dados recebidos:', dados.length, 'registros');
    if (dados.length > 0) {
      console.log('📋 Primeiro registro:', dados[0]);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  process.exit(0);
}

teste();
