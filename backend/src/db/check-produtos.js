const pool = require('./connection');

async function checkProdutosTable() {
  try {
    // Verificar se a tabela existe
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'produtos'
      );
    `);
    
    const tableExists = checkResult.rows[0].exists;
    console.log(`Tabela produtos existe: ${tableExists}`);
    
    if (tableExists) {
      // Consultar dados
      const dataResult = await pool.query('SELECT * FROM produtos ORDER BY sku');
      console.log('Dados da tabela produtos:');
      console.table(dataResult.rows);
      console.log(`Total de registros: ${dataResult.rows.length}`);
    } 
  } catch (error) {
    console.error('Erro ao verificar tabela produtos:', error);
  } finally {
    // Fechar a conexão
    pool.end();
  }
}

checkProdutosTable(); 