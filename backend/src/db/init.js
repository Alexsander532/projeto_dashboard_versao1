const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'db.nqnlafkiiszhpnzhaugb.supabase.co',
  database: 'postgres',
  password: 'Cefet2020.',
  port: 5432
});

async function initializeDatabase() {
  try {
    // Testa a conexão
    await pool.query('SELECT NOW()');
    console.log('Conexão com o banco de dados estabelecida com sucesso');

    // Cria as tabelas se não existirem
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vendas_ml (
        id SERIAL PRIMARY KEY,
        marketplace VARCHAR(50) NOT NULL,
        pedido VARCHAR(50) NOT NULL UNIQUE,
        data DATE NOT NULL,
        sku VARCHAR(50) NOT NULL,
        unidades INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        valor_comprado DECIMAL(10,2) NOT NULL,
        valor_vendido DECIMAL(10,2) NOT NULL,
        taxas DECIMAL(10,2) NOT NULL,
        frete DECIMAL(10,2) NOT NULL,
        descontos DECIMAL(10,2) NOT NULL,
        ctl DECIMAL(10,2) NOT NULL,
        receita_envio DECIMAL(10,2) NOT NULL,
        valor_liquido DECIMAL(10,2) NOT NULL,
        lucro DECIMAL(10,2) NOT NULL,
        markup DECIMAL(10,2) NOT NULL,
        margem_lucro DECIMAL(10,2) NOT NULL,
        envio VARCHAR(100),
        numero_envio VARCHAR(100),
        imposto DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS metas_ml (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(50) NOT NULL,
        mes_ano DATE NOT NULL,
        meta_vendas INTEGER NOT NULL DEFAULT 0,
        meta_margem DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(sku, mes_ano)
      );

      CREATE TABLE IF NOT EXISTS estoque (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(50) NOT NULL UNIQUE,
        descricao TEXT NOT NULL,
        estoque INTEGER NOT NULL DEFAULT 0,
        cmv DECIMAL(10,2) NOT NULL DEFAULT 0,
        minimo INTEGER NOT NULL DEFAULT 0,
        valor_liquido DECIMAL(10,2) NOT NULL DEFAULT 0,
        total_vendas INTEGER NOT NULL DEFAULT 0,
        ultima_venda DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tabelas criadas/verificadas com sucesso');
    return pool;
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

module.exports = {
  pool,
  initializeDatabase
}; 