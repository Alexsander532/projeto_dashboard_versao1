// backend/src/types/estoque.ts

/**
 * Interface com os dados brutos retornados do Supabase
 */
export interface EstoqueRaw {
  id: number;
  sku: string;
  descricao: string;
  estoque: number;
  minimo: number;
  cmv: number;
  valor_liquido: number;
  media_vendas: number;
  total_vendas: number;
  vendas_quinzenais: number;
  ultima_venda: string | null;
  status: string;
  previsao_dias: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interface simplificada com apenas sku e estoque
 */
export interface EstoqueSimples {
  sku: string;
  estoque: number;
}

/**
 * Interface para uso na API
 */
export type Estoque = EstoqueRaw;

/**
 * Interface para dados de entrada ao atualizar
 */
export interface AtualizarEstoqueInput {
  produto?: string;
  estoque?: number;
  minimo?: number;
  precoCompra?: number;
  valorLiquidoMedio?: number;
  status?: string;
}

/**
 * Interface para atualização de quantidade
 */
export interface AtualizarQuantidadeInput {
  quantidade: number;
}

/**
 * Interface para atualização delta
 */
export interface AtualizarDeltaInput {
  delta: number;
}

/**
 * Interface para atualização de CMV
 */
export interface AtualizarCMVInput {
  cmv: number;
}

/**
 * Interface para métricas gerais de estoque
 */
export interface EstoqueMetricas {
  totalProdutos: number;
  totalEstoque: number;
  valorTotalEstoque: number;
  produtosReposicao: number;
  produtosSemEstoque: number;
  mediaGeralVendas: number;
}

/**
 * Interface para resposta de erro
 */
export interface ErroResponse {
  error: string;
  details?: string;
}

/**
 * Status possíveis de um produto
 */
export enum StatusEstoque {
  SEM_ESTOQUE = 'Sem Estoque',
  EM_REPOSICAO = 'Em reposição',
  EM_NEGOCIACAO = 'Em negociação',
  EM_ESTOQUE = 'Em estoque',
  ESTOQUE_ALTO = 'Estoque alto',
}

/**
 * Função utilitária para calcular status baseado em estoque e mínimo
 */
export function calcularStatus(estoque: number, minimo: number): StatusEstoque {
  if (estoque === 0) return StatusEstoque.SEM_ESTOQUE;
  if (estoque < minimo) return StatusEstoque.EM_REPOSICAO;
  if (estoque < minimo * 1.2) return StatusEstoque.EM_NEGOCIACAO;
  if (estoque <= minimo * 1.5) return StatusEstoque.EM_ESTOQUE;
  return StatusEstoque.ESTOQUE_ALTO;
}
