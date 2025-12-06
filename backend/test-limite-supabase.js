const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  try {
    console.log('🔍 Testando limite do Supabase...\n');

    // Teste 1: Buscar com limit padrão
    const { data: data1, error: error1, count: count1 } = await supabase
      .from('vendas_ml')
      .select('id', { count: 'exact' })
      .limit(1000);

    console.log(`Teste 1 (limit 1000): ${data1?.length || 0} registros retornados`);
    console.log(`Count total: ${count1}`);

    // Teste 2: Buscar com limit 2000
    const { data: data2, error: error2, count: count2 } = await supabase
      .from('vendas_ml')
      .select('id', { count: 'exact' })
      .limit(2000);

    console.log(`\nTeste 2 (limit 2000): ${data2?.length || 0} registros retornados`);
    console.log(`Count total: ${count2}`);

    // Teste 3: Buscar sem limit explícito
    const { data: data3, error: error3, count: count3 } = await supabase
      .from('vendas_ml')
      .select('id', { count: 'exact' });

    console.log(`\nTeste 3 (sem limit): ${data3?.length || 0} registros retornados`);
    console.log(`Count total: ${count3}`);

    // Teste 4: Range
    const { data: data4, error: error4, count: count4 } = await supabase
      .from('vendas_ml')
      .select('id', { count: 'exact' })
      .range(0, 1999);

    console.log(`\nTeste 4 (range 0-1999): ${data4?.length || 0} registros retornados`);
    console.log(`Count total: ${count4}`);

  } catch (err) {
    console.error('❌ Erro:', err);
  }
}

test();
