import api from '../config/api';
import { format } from 'date-fns';

export const fetchMetas = async (mesAno) => {
  try {
    // Extrair ano e mês diretamente da string para evitar problemas com timezone
    const [ano, mes, dia] = mesAno.split('-').map(Number);
    
    // Formatar a data corretamente (sem ajuste de mês)
    const formattedDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
    console.log('Buscando metas para:', formattedDate);
    
    const response = await api.get(`/api/metas?mes_ano=${formattedDate}`);
    console.log('Resposta da API de metas (Railway):', response.data);
    
    // Processar os dados para o formato esperado pelo componente
    const result = {
      goals: {},
      marginGoals: {}
    };
    
    if (Array.isArray(response.data)) {
      response.data.forEach(meta => {
        if (meta.sku) {
          if (meta.meta_vendas !== null && meta.meta_vendas !== undefined) {
            result.goals[meta.sku] = Number(meta.meta_vendas);
          }
          if (meta.meta_margem !== null && meta.meta_margem !== undefined) {
            result.marginGoals[meta.sku] = Number(meta.meta_margem);
          }
        }
      });
    }
    
    console.log('Metas processadas do Railway:', result);
    return result;
  } catch (error) {
    console.error('Erro ao carregar metas do Railway:', error);
    // Retornar objeto vazio em caso de erro para evitar quebras
    return { goals: {}, marginGoals: {} };
  }
};

export const updateMeta = async (sku, data) => {
  try {
    console.log('=== INÍCIO DA ATUALIZAÇÃO DE META ===');
    console.log('SKU:', sku);
    console.log('Dados:', data);

    const mesAno = `${data.ano}-${String(data.mes).padStart(2, '0')}-01`;
    console.log('Data formatada:', mesAno);

    const payload = {
      meta_vendas: Number(data.metaVendas),
      meta_margem: Number(data.metaMargem),
      mes_ano: mesAno
    };

    console.log('Payload da requisição:', payload);

    const response = await api.post(`/api/metas/${sku}`, payload);
    console.log('Resposta da API:', response.data);

    return true;
  } catch (error) {
    console.error('Erro na atualização:', error);
    return false;
  }
};

export const fetchMetricas = async (mesAno) => {
  try {
    console.log('Buscando métricas para:', mesAno);
    
    // Extrair ano e mês diretamente da string para evitar problemas com timezone
    const [ano, mes, dia] = mesAno.split('-').map(Number);
    
    // Formatar a data corretamente (sem ajuste de mês)
    const formattedDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
    console.log('Data formatada para API (sem ajuste):', formattedDate);
    
    // Usar a rota específica para métricas de metas
    const response = await api.get(`/api/vendas/metricas-metas?mes_ano=${formattedDate}`);
    
    // Log detalhado para depuração
    console.log('Resposta bruta da API métricas para metas (Railway):', response.data);
    
    // Processar os dados exatamente como na página do Mercado Livre
    const metricas = {
      totalVendas: Number(response.data?.valor_total_vendido || 0),
      totalUnidades: Number(response.data?.total_unidades || 0),
      margemMedia: Number(response.data?.margem_media || 0)
    };
    
    // Log detalhado para depuração
    console.log('Métricas formatadas para metas do Railway:', metricas);
    
    return metricas;
  } catch (error) {
    console.error('Erro ao buscar métricas para metas do Railway:', error);
    // Retornar valores padrão em caso de erro
    return {
      totalVendas: 0,
      totalUnidades: 0,
      margemMedia: 0
    };
  }
};

export const fetchVendas = async (mesAno) => {
  try {
    // Extrair ano e mês diretamente da string para evitar problemas com timezone
    const [ano, mes, dia] = mesAno.split('-').map(Number);
    
    // Formatar a data corretamente (sem ajuste de mês)
    const formattedDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
    console.log('Data formatada para API (sem ajuste):', formattedDate);
    
    console.log('Buscando vendas por SKU para:', formattedDate);
    const response = await api.get(`/api/vendas/por-sku?mes_ano=${formattedDate}`);
    
    if (!Array.isArray(response.data)) {
      console.error('Formato de dados inválido do Railway:', response.data);
      return [];
    }
    
    // Processar os dados exatamente como na página do ML
    const vendasProcessadas = response.data.map(venda => ({
      ...venda,
      valor_vendido: Number(venda.valor_vendido || 0),
      unidades: Number(venda.unidades || 0),
      margem_lucro: Number(venda.margem_lucro || 0)
    }));
    
    console.log(`Recebidas ${vendasProcessadas.length} SKUs com vendas do Railway`);
    return vendasProcessadas;
  } catch (error) {
    console.error('Erro ao buscar vendas do Railway:', error);
    return [];
  }
}; 