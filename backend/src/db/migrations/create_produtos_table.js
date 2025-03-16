const pool = require('../connection');

async function createProdutosTable() {
  try {
    // Criar a tabela produtos se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(50) NOT NULL UNIQUE,
        nome VARCHAR(255) NOT NULL,
        cmv_atual DECIMAL(10,2),
        estoque INTEGER,
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_produtos_sku ON produtos(sku);
    `);
    
    console.log('Tabela produtos criada/verificada com sucesso!');
    
    // Verificar se já existem dados
    const count = await pool.query('SELECT COUNT(*) FROM produtos');
    
    if (parseInt(count.rows[0].count) === 0) {
      // Inserir dados iniciais apenas se a tabela estiver vazia
      await pool.query(`
        INSERT INTO produtos (sku, nome, cmv_atual, estoque, status) 
        VALUES 
          ('KGP001', 'Produto B', 30.00, 40, 'Ativo'),
          ('GP0047', 'Produto C', 30.00, 40, 'Ativo'),
          ('KGP004', 'Produto D', 30.00, 40, 'Ativo')
        ON CONFLICT (sku) DO NOTHING;
      `);
      console.log('Dados iniciais inseridos!');
    }
    
    console.log('Setup concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o setup:', error);
  } finally {
    await pool.end();
  }
}

createProdutosTable(); 