const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  try {
    // Verificar se tabela produtos existe
    const { data: produtos, error: erroP } = await supabase
      .from('produtos')
      .select('*')
      .limit(3);
    
    if (erroP) {
      console.log('❌ Tabela produtos não existe ou erro:', erroP.message);
    } else {
      console.log('✅ Tabela produtos encontrada:');
      console.log(JSON.stringify(produtos, null, 2));
    }

    // Listar todas as tabelas
    console.log('\n📋 Listando informações das tabelas...');
    const { data: tables, error: erroTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (erroTables) {
      console.log('Info: Não foi possível listar tabelas diretamente');
    } else {
      console.log('Tabelas públicas:', tables.map(t => t.table_name));
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

test();
