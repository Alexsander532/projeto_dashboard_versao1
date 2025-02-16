const express = require('express');
const router = express.Router();
const db = require('../db');

// Buscar metas por mês/ano
router.get('/', async (req, res) => {
  try {
    const { mes_ano } = req.query;
    
    // Se não houver metas para o mês solicitado, busca as metas do último mês disponível
    const query = `
      WITH UltimoMes AS (
        SELECT MAX(mes_ano) as ultimo_mes
        FROM metas_ml
        WHERE mes_ano <= $1::date
      )
      SELECT m.* 
      FROM metas_ml m
      JOIN UltimoMes u ON DATE_TRUNC('month', m.mes_ano) = DATE_TRUNC('month', u.ultimo_mes)
    `;
    
    const result = await db.query(query, [mes_ano]);
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
    const result = await db.query('SELECT * FROM metas_ml WHERE mes_ano = $1', [mes_ano]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar metas do mês:', error);
    res.status(500).json({ error: 'Erro ao buscar metas do mês' });
  }
});

// Atualizar meta
router.post('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const { meta_vendas, meta_margem, mes_ano } = req.body;

    // Validação dos dados
    if (!sku || !mes_ano) {
      return res.status(400).json({ error: 'SKU e mês/ano são obrigatórios' });
    }

    // Garante que meta_vendas e meta_margem são números
    const vendas = parseFloat(meta_vendas) || 0;
    const margem = parseFloat(meta_margem) || 0;

    // Formata a data corretamente
    let formattedDate;
    try {
      const date = new Date(mes_ano);
      if (isNaN(date.getTime())) {
        throw new Error('Data inválida');
      }
      formattedDate = date.toISOString().split('T')[0];
    } catch (error) {
      return res.status(400).json({ error: 'Data inválida' });
    }

    // Verifica se já existe uma meta para este SKU e mês
    const checkQuery = `
      SELECT * FROM metas_ml 
      WHERE sku = $1 AND DATE_TRUNC('month', mes_ano) = DATE_TRUNC('month', $2::date)
    `;
    
    const checkResult = await db.query(checkQuery, [sku, formattedDate]);

    let result;
    if (checkResult.rows.length > 0) {
      // Atualiza a meta existente
      const updateQuery = `
        UPDATE metas_ml 
        SET meta_vendas = $1, meta_margem = $2
        WHERE sku = $3 AND DATE_TRUNC('month', mes_ano) = DATE_TRUNC('month', $4::date)
        RETURNING *
      `;
      
      result = await db.query(updateQuery, [vendas, margem, sku, formattedDate]);
    } else {
      // Insere uma nova meta
      const insertQuery = `
        INSERT INTO metas_ml (sku, meta_vendas, meta_margem, mes_ano)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      
      result = await db.query(insertQuery, [sku, vendas, margem, formattedDate]);
    }

    if (result.rows.length === 0) {
      throw new Error('Erro ao salvar meta no banco de dados');
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    res.status(500).json({ error: 'Erro ao atualizar meta' });
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
    
    const lastMonthResult = await db.query(lastMonthQuery, [mes_ano]);
    
    // Se encontrou metas anteriores, copia para o novo mês
    if (lastMonthResult.rows.length > 0) {
      const insertPromises = lastMonthResult.rows.map(meta => {
        const query = `
          INSERT INTO metas_ml (sku, meta_vendas, meta_margem, mes_ano)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (sku, mes_ano) DO NOTHING
        `;
        return db.query(query, [meta.sku, meta.meta_vendas, meta.meta_margem, mes_ano]);
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