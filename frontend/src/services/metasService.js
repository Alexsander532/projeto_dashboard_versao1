import api from '../config/api';
import { format } from 'date-fns';

export const fetchMetas = async (mesAno) => {
  try {
    // Garantir que a data esteja no formato correto para a API
    const data = new Date(mesAno);
    const formattedDate = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-01`;
    
    const response = await api.get(`/api/metas?mes_ano=${formattedDate}`);
    console.log('Metas recebidas:', response.data);
    
    // Processar os dados para o formato esperado pelo componente
    return response.data.reduce((acc, meta) => {
      if (meta.meta_vendas) acc.goals[meta.sku] = parseFloat(meta.meta_vendas);
      if (meta.meta_margem) acc.marginGoals[meta.sku] = parseFloat(meta.meta_margem);
      return acc;
    }, { goals: {}, marginGoals: {} });
  } catch (error) {
    console.error('Erro ao carregar metas:', error);
    throw new Error('Falha ao carregar metas');
  }
};

export const updateMeta = async (sku, data) => {
  try {
    // Garantir que a data esteja no formato correto para a API
    const mesAno = `${data.ano}-${String(data.mes).padStart(2, '0')}-01`;
    
    await api.post(`/api/metas/${sku}`, {
      meta_vendas: data.metaVendas,
      meta_margem: data.metaMargem,
      mes_ano: mesAno
    });
    
    console.log(`Meta atualizada para SKU ${sku}`);
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    throw new Error('Falha ao atualizar meta');
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
    console.log('Resposta bruta da API métricas para metas:', response.data);
    
    // Processar os dados exatamente como na página do Mercado Livre
    const metricas = {
      totalVendas: Number(response.data.valor_total_vendido || 0),
      totalUnidades: Number(response.data.total_unidades || 0),
      margemMedia: Number(response.data.margem_media || 0)
    };
    
    // Log detalhado para depuração
    console.log('Métricas formatadas para metas:', metricas);
    
    return metricas;
  } catch (error) {
    console.error('Erro ao buscar métricas para metas:', error);
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
      console.error('Formato de dados inválido:', response.data);
      return [];
    }
    
    // Processar os dados exatamente como na página do ML
    const vendasProcessadas = response.data.map(venda => ({
      ...venda,
      valor_vendido: Number(venda.valor_vendido || 0),
      unidades: Number(venda.unidades || 0),
      margem_lucro: Number(venda.margem_lucro || 0)
    }));
    
    console.log(`Recebidas ${vendasProcessadas.length} SKUs com vendas`);
    return vendasProcessadas;
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    return [];
  }
}; 