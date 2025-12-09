const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE || 'railway',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false, // Necessário para conexões externas
  },
});

// Teste de conexão - DESABILITADO (usando apenas Supabase agora)
pool.on('connect', () => {
  console.log('✓ Pool PostgreSQL inicializado (fallback para rotas legadas)');
});

pool.on('error', (err) => {
  console.warn('⚠ Aviso: PostgreSQL não disponível. Usando Supabase para novas operações.');
  // Não interrompe o servidor se PostgreSQL não estiver disponível
});

// Adicionar função de teste
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW() as time');
    client.release();
    return true;
  } catch (err) {
    // Silenciosamente falha se PostgreSQL não estiver disponível
    return false;
  }
};

// Não executar teste de conexão na inicialização

module.exports = pool; 