const express = require('express');
const router = express.Router();
const { 
  buscarMetricasVendas, 
  buscarVendasPorSku 
} = require('../services/vendasService');

// Rota para buscar métricas de vendas para a página de Metas
router.get('/metricas-metas', async (req, res) => {
  try {
    const { mes_ano } = req.query;
    
    if (!mes_ano) {
      return res.status(400).json({ error: 'Parâmetro mes_ano é obrigatório' });
    }
    
    console.log('📊 GET /metricas-metas - mes_ano:', mes_ano);
    const metricas = await buscarMetricasVendas(mes_ano);
    
    console.log('✅ Métricas retornadas:', metricas);
    res.json(metricas);
  } catch (error) {
    console.error('❌ Erro ao buscar métricas para metas:', error.message);
    res.status(500).json({ error: 'Erro ao buscar métricas para metas: ' + error.message });
  }
});

// Buscar vendas agrupadas por SKU para a página de metas
router.get('/por-sku', async (req, res) => {
  try {
    const { mes_ano } = req.query;
    
    if (!mes_ano) {
      return res.status(400).json({ error: 'Parâmetro mes_ano é obrigatório' });
    }
    
    console.log('📊 GET /por-sku - mes_ano:', mes_ano);
    const vendas = await buscarVendasPorSku(mes_ano);
    
    console.log(`✅ Retornando ${vendas.length} SKUs com vendas`);
    res.json(vendas);
  } catch (error) {
    console.error('❌ Erro ao buscar vendas por SKU:', error.message);
    res.status(500).json({ error: 'Erro ao buscar vendas por SKU: ' + error.message });
  }
});

module.exports = router;
