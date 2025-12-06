// Teste para ver todos os campos da tabela
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function teste() {
  try {
    console.log('🔍 Buscando primeiros 5 registros com TODOS os campos...\n');
    const { data, error } = await supabase
      .from('estoque')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log('✅ Dados encontrados:\n');
    data.forEach((produto, index) => {
      console.log(`Produto ${index + 1}:`, JSON.stringify(produto, null, 2));
      console.log('---');
    });
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  process.exit(0);
}

teste();
