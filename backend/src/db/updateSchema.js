require('dotenv').config();
const { pool } = require('./init');

async function updateSchema() {
    try {
        // Dropa a tabela existente
        await pool.query('DROP TABLE IF EXISTS vendas_ml CASCADE');
        
        // Cria a tabela com a nova estrutura
        await pool.query(`
          CREATE TABLE vendas_ml (
            id SERIAL PRIMARY KEY,
            marketplace VARCHAR(50) NOT NULL,
            pedido VARCHAR(50) NOT NULL UNIQUE,
            data DATE NOT NULL,
            sku VARCHAR(50) NOT NULL,
            unidades INTEGER NOT NULL,
            status VARCHAR(50) NOT NULL,
            valor_comprado DECIMAL(10,2) NOT NULL,
            valor_vendido DECIMAL(10,2) NOT NULL,
            taxas DECIMAL(10,2) NOT NULL,
            frete DECIMAL(10,2) NOT NULL,
            descontos DECIMAL(10,2) NOT NULL,
            ctl DECIMAL(10,2) NOT NULL,
            receita_envio DECIMAL(10,2) NOT NULL,
            valor_liquido DECIMAL(10,2) NOT NULL,
            lucro DECIMAL(10,2) NOT NULL,
            markup DECIMAL(10,2) NOT NULL,
            margem_lucro DECIMAL(10,2) NOT NULL,
            envio VARCHAR(100),
            numero_envio VARCHAR(100),
            imposto DECIMAL(10,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

        console.log('Schema atualizado com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao atualizar schema:', error);
        process.exit(1);
    }
}

updateSchema();
