const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function testConnection() {
  try {
    // Tenta conectar
    const client = await pool.connect();
    console.log('Conexão bem sucedida!');
    
    // Verifica as tabelas existentes
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\nTabelas encontradas:');
    tables.rows.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

    client.release();
    process.exit(0);
  } catch (error) {
    console.error('Erro ao conectar:', error);
    process.exit(1);
  }
}

testConnection(); 