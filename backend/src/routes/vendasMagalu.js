const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Buscar todas as vendas da Magazine Luiza
router.get('/', async (req, res) => {
  try {
    const { mes_ano, dataInicial, dataFinal, sku } = req.query;
    
    let whereClause = "";
    let params = [];
    let paramCount = 0;
    
    // Filtro por período específico (dataInicial e dataFinal)
    if (dataInicial && dataFinal) {
      paramCount++;
      whereClause += `WHERE purchased_at BETWEEN $${paramCount} AND $${paramCount + 1}`;
      params.push(dataInicial, dataFinal);
      paramCount++;
    }
    // Filtro por mês/ano
    else if (mes_ano) {
      const data = new Date(mes_ano);
      const ano = data.getFullYear();
      const mes = data.getMonth() + 1;
      whereClause = `WHERE EXTRACT(YEAR FROM purchased_at) = ${ano} AND EXTRACT(MONTH FROM purchased_at) = ${mes}`;
    }
    
    // Filtro por SKU
    if (sku && sku !== 'todos') {
      if (whereClause) {
        paramCount++;
        whereClause += ` AND sku = $${paramCount}`;
      } else {
        paramCount++;
        whereClause = `WHERE sku = $${paramCount}`;
      }
      params.push(sku);
    }
    
    const result = await pool.query(`
      SELECT 
        id,
        order_id as pedido,
        purchased_at as data,
        sku,
        produto,
        unidades,
        valor_venda as valor_vendido,
        comissao_magalu as taxas,
        frete_total as frete,
        desconto_total as desconto,
        (valor_venda - comissao_magalu - frete_total - desconto_total) as valor_liquido,
        inserted_at
      FROM vendas_magalu 
      ${whereClause}
      ORDER BY purchased_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar vendas da Magazine Luiza:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas da Magazine Luiza' });
  }
});

// Buscar métricas de vendas da Magazine Luiza
router.get('/metricas', async (req, res) => {
  try {
    const { mes_ano, dataInicial, dataFinal } = req.query;
    
    let whereClause = "";
    let params = [];
    
    // Filtro por período específico
    if (dataInicial && dataFinal) {
      whereClause = "WHERE purchased_at BETWEEN $1 AND $2";
      params = [dataInicial, dataFinal];
    }
    // Filtro por mês/ano
    else if (mes_ano) {
      const data = new Date(mes_ano);
      const ano = data.getFullYear();
      const mes = data.getMonth() + 1;
      whereClause = `WHERE EXTRACT(YEAR FROM purchased_at) = ${ano} AND EXTRACT(MONTH FROM purchased_at) = ${mes}`;
    }
    
    const query = `
      SELECT 
        SUM(valor_venda) as valor_total_vendido,
        SUM(unidades) as total_unidades,
        COUNT(DISTINCT order_id) as total_pedidos,
        SUM(valor_venda - comissao_magalu - frete_total - desconto_total) as valor_liquido_total,
        CASE 
          WHEN SUM(valor_venda) > 0 
          THEN ((SUM(valor_venda - comissao_magalu - frete_total - desconto_total) / SUM(valor_venda)) * 100)
          ELSE 0 
        END as margem_media,
        SUM(comissao_magalu) as total_taxas,
        SUM(frete_total) as total_frete,
        SUM(desconto_total) as total_desconto
      FROM vendas_magalu
      ${whereClause}
    `;
    
    const result = await pool.query(query, params);
    
    console.log('Métricas Magazine Luiza:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar métricas da Magazine Luiza:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas da Magazine Luiza' });
  }
});

// Buscar vendas agrupadas por SKU (para página de metas)
router.get('/por-sku', async (req, res) => {
  try {
    const { mes_ano } = req.query;
    
    if (!mes_ano) {
      return res.status(400).json({ error: 'Parâmetro mes_ano é obrigatório' });
    }
    
    const [ano, mes] = mes_ano.split('-').map(Number);
    
    const query = `
      SELECT 
        v.sku,
        v.produto,
        SUM(v.valor_venda) as valor_vendido,
        SUM(v.unidades) as unidades,
        SUM(v.valor_venda - v.comissao_magalu - v.frete_total - v.desconto_total) as lucro,
        CASE 
          WHEN SUM(v.valor_venda) > 0 
          THEN ((SUM(v.valor_venda - v.comissao_magalu - v.frete_total - v.desconto_total) / SUM(v.valor_venda)) * 100)
          ELSE 0 
        END as margem_lucro
      FROM vendas_magalu v
      WHERE EXTRACT(YEAR FROM v.purchased_at) = $1 AND EXTRACT(MONTH FROM v.purchased_at) = $2
      GROUP BY v.sku, v.produto
      ORDER BY SUM(v.valor_venda) DESC
    `;
    
    const result = await pool.query(query, [ano, mes]);
    
    console.log(`Vendas por SKU Magazine Luiza para ${mes}/${ano}:`, result.rows.length, 'SKUs');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar vendas por SKU da Magazine Luiza:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas por SKU da Magazine Luiza' });
  }
});

// Buscar métricas para metas da Magazine Luiza
router.get('/metricas-metas', async (req, res) => {
  try {
    const { mes_ano } = req.query;
    
    if (!mes_ano) {
      return res.status(400).json({ error: 'Parâmetro mes_ano é obrigatório' });
    }
    
    const [ano, mes] = mes_ano.split('-').map(Number);
    
    const query = `
      SELECT 
        SUM(valor_venda) as valor_total_vendido,
        SUM(unidades) as total_unidades,
        CASE 
          WHEN SUM(valor_venda) > 0 
          THEN ((SUM(valor_venda - comissao_magalu - frete_total - desconto_total) / SUM(valor_venda)) * 100)
          ELSE 0 
        END as margem_media
      FROM vendas_magalu
      WHERE 
        EXTRACT(YEAR FROM purchased_at) = $1 
        AND EXTRACT(MONTH FROM purchased_at) = $2
    `;
    
    const result = await pool.query(query, [ano, mes]);
    
    console.log('Métricas para metas Magazine Luiza:', {
      ano: ano,
      mes: mes,
      valor_total_vendido: result.rows[0].valor_total_vendido,
      total_unidades: result.rows[0].total_unidades,
      margem_media: result.rows[0].margem_media
    });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar métricas para metas da Magazine Luiza:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas para metas da Magazine Luiza' });
  }
});

module.exports = router;