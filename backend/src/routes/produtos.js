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

// ========================================
// NOVA FUNCIONALIDADE: PRODUTOS DO ESTOQUE
// ========================================

/**
 * GET /api/produtos/estoque
 * 
 * Esta rota busca todos os produtos diretamente da tabela de estoque,
 * ao invés da tabela produtos. Isso garante que sempre tenhamos os dados
 * mais atualizados e elimina a duplicação de informações.
 * 
 * Campos retornados:
 * - sku: Código único do produto
 * - nome: Descrição do produto (campo 'descricao' da tabela estoque)
 * - cmv_atual: Custo da Mercadoria Vendida (campo 'cmv' da tabela estoque)
 * - estoque: Quantidade em estoque
 * - status: Sempre 'ativo' (pode ser expandido futuramente)
 * 
 * Vantagens desta abordagem:
 * 1. Fonte única de verdade (tabela estoque)
 * 2. Dados sempre sincronizados
 * 3. Não há risco de inconsistência entre tabelas
 * 4. Carregamento automático de todos os SKUs
 */
router.get('/estoque', async (req, res) => {
    try {
        console.log('=== INICIANDO BUSCA DE PRODUTOS DO ESTOQUE ===');
        console.log('Rota acessada: /api/produtos/estoque');
        console.log('Timestamp:', new Date().toISOString());
        
        // Query SQL que busca dados da tabela estoque
        // Mapeamos os campos para manter compatibilidade com o frontend
        const query = `
            SELECT 
                sku,                    -- Código único do produto
                descricao as nome,      -- Descrição vira 'nome' para compatibilidade
                cmv as cmv_atual,       -- CMV vira 'cmv_atual' para compatibilidade
                estoque,                -- Quantidade em estoque
                'ativo' as status       -- Status fixo como 'ativo'
            FROM estoque
            WHERE sku IS NOT NULL       -- Garante que só pegamos SKUs válidos
            AND sku != ''               -- Exclui SKUs vazios
            ORDER BY sku ASC            -- Ordena alfabeticamente por SKU
        `;
        
        console.log('Executando query na tabela estoque...');
        const result = await pool.query(query);
        
        console.log(`✅ Query executada com sucesso!`);
        console.log(`📊 Total de produtos encontrados: ${result.rows.length}`);
        
        // Log de alguns exemplos para debug (apenas os primeiros 3)
        if (result.rows.length > 0) {
            console.log('📋 Primeiros produtos encontrados:');
            result.rows.slice(0, 3).forEach((produto, index) => {
                console.log(`   ${index + 1}. SKU: ${produto.sku} | Nome: ${produto.nome} | CMV: R$ ${produto.cmv_atual}`);
            });
        }
        
        // Retorna os dados no formato esperado pelo frontend
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ ERRO na rota /api/produtos/estoque:', error);
        console.error('Detalhes do erro:', {
            message: error.message,
            code: error.code,
            detail: error.detail
        });
        
        res.status(500).json({ 
            error: 'Erro interno do servidor ao buscar produtos do estoque',
            details: error.message 
        });
    }
});

/**
 * PUT /api/produtos/estoque/:sku
 * 
 * Esta rota permite atualizar o CMV (Custo da Mercadoria Vendida) 
 * de um produto específico diretamente na tabela de estoque.
 * 
 * Parâmetros:
 * - sku (URL): Código único do produto a ser atualizado
 * - cmv_atual (body): Novo valor do CMV
 * 
 * Esta é a funcionalidade principal que permite editar o preço
 * de compra diretamente da página de produtos.
 */
router.put('/estoque/:sku', async (req, res) => {
    try {
        const { sku } = req.params;
        const { cmv_atual } = req.body;
        
        console.log('=== ATUALIZANDO CMV DO PRODUTO ===');
        console.log(`SKU: ${sku}`);
        console.log(`Novo CMV: R$ ${cmv_atual}`);
        console.log('Timestamp:', new Date().toISOString());
        
        // Validação básica dos dados recebidos
        if (!sku || sku.trim() === '') {
            console.log('❌ Erro: SKU não fornecido ou vazio');
            return res.status(400).json({ error: 'SKU é obrigatório' });
        }
        
        if (cmv_atual === undefined || cmv_atual === null) {
            console.log('❌ Erro: CMV não fornecido');
            return res.status(400).json({ error: 'CMV atual é obrigatório' });
        }
        
        if (isNaN(cmv_atual) || cmv_atual < 0) {
            console.log('❌ Erro: CMV inválido');
            return res.status(400).json({ error: 'CMV deve ser um número positivo' });
        }
        
        console.log('✅ Validações passaram, executando update...');
        
        // Query para atualizar o CMV na tabela estoque
        const updateQuery = `
            UPDATE estoque 
            SET cmv = $1                    -- Novo valor do CMV
            WHERE sku = $2                  -- Filtro pelo SKU
            RETURNING 
                sku,
                descricao as nome,
                cmv as cmv_atual,
                estoque,
                'ativo' as status
        `;
        
        const result = await pool.query(updateQuery, [cmv_atual, sku]);
        
        // Verifica se o produto foi encontrado e atualizado
        if (result.rows.length === 0) {
            console.log(`❌ Produto com SKU ${sku} não encontrado no estoque`);
            return res.status(404).json({ error: 'Produto não encontrado no estoque' });
        }
        
        console.log('✅ CMV atualizado com sucesso!');
        console.log('📊 Dados atualizados:', result.rows[0]);
        
        // Retorna o produto atualizado
        res.json({
            message: 'CMV atualizado com sucesso',
            produto: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ ERRO ao atualizar CMV:', error);
        console.error('Detalhes do erro:', {
            message: error.message,
            code: error.code,
            detail: error.detail
        });
        
        res.status(500).json({ 
            error: 'Erro interno do servidor ao atualizar CMV',
            details: error.message 
        });
    }
});

module.exports = router;