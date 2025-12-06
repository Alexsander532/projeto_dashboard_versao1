-- Script SQL para criar a tabela estoque no Supabase
-- Execute este SQL no seu editor SQL do Supabase (SQL Editor)

CREATE TABLE IF NOT EXISTS estoque (
  id BIGSERIAL PRIMARY KEY,
  sku VARCHAR(100) UNIQUE NOT NULL,
  descricao TEXT,
  estoque INTEGER DEFAULT 0,
  minimo INTEGER DEFAULT 0,
  cmv DECIMAL(10, 2) DEFAULT 0,
  valor_liquido DECIMAL(10, 2) DEFAULT 0,
  media_vendas DECIMAL(10, 2) DEFAULT 0,
  total_vendas INTEGER DEFAULT 0,
  vendas_quinzenais INTEGER DEFAULT 0,
  ultima_venda TIMESTAMP,
  status VARCHAR(50) DEFAULT 'Disponível',
  previsao_dias INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_estoque_sku ON estoque(sku);
CREATE INDEX IF NOT EXISTS idx_estoque_status ON estoque(status);

-- Inserir alguns dados de exemplo (opcional)
INSERT INTO estoque (sku, descricao, estoque, minimo, cmv, valor_liquido, media_vendas, status)
VALUES 
  ('SKU001', 'Produto 1', 100, 10, 25.50, 50.00, 5.5, 'Disponível'),
  ('SKU002', 'Produto 2', 50, 20, 15.00, 35.00, 3.2, 'Disponível'),
  ('SKU003', 'Produto 3', 5, 30, 45.00, 80.00, 8.1, 'Em reposição')
ON CONFLICT (sku) DO NOTHING;
