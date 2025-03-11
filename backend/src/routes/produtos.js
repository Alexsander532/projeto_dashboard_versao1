const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Middleware para verificar se a tabela existe
router.use(async (req, res, next) => {
  try {
    // Verificar se a tabela existe
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'produtos'
      );
    `);
    
    if (!checkTable.rows[0].exists) {
      return res.status(500).json({ 
        error: 'Tabela produtos não existe',
        message: 'Execute o script de setup primeiro'
      });
    }
    
    next();
  } catch (error) {
    console.error('Erro ao verificar tabela produtos:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar tabela produtos',
      message: error.message
    });
  }
});

// GET - Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/produtos - Listando todos os produtos');
    
    const result = await pool.query(`
      SELECT * FROM produtos 
      ORDER BY sku
    `);
    
    console.log(`Encontrados ${result.rows.length} produtos`);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ 
      error: 'Erro ao listar produtos',
      message: error.message
    });
  }
});

// GET - Buscar produto por SKU
router.get('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    console.log(`GET /api/produtos/${sku} - Buscando produto`);
    
    const result = await pool.query(`
      SELECT * FROM produtos 
      WHERE sku = $1
    `, [sku]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Produto não encontrado',
        sku
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar produto',
      message: error.message
    });
  }
});

// POST - Criar novo produto
router.post('/', async (req, res) => {
  try {
    const { sku, nome, cmv_atual, estoque, status, imagem_url } = req.body;
    console.log('POST /api/produtos - Criando novo produto', { sku, nome });
    
    // Validar dados
    if (!sku || !nome) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'SKU e nome são obrigatórios'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO produtos (sku, nome, cmv_atual, estoque, status, imagem_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [sku, nome, cmv_atual, estoque, status, imagem_url]);
    
    console.log('Produto criado com sucesso:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    
    // Verificar erro de duplicidade
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'Produto já existe',
        message: 'Já existe um produto com este SKU'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao criar produto',
      message: error.message
    });
  }
});

// PUT - Atualizar produto
router.put('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const { nome, cmv_atual, estoque, status, imagem_url } = req.body;
    console.log(`PUT /api/produtos/${sku} - Atualizando produto`);
    
    // Validar dados
    if (!nome) {
      return res.status(400).json({ 
        error: 'Dados incompletos',
        message: 'Nome é obrigatório'
      });
    }
    
    const result = await pool.query(`
      UPDATE produtos 
      SET nome = $1, 
          cmv_atual = $2, 
          estoque = $3, 
          status = $4,
          imagem_url = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE sku = $6
      RETURNING *
    `, [nome, cmv_atual, estoque, status, imagem_url, sku]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Produto não encontrado',
        sku
      });
    }
    
    console.log('Produto atualizado com sucesso:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar produto',
      message: error.message
    });
  }
});

// DELETE - Excluir produto
router.delete('/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    console.log(`DELETE /api/produtos/${sku} - Excluindo produto`);
    
    const result = await pool.query(`
      DELETE FROM produtos 
      WHERE sku = $1
      RETURNING *
    `, [sku]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Produto não encontrado',
        sku
      });
    }
    
    console.log('Produto excluído com sucesso:', result.rows[0]);
    res.json({ 
      message: 'Produto excluído com sucesso',
      produto: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ 
      error: 'Erro ao excluir produto',
      message: error.message
    });
  }
});

module.exports = router; 