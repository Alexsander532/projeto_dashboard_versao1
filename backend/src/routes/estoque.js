const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Rota GET para buscar todos os produtos no estoque
router.get('/', async (req, res) => {
  try {
    const query = `
      WITH vendas_ultimos_30_dias AS (
        SELECT 
          sku,
          COUNT(*) as total_vendas,
          COUNT(*)::float / 30 as media_diaria
        FROM vendas_ml
        WHERE data >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY sku
      ),
      vendas_ultimos_15_dias AS (
        SELECT 
          sku,
          SUM(unidades) as vendas_quinzenais
        FROM vendas_ml
        WHERE data >= CURRENT_DATE - INTERVAL '15 days'
        GROUP BY sku
      ),
      ultima_venda AS (
        SELECT 
          sku,
          MAX(data) as ultima_data_venda
        FROM vendas_ml
        GROUP BY sku
      )
      SELECT 
        e.id,
        e.sku,
        e.descricao,
        e.estoque,
        e.minimo,
        COALESCE(e.cmv, 0) as cmv,
        COALESCE(e.valor_liquido, 0) as valor_liquido,
        COALESCE(v.media_diaria, 0) as media_vendas,
        COALESCE(v.total_vendas, 0) as total_vendas,
        COALESCE(v15.vendas_quinzenais, 0) as vendas_quinzenais,
        COALESCE(uv.ultima_data_venda, NULL) as ultima_venda,
        e.status,
        e.created_at,
        e.updated_at,
        CASE 
          WHEN v.media_diaria > 0 THEN 
            ROUND(e.estoque / v.media_diaria)
          ELSE NULL 
        END as previsao_dias
      FROM estoque e
      LEFT JOIN vendas_ultimos_30_dias v ON e.sku = v.sku
      LEFT JOIN ultima_venda uv ON e.sku = uv.sku
      LEFT JOIN vendas_ultimos_15_dias v15 ON e.sku = v15.sku
      ORDER BY e.id ASC
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Rota PUT para atualizar a quantidade em estoque
router.put('/:sku/quantidade', async (req, res) => {
  const { sku } = req.params;
  const { quantidade } = req.body;
  
  try {
    console.log(`Atualizando quantidade do produto ${sku} para ${quantidade}`);
    
    const query = `
      UPDATE estoque 
      SET 
        estoque = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE sku = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [quantidade, sku]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    console.log(`Quantidade atualizada com sucesso para o produto ${sku}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar quantidade:', error);
    res.status(500).json({ error: 'Erro ao atualizar quantidade' });
  }
});

// Rota PUT para atualizar informações do produto
router.put('/:sku', async (req, res) => {
  const { sku } = req.params;
  const { 
    produto,
    estoque,
    minimo,
    precoCompra,
    valorLiquidoMedio,
    status
  } = req.body;
  
  try {
    console.log(`Atualizando informações do produto ${sku}`);
    
    const query = `
      UPDATE estoque 
      SET 
        descricao = $1,
        estoque = $2,
        minimo = $3,
        cmv = $4,
        valor_liquido = $5,
        status = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE sku = $7
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      produto,
      estoque,
      minimo,
      precoCompra,
      valorLiquidoMedio,
      status,
      sku
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    console.log(`Informações atualizadas com sucesso para o produto ${sku}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Rota para criar/atualizar a tabela e gerar dados iniciais
router.post('/init', async (req, res) => {
  try {
    // Cria a tabela se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS estoque (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(50) UNIQUE NOT NULL,
        descricao TEXT NOT NULL,
        estoque INTEGER NOT NULL DEFAULT 0,
        minimo INTEGER NOT NULL DEFAULT 0,
        cmv DECIMAL(10,2) NOT NULL DEFAULT 0,
        valor_liquido DECIMAL(10,2) NOT NULL DEFAULT 0,
        media_vendas DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_vendas INTEGER NOT NULL DEFAULT 0,
        ultima_venda DATE,
        status VARCHAR(50) DEFAULT 'Sem Estoque',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Busca SKUs únicos da tabela vendas_ml
    const skusResult = await pool.query(`
      SELECT DISTINCT sku, descricao 
      FROM vendas_ml 
      ORDER BY sku
    `);

    // Gera dados fictícios para cada SKU
    for (const row of skusResult.rows) {
      const sku = row.sku;
      const descricao = row.descricao || 'Produto ' + sku;
      const estoque = Math.floor(Math.random() * 100);
      const minimo = Math.floor(Math.random() * 30 + 20);
      const cmv = (Math.random() * 100 + 50).toFixed(2);
      const valorLiquido = (Math.random() * 200 + 100).toFixed(2);
      const mediaVendas = (Math.random() * 10).toFixed(2);
      const totalVendas = Math.floor(Math.random() * 1000);
      const ultimaVenda = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
      
      const status = estoque === 0 ? 'Sem Estoque' :
                    estoque < minimo ? 'Em reposição' :
                    estoque < (minimo * 1.2) ? 'Em negociação' :
                    estoque <= (minimo * 1.5) ? 'Em estoque' :
                    'Estoque alto';

      await pool.query(`
        INSERT INTO estoque (
          sku, 
          descricao, 
          estoque,
          minimo,
          cmv,
          valor_liquido,
          media_vendas,
          total_vendas,
          ultima_venda,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (sku) DO UPDATE SET
          descricao = EXCLUDED.descricao,
          estoque = EXCLUDED.estoque,
          minimo = EXCLUDED.minimo,
          cmv = EXCLUDED.cmv,
          valor_liquido = EXCLUDED.valor_liquido,
          media_vendas = EXCLUDED.media_vendas,
          total_vendas = EXCLUDED.total_vendas,
          ultima_venda = EXCLUDED.ultima_venda,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP
      `, [
        sku,
        descricao,
        estoque,
        minimo,
        cmv,
        valorLiquido,
        mediaVendas,
        totalVendas,
        ultimaVenda,
        status
      ]);
    }

    res.json({ message: 'Tabela de estoque inicializada com sucesso' });
  } catch (error) {
    console.error('Erro ao inicializar tabela de estoque:', error);
    res.status(500).json({ error: 'Erro ao inicializar tabela de estoque', details: error.message });
  }
});

// Rota para buscar métricas do estoque
router.get('/metricas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(COUNT(*), 0) as total_produtos,
        COALESCE(SUM(estoque), 0) as total_estoque,
        COALESCE(SUM(estoque * cmv), 0) as valor_total_estoque,
        COALESCE(COUNT(CASE WHEN status = 'Em reposição' THEN 1 END), 0) as produtos_reposicao,
        COALESCE(COUNT(CASE WHEN status = 'Sem Estoque' THEN 1 END), 0) as produtos_sem_estoque,
        COALESCE(AVG(media_vendas), 0) as media_geral_vendas
      FROM estoque
    `);
    
    // Formatar os dados antes de enviar
    const metricas = {
      totalProdutos: Number(result.rows[0].total_produtos) || 0,
      totalEstoque: Number(result.rows[0].total_estoque) || 0,
      valorTotalEstoque: Number(result.rows[0].valor_total_estoque) || 0,
      produtosReposicao: Number(result.rows[0].produtos_reposicao) || 0,
      produtosSemEstoque: Number(result.rows[0].produtos_sem_estoque) || 0,
      mediaGeralVendas: Number(result.rows[0].media_geral_vendas) || 0
    };
    
    res.json(metricas);
  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas', details: error.message });
  }
});

// Rota PUT para atualizar apenas o CMV de um produto
router.put('/:sku/cmv', async (req, res) => {
  const { sku } = req.params;
  const { cmv } = req.body;
  
  try {
    // Validação do CMV
    if (cmv === undefined || cmv === null) {
      return res.status(400).json({ error: 'CMV é obrigatório' });
    }
    
    const cmvNumerico = parseFloat(cmv);
    if (isNaN(cmvNumerico) || cmvNumerico < 0) {
      return res.status(400).json({ error: 'CMV deve ser um número válido e não negativo' });
    }
    
    console.log(`Atualizando CMV do produto ${sku} para ${cmvNumerico}`);
    
    const query = `
      UPDATE estoque 
      SET 
        cmv = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE sku = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [cmvNumerico, sku]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    console.log(`CMV atualizado com sucesso para o produto ${sku}: ${cmvNumerico}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar CMV:', error);
    res.status(500).json({ error: 'Erro ao atualizar CMV' });
  }
});

// Rota para atualizar a quantidade em estoque
router.post('/:sku/quantidade', async (req, res) => {
  const { sku } = req.params;
  const { delta } = req.body;

  try {
    const query = `
      UPDATE estoque 
      SET estoque = estoque + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE sku = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [delta, sku]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar quantidade:', error);
    res.status(500).json({ error: 'Erro ao atualizar quantidade' });
  }
});

// Exporta o router como uma função middleware
module.exports = router;