const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Buscar todas as vendas
router.get('/vendas', async (req, res) => {
  try {
    const { mes_ano } = req.query;
    
    // Se não tiver mes_ano, retorna todas as vendas
    let whereClause = "";
    
    // Se tiver mes_ano, filtra pelo mês e ano específicos
    if (mes_ano) {
      const data = new Date(mes_ano);
      const ano = data.getFullYear();
      const mes = data.getMonth() + 1;
      whereClause = `WHERE EXTRACT(YEAR FROM data) = ${ano} AND EXTRACT(MONTH FROM data) = ${mes}`;
    }
    
    const result = await pool.query(`
      SELECT * FROM vendas_ml 
      ${whereClause}
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

// Buscar métricas de vendas por mês/ano (mesma lógica usada na página do Mercado Livre)
router.get('/vendas/metricas', async (req, res) => {
  try {
    const { mes_ano } = req.query;
    
    // Validar o formato da data
    let data;
    let whereClause = "";
    let params = [];
    
    if (mes_ano) {
      try {
        data = new Date(mes_ano);
        if (isNaN(data.getTime())) {
          throw new Error('Data inválida');
        }
        const ano = data.getFullYear();
        const mes = data.getMonth() + 1;
        whereClause = "WHERE EXTRACT(YEAR FROM data) = $1 AND EXTRACT(MONTH FROM data) = $2";
        params = [ano, mes];
      } catch (err) {
        console.error('Data inválida:', mes_ano);
        return res.status(400).json({ error: 'Formato de data inválido' });
      }
    }
    
    console.log('Executando query de métricas com filtro:', whereClause, params);
    
    // Consulta exatamente igual à usada na página do Mercado Livre
    const query = `
      SELECT 
        SUM(valor_vendido) as valor_total_vendido,
        SUM(unidades) as total_unidades,
        CASE 
          WHEN SUM(valor_vendido) > 0 
          THEN (SUM(lucro) / SUM(valor_vendido)) * 100 
          ELSE 0 
        END as margem_media
      FROM vendas_ml
      ${whereClause}
    `;
    
    const result = await pool.query(query, params);
    
    console.log('Resultado das métricas:', result.rows[0]);
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

// Rota para atualizar venda
router.put('/vendas/:pedido', async (req, res) => {
  try {
    const { pedido } = req.params;
    const atualizacao = req.body;

    // Validar campos permitidos
    const camposPermitidos = ['unidades', 'valor_comprado', 'valor_vendido', 'taxas', 'frete', 'ctl'];
    const camposParaAtualizar = Object.keys(atualizacao).filter(campo => 
      camposPermitidos.includes(campo.toLowerCase())
    );

    if (camposParaAtualizar.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo válido para atualização' });
    }

    // Constrói a query de atualização
    const setClauses = camposParaAtualizar.map((campo, index) => 
      `${campo.toLowerCase()} = $${index + 2}`
    ).join(', ');
    
    const valores = camposParaAtualizar.map(campo => atualizacao[campo]);
    
    const query = `
      UPDATE vendas_ml 
      SET ${setClauses},
          updated_at = CURRENT_TIMESTAMP
      WHERE pedido = $1
      RETURNING *
    `;

    const result = await pool.query(query, [pedido, ...valores]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar venda:', error);
    res.status(500).json({ error: 'Erro ao atualizar venda' });
  }
});

// Buscar vendas agrupadas por SKU para a página de metas
router.get('/vendas/por-sku', async (req, res) => {
  try {
    const { mes_ano } = req.query;
    
    if (!mes_ano) {
      return res.status(400).json({ error: 'Parâmetro mes_ano é obrigatório' });
    }
    
    // Validar e corrigir o formato da data
    try {
      // Extrair ano e mês diretamente da string para evitar problemas com timezone
      const [ano, mes] = mes_ano.split('-').map(Number);
      
      console.log(`Buscando vendas por SKU para ${mes}/${ano} (da string original)`);
      
      // Consulta SQL com filtro explícito por mês e ano
      const query = `
        SELECT 
          v.sku,
          e.descricao as produto,
          SUM(v.valor_vendido) as valor_vendido,
          SUM(v.unidades) as unidades,
          SUM(v.lucro) as lucro,
          CASE 
            WHEN SUM(v.valor_vendido) > 0 
            THEN (SUM(v.lucro) / SUM(v.valor_vendido)) * 100 
            ELSE 0 
          END as margem_lucro
        FROM vendas_ml v
        LEFT JOIN estoque e ON v.sku = e.sku
        WHERE EXTRACT(YEAR FROM v.data) = $1 AND EXTRACT(MONTH FROM v.data) = $2
        GROUP BY v.sku, e.descricao
        ORDER BY SUM(v.valor_vendido) DESC
      `;
      
      const result = await pool.query(query, [ano, mes]);
      
      console.log('Dados retornados pela consulta SQL (por-sku):', JSON.stringify(result.rows.slice(0, 3), null, 2));
      
      console.log(`Encontradas ${result.rows.length} SKUs com vendas`);
      res.json(result.rows);
    } catch (err) {
      console.error('Erro ao processar data:', err, mes_ano);
      return res.status(400).json({ error: 'Formato de data inválido' });
    }
  } catch (error) {
    console.error('Erro ao buscar vendas por SKU:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas por SKU' });
  }
});

// Rota para buscar métricas de vendas para a página de Metas
router.get('/vendas/metricas-metas', async (req, res) => {
  try {
    const { mes_ano } = req.query;
    
    if (!mes_ano) {
      return res.status(400).json({ error: 'Parâmetro mes_ano é obrigatório' });
    }
    
    // Validar e corrigir o formato da data
    let data;
    try {
      // Formato esperado: YYYY-MM-DD
      data = new Date(mes_ano);
      if (isNaN(data.getTime())) {
        throw new Error('Data inválida');
      }
      
      // Extrair ano e mês diretamente da string para evitar problemas com timezone
      const [ano, mes] = mes_ano.split('-').map(Number);
      
      console.log(`Buscando métricas para ${mes}/${ano} (da string original)`);
      
      // Consulta SQL com filtro explícito por mês e ano
      const query = `
        SELECT 
          SUM(valor_vendido) as valor_total_vendido,
          SUM(unidades) as total_unidades,
          CASE 
            WHEN SUM(valor_vendido) > 0 
            THEN (SUM(lucro) / SUM(valor_vendido)) * 100 
            ELSE 0 
          END as margem_media
        FROM vendas_ml
        WHERE 
          EXTRACT(YEAR FROM data) = $1 
          AND EXTRACT(MONTH FROM data) = $2
      `;
      
      const result = await pool.query(query, [ano, mes]);
      
      // Log detalhado para depuração
      console.log('Resultado das métricas para metas:', {
        ano: ano,
        mes: mes,
        valor_total_vendido: result.rows[0].valor_total_vendido,
        total_unidades: result.rows[0].total_unidades,
        margem_media: result.rows[0].margem_media
      });
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Erro ao processar data:', err, mes_ano);
      return res.status(400).json({ error: 'Formato de data inválido' });
    }
  } catch (error) {
    console.error('Erro ao buscar métricas para metas:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas para metas' });
  }
});

module.exports = router;
