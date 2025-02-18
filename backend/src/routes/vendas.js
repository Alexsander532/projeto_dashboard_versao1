const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Buscar todas as vendas
router.get('/vendas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM vendas_ml 
      ORDER BY data DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
});

// Buscar vendas por período
router.get('/vendas/periodo', async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    
    const result = await pool.query(`
      SELECT * FROM vendas_ml 
      WHERE data BETWEEN $1 AND $2
      ORDER BY data DESC
    `, [inicio, fim]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar vendas por período:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas por período' });
  }
});

// Buscar métricas de vendas
router.get('/vendas/metricas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_vendas,
        SUM(valor_vendido) as valor_total,
        AVG(valor_vendido) as ticket_medio,
        SUM(lucro) as lucro_total,
        AVG(margem_lucro) as margem_media
      FROM vendas_ml
      WHERE data >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// Registrar nova venda
router.post('/vendas', async (req, res) => {
  try {
    const {
      marketplace,
      pedido,
      data,
      sku,
      unidades,
      status,
      valor_comprado,
      valor_vendido,
      taxas,
      frete,
      descontos,
      ctl,
      receita_envio,
      envio,
      numero_envio,
      imposto
    } = req.body;

    const result = await pool.query(`
      INSERT INTO vendas_ml (
        marketplace, pedido, data, sku, unidades, status,
        valor_comprado, valor_vendido, taxas, frete, descontos,
        ctl, receita_envio, envio, numero_envio, imposto
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      ) RETURNING *
    `, [
      marketplace,
      pedido,
      data,
      sku,
      unidades,
      status,
      valor_comprado,
      valor_vendido,
      taxas,
      frete,
      descontos,
      ctl,
      receita_envio,
      envio,
      numero_envio,
      imposto
    ]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao registrar venda:', error);
    res.status(500).json({ error: 'Erro ao registrar venda' });
  }
});

router.get('/api/vendas', async (req, res) => {
    try {
        console.log('Acessando rota /api/vendas');
        const result = await pool.query('SELECT * FROM vendas');
        console.log('Dados obtidos:', result.rows.length);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro na rota /api/vendas:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
