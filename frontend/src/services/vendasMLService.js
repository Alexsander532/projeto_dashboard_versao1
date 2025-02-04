import axios from 'axios';
import { format } from 'date-fns';
import api from '../config/api';

export const fetchVendasML = async (filtros = {}) => {
  try {
    console.log('Iniciando busca de vendas do ML com filtros:', filtros);
    
    // Constrói os parâmetros da query
    const params = new URLSearchParams();
    
    // Formata as datas para o formato ISO
    if (filtros.dataInicial) {
      const dataInicial = new Date(filtros.dataInicial);
      dataInicial.setHours(0, 0, 0, 0);
      params.append('dataInicial', format(dataInicial, 'yyyy-MM-dd'));
    }
    
    if (filtros.dataFinal) {
      const dataFinal = new Date(filtros.dataFinal);
      dataFinal.setHours(23, 59, 59, 999);
      params.append('dataFinal', format(dataFinal, 'yyyy-MM-dd'));
    }
    
    if (filtros.sku) {
      params.append('sku', filtros.sku);
    }

    const response = await api.get(`/api/vendas?${params.toString()}`);
    console.log('Dados recebidos:', response.data);
    
    // Processa os dados recebidos mapeando para os nomes corretos
    return response.data.map(venda => ({
      pedido: venda.pedido,
      data: venda.data,
      sku: venda.sku,
      unidades: Number(venda.unidades),
      valorComprado: Number(venda.valor_comprado),
      valorVendido: Number(venda.valor_vendido),
      taxas: Number(venda.taxas),
      frete: Number(venda.frete),
      ctl: Number(venda.ctl),
      valorLiquido: Number(venda.valor_liquido),
      lucro: Number(venda.lucro),
      margemLucro: Number(venda.margem_lucro),
      envio: venda.envio
    }));
  } catch (error) {
    console.error('Erro ao buscar vendas do Mercado Livre:', error.response?.data || error.message);
    throw new Error('Não foi possível carregar os dados de vendas. Por favor, tente novamente.');
  }
};

export const fetchMetricas = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filtros.dataInicial) {
      const dataInicial = new Date(filtros.dataInicial);
      dataInicial.setHours(0, 0, 0, 0);
      params.append('dataInicial', format(dataInicial, 'yyyy-MM-dd'));
    }
    
    if (filtros.dataFinal) {
      const dataFinal = new Date(filtros.dataFinal);
      dataFinal.setHours(23, 59, 59, 999);
      params.append('dataFinal', format(dataFinal, 'yyyy-MM-dd'));
    }

    const response = await api.get(`/api/vendas/metricas?${params.toString()}`);
    
    return {
      ...response.data,
      valor_total_vendido: Number(response.data.valor_total_vendido) || 0,
      valor_total_comprado: Number(response.data.valor_total_comprado) || 0,
      lucro_total: Number(response.data.lucro_total) || 0,
      margem_media: Number(response.data.margem_media) || 0,
      total_pedidos: Number(response.data.total_pedidos) || 0,
      total_unidades: Number(response.data.total_unidades) || 0,
      total_skus: Number(response.data.total_skus) || 0
    };
  } catch (error) {
    console.error('Erro ao buscar métricas:', error.response?.data || error.message);
    throw new Error('Não foi possível carregar as métricas. Por favor, tente novamente.');
  }
};

export const fetchMargins = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filtros.dataInicial) {
      const dataInicial = new Date(filtros.dataInicial);
      dataInicial.setHours(0, 0, 0, 0);
      params.append('dataInicial', format(dataInicial, 'yyyy-MM-dd'));
    }
    
    if (filtros.dataFinal) {
      const dataFinal = new Date(filtros.dataFinal);
      dataFinal.setHours(23, 59, 59, 999);
      params.append('dataFinal', format(dataFinal, 'yyyy-MM-dd'));
    }

    const response = await api.get(`/api/vendas/margins?${params.toString()}`);
    return response.data.margins;
  } catch (error) {
    console.error('Erro ao buscar margens:', error.response?.data || error.message);
    throw new Error('Não foi possível carregar as margens. Por favor, tente novamente.');
  }
}; 
