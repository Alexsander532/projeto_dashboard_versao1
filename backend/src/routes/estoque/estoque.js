// backend/src/routes/estoque/estoque.js

const express = require('express');
const {
  buscarTodosEstoques,
  buscarEstoquePorSku,
  atualizarEstoque,
  atualizarQuantidade,
  atualizarQuantidadeDelta,
  atualizarCMV,
  deletarEstoque,
  buscarMetricasEstoque,
  buscarEstoquesPorStatus,
  buscarEstoquesCriticos,
} = require('../../services/estoqueService');

const router = express.Router();

/**
 * GET /api/estoque
 * Buscar todos os produtos de estoque
 */
router.get('/', async (req, res) => {
  try {
    const estoque = await buscarTodosEstoques();
    res.json(estoque);
  } catch (error) {
    console.error('Erro na rota GET /:', error);
    res.status(500).json({
      error: 'Erro ao buscar estoque',
      details: error.message,
    });
  }
});

/**
 * GET /api/estoque/metricas
 * Buscar métricas gerais de estoque
 */
router.get('/metricas', async (req, res) => {
  try {
    const metricas = await buscarMetricasEstoque();
    res.json(metricas);
  } catch (error) {
    console.error('Erro na rota GET /metricas:', error);
    res.status(500).json({
      error: 'Erro ao buscar métricas',
      details: error.message,
    });
  }
});

/**
 * GET /api/estoque/status/:status
 * Buscar produtos com status específico
 */
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const estoques = await buscarEstoquesPorStatus(status);
    res.json(estoques);
  } catch (error) {
    console.error('Erro na rota GET /status/:status:', error);
    res.status(500).json({
      error: 'Erro ao buscar estoques por status',
      details: error.message,
    });
  }
});

/**
 * GET /api/estoque/criticos
 * Buscar produtos com previsão crítica
 */
router.get('/criticos', async (req, res) => {
  try {
    const diasMinimos = req.query.dias ? parseInt(req.query.dias) : 5;
    const estoques = await buscarEstoquesCriticos(diasMinimos);
    res.json(estoques);
  } catch (error) {
    console.error('Erro na rota GET /criticos:', error);
    res.status(500).json({
      error: 'Erro ao buscar estoques críticos',
      details: error.message,
    });
  }
});

/**
 * GET /api/estoque/:sku
 * Buscar um produto específico pelo SKU
 */
router.get('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const estoque = await buscarEstoquePorSku(sku);

    if (!estoque) {
      return res.status(404).json({
        error: 'Produto não encontrado',
      });
    }

    res.json(estoque);
  } catch (error) {
    console.error('Erro na rota GET /:sku:', error);
    res.status(500).json({
      error: 'Erro ao buscar produto',
      details: error.message,
    });
  }
});

/**
 * PUT /api/estoque/:sku
 * Atualizar informações completas de um produto
 */
router.put('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const input = req.body;

    console.log(`Atualizando produto ${sku}:`, input);

    const estoque = await atualizarEstoque(sku, input);
    res.json(estoque);
  } catch (error) {
    console.error('Erro na rota PUT /:sku:', error);
    res.status(500).json({
      error: 'Erro ao atualizar produto',
      details: error.message,
    });
  }
});

/**
 * PUT /api/estoque/:sku/quantidade
 * Atualizar apenas a quantidade em estoque
 */
router.put('/:sku/quantidade', async (req, res) => {
  try {
    const { sku } = req.params;
    const { quantidade } = req.body;

    if (typeof quantidade !== 'number') {
      return res.status(400).json({
        error: 'Quantidade deve ser um número',
      });
    }

    console.log(`Atualizando quantidade do produto ${sku} para ${quantidade}`);

    const estoque = await atualizarQuantidade(sku, quantidade);
    res.json(estoque);
  } catch (error) {
    console.error('Erro na rota PUT /:sku/quantidade:', error);
    res.status(500).json({
      error: 'Erro ao atualizar quantidade',
      details: error.message,
    });
  }
});

/**
 * POST /api/estoque/:sku/quantidade
 * Adicionar ou remover quantidade (delta)
 */
router.post('/:sku/quantidade', async (req, res) => {
  try {
    const { sku } = req.params;
    const { delta } = req.body;

    if (typeof delta !== 'number') {
      return res.status(400).json({
        error: 'Delta deve ser um número',
      });
    }

    console.log(`Atualizando quantidade do produto ${sku} por delta ${delta}`);

    const estoque = await atualizarQuantidadeDelta(sku, delta);
    res.json(estoque);
  } catch (error) {
    console.error('Erro na rota POST /:sku/quantidade:', error);
    res.status(500).json({
      error: 'Erro ao atualizar quantidade',
      details: error.message,
    });
  }
});

/**
 * PUT /api/estoque/:sku/cmv
 * Atualizar apenas o CMV (preço de compra)
 */
router.put('/:sku/cmv', async (req, res) => {
  try {
    const { sku } = req.params;
    const { cmv } = req.body;

    if (typeof cmv !== 'number' || cmv < 0) {
      return res.status(400).json({
        error: 'CMV deve ser um número não-negativo',
      });
    }

    console.log(`Atualizando CMV do produto ${sku} para ${cmv}`);

    const estoque = await atualizarCMV(sku, cmv);
    res.json(estoque);
  } catch (error) {
    console.error('Erro na rota PUT /:sku/cmv:', error);
    res.status(500).json({
      error: 'Erro ao atualizar CMV',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/estoque/:sku
 * Deletar um produto do estoque
 */
router.delete('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;

    console.log(`Deletando produto ${sku}`);

    await deletarEstoque(sku);
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Erro na rota DELETE /:sku:', error);
    res.status(500).json({
      error: 'Erro ao deletar produto',
      details: error.message,
    });
  }
});

module.exports = router;
