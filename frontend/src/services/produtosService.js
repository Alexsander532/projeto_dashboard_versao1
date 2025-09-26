import api from '../config/api';

// ========================================
// FUNÇÕES ORIGINAIS (Tabela produtos)
// ========================================

// Buscar todos os produtos da tabela produtos (função original)
export const fetchProdutos = async () => {
  try {
    const response = await api.get('/api/produtos');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
};

// Adicionar novo produto na tabela produtos (função original)
export const addProduto = async (produto) => {
  try {
    const response = await api.post('/api/produtos', produto);
    return response.data;
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    throw error;
  }
};

// Atualizar produto existente na tabela produtos (função original)
export const updateProduto = async (sku, produto) => {
  try {
    const response = await api.put(`/api/produtos/${sku}`, produto);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    throw error;
  }
};

// Excluir produto da tabela produtos (função original)
export const deleteProduto = async (sku) => {
  try {
    const response = await api.delete(`/api/produtos/${sku}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    throw error;
  }
};

// ========================================
// NOVAS FUNÇÕES (Baseadas na tabela estoque)
// ========================================

/**
 * Buscar todos os produtos da tabela estoque
 * 
 * Esta função substitui fetchProdutos() para a nova funcionalidade.
 * Ela busca dados diretamente da tabela estoque, garantindo que
 * sempre tenhamos informações atualizadas e sincronizadas.
 * 
 * Retorna:
 * - sku: Código único do produto
 * - nome: Descrição do produto (vem do campo 'descricao' do estoque)
 * - cmv_atual: Custo da Mercadoria Vendida
 * - estoque: Quantidade disponível
 * - status: Status do produto (sempre 'ativo' por enquanto)
 * 
 * Vantagens:
 * 1. Dados sempre atualizados (fonte única de verdade)
 * 2. Não há risco de inconsistência entre tabelas
 * 3. Carregamento automático de todos os SKUs do estoque
 */
export const fetchProdutosEstoque = async () => {
  try {
    console.log('🔍 Buscando produtos da tabela estoque...');
    
    // Chama a nova rota que busca dados do estoque
    const response = await api.get('/api/estoque');
    
    console.log(`✅ ${response.data.length} produtos carregados do estoque`);
    
    // Log dos primeiros produtos para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development' && response.data.length > 0) {
      console.log('📋 Primeiros produtos:', response.data.slice(0, 3));
    }
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Erro ao buscar produtos do estoque:', error);
    
    // Log detalhado do erro para facilitar debug
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
    
    throw error;
  }
};

/**
 * Atualizar CMV de um produto específico na tabela estoque
 * 
 * Esta função permite editar o Custo da Mercadoria Vendida (CMV)
 * diretamente na tabela estoque, mantendo tudo sincronizado.
 * 
 * Parâmetros:
 * @param {string} sku - Código único do produto
 * @param {number} cmv_atual - Novo valor do CMV
 * 
 * Retorna:
 * - Objeto com mensagem de sucesso e dados atualizados do produto
 * 
 * Validações:
 * - SKU deve existir na tabela estoque
 * - CMV deve ser um número positivo
 * - Dados são validados tanto no frontend quanto no backend
 */
export const updateProdutoCMV = async (sku, cmv_atual) => {
  try {
    console.log(`💰 Atualizando CMV do produto ${sku} para R$ ${cmv_atual}`);
    
    // Validação básica no frontend antes de enviar
    if (!sku || sku.trim() === '') {
      throw new Error('SKU é obrigatório');
    }
    
    if (cmv_atual === undefined || cmv_atual === null || isNaN(cmv_atual)) {
      throw new Error('CMV deve ser um número válido');
    }
    
    if (cmv_atual < 0) {
      throw new Error('CMV deve ser um valor positivo');
    }
    
    // Chama a nova rota de atualização do estoque
    const response = await api.put(`/api/estoque/${sku}/cmv`, {
      cmv: parseFloat(cmv_atual) // Garante que é um número
    });
    
    console.log('✅ CMV atualizado com sucesso!');
    console.log('📊 Dados atualizados:', response.data.produto);
    
    return response.data;
    
  } catch (error) {
    console.error(`❌ Erro ao atualizar CMV do produto ${sku}:`, error);
    
    // Log detalhado do erro
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Mensagem:', error.response.data?.error || 'Erro desconhecido');
    }
    
    throw error;
  }
};

/**
 * Função auxiliar para formatar valores monetários
 * 
 * Converte números para formato brasileiro (R$ 99,99)
 * Útil para exibição na interface do usuário.
 */
export const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(parseFloat(valor));
};

/**
 * Função auxiliar para validar SKU
 * 
 * Verifica se o SKU está em formato válido.
 * Pode ser expandida futuramente com regras mais específicas.
 */
export const validarSKU = (sku) => {
  if (!sku || typeof sku !== 'string') {
    return false;
  }
  
  // Remove espaços e verifica se não está vazio
  const skuLimpo = sku.trim();
  return skuLimpo.length > 0;
};