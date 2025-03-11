import api from './config/api';

async function testAPI() {
  try {
    console.log('Testando conexão com a API...');
    
    // Testar rota direta
    console.log('Testando rota /api/test-direto...');
    const testDireto = await api.get('/api/test-direto');
    console.log('Resultado do teste direto:', testDireto.data);
    
    // Testar rota de produtos
    console.log('Testando rota /api/produtos...');
    const produtos = await api.get('/api/produtos');
    console.log('Resultado de produtos:', produtos.data);
    
    return {
      success: true,
      testDireto: testDireto.data,
      produtos: produtos.data
    };
  } catch (error) {
    console.error('Erro ao testar API:', error);
    return {
      success: false,
      error: error.message,
      config: error.config,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    };
  }
}

// Executar o teste
testAPI().then(result => {
  console.log('Resultado final do teste:', result);
}); 