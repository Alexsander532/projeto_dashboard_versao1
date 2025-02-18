const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'db.nqnlafkiiszhpnzhaugb.supabase.co',
  database: 'postgres',
  password: 'Cefet2020.',
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // Necessário para conexões externas ao Supabase
  },
});

module.exports = pool; 