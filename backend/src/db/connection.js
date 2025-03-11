const { Pool } = require('pg');
require('dotenv').config();

// Remover logs de credenciais para segurança
// console.log('$$$ DB USER',process.env.DB_USER);
// console.log('$$$ DB HOST',process.env.DB_HOST);
// console.log('$$$ DB DATABASE',process.env.DB_DATABASE);
// console.log('$$$ DB PASSWORD',process.env.DB_PASSWORD);
// console.log('$$$ DB PORT',process.env.DB_PORT);

const pool = new Pool({
  user: 'postgres',
  host: 'centerbeam.proxy.rlwy.net',
  database: 'railway',
  password: 'DmyaUqXoBAMACqXUWQbUCEpFVnBPadqD',
  port: 34984,
  ssl: {
    rejectUnauthorized: false, // Necessário para conexões externas
  },
});

// Teste de conexão
pool.on('connect', () => {
  console.log('Conectado ao banco de dados Railway');
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