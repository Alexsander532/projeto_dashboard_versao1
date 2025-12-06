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

// Teste de conexão
pool.on('connect', () => {
  console.log('Conectado ao banco de dados Railway (usado por outras rotas)');
});

pool.on('error', (err) => {
  console.error('Erro inesperado na conexão com o banco:', err);
  process.exit(-1);
});

// Adicionar função de teste
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexão de teste bem-sucedida!');
    
    // Testar uma consulta simples
    const res = await client.query('SELECT NOW() as time');
    console.log('Hora do servidor:', res.rows[0].time);
    
    client.release();
    return true;
  } catch (err) {
    console.error('Erro ao testar conexão:', err);
    return false;
  }
};

// Executar teste de conexão ao iniciar
testConnection();

module.exports = pool; 