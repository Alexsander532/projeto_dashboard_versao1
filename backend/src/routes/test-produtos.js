const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Rota de teste para verificar a conexão com a tabela produtos
router.get('/test-produtos', async (req, res) => {
  try {
    console.log('Testando conexão com a tabela produtos...');
    
    // Verificar se a tabela existe
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'produtos'
      );
    `);
    
    const tableExists = checkTable.rows[0].exists;
    
    if (tableExists) {
      // Consultar dados
      const result = await pool.query('SELECT * FROM produtos ORDER BY sku');
      console.log(`Encontrados ${result.rows.length} produtos`);
      
      res.json({
        success: true,
        message: 'Tabela produtos existe',
        count: result.rows.length,
        data: result.rows
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Tabela produtos não existe'
      });
    }
  } catch (error) {
    console.error('Erro ao testar conexão com produtos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao testar conexão',
      error: error.message
    });
  }
});

module.exports = router; 