require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Aviso: Variáveis de ambiente do Supabase não configuradas!');
  console.warn('Certifique-se de que SUPABASE_URL e SUPABASE_ANON_KEY estão no arquivo .env');
}

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = supabase;
