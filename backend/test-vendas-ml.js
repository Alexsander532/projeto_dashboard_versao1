const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  try {
    console.log('🔍 Testando conexão com tabela vendas_ml...\n');

    // Tentar buscar dados da tabela vendas_ml
    const { data, error, count } = await supabase
      .from('vendas_ml')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.log('❌ Erro ao buscar vendas_ml:', error.message);
      console.log('\nTentando listar outras tabelas...');
      
      // Listar todas as views públicas para ver quais tabelas existem
      const { data: tables } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      console.log('📋 Tabelas encontradas:', tables);
      return;
    }

    console.log('✅ Tabela vendas_ml encontrada!');
    console.log('📊 Total de registros:', count);
    console.log('\n📝 Primeiros 5 registros:');
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

test();
