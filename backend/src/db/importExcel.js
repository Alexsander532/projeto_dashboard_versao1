const XLSX = require('xlsx');
const { pool } = require('./init');
const path = require('path');
const os = require('os');

async function importExcel() {
  try {
    // Caminho para o arquivo Excel nos Downloads
    const excelPath = path.join(os.homedir(), 'Downloads', 'vendas_ml.xlsx');
    
    // Lê o arquivo Excel
    console.log('Lendo arquivo Excel...');
    const workbook = XLSX.readFile(excelPath);
    const worksheet = workbook.Sheets['vendas_ml'];
    const dados = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Encontrados ${dados.length} registros para importar`);

    // Limpa a tabela existente
    await pool.query('TRUNCATE TABLE vendas_ml RESTART IDENTITY CASCADE');
    console.log('Tabela limpa com sucesso');

    // Insere os dados
    for (const venda of dados) {
      await pool.query(`
        INSERT INTO vendas_ml (
          marketplace, pedido, data, sku, unidades, status,
          valor_comprado, valor_vendido, taxas, frete, descontos,
          ctl, receita_envio, valor_liquido, lucro, markup,
          margem_lucro, envio, numero_envio, imposto
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
      `, [
        venda.marketplace || 'Mercado Livre',
        venda.pedido,
        new Date(venda.data),
        venda.sku,
        venda.unidades,
        venda.status || 'Concluído',
        venda.valor_comprado || 0,
        venda.valor_vendido || 0,
        venda.taxas || 0,
        venda.frete || 0,
        venda.descontos || 0,
        venda.ctl || 0,
        venda.receita_envio || 0,
        venda.valor_liquido || 0,
        venda.lucro || 0,
        venda.markup || 0,
        venda.margem_lucro || 0,
        venda.envio || 'Correios',
        venda.numero_envio || '',
        venda.imposto || 0
      ]);
    }

    console.log('Dados importados com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    process.exit(1);
  }
}

importExcel(); 