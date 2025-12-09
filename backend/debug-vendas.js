require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function debugVendas() {
  try {
    console.log('🔍 Buscando estrutura de dados da tabela vendas_ml...\n');
    
    // Buscar 3 registros de exemplo
    const { data, error } = await supabase
      .from('vendas_ml')
      .select('*')
      .limit(3);
    
    if (error) {
      console.error('❌ Erro:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ Nenhum dado encontrado');
      return;
    }
    
    console.log('✅ Primeiro registro completo:\n');
    console.log(JSON.stringify(data[0], null, 2));
    
    console.log('\n📋 Colunas disponíveis:');
    const colunas = Object.keys(data[0]);
    colunas.forEach((col, i) => {
      console.log(`  ${i + 1}. ${col}: ${typeof data[0][col]} = ${data[0][col]}`);
    });
    
    console.log('\n🔍 Buscando registros de dezembro 2025...\n');
    const { data: dezembros, count } = await supabase
      .from('vendas_ml')
      .select('*', { count: 'exact' })
      .ilike('data_pedido', '%12/25%');
    
    if (dezembros && dezembros.length > 0) {
      console.log(`✅ Encontrados ${dezembros.length} registros de dezembro\n`);
      console.log('Primeiro registro de dezembro:\n');
      console.log(JSON.stringify(dezembros[0], null, 2));
      
      console.log('\n📊 Verificando coluna "unidades":');
      console.log(`  Valor: ${dezembros[0].unidades}`);
      console.log(`  Tipo: ${typeof dezembros[0].unidades}`);
      console.log(`  É null/undefined? ${dezembros[0].unidades === null || dezembros[0].unidades === undefined}`);
    } else {
      console.log('⚠️ Nenhum registro de dezembro encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugVendas();
