const pool = require('../connection');

async function setupProdutosTable() {
  try {
    console.log('Iniciando configuração da tabela produtos...');
    
    // Verificar se a tabela existe
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'produtos'
      );
    `);
    
    const tableExists = checkTable.rows[0].exists;
    
    if (!tableExists) {
      console.log('Criando tabela produtos...');
      
      // Criar a tabela
      await pool.query(`
        CREATE TABLE produtos (
          id SERIAL PRIMARY KEY,
          sku VARCHAR(50) NOT NULL UNIQUE,
          nome VARCHAR(255) NOT NULL,
          cmv_atual DECIMAL(10,2),
          estoque INTEGER,
          status VARCHAR(20),
          imagem_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_produtos_sku ON produtos(sku);
      `);
      
      console.log('Tabela produtos criada com sucesso!');
      
      // Inserir dados iniciais
      console.log('Inserindo dados iniciais...');
      await pool.query(`
        INSERT INTO produtos (sku, nome, cmv_atual, estoque, status) 
        VALUES 
          ('KGP001', 'Produto B', 30.00, 40, 'Ativo'),
          ('GP0047', 'Produto C', 30.00, 40, 'Ativo'),
          ('KGP004', 'Produto D', 30.00, 40, 'Ativo'),
          ('GP0078', 'Produto E', 30.00, 40, 'Ativo'),
          ('GP0050', 'Produto F', 30.00, 40, 'Ativo'),
          ('GP0076', 'Produto G', 30.00, 40, 'Ativo')
        ON CONFLICT (sku) DO NOTHING;
      `);
      
      console.log('Dados iniciais inseridos com sucesso!');
    } else {
      console.log('Tabela produtos já existe.');
    }
    
    // Verificar dados
    const countResult = await pool.query('SELECT COUNT(*) FROM produtos');
    console.log(`Total de produtos: ${countResult.rows[0].count}`);
    
    return {
      success: true,
      tableExists,
      count: countResult.rows[0].count
    };
  } catch (error) {
    console.error('Erro ao configurar tabela produtos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar a configuração
setupProdutosTable()
  .then(result => {
    console.log('Resultado da configuração:', result);
    pool.end();
  })
  .catch(error => {
    console.error('Erro ao executar setup:', error);
    pool.end();
  }); 