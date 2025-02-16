const { Pool } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Conecta ao postgres para criar o banco
  const initialPool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
  });

  try {
    // Verifica se o banco existe
    const result = await initialPool.query(`
      SELECT datname FROM pg_database WHERE datname = 'ml_sales'
    `);

    if (result.rows.length === 0) {
      // Cria o banco se não existir
      await initialPool.query('CREATE DATABASE ml_sales');
      console.log('Banco de dados ml_sales criado!');
    }

    await initialPool.end();

    // Conecta ao novo banco para criar as tabelas
    const mlPool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: 'ml_sales',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT
    });

    // Cria as tabelas
    await mlPool.query(`
      CREATE TABLE IF NOT EXISTS vendas_ml (
        id SERIAL PRIMARY KEY,
        marketplace VARCHAR(50),
        pedido VARCHAR(50) UNIQUE,
        data DATE,
        sku VARCHAR(50),
        unidades INTEGER,
        status VARCHAR(50),
        valor_comprado DECIMAL(10,2),
        valor_vendido DECIMAL(10,2),
        taxas DECIMAL(10,2),
        frete DECIMAL(10,2),
        descontos DECIMAL(10,2),
        ctl DECIMAL(10,2),
        receita_envio DECIMAL(10,2),
        valor_liquido DECIMAL(10,2),
        lucro DECIMAL(10,2),
        markup DECIMAL(10,2),
        margem_lucro DECIMAL(10,2),
        envio VARCHAR(100),
        numero_envio VARCHAR(100),
        imposto DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS metas_ml (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(50),
        mes_ano DATE,
        meta_vendas INTEGER DEFAULT 0,
        meta_margem DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(sku, mes_ano)
      );

      CREATE TABLE IF NOT EXISTS estoque (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(50) UNIQUE,
        descricao TEXT,
        estoque INTEGER DEFAULT 0,
        minimo INTEGER DEFAULT 0,
        cmv DECIMAL(10,2) DEFAULT 0,
        valor_liquido DECIMAL(10,2) DEFAULT 0,
        media_vendas DECIMAL(10,2) DEFAULT 0,
        total_vendas INTEGER DEFAULT 0,
        ultima_venda DATE,
        status VARCHAR(50) DEFAULT 'Sem Estoque',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tabelas criadas com sucesso!');
    await mlPool.end();

  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

createDatabase(); 