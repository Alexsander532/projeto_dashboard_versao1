-- Criar tabelas para sistema de compras
-- Este script cria as tabelas necessárias para rastrear pedidos de compra

-- Tabela principal de pedidos de compra
CREATE TABLE IF NOT EXISTS pedidos_compra (
  id BIGSERIAL PRIMARY KEY,
  fornecedor VARCHAR(255) NOT NULL,
  valor DECIMAL(12, 2) NOT NULL,
  data_pedido DATE NOT NULL,
  previsao_entrega DATE,
  observacoes TEXT,
  status VARCHAR(50) DEFAULT 'pedido', -- pedido, fabricacao, transito, alfandega, recebido
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de itens do pedido de compra
CREATE TABLE IF NOT EXISTS itens_pedido_compra (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT NOT NULL REFERENCES pedidos_compra(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL,
  quantidade INTEGER NOT NULL,
  preco_unitario DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos_compra(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_fornecedor ON pedidos_compra(fornecedor);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos_compra(data_pedido);
CREATE INDEX IF NOT EXISTS idx_itens_pedido ON itens_pedido_compra(pedido_id);
CREATE INDEX IF NOT EXISTS idx_itens_sku ON itens_pedido_compra(sku);

-- Adicionar policies de RLS (Row Level Security) se estiver usando Supabase
-- Uncomment as linhas abaixo se estiver usando Supabase:
/*
ALTER TABLE pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido_compra ENABLE ROW LEVEL SECURITY;

-- Policy para permitir leitura de todos os pedidos
CREATE POLICY pedidos_select ON pedidos_compra FOR SELECT USING (true);
CREATE POLICY itens_select ON itens_pedido_compra FOR SELECT USING (true);

-- Policy para permitir insert de novos pedidos
CREATE POLICY pedidos_insert ON pedidos_compra FOR INSERT WITH CHECK (true);
CREATE POLICY itens_insert ON itens_pedido_compra FOR INSERT WITH CHECK (true);

-- Policy para permitir update de pedidos
CREATE POLICY pedidos_update ON pedidos_compra FOR UPDATE USING (true);
CREATE POLICY itens_update ON itens_pedido_compra FOR UPDATE USING (true);

-- Policy para permitir delete de pedidos
CREATE POLICY pedidos_delete ON pedidos_compra FOR DELETE USING (true);
CREATE POLICY itens_delete ON itens_pedido_compra FOR DELETE USING (true);
*/
