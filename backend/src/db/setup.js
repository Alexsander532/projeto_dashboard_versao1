const pool = require('./connection');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    console.log('Iniciando configuração do banco de dados...');
    
    // Ler o arquivo SQL de criação da tabela metas_ml
    const createMetasMlTableSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create_metas_ml_table.sql'),
      'utf8'
    );
    
    // Ler o arquivo SQL de criação da tabela produtos
    const createProdutosTableSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'create_produtos_table.sql'),
      'utf8'
    );
    
    // Executar os scripts SQL
    await pool.query(createMetasMlTableSQL);
    await pool.query(createProdutosTableSQL);
    
    // Verificar se as tabelas foram criadas
    const checkTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('metas_ml', 'produtos');
    `);
    
    const tables = checkTables.rows.map(row => row.table_name);
    
    if (tables.includes('metas_ml')) {
      console.log('Tabela metas_ml criada com sucesso!');
    } else {
      console.error('ERRO: A tabela metas_ml não foi criada corretamente!');
    }
    
    if (tables.includes('produtos')) {
      console.log('Tabela produtos criada com sucesso!');
    } else {
      console.error('ERRO: A tabela produtos não foi criada corretamente!');
    }
    
    console.log('Configuração do banco de dados concluída!');
  } catch (error) {
    console.error('Erro ao configurar o banco de dados:', error);
  } finally {
    await pool.end();
  }
}

// Executar a configuração
setupDatabase(); 