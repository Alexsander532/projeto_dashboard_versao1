-- Verificar se a tabela metas_ml existe
CREATE TABLE IF NOT EXISTS metas_ml (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) NOT NULL,
  meta_vendas NUMERIC(10, 2),
  meta_margem NUMERIC(5, 2),
  mes_ano DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_metas_ml_sku_mes_ano ON metas_ml(sku, mes_ano); 