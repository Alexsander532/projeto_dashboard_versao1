const { Pool } = require('pg');
require('dotenv').config();


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