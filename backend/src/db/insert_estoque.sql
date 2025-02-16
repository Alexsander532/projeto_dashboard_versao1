-- Limpa a tabela antes de inserir os dados
TRUNCATE TABLE estoque;

-- Insere os produtos
INSERT INTO estoque (
    sku, 
    descricao, 
    estoque, 
    minimo, 
    cmv, 
    valor_liquido, 
    media_vendas,
    total_vendas,
    ultima_venda
) VALUES
('GP0029', 'Kit Gabinete Pro Max', 45, 30, 52.50, 68.25, 5, 75, '2024-01-04'),
('GP0047', 'Kit Gabinete Premium Plus', 32, 25, 75.30, 97.89, 4, 60, '2024-01-04'),
('GP0050', 'Kit Gabinete Premium', 28, 35, 63.80, 82.94, 6, 90, '2024-01-04'),
('KGP001', 'Kit Gabinete Basic Plus', 55, 40, 41.20, 53.56, 3, 45, '2024-01-04'),
('KGP002', 'Kit Gabinete Standard', 22, 30, 46.90, 60.97, 4, 60, '2024-01-04'),
('KGP003', 'Kit Gabinete Plus', 38, 35, 58.40, 75.92, 5, 75, '2024-01-04'),
('KGP005', 'Kit Gabinete Pro', 18, 25, 69.90, 90.87, 7, 105, '2024-01-04');

-- O status será calculado automaticamente pelo trigger
-- O valor_liquido foi calculado com uma margem de 30% sobre o CMV
-- total_vendas foi calculado como media_vendas * 15 dias
-- created_at e updated_at serão preenchidos automaticamente 