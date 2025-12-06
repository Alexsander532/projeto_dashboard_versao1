// backend/src/services/estoqueService.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Inicializar cliente Supabase com URL e ANON_KEY
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios no .env');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * GET: Buscar todos os produtos de estoque (sku e total)
 */
async function buscarTodosEstoques() {
  try {
    const { data, error } = await supabase
      .from('estoque')
      .select('sku, total, preco_compra, bling, full_ml, magalu, id, created_at, updated_at')
      .order('sku', { ascending: true });

    if (error) {
      console.error('Erro em buscarTodosEstoques:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro em buscarTodosEstoques:', error);
    throw error;
  }
}

/**
 * GET: Buscar um produto específico pelo SKU
 */
async function buscarEstoquePorSku(sku) {
  try {
    const { data, error } = await supabase
      .from('estoque')
      .select('*')
      .eq('sku', sku)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro em buscarEstoquePorSku:', error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Erro em buscarEstoquePorSku:', error);
    throw error;
  }
}

/**
 * PUT: Atualizar informações de um produto
 */
async function atualizarEstoque(sku, input) {
  try {
    // Buscar produto atual
    const produtoAtual = await buscarEstoquePorSku(sku);
    if (!produtoAtual) {
      throw new Error('Produto não encontrado');
    }

    // Preparar objeto de atualização
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Atualizar campos fornecidos
    if (input.bling !== undefined) {
      updateData.bling = Math.floor(input.bling);
    }
    if (input.full_ml !== undefined) {
      updateData.full_ml = Math.floor(input.full_ml);
    }
    if (input.magalu !== undefined) {
      updateData.magalu = Math.floor(input.magalu);
    }
    if (input.total !== undefined) {
      updateData.total = Math.floor(input.total);
    }
    if (input.preco_compra !== undefined) {
      updateData.preco_compra = parseFloat(input.preco_compra);
    }

    const { data, error } = await supabase
      .from('estoque')
      .update(updateData)
      .eq('sku', sku)
      .select()
      .single();

    if (error) {
      console.error('Erro em atualizarEstoque:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Falha ao atualizar produto');
    }

    return data;
  } catch (error) {
    console.error('Erro em atualizarEstoque:', error);
    throw error;
  }
}

/**
 * PUT: Atualizar apenas a quantidade total
 */
async function atualizarQuantidade(sku, quantidade) {
  try {
    // Validar quantidade
    if (typeof quantidade !== 'number' || quantidade < 0) {
      throw new Error('Quantidade deve ser um número não-negativo');
    }

    const { data, error } = await supabase
      .from('estoque')
      .update({
        total: Math.floor(quantidade),
        updated_at: new Date().toISOString(),
      })
      .eq('sku', sku)
      .select()
      .single();

    if (error) {
      console.error('Erro em atualizarQuantidade:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Falha ao atualizar quantidade');
    }

    return data;
  } catch (error) {
    console.error('Erro em atualizarQuantidade:', error);
    throw error;
  }
}

/**
 * POST: Adicionar ou remover quantidade (delta)
 */
async function atualizarQuantidadeDelta(sku, delta) {
  try {
    // Validar delta
    if (typeof delta !== 'number' || isNaN(delta)) {
      throw new Error('Delta deve ser um número');
    }

    // Buscar produto atual
    const produtoAtual = await buscarEstoquePorSku(sku);
    if (!produtoAtual) {
      throw new Error('Produto não encontrado');
    }

    // Calcular nova quantidade
    const novaQuantidade = (produtoAtual.total || 0) + Math.floor(delta);

    // Validar que não fica negativo
    if (novaQuantidade < 0) {
      throw new Error('Não é possível remover mais do que existe em estoque');
    }

    const { data, error } = await supabase
      .from('estoque')
      .update({
        total: novaQuantidade,
        updated_at: new Date().toISOString(),
      })
      .eq('sku', sku)
      .select()
      .single();

    if (error) {
      console.error('Erro em atualizarQuantidadeDelta:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Falha ao atualizar quantidade');
    }

    return data;
  } catch (error) {
    console.error('Erro em atualizarQuantidadeDelta:', error);
    throw error;
  }
}

/**
 * DELETE: Deletar um produto do estoque
 */
async function deletarEstoque(sku) {
  try {
    const { error, count } = await supabase
      .from('estoque')
      .delete()
      .eq('sku', sku);

    if (error) {
      console.error('Erro em deletarEstoque:', error);
      throw error;
    }

    if (!count || count === 0) {
      throw new Error('Produto não encontrado');
    }
  } catch (error) {
    console.error('Erro em deletarEstoque:', error);
    throw error;
  }
}

/**
 * GET: Buscar métricas gerais de estoque
 */
async function buscarMetricasEstoque() {
  try {
    const { data: produtos, error } = await supabase
      .from('estoque')
      .select('sku, bling, full_ml, magalu, total');

    if (error) {
      console.error('Erro em buscarMetricasEstoque:', error);
      throw error;
    }

    const estoques = produtos || [];

    // Calcular métricas
    const metricas = {
      totalProdutos: estoques.length,
      totalEstoque: estoques.reduce((sum, p) => sum + (p.total || 0), 0),
      totalBling: estoques.reduce((sum, p) => sum + (p.bling || 0), 0),
      totalFullML: estoques.reduce((sum, p) => sum + (p.full_ml || 0), 0),
      totalMagalu: estoques.reduce((sum, p) => sum + (p.magalu || 0), 0),
    };

    return metricas;
  } catch (error) {
    console.error('Erro em buscarMetricasEstoque:', error);
    throw error;
  }
}

/**
 * GET: Buscar produtos por SKU (busca parcial)
 */
async function buscarEstoquesPorStatus(status) {
  try {
    const { data, error } = await supabase
      .from('estoque')
      .select('*')
      .ilike('sku', `%${status}%`)
      .order('sku', { ascending: true });

    if (error) {
      console.error('Erro em buscarEstoquesPorStatus:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro em buscarEstoquesPorStatus:', error);
    throw error;
  }
}

/**
 * GET: Buscar produtos críticos (total zerado)
 */
async function buscarEstoquesCriticos(diasMinimos = 5) {
  try {
    const { data, error } = await supabase
      .from('estoque')
      .select('*')
      .eq('total', 0)
      .order('sku', { ascending: true });

    if (error) {
      console.error('Erro em buscarEstoquesCriticos:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro em buscarEstoquesCriticos:', error);
    throw error;
  }
}

module.exports = {
  buscarTodosEstoques,
  buscarEstoquePorSku,
  atualizarEstoque,
  atualizarQuantidade,
  atualizarQuantidadeDelta,
  deletarEstoque,
  buscarMetricasEstoque,
  buscarEstoquesPorStatus,
  buscarEstoquesCriticos,
};
