// backend/src/services/comprasService.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios no .env');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Criar novo pedido de compra com itens
 */
async function criarPedido(dadosPedido) {
  try {
    const { fornecedor, valor, dataPedido, previsaoEntrega, observacoes, produtos } = dadosPedido;

    // 1. Criar pedido principal
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos_compra')
      .insert({
        fornecedor,
        valor,
        data_pedido: dataPedido,
        previsao_entrega: previsaoEntrega || null,
        observacoes: observacoes || null,
        status: 'pedido'
      })
      .select()
      .single();

    if (pedidoError) {
      console.error('Erro ao criar pedido:', pedidoError);
      throw pedidoError;
    }

    // 2. Criar itens do pedido
    if (produtos && produtos.length > 0) {
      const itensParaInserir = produtos.map(prod => ({
        pedido_id: pedido.id,
        sku: prod.sku,
        quantidade: prod.quantidade,
        preco_unitario: prod.precoCompra || prod.preco_unitario || 0
      }));

      const { data: itens, error: itensError } = await supabase
        .from('itens_pedido_compra')
        .insert(itensParaInserir)
        .select();

      if (itensError) {
        console.error('Erro ao criar itens do pedido:', itensError);
        // Rollback: deletar pedido se falhar ao criar itens
        await supabase.from('pedidos_compra').delete().eq('id', pedido.id);
        throw itensError;
      }

      // Retornar pedido com itens
      return {
        ...pedido,
        produtos: itens
      };
    }

    return pedido;
  } catch (error) {
    console.error('Erro em criarPedido:', error);
    throw error;
  }
}

/**
 * Buscar todos os pedidos com seus itens
 */
async function buscarTodosPedidos(filtros = {}) {
  try {
    let query = supabase
      .from('pedidos_compra')
      .select(`
        *,
        itens:itens_pedido_compra(*)
      `)
      .order('data_pedido', { ascending: false });

    // Aplicar filtros opcionais
    if (filtros.status) {
      query = query.eq('status', filtros.status);
    }

    if (filtros.fornecedor) {
      query = query.ilike('fornecedor', `%${filtros.fornecedor}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
      throw error;
    }

    // Renomear itens para produtos para manter compatibilidade com frontend
    return data.map(pedido => ({
      ...pedido,
      produtos: pedido.itens || [],
      itens: undefined // remover campo itens
    }));
  } catch (error) {
    console.error('Erro em buscarTodosPedidos:', error);
    throw error;
  }
}

/**
 * Buscar pedido específico por ID
 */
async function buscarPedidoPorId(id) {
  try {
    const { data, error } = await supabase
      .from('pedidos_compra')
      .select(`
        *,
        itens:itens_pedido_compra(*)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar pedido:', error);
      throw error;
    }

    if (!data) {
      return null;
    }

    return {
      ...data,
      produtos: data.itens || [],
      itens: undefined
    };
  } catch (error) {
    console.error('Erro em buscarPedidoPorId:', error);
    throw error;
  }
}

/**
 * Atualizar status do pedido
 */
async function atualizarStatusPedido(id, novoStatus) {
  try {
    const statusValidos = ['pedido', 'fabricacao', 'transito', 'alfandega', 'recebido'];
    
    if (!statusValidos.includes(novoStatus)) {
      throw new Error(`Status inválido: ${novoStatus}. Deve ser um de: ${statusValidos.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('pedidos_compra')
      .update({ status: novoStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro em atualizarStatusPedido:', error);
    throw error;
  }
}

/**
 * Atualizar pedido completo
 */
async function atualizarPedido(id, dadosAtualizados) {
  try {
    const { fornecedor, valor, dataPedido, previsaoEntrega, observacoes, status } = dadosAtualizados;

    const dadosParaAtualizar = {};
    if (fornecedor !== undefined) dadosParaAtualizar.fornecedor = fornecedor;
    if (valor !== undefined) dadosParaAtualizar.valor = valor;
    if (dataPedido !== undefined) dadosParaAtualizar.data_pedido = dataPedido;
    if (previsaoEntrega !== undefined) dadosParaAtualizar.previsao_entrega = previsaoEntrega;
    if (observacoes !== undefined) dadosParaAtualizar.observacoes = observacoes;
    if (status !== undefined) dadosParaAtualizar.status = status;

    const { data, error } = await supabase
      .from('pedidos_compra')
      .update(dadosParaAtualizar)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar pedido:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro em atualizarPedido:', error);
    throw error;
  }
}

/**
 * Deletar pedido (cascade deleta itens também)
 */
async function deletarPedido(id) {
  try {
    const { error } = await supabase
      .from('pedidos_compra')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar pedido:', error);
      throw error;
    }

    return { success: true, id };
  } catch (error) {
    console.error('Erro em deletarPedido:', error);
    throw error;
  }
}

/**
 * Buscar histórico de movimentações de um pedido
 */
async function buscarHistoricoPedido(pedidoId) {
  try {
    const { data, error } = await supabase
      .from('historico_pedidos_compra')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('data_movimentacao', { ascending: false });

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro em buscarHistoricoPedido:', error);
    throw error;
  }
}

/**
 * Atualizar pedido completo incluindo itens
 */
async function atualizarPedidoCompleto(id, dadosAtualizados) {
  try {
    const { fornecedor, valor, dataPedido, previsaoEntrega, observacoes, status, produtos } = dadosAtualizados;

    // 1. Atualizar dados do pedido
    const dadosParaAtualizar = {};
    if (fornecedor !== undefined) dadosParaAtualizar.fornecedor = fornecedor;
    if (valor !== undefined) dadosParaAtualizar.valor = valor;
    if (dataPedido !== undefined) dadosParaAtualizar.data_pedido = dataPedido;
    if (previsaoEntrega !== undefined) dadosParaAtualizar.previsao_entrega = previsaoEntrega;
    if (observacoes !== undefined) dadosParaAtualizar.observacoes = observacoes;
    if (status !== undefined) dadosParaAtualizar.status = status;

    const { data: pedidoAtualizado, error: pedidoError } = await supabase
      .from('pedidos_compra')
      .update(dadosParaAtualizar)
      .eq('id', id)
      .select()
      .single();

    if (pedidoError) {
      console.error('Erro ao atualizar pedido:', pedidoError);
      throw pedidoError;
    }

    // 2. Se produtos foram enviados, atualizar itens
    if (produtos && produtos.length > 0) {
      // Deletar itens antigos
      const { error: deleteError } = await supabase
        .from('itens_pedido_compra')
        .delete()
        .eq('pedido_id', id);

      if (deleteError) {
        console.error('Erro ao deletar itens antigos:', deleteError);
        throw deleteError;
      }

      // Inserir novos itens
      const itensParaInserir = produtos.map(prod => ({
        pedido_id: id,
        sku: prod.sku,
        quantidade: prod.quantidade,
        preco_unitario: prod.precoCompra || prod.preco_unitario || 0
      }));

      const { data: novosItens, error: itensError } = await supabase
        .from('itens_pedido_compra')
        .insert(itensParaInserir)
        .select();

      if (itensError) {
        console.error('Erro ao inserir novos itens:', itensError);
        throw itensError;
      }

      return {
        ...pedidoAtualizado,
        produtos: novosItens
      };
    }

    return pedidoAtualizado;
  } catch (error) {
    console.error('Erro em atualizarPedidoCompleto:', error);
    throw error;
  }
}

/**
 * Buscar métricas financeiras dos pedidos
 */
async function buscarMetricasFinanceiras() {
  try {
    const { data, error } = await supabase
      .from('pedidos_compra')
      .select('status, valor');

    if (error) {
      console.error('Erro ao buscar métricas:', error);
      throw error;
    }

    const metricas = {
      totalPedidos: 0,
      totalTransito: 0,
      totalRecebido: 0,
      totalPendente: 0,
      totalGeral: 0,
      countPorStatus: {
        pedido: 0,
        fabricacao: 0,
        transito: 0,
        alfandega: 0,
        recebido: 0
      }
    };

    data.forEach(pedido => {
      const valor = parseFloat(pedido.valor) || 0;
      metricas.totalGeral += valor;
      metricas.countPorStatus[pedido.status]++;

      switch (pedido.status) {
        case 'pedido':
          metricas.totalPedidos += valor;
          metricas.totalPendente += valor;
          break;
        case 'fabricacao':
        case 'transito':
        case 'alfandega':
          metricas.totalTransito += valor;
          metricas.totalPendente += valor;
          break;
        case 'recebido':
          metricas.totalRecebido += valor;
          break;
      }
    });

    return metricas;
  } catch (error) {
    console.error('Erro em buscarMetricasFinanceiras:', error);
    throw error;
  }
}

module.exports = {
  criarPedido,
  buscarTodosPedidos,
  buscarPedidoPorId,
  atualizarStatusPedido,
  atualizarPedido,
  atualizarPedidoCompleto,
  deletarPedido,
  buscarMetricasFinanceiras,
  buscarHistoricoPedido
};
