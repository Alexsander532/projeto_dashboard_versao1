// backend/src/db/estoque.queries.js
// Arquivo de queries para estoque
// NOTA: Estas queries são usadas pelo estoqueService.ts

/**
 * Buscar todos os produtos de estoque
 */
async function buscarTodosEstoque(pool) {
  const query = `
    SELECT * FROM estoque ORDER BY sku ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Buscar estoque simples (sku + total) - Otimizado para tabela
 */
async function buscarEstoqueSimplesOtimizado(pool) {
  const query = `
    SELECT sku, estoque as total FROM estoque ORDER BY sku ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}

/**
 * Buscar um estoque por SKU
 */
async function buscarEstoquePorSku(pool, sku) {
  const query = `
    SELECT * FROM estoque WHERE sku = $1
  `;
  const result = await pool.query(query, [sku]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Atualizar um estoque
 */
async function atualizarEstoque(pool, sku, dados) {
  const fields = [];
  const values = [];
  let index = 1;

  Object.keys(dados).forEach((key) => {
    fields.push(`${key} = $${index}`);
    values.push(dados[key]);
    index++;
  });

  fields.push(`updated_at = NOW()`);
  values.push(sku);

  const query = `
    UPDATE estoque
    SET ${fields.join(', ')}
    WHERE sku = $${index}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Atualizar quantidade delta
 */
async function atualizarEstoqueDelta(pool, sku, delta) {
  const query = `
    UPDATE estoque
    SET estoque = estoque + $1, updated_at = NOW()
    WHERE sku = $2
    RETURNING *
  `;
  const result = await pool.query(query, [delta, sku]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Buscar métricas de estoque
 */
async function buscarMetricasEstoque(pool) {
  const query = `
    SELECT
      COUNT(*) as total_produtos,
      SUM(estoque) as total_estoque,
      SUM(estoque * cmv) as valor_total_estoque,
      COUNT(CASE WHEN status = 'Em reposição' THEN 1 END) as produtos_reposicao,
      COUNT(CASE WHEN status = 'Sem Estoque' THEN 1 END) as produtos_sem_estoque,
      AVG(media_vendas) as media_geral_vendas
    FROM estoque
  `;
  const result = await pool.query(query);
  return result.rows[0];
}

/**
 * Buscar estoques por status
 */
async function buscarEstoquesPorStatus(pool, status) {
  const query = `
    SELECT * FROM estoque WHERE status = $1 ORDER BY sku ASC
  `;
  const result = await pool.query(query, [status]);
  return result.rows;
}

/**
 * Buscar estoques críticos
 */
async function buscarEstoquesCriticos(pool, diasMinimos = 5) {
  const query = `
    SELECT * FROM estoque
    WHERE previsao_dias < $1
    ORDER BY previsao_dias ASC
  `;
  const result = await pool.query(query, [diasMinimos]);
  return result.rows;
}

module.exports = {
  buscarTodosEstoque,
  buscarEstoqueSimplesOtimizado,
  buscarEstoquePorSku,
  atualizarEstoque,
  atualizarEstoqueDelta,
  buscarMetricasEstoque,
  buscarEstoquesPorStatus,
  buscarEstoquesCriticos,
};
