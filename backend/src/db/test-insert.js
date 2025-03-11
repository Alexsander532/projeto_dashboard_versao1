const pool = require('./connection');

async function testInsert() {
  try {
    console.log('Testando inserção na tabela metas_ml...');
    
    // Array de metas para teste
    const metas = [
      {
        sku: 'GP0078',
        meta_vendas: 50000,
        meta_margem: 30,
        mes_ano: '2025-03-01'
      },
      {
        sku: 'GP0080',
        meta_vendas: 30000,
        meta_margem: 35,
        mes_ano: '2025-03-01'
      },
      {
        sku: 'GP0089',
        meta_vendas: 25000,
        meta_margem: 40,
        mes_ano: '2025-03-01'
      }
    ];

    console.log('Inserindo metas de teste...');
    
    for (const meta of metas) {
      // Verificar se já existe uma meta para este SKU/mês
      const checkResult = await pool.query(`
        SELECT id FROM metas_ml 
        WHERE sku = $1 
        AND EXTRACT(YEAR FROM mes_ano) = EXTRACT(YEAR FROM $2::date)
        AND EXTRACT(MONTH FROM mes_ano) = EXTRACT(MONTH FROM $2::date)
      `, [meta.sku, meta.mes_ano]);

      if (checkResult.rows.length > 0) {
        // Atualizar meta existente
        const result = await pool.query(`
          UPDATE metas_ml 
          SET meta_vendas = $1, meta_margem = $2, updated_at = CURRENT_TIMESTAMP
          WHERE sku = $3 
          AND EXTRACT(YEAR FROM mes_ano) = EXTRACT(YEAR FROM $4::date)
          AND EXTRACT(MONTH FROM mes_ano) = EXTRACT(MONTH FROM $4::date)
          RETURNING *
        `, [meta.meta_vendas, meta.meta_margem, meta.sku, meta.mes_ano]);
        
        console.log(`Meta atualizada para SKU ${meta.sku}:`, result.rows[0]);
      } else {
        // Inserir nova meta
        const result = await pool.query(`
          INSERT INTO metas_ml (sku, meta_vendas, meta_margem, mes_ano)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [meta.sku, meta.meta_vendas, meta.meta_margem, meta.mes_ano]);
        
        console.log(`Nova meta criada para SKU ${meta.sku}:`, result.rows[0]);
      }
    }

    // Verificar todas as metas inseridas
    const allMetas = await pool.query(`
      SELECT * FROM metas_ml 
      WHERE EXTRACT(YEAR FROM mes_ano) = 2025 
      AND EXTRACT(MONTH FROM mes_ano) = 3
    `);
    
    console.log('\nTodas as metas para Março/2025:');
    allMetas.rows.forEach(meta => {
      console.log(`SKU: ${meta.sku}`);
      console.log(`Meta de Vendas: R$ ${meta.meta_vendas}`);
      console.log(`Meta de Margem: ${meta.meta_margem}%`);
      console.log('---');
    });

    console.log('\nTeste de inserção concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao testar inserção:', error);
  } finally {
    await pool.end();
  }
}

// Executar o teste
testInsert(); 