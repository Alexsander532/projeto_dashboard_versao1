// backend/src/routes/vendasML.js

const express = require('express');
const router = express.Router();
const {
  buscarTodasVendas,
  buscarVendasPorPeriodo,
  buscarVendasPorSku,
  buscarVendasPorStatus,
  buscarVendaPorOrderId,
  buscarMetricasVendas,
  buscarVendasPorSkuAgrupadas,
  atualizarVenda,
  deletarVenda
} = require('../services/vendasMLService');

/**
 * GET /api/vendas-ml/metricas
 * Calcular métricas de vendas
 */
router.get('/metricas', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    const metricas = await buscarMetricasVendas(dataInicio, dataFim);
    res.json(metricas);
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vendas-ml/agrupadas
 * Buscar vendas agrupadas por SKU
 */
router.get('/agrupadas', async (req, res) => {
  try {
    const vendas = await buscarVendasPorSkuAgrupadas();
    res.json(vendas);
  } catch (error) {
    console.error('Erro ao buscar vendas agrupadas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vendas-ml/periodo
 * Buscar vendas por período
 */
router.get('/periodo', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({ error: 'dataInicio e dataFim são obrigatórios' });
    }

    const vendas = await buscarVendasPorPeriodo(dataInicio, dataFim);
    res.json(vendas);
  } catch (error) {
    console.error('Erro ao buscar vendas por período:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vendas-ml/status/:status
 * Buscar vendas por status
 */
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const vendas = await buscarVendasPorStatus(status);
    res.json(vendas);
  } catch (error) {
    console.error('Erro ao buscar vendas por status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vendas-ml/sku/:sku
 * Buscar vendas por SKU
 */
router.get('/sku/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const vendas = await buscarVendasPorSku(sku);
    res.json(vendas);
  } catch (error) {
    console.error('Erro ao buscar vendas por SKU:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vendas-ml/:orderId
 * Buscar venda específica por order_id
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const venda = await buscarVendaPorOrderId(orderId);

    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }

    res.json(venda);
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/vendas-ml/:orderId
 * Atualizar venda
 */
router.put('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const venda = await atualizarVenda(orderId, req.body);
    res.json(venda);
  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/vendas-ml/:orderId
 * Deletar venda
 */
router.delete('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const venda = await deletarVenda(orderId);
    res.json({ message: 'Venda deletada com sucesso', data: venda });
  } catch (error) {
    console.error('Erro ao deletar venda:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/vendas-ml
 * Buscar todas as vendas com paginação
 */
router.get('/', async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 10000; // Aumentado de 1000 para 10000
    const offset = parseInt(req.query.offset) || 0;

    const resultado = await buscarTodasVendas(limite, offset);
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
