import api from '../config/api';

// Buscar todas as vendas da Magazine Luiza
export const fetchVendasMagalu = async (params = {}) => {
  try {
    console.log('Buscando vendas Magazine Luiza com parâmetros:', params);
    
    const queryParams = new URLSearchParams();
    
    // Adicionar parâmetros de filtro se existirem
    if (params.dataInicial) {
      queryParams.append('dataInicial', params.dataInicial);
    }
    if (params.dataFinal) {
      queryParams.append('dataFinal', params.dataFinal);
    }
    if (params.mes_ano) {
      queryParams.append('mes_ano', params.mes_ano);
    }
    if (params.sku && params.sku !== 'todos') {
      queryParams.append('sku', params.sku);
    }
    
    const url = `/api/vendas-magalu${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('URL da requisição Magazine Luiza:', url);
    
    const response = await api.get(url);
    console.log('Resposta vendas Magazine Luiza:', response.data.length, 'registros');
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar vendas da Magazine Luiza:', error);
    throw error;
  }
};

// Buscar métricas de vendas da Magazine Luiza
export const fetchMetricasMagalu = async (params = {}) => {
  try {
    console.log('Buscando métricas Magazine Luiza com parâmetros:', params);
    
    const queryParams = new URLSearchParams();
    
    if (params.dataInicial) {
      queryParams.append('dataInicial', params.dataInicial);
    }
    if (params.dataFinal) {
      queryParams.append('dataFinal', params.dataFinal);
    }
    if (params.mes_ano) {
      queryParams.append('mes_ano', params.mes_ano);
    }
    
    const url = `/api/vendas-magalu/metricas${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('URL métricas Magazine Luiza:', url);
    
    const response = await api.get(url);
    console.log('Métricas Magazine Luiza recebidas:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar métricas da Magazine Luiza:', error);
    throw error;
  }
};

// Buscar vendas agrupadas por SKU (para página de metas)
export const fetchVendasMagaluPorSku = async (mesAno) => {
  try {
    console.log('Buscando vendas Magazine Luiza por SKU para:', mesAno);
    
    const response = await api.get(`/api/vendas-magalu/por-sku?mes_ano=${mesAno}`);
    console.log('Vendas Magazine Luiza por SKU:', response.data.length, 'SKUs');
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar vendas Magazine Luiza por SKU:', error);
    throw error;
  }
};

// Buscar métricas para metas da Magazine Luiza
export const fetchMetricasMetasMagalu = async (mesAno) => {
  try {
    console.log('Buscando métricas para metas Magazine Luiza:', mesAno);
    
    const response = await api.get(`/api/vendas-magalu/metricas-metas?mes_ano=${mesAno}`);
    console.log('Métricas para metas Magazine Luiza:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar métricas para metas Magazine Luiza:', error);
    throw error;
  }
};

export default {
  fetchVendasMagalu,
  fetchMetricasMagalu,
  fetchVendasMagaluPorSku,
  fetchMetricasMetasMagalu
};