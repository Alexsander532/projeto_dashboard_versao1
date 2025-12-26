// frontend/src/services/comprasService.js

import api from '../config/api';

/**
 * Criar novo pedido de compra
 */
export const criarPedido = async (dadosPedido) => {
  try {
    const response = await api.post('/api/compras', dadosPedido);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    throw error;
  }
};

/**
 * Buscar todos os pedidos
 */
export const buscarPedidos = async (filtros = {}) => {
  try {
    const params = {};
    if (filtros.status) params.status = filtros.status;
    if (filtros.fornecedor) params.fornecedor = filtros.fornecedor;

    const response = await api.get('/api/compras', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    throw error;
  }
};

/**
 * Buscar pedido por ID
 */
export const buscarPedidoPorId = async (id) => {
  try {
    const response = await api.get(`/api/compras/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    throw error;
  }
};

/**
 * Atualizar status do pedido
 */
export const atualizarStatusPedido = async (id, novoStatus) => {
  try {
    const response = await api.put(`/api/compras/${id}/status`, { status: novoStatus });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
};

/**
 * Atualizar pedido completo (incluindo itens)
 */
export const atualizarPedido = async (id, dadosAtualizados) => {
  try {
    const response = await api.put(`/api/compras/${id}`, dadosAtualizados);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    throw error;
  }
};

/**
 * Buscar histórico de movimentações de um pedido
 */
export const buscarHistoricoPedido = async (id) => {
  try {
    const response = await api.get(`/api/compras/${id}/historico`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    throw error;
  }
};

/**
 * Deletar pedido
 */
export const deletarPedido = async (id) => {
  try {
    const response = await api.delete(`/api/compras/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    throw error;
  }
};

/**
 * Buscar métricas financeiras
 */
export const buscarMetricasFinanceiras = async () => {
  try {
    const response = await api.get('/api/compras/metricas');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    throw error;
  }
};
