const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function test() {
  try {
    // Verificar estoque completo
    const { data: estoque, error: erroE } = await supabase
      .from('estoque')
      .select('*')
      .limit(5);
    
    if (erroE) {
      console.log('❌ Erro ao buscar estoque:', erroE.message);
    } else {
      console.log('✅ Registros da tabela estoque:');
      console.log(JSON.stringify(estoque, null, 2));
    }

  } catch (err) {
    console.error('Erro:', err);
  }
}

test();
