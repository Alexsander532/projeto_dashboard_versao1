const pool = require('./connection');

async function checkTable() {
  try {
    console.log('Verificando tabela metas_ml...');
    
    // Verificar se a tabela existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'metas_ml'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('Tabela metas_ml existe.');
      
      // Verificar a estrutura da tabela
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'metas_ml'
        ORDER BY ordinal_position;
      `);
      
      console.log('Estrutura da tabela metas_ml:');
      columns.rows.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
      // Verificar constraints
      const constraints = await pool.query(`
        SELECT conname, contype, pg_get_constraintdef(c.oid) as def
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE conrelid = 'metas_ml'::regclass
        AND n.nspname = 'public';
      `);
      
      console.log('Constraints da tabela metas_ml:');
      constraints.rows.forEach(con => {
        console.log(`- ${con.conname}: ${con.def}`);
      });
      
      // Verificar registros existentes
      const count = await pool.query(`
        SELECT COUNT(*) FROM metas_ml;
      `);
      
      console.log(`Total de registros na tabela: ${count.rows[0].count}`);
      
      // Mostrar alguns registros de exemplo
      if (parseInt(count.rows[0].count) > 0) {
        const samples = await pool.query(`
          SELECT * FROM metas_ml LIMIT 5;
        `);
        
        console.log('Exemplos de registros:');
        samples.rows.forEach(row => {
          console.log(row);
        });
      }
    } else {
      console.error('ERRO: A tabela metas_ml não existe!');
    }
  } catch (error) {
    console.error('Erro ao verificar tabela:', error);
  } finally {
    // Fechar a conexão com o pool
    await pool.end();
  }
}

// Executar a verificação
checkTable(); 