// backend/src/services/vendasMLService.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Inicializar cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios no .env');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * GET: Buscar todas as vendas do Mercado Livre
 * O Supabase tem limite máximo de 1000 por request, então faz múltiplas requisições
 */
async function buscarTodasVendas(limite = 5000, offset = 0) {
  try {
    const SUPABASE_LIMIT = 1000; // Limite máximo do Supabase por request
    let todosOsDados = [];
    let currentOffset = offset;
    let totalCount = 0;

    // Primeira requisição para pegar o count total
    const { data: primeiroLote, error: errorPrimeiro, count } = await supabase
      .from('vendas_ml')
      .select('*', { count: 'exact' })
      .order('data_pedido', { ascending: false })
      .range(currentOffset, currentOffset + SUPABASE_LIMIT - 1);

    if (errorPrimeiro) {
      console.error('Erro em buscarTodasVendas (primeira requisição):', errorPrimeiro);
      throw errorPrimeiro;
    }

    totalCount = count || 0;
    todosOsDados = primeiroLote || [];

    // Se tem mais dados, fazer requisições adicionais
    if (todosOsDados.length === SUPABASE_LIMIT && totalCount > SUPABASE_LIMIT) {
      let offset2 = currentOffset + SUPABASE_LIMIT;
      
      // Loop para pegar o resto dos dados (até ao limite solicitado)
      while (offset2 < totalCount && todosOsDados.length < limite) {
        const { data: lote, error: errorLote } = await supabase
          .from('vendas_ml')
          .select('*')
          .order('data_pedido', { ascending: false })
          .range(offset2, offset2 + SUPABASE_LIMIT - 1);

        if (errorLote) {
          console.error('Erro em buscarTodasVendas (requisição adicional):', errorLote);
          break;
        }

        if (!lote || lote.length === 0) break;

        todosOsDados = todosOsDados.concat(lote);
        offset2 += SUPABASE_LIMIT;
      }
    }

    console.log(`✅ Carregadas ${todosOsDados.length} vendas do total de ${totalCount}`);

    return {
      data: todosOsDados || [],
      total: totalCount || 0
    };
  } catch (error) {
    console.error('Erro em buscarTodasVendas:', error);
    throw error;
  }
}

/**
 * GET: Buscar vendas por período
 */
async function buscarVendasPorPeriodo(dataInicio, dataFim) {
  try {
    const { data, error } = await supabase
      .from('vendas_ml')
      .select('*')
      .gte('data_pedido', dataInicio)
      .lte('data_pedido', dataFim)
      .order('data_pedido', { ascending: false });

    if (error) {
      console.error('Erro em buscarVendasPorPeriodo:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro em buscarVendasPorPeriodo:', error);
    throw error;
  }
}

/**
 * GET: Buscar vendas por SKU
 */
async function buscarVendasPorSku(sku) {
  try {
    const { data, error } = await supabase
      .from('vendas_ml')
      .select('*')
      .eq('sku', sku)
      .order('data_pedido', { ascending: false });

    if (error) {
      console.error('Erro em buscarVendasPorSku:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro em buscarVendasPorSku:', error);
    throw error;
  }
}

/**
 * GET: Buscar vendas por status
 */
async function buscarVendasPorStatus(status) {
  try {
    const { data, error } = await supabase
      .from('vendas_ml')
      .select('*')
      .eq('status', status)
      .order('data_pedido', { ascending: false });

    if (error) {
      console.error('Erro em buscarVendasPorStatus:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro em buscarVendasPorStatus:', error);
    throw error;
  }
}

/**
 * GET: Buscar venda por order_id
 */
async function buscarVendaPorOrderId(orderId) {
  try {
    const { data, error } = await supabase
      .from('vendas_ml')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro em buscarVendaPorOrderId:', error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Erro em buscarVendaPorOrderId:', error);
    throw error;
  }
}

/**
 * GET: Calcular métricas de vendas
 */
async function buscarMetricasVendas(dataInicio = null, dataFim = null) {
  try {
    let query = supabase.from('vendas_ml').select('*');

    if (dataInicio && dataFim) {
      query = query
        .gte('data_pedido', dataInicio)
        .lte('data_pedido', dataFim);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro em buscarMetricasVendas:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        totalVendas: 0,
        quantidadeTotal: 0,
        valorVendido: 0,
        taxas: 0,
        frete: 0,
        desconto: 0,
        receita_envio: 0,
        valor_comprado: 0,
        ctl: 0,
        imposto: 0,
        valor_liquido: 0,
        lucro: 0,
        ticketMedio: 0,
        markup_medio: 0,
        margem_lucro_media: 0
      };
    }

    const metricas = {
      totalVendas: data.length,
      quantidadeTotal: data.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0),
      valorVendido: data.reduce((sum, item) => sum + (Number(item.valor_vendido) || 0), 0),
      taxas: data.reduce((sum, item) => sum + (Number(item.taxas) || 0), 0),
      frete: data.reduce((sum, item) => sum + (Number(item.frete) || 0), 0),
      desconto: data.reduce((sum, item) => sum + (Number(item.desconto) || 0), 0),
      receita_envio: data.reduce((sum, item) => sum + (Number(item.receita_envio) || 0), 0),
      valor_comprado: data.reduce((sum, item) => sum + (Number(item.valor_comprado) || 0), 0),
      ctl: data.reduce((sum, item) => sum + (Number(item.ctl) || 0), 0),
      imposto: data.reduce((sum, item) => sum + (Number(item.imposto) || 0), 0),
      valor_liquido: data.reduce((sum, item) => sum + (Number(item.valor_liquido) || 0), 0),
      lucro: data.reduce((sum, item) => sum + (Number(item.lucro) || 0), 0),
      markup_medio: 0,
      margem_lucro_media: 0
    };

    // Calcular médias
    metricas.ticketMedio = metricas.totalVendas > 0 ? metricas.valor_liquido / metricas.totalVendas : 0;
    
    const markups = data.filter(item => item.markup && Number(item.markup) > 0);
    metricas.markup_medio = markups.length > 0
      ? markups.reduce((sum, item) => sum + Number(item.markup), 0) / markups.length
      : 0;

    const margens = data.filter(item => item.margem_lucro && Number(item.margem_lucro) > 0);
    metricas.margem_lucro_media = margens.length > 0
      ? margens.reduce((sum, item) => sum + Number(item.margem_lucro), 0) / margens.length
      : 0;

    return metricas;
  } catch (error) {
    console.error('Erro em buscarMetricasVendas:', error);
    throw error;
  }
}

/**
 * GET: Agrupar vendas por SKU
 */
async function buscarVendasPorSkuAgrupadas() {
  try {
    const { data, error } = await supabase
      .from('vendas_ml')
      .select('*')
      .order('sku', { ascending: true });

    if (error) {
      console.error('Erro em buscarVendasPorSkuAgrupadas:', error);
      throw error;
    }

    // Agrupar por SKU
    const agrupadas = {};
    (data || []).forEach(item => {
      if (!agrupadas[item.sku]) {
        agrupadas[item.sku] = {
          sku: item.sku,
          totalVendas: 0,
          quantidade: 0,
          valor_vendido: 0,
          lucro: 0,
          valor_liquido: 0
        };
      }
      agrupadas[item.sku].totalVendas += 1;
      agrupadas[item.sku].quantidade += Number(item.quantidade) || 0;
      agrupadas[item.sku].valor_vendido += Number(item.valor_vendido) || 0;
      agrupadas[item.sku].lucro += Number(item.lucro) || 0;
      agrupadas[item.sku].valor_liquido += Number(item.valor_liquido) || 0;
    });

    return Object.values(agrupadas);
  } catch (error) {
    console.error('Erro em buscarVendasPorSkuAgrupadas:', error);
    throw error;
  }
}

/**
 * PUT: Atualizar venda
 */
async function atualizarVenda(orderId, updateData) {
  try {
    const { data, error } = await supabase
      .from('vendas_ml')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Erro em atualizarVenda:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro em atualizarVenda:', error);
    throw error;
  }
}

/**
 * DELETE: Deletar venda
 */
async function deletarVenda(orderId) {
  try {
    const { data, error } = await supabase
      .from('vendas_ml')
      .delete()
      .eq('order_id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Erro em deletarVenda:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro em deletarVenda:', error);
    throw error;
  }
}

module.exports = {
  buscarTodasVendas,
  buscarVendasPorPeriodo,
  buscarVendasPorSku,
  buscarVendasPorStatus,
  buscarVendaPorOrderId,
  buscarMetricasVendas,
  buscarVendasPorSkuAgrupadas,
  atualizarVenda,
  deletarVenda
};
