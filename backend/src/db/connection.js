const { Pool } = require('pg');
require('dotenv').config();

console.log('$$$ DB USER',process.env.DB_USER);
console.log('$$$ DB HOST',process.env.DB_HOST);
console.log('$$$ DB DATABASE',process.env.DB_DATABASE);
console.log('$$$ DB PASSWORD',process.env.DB_PASSWORD);
console.log('$$$ DB PORT',process.env.DB_PORT);

const pool = new Pool({
  user: 'postgres',
  host: 'db.nqnlafkiiszhpnzhaugb.supabase.co',
  database: 'postgres',
  password: 'Cefet2020.',
  port: 5432
});

// Teste de conexão
pool.on('connect', () => {
  console.log('Conectado ao banco de dados');
});

pool.on('error', (err) => {
  console.error('Erro inesperado:', err);
  process.exit(-1);
});

module.exports = pool; 