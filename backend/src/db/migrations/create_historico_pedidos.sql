-- =====================================================
-- MIGRATION: Histórico de Movimentações de Pedidos
-- Descrição: Cria tabela para registrar mudanças de status
-- Data: 2025-12-13
-- =====================================================

-- Tabela de histórico de movimentações
CREATE TABLE IF NOT EXISTS historico_pedidos_compra (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos_compra(id) ON DELETE CASCADE,
    status_anterior VARCHAR(50),
    status_novo VARCHAR(50) NOT NULL,
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacao TEXT,
    
    -- Validações
    CONSTRAINT chk_status_anterior CHECK (status_anterior IS NULL OR status_anterior IN ('pedido', 'fabricacao', 'transito', 'alfandega', 'recebido')),
    CONSTRAINT chk_status_novo CHECK (status_novo IN ('pedido', 'fabricacao', 'transito', 'alfandega', 'recebido'))
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_historico_pedido ON historico_pedidos_compra(pedido_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_pedidos_compra(data_movimentacao DESC);

-- Comentários para documentação
COMMENT ON TABLE historico_pedidos_compra IS 'Armazena histórico de mudanças de status dos pedidos de compra';
COMMENT ON COLUMN historico_pedidos_compra.status_anterior IS 'Status antes da mudança (NULL para criação)';
COMMENT ON COLUMN historico_pedidos_compra.status_novo IS 'Novo status do pedido';
COMMENT ON COLUMN historico_pedidos_compra.data_movimentacao IS 'Data/hora da mudança de status';

-- Trigger para registrar automaticamente mudanças de status
CREATE OR REPLACE FUNCTION registrar_historico_pedido()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar apenas se o status mudou ou é uma inserção
    IF TG_OP = 'INSERT' THEN
        INSERT INTO historico_pedidos_compra (pedido_id, status_anterior, status_novo, observacao)
        VALUES (NEW.id, NULL, NEW.status, 'Pedido criado');
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO historico_pedidos_compra (pedido_id, status_anterior, status_novo)
        VALUES (NEW.id, OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_historico_pedido ON pedidos_compra;
CREATE TRIGGER trigger_historico_pedido
    AFTER INSERT OR UPDATE ON pedidos_compra
    FOR EACH ROW
    EXECUTE FUNCTION registrar_historico_pedido();

-- Tornar fornecedor opcional (remover NOT NULL se existir)
ALTER TABLE pedidos_compra ALTER COLUMN fornecedor DROP NOT NULL;

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Migration executada com sucesso: Histórico de Pedidos criado!';
END $$;
