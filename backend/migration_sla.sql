-- Migration: Add SLA columns to pedidos_compra
ALTER TABLE pedidos_compra
ADD COLUMN IF NOT EXISTS prazo_fabricacao INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prazo_transito INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prazo_alfandega INTEGER DEFAULT 0;

-- Optional: Comments for documentation
COMMENT ON COLUMN pedidos_compra.prazo_fabricacao IS 'Prazo estimado em dias para a etapa de fabricação';
COMMENT ON COLUMN pedidos_compra.prazo_transito IS 'Prazo estimado em dias para a etapa de trânsito';
COMMENT ON COLUMN pedidos_compra.prazo_alfandega IS 'Prazo estimado em dias para a etapa de alfândega';
