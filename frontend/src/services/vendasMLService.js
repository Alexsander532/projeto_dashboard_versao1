import axios from 'axios';
import api from '../config/api';
import { fetchEstoque } from './estoqueService';

/**
 * Buscar todas as vendas do Mercado Livre
 */
export const fetchVendasML = async (filtros = {}) => {
  try {
    const limite = filtros.limite || 10000; // Aumentado para pegar todos os ~1212 registros
    const offset = filtros.offset || 0;

    const response = await api.get('/api/vendas-ml', {
      params: {
        limite,
        offset
      }
    });
    
    // O backend retorna { data: [], total: number }
    // Retornar apenas o array de dados mapeado para o formato esperado
    const vendas = response.data.data || [];
    
    console.log(`✅ Carregadas ${vendas.length} vendas do Mercado Livre do Supabase`);
    
    // Buscar dados do estoque para pegar os preços de compra
    let estoque = [];
    try {
      estoque = await fetchEstoque();
    } catch (e) {
      console.warn('Erro ao buscar estoque:', e);
    }
    
    // Criar um mapa SKU -> precoCompra para busca rápida
    const estoqueMap = {};
    estoque.forEach(item => {
      estoqueMap[item.sku] = item.precoCompra;
    });
    
    return vendas.map(venda => {
      // Parse da data: "08/01/25 11:52:28" -> Date object
      let dataParsed;
      try {
        const [datePart, timePart] = venda.data_pedido.split(' ');
        const [dia, mes, ano] = datePart.split('/');
        const [hora, minuto, segundo] = timePart.split(':');
        
        // Converter ano de 2 dígitos para 4 dígitos (25 -> 2025)
        const anoCompleto = parseInt(ano) < 50 ? 2000 + parseInt(ano) : 1900 + parseInt(ano);
        
        dataParsed = new Date(anoCompleto, parseInt(mes) - 1, parseInt(dia), parseInt(hora), parseInt(minuto), parseInt(segundo));
      } catch (e) {
        console.warn('Erro ao fazer parse da data:', venda.data_pedido, e);
        dataParsed = new Date(); // Fallback para data atual
      }
      
      // Buscar o preço de compra do estoque, se não encontrar, usar o valor original
      const precoCompraDoEstoque = estoqueMap[venda.sku] || Number(venda.valor_comprado);
      
      return {
        pedido: venda.order_id,
        data: dataParsed,
        sku: venda.sku,
        unidades: Number(venda.quantidade),
        valor_comprado: precoCompraDoEstoque,
        valor_vendido: Number(venda.valor_vendido),
        taxas: Number(venda.taxas),
        frete: Number(venda.frete),
        ctl: Number(venda.ctl),
        valor_liquido: Number(venda.valor_liquido),
        lucro: Number(venda.lucro),
        margem_lucro: Number(venda.margem_lucro),
        envio: venda.tipo_envio,
        status: venda.status,
        orderId: venda.order_id,
        // Mantém também camelCase para compatibilidade com Dashboard
        valorComprado: precoCompraDoEstoque,
        valorVendido: Number(venda.valor_vendido),
        valorLiquido: Number(venda.valor_liquido),
        margemLucro: Number(venda.margem_lucro)
      };
    });
  } catch (error) {
    console.error('Erro ao buscar vendas ML:', error);
    throw error;
  }
};

/**
 * Buscar vendas por período
 */
export const fetchVendasMLPorPeriodo = async (dataInicio, dataFim) => {
  try {
    const response = await api.get('/api/vendas-ml/periodo', {
      params: {
        dataInicio,
        dataFim
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar vendas ML por período:', error);
    throw error;
  }
};

/**
 * Buscar vendas por SKU
 */
export const fetchVendasMLPorSku = async (sku) => {
  try {
    const response = await api.get(`/api/vendas-ml/sku/${sku}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar vendas ML por SKU:', error);
    throw error;
  }
};

/**
 * Buscar vendas por status
 */
export const fetchVendasMLPorStatus = async (status) => {
  try {
    const response = await api.get(`/api/vendas-ml/status/${status}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar vendas ML por status:', error);
    throw error;
  }
};

/**
 * Buscar venda específica por order_id
 */
export const fetchVendaMLPorOrderId = async (orderId) => {
  try {
    const response = await api.get(`/api/vendas-ml/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar venda ML:', error);
    throw error;
  }
};

/**
 * Buscar métricas de vendas ML
 */
export const fetchMetricasVendasML = async (dataInicio = null, dataFim = null) => {
  try {
    const params = {};
    if (dataInicio) params.dataInicio = dataInicio;
    if (dataFim) params.dataFim = dataFim;

    const response = await api.get('/api/vendas-ml/metricas', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar métricas vendas ML:', error);
    throw error;
  }
};

/**
 * Buscar vendas agrupadas por SKU
 */
export const fetchVendasMLAgrupadas = async () => {
  try {
    const response = await api.get('/api/vendas-ml/agrupadas');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar vendas ML agrupadas:', error);
    throw error;
  }
};

/**
 * Atualizar venda ML
 */
export const atualizarVendaML = async (orderId, dados) => {
  try {
    const response = await api.put(`/api/vendas-ml/${orderId}`, dados);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar venda ML:', error);
    throw error;
  }
};

/**
 * Deletar venda ML
 */
export const deletarVendaML = async (orderId) => {
  try {
    const response = await api.delete(`/api/vendas-ml/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar venda ML:', error);
    throw error;
  }
}; 
