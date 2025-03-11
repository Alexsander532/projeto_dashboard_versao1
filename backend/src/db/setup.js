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
    
    // Executar o script SQL
    await pool.query(createMetasMlTableSQL);
    console.log('Tabela metas_ml criada ou verificada com sucesso!');
    
    // Verificar se a tabela existe
    const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'metas_ml'
      );
    `);
    
    if (checkTableResult.rows[0].exists) {
      console.log('Tabela metas_ml existe no banco de dados Railway.');
      
      // Verificar a estrutura da tabela
      const tableStructure = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'metas_ml';
      `);
      
      console.log('Estrutura da tabela metas_ml:');
      tableStructure.rows.forEach(column => {
        console.log(`- ${column.column_name}: ${column.data_type}`);
      });
    } else {
      console.error('ERRO: A tabela metas_ml não foi criada corretamente!');
    }
    
    console.log('Configuração do banco de dados concluída!');
  } catch (error) {
    console.error('Erro ao configurar o banco de dados:', error);
  }
}

// Executar a configuração
setupDatabase(); 