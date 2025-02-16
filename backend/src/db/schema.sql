-- Criar tabela de vendas do Mercado Livre se não existir
DROP TABLE IF EXISTS vendas_ml;
CREATE TABLE vendas_ml (
    id SERIAL PRIMARY KEY,
    marketplace VARCHAR(50) NOT NULL,
    pedido VARCHAR(50) NOT NULL UNIQUE,
    data TIMESTAMP NOT NULL,
    sku VARCHAR(50) NOT NULL,
    unidades INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'Concluído',
    valor_comprado DECIMAL(10,2) NOT NULL DEFAULT 0,
    valor_vendido DECIMAL(10,2) NOT NULL DEFAULT 0,
    taxas DECIMAL(10,2) NOT NULL DEFAULT 0,
    frete DECIMAL(10,2) NOT NULL DEFAULT 0,
    descontos DECIMAL(10,2) NOT NULL DEFAULT 0,
    ctl DECIMAL(10,2) NOT NULL DEFAULT 0,
    receita_envio DECIMAL(10,2) NOT NULL DEFAULT 0,
    valor_liquido DECIMAL(10,2) GENERATED ALWAYS AS (
        valor_vendido - taxas - frete - descontos - ctl + receita_envio
    ) STORED,
    lucro DECIMAL(10,2) GENERATED ALWAYS AS (
        valor_vendido - taxas - frete - descontos - ctl + receita_envio - valor_comprado
    ) STORED,
    markup DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN valor_comprado > 0 THEN ((valor_vendido / valor_comprado) - 1) * 100
            ELSE 0
        END
    ) STORED,
    margem_lucro DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
            WHEN valor_vendido > 0 THEN (
                (valor_vendido - taxas - frete - descontos - ctl + receita_envio - valor_comprado) / valor_vendido
            ) * 100
            ELSE 0
        END
    ) STORED,
    envio VARCHAR(50) NOT NULL DEFAULT 'FULL',
    numero_envio VARCHAR(50),
    imposto DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_vendas_ml_data ON vendas_ml(data);
CREATE INDEX IF NOT EXISTS idx_vendas_ml_sku ON vendas_ml(sku);
CREATE INDEX IF NOT EXISTS idx_vendas_ml_pedido ON vendas_ml(pedido);

-- Trigger para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar o timestamp automaticamente
DROP TRIGGER IF EXISTS update_vendas_ml_updated_at ON vendas_ml;
CREATE TRIGGER update_vendas_ml_updated_at
    BEFORE UPDATE ON vendas_ml
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela de metas do Mercado Livre se não existir
CREATE TABLE IF NOT EXISTS metas_ml (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL,
    mes_ano VARCHAR(7) NOT NULL,
    meta_quantidade INTEGER NOT NULL,
    meta_valor DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT metas_ml_sku_mes_ano_key UNIQUE (sku, mes_ano)
);

-- Tabela de Estoque
DROP TABLE IF EXISTS estoque;
CREATE TABLE IF NOT EXISTS estoque (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    minimo INTEGER NOT NULL DEFAULT 0,
    cmv DECIMAL(10,2) NOT NULL DEFAULT 0,
    valor_liquido DECIMAL(10,2) NOT NULL DEFAULT 0,
    media_vendas DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_vendas INTEGER NOT NULL DEFAULT 0,
    ultima_venda DATE,
    status VARCHAR(50) DEFAULT 'Em Estoque',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar o timestamp automaticamente
DROP TRIGGER IF EXISTS update_estoque_updated_at ON estoque;
CREATE TRIGGER update_estoque_updated_at
    BEFORE UPDATE ON estoque
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular o status do produto baseado no estoque
CREATE OR REPLACE FUNCTION calcular_status_estoque()
RETURNS TRIGGER AS $$
BEGIN
    -- Define o status baseado nas regras de negócio
    IF NEW.estoque = 0 THEN
        NEW.status = 'Sem Estoque';
    ELSIF NEW.estoque < NEW.minimo THEN
        NEW.status = 'Em reposição';
    ELSIF NEW.estoque < (NEW.minimo * 1.2) THEN
        NEW.status = 'Em negociação';
    ELSIF NEW.estoque <= (NEW.minimo * 1.5) THEN
        NEW.status = 'Em estoque';
    ELSE
        NEW.status = 'Estoque alto';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar o status automaticamente
DROP TRIGGER IF EXISTS update_estoque_status ON estoque;
CREATE TRIGGER update_estoque_status
    BEFORE INSERT OR UPDATE OF estoque, minimo ON estoque
    FOR EACH ROW
    EXECUTE FUNCTION calcular_status_estoque();

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_estoque_sku ON estoque(sku);
CREATE INDEX IF NOT EXISTS idx_estoque_status ON estoque(status);
