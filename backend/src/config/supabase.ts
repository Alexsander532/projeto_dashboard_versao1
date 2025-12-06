// backend/src/config/supabase.ts
// NOTA: Este arquivo está deprecado. Usamos PostgreSQL direto via estoqueService.ts

import dotenv from 'dotenv';

dotenv.config();

/**
 * Função para obter conexão PostgreSQL ao Supabase
 * O backend agora usa a conexão PostgreSQL direto em estoqueService.ts
 */
export async function getPostgresConnection() {
  const { Pool } = require('pg');

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_DATABASE || 'postgres',
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL via pool');
    client.release();
    return pool;
  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error);
    throw error;
  }
}
