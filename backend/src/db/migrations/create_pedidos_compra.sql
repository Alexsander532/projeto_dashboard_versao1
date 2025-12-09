-- =====================================================
-- MIGRATION: Sistema de Pedidos de Compra
-- Descrição: Cria tabelas para gerenciar pedidos de compra
-- Data: 2025-12-09
-- =====================================================

-- Tabela principal de pedidos de compra
CREATE TABLE IF NOT EXISTS pedidos_compra (
    id SERIAL PRIMARY KEY,
    fornecedor VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL DEFAULT 0,
    data_pedido DATE NOT NULL,
    previsao_entrega DATE,
    observacoes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pedido',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Validações
    CONSTRAINT chk_status CHECK (status IN ('pedido', 'fabricacao', 'transito', 'alfandega', 'recebido')),
    CONSTRAINT chk_valor CHECK (valor >= 0),
    CONSTRAINT chk_datas CHECK (previsao_entrega IS NULL OR previsao_entrega >= data_pedido)
);

-- Tabela de itens do pedido (produtos)
CREATE TABLE IF NOT EXISTS itens_pedido_compra (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos_compra(id) ON DELETE CASCADE,
    sku VARCHAR(50) NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Validações
    CONSTRAINT chk_quantidade CHECK (quantidade > 0),
    CONSTRAINT chk_preco CHECK (preco_unitario >= 0)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos_compra(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos_compra(data_pedido DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_fornecedor ON pedidos_compra(fornecedor);
CREATE INDEX IF NOT EXISTS idx_itens_pedido ON itens_pedido_compra(pedido_id);
CREATE INDEX IF NOT EXISTS idx_itens_sku ON itens_pedido_compra(sku);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_pedidos_compra_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pedidos_compra_updated_at ON pedidos_compra;
CREATE TRIGGER trigger_update_pedidos_compra_updated_at
    BEFORE UPDATE ON pedidos_compra
    FOR EACH ROW
    EXECUTE FUNCTION update_pedidos_compra_updated_at();

-- Comentários para documentação
COMMENT ON TABLE pedidos_compra IS 'Armazena pedidos de compra realizados aos fornecedores';
COMMENT ON TABLE itens_pedido_compra IS 'Armazena os produtos incluídos em cada pedido de compra';
COMMENT ON COLUMN pedidos_compra.status IS 'Status do pedido: pedido, fabricacao, transito, alfandega, recebido';
COMMENT ON COLUMN itens_pedido_compra.subtotal IS 'Valor calculado automaticamente (quantidade × preço)';

-- View para facilitar consultas completas
CREATE OR REPLACE VIEW vw_pedidos_completos AS
SELECT 
    p.id,
    p.fornecedor,
    p.valor,
    p.data_pedido,
    p.previsao_entrega,
    p.observacoes,
    p.status,
    p.created_at,
    p.updated_at,
    COUNT(i.id) as total_itens,
    SUM(i.quantidade) as total_quantidade,
    json_agg(
        json_build_object(
            'id', i.id,
            'sku', i.sku,
            'quantidade', i.quantidade,
            'preco_unitario', i.preco_unitario,
            'subtotal', i.subtotal
        ) ORDER BY i.id
    ) as itens
FROM pedidos_compra p
LEFT JOIN itens_pedido_compra i ON p.id = i.pedido_id
GROUP BY p.id, p.fornecedor, p.valor, p.data_pedido, p.previsao_entrega, 
         p.observacoes, p.status, p.created_at, p.updated_at;

COMMENT ON VIEW vw_pedidos_completos IS 'View com pedidos e seus itens agregados em JSON';

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Migration executada com sucesso: Sistema de Pedidos de Compra criado!';
END $$;
