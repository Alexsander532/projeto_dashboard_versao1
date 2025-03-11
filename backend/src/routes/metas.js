const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Buscar metas por mês/ano
router.get('/', async (req, res) => {
  try {
    console.log('Recebida requisição GET /metas');
    const { mes_ano } = req.query;
    
    if (!mes_ano) {
      console.error('Parâmetro mes_ano não fornecido');
      return res.status(400).json({ error: 'Parâmetro mes_ano é obrigatório' });
    }
    
    const [ano, mes] = mes_ano.split('-').map(Number);
    
    const query = `
      SELECT 
        m.sku, 
        m.meta_vendas, 
        m.meta_margem,
        e.descricao as produto
      FROM metas_ml m
      LEFT JOIN estoque e ON m.sku = e.sku
      WHERE EXTRACT(YEAR FROM m.mes_ano) = $1 
      AND EXTRACT(MONTH FROM m.mes_ano) = $2
    `;
    
    const result = await pool.query(query, [ano, mes]);
    console.log(`Encontradas ${result.rows.length} metas`);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    res.status(500).json({ error: 'Erro ao buscar metas' });
  }
});

// Buscar metas de um mês específico
router.get('/mes/:mes_ano', async (req, res) => {
  try {
    const { mes_ano } = req.params;
    const result = await pool.query('SELECT * FROM metas_ml WHERE mes_ano = $1', [mes_ano]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar metas do mês:', error);
    res.status(500).json({ error: 'Erro ao buscar metas do mês' });
  }
});

// Atualizar ou criar meta para um SKU
router.post('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const { meta_vendas, meta_margem, mes_ano } = req.body;
    
    console.log('Dados recebidos:', { sku, meta_vendas, meta_margem, mes_ano });

    if (!sku || !mes_ano) {
      return res.status(400).json({ error: 'SKU e mês/ano são obrigatórios' });
    }

    const metaVendas = Number(meta_vendas);
    const metaMargem = Number(meta_margem);

    // Verificar se já existe uma meta
    const checkResult = await pool.query(`
      SELECT id FROM metas_ml 
      WHERE sku = $1 
      AND EXTRACT(YEAR FROM mes_ano) = EXTRACT(YEAR FROM $2::date)
      AND EXTRACT(MONTH FROM mes_ano) = EXTRACT(MONTH FROM $2::date)
    `, [sku, mes_ano]);

    let result;
    if (checkResult.rows.length > 0) {
      // Atualizar meta existente
      result = await pool.query(`
        UPDATE metas_ml 
        SET meta_vendas = $1, meta_margem = $2
        WHERE sku = $3 
        AND EXTRACT(YEAR FROM mes_ano) = EXTRACT(YEAR FROM $4::date)
        AND EXTRACT(MONTH FROM mes_ano) = EXTRACT(MONTH FROM $4::date)
        RETURNING *
      `, [metaVendas, metaMargem, sku, mes_ano]);
    } else {
      // Inserir nova meta
      result = await pool.query(`
        INSERT INTO metas_ml (sku, meta_vendas, meta_margem, mes_ano)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [sku, metaVendas, metaMargem, mes_ano]);
    }

    console.log('Meta salva:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao salvar meta:', error);
    res.status(500).json({ error: 'Erro ao salvar meta' });
  }
});

// Criar metas zeradas para novo mês
router.post('/novo-mes', async (req, res) => {
  try {
    const { mes_ano } = req.body;
    
    // Busca o último mês com metas
    const lastMonthQuery = `
      SELECT DISTINCT ON (sku) sku, meta_vendas, meta_margem
      FROM metas_ml
      WHERE mes_ano < $1::date
      ORDER BY sku, mes_ano DESC
    `;
    
    const lastMonthResult = await pool.query(lastMonthQuery, [mes_ano]);
    
    // Se encontrou metas anteriores, copia para o novo mês
    if (lastMonthResult.rows.length > 0) {
      const insertPromises = lastMonthResult.rows.map(meta => {
        const query = `
          INSERT INTO metas_ml (sku, meta_vendas, meta_margem, mes_ano)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (sku, mes_ano) DO NOTHING
        `;
        return pool.query(query, [meta.sku, meta.meta_vendas, meta.meta_margem, mes_ano]);
      });
      
      await Promise.all(insertPromises);
    }
    
    res.json({ message: 'Metas criadas com sucesso' });
  } catch (error) {
    console.error('Erro ao criar metas para novo mês:', error);
    res.status(500).json({ error: 'Erro ao criar metas para novo mês' });
  }
});

module.exports = router;