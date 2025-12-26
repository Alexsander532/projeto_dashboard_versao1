// backend/src/routes/compras.js

const express = require('express');
const {
  criarPedido,
  buscarTodosPedidos,
  buscarPedidoPorId,
  atualizarStatusPedido,
  atualizarPedido,
  atualizarPedidoCompleto,
  deletarPedido,
  buscarMetricasFinanceiras,
  buscarHistoricoPedido
} = require('../services/comprasService');

const router = express.Router();

/**
 * POST /api/compras
 * Criar novo pedido de compra
 */
router.post('/', async (req, res) => {
  try {
    const pedido = await criarPedido(req.body);
    res.status(201).json(pedido);
  } catch (error) {
    console.error('Erro na rota POST /compras:', error);
    res.status(500).json({
      error: 'Erro ao criar pedido de compra',
      details: error.message
    });
  }
});

/**
 * GET /api/compras
 * Buscar todos os pedidos (com filtros opcionais)
 */
router.get('/', async (req, res) => {
  try {
    const filtros = {
      status: req.query.status,
      fornecedor: req.query.fornecedor
    };
    
    const pedidos = await buscarTodosPedidos(filtros);
    res.json(pedidos);
  } catch (error) {
    console.error('Erro na rota GET /compras:', error);
    res.status(500).json({
      error: 'Erro ao buscar pedidos',
      details: error.message
    });
  }
});

/**
 * GET /api/compras/metricas
 * Buscar métricas financeiras dos pedidos
 */
router.get('/metricas', async (req, res) => {
  try {
    const metricas = await buscarMetricasFinanceiras();
    res.json(metricas);
  } catch (error) {
    console.error('Erro na rota GET /compras/metricas:', error);
    res.status(500).json({
      error: 'Erro ao buscar métricas',
      details: error.message
    });
  }
});

/**
 * GET /api/compras/:id/historico
 * Buscar histórico de movimentações de um pedido
 * IMPORTANTE: Esta rota deve vir ANTES de /:id para não conflitar
 */
router.get('/:id/historico', async (req, res) => {
  try {
    const { id } = req.params;
    const historico = await buscarHistoricoPedido(id);
    res.json(historico);
  } catch (error) {
    console.error('Erro na rota GET /compras/:id/historico:', error);
    res.status(500).json({
      error: 'Erro ao buscar histórico',
      details: error.message
    });
  }
});

/**
 * GET /api/compras/:id
 * Buscar pedido específico por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await buscarPedidoPorId(id);
    
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    
    res.json(pedido);
  } catch (error) {
    console.error('Erro na rota GET /compras/:id:', error);
    res.status(500).json({
      error: 'Erro ao buscar pedido',
      details: error.message
    });
  }
});

/**
 * PUT /api/compras/:id/status
 * Atualizar apenas o status do pedido
 */
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
    
    const pedido = await atualizarStatusPedido(id, status);
    res.json(pedido);
  } catch (error) {
    console.error('Erro na rota PUT /compras/:id/status:', error);
    res.status(500).json({
      error: 'Erro ao atualizar status do pedido',
      details: error.message
    });
  }
});

/**
 * PUT /api/compras/:id
 * Atualizar pedido completo (incluindo itens)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await atualizarPedidoCompleto(id, req.body);
    res.json(pedido);
  } catch (error) {
    console.error('Erro na rota PUT /compras/:id:', error);
    res.status(500).json({
      error: 'Erro ao atualizar pedido',
      details: error.message
    });
  }
});

/**
 * DELETE /api/compras/:id
 * Deletar pedido (e seus itens automaticamente via cascade)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await deletarPedido(id);
    res.json(resultado);
  } catch (error) {
    console.error('Erro na rota DELETE /compras/:id:', error);
    res.status(500).json({
      error: 'Erro ao deletar pedido',
      details: error.message
    });
  }
});

module.exports = router;
