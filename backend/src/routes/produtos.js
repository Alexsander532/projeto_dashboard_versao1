const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Middleware de logging
router.use((req, res, next) => {
  console.log(`[Produtos] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// GET /api/produtos
router.get('/api/produtos', async (req, res) => {
    try {
        console.log('Acessando rota /api/produtos');
        const result = await pool.query(`
            SELECT id, sku, nome, cmv_atual, estoque, status, imagem_url,
                   created_at, updated_at
            FROM produtos
            ORDER BY sku
        `);
        console.log('Dados obtidos:', result.rows.length);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro na rota /api/produtos:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/produtos/:sku
router.get('/api/produtos/:sku', async (req, res) => {
    try {
        const { sku } = req.params;
        console.log(`Buscando produto com SKU: ${sku}`);
        
        const result = await pool.query(`
            SELECT id, sku, nome, cmv_atual, estoque, status, imagem_url,
                   created_at, updated_at
            FROM produtos
            WHERE sku = $1
        `, [sku]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/produtos
router.post('/api/produtos', async (req, res) => {
    try {
        const { sku, nome, cmv_atual, estoque, status, imagem_url } = req.body;
        console.log('Criando novo produto:', { sku, nome });

        const result = await pool.query(`
            INSERT INTO produtos (sku, nome, cmv_atual, estoque, status, imagem_url)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [sku, nome, cmv_atual, estoque, status, imagem_url]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        if (error.code === '23505') {
            res.status(409).json({ error: 'SKU já existe' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// PUT /api/produtos/:sku
router.put('/api/produtos/:sku', async (req, res) => {
    try {
        const { sku } = req.params;
        const { nome, cmv_atual, estoque, status, imagem_url } = req.body;
        console.log(`Atualizando produto ${sku}:`, req.body);

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
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/produtos/:sku
router.delete('/api/produtos/:sku', async (req, res) => {
    try {
        const { sku } = req.params;
        console.log(`Excluindo produto ${sku}`);

        const result = await pool.query(`
            DELETE FROM produtos
            WHERE sku = $1
            RETURNING *
        `, [sku]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json({
            message: 'Produto excluído com sucesso',
            produto: result.rows[0]
        });
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 