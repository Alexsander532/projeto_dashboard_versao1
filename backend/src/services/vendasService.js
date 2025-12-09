const supabase = require('../config/supabase');

/**
 * Buscar métricas totais de vendas para um mês/ano específico
 * @param {string} mesAno - Formato: "YYYY-MM" (ex: "2025-12")
 * @returns {Object} { valor_total_vendido, total_unidades, margem_media }
 */
async function buscarMetricasVendas(mesAno) {
  try {
    const [anoReq, mesReq] = mesAno.split('-').map(Number);
    
    console.log(`📊 Buscando métricas de vendas para ${mesReq}/${anoReq}`);
    
    // Buscar TODAS as vendas com paginação (Supabase tem limite de 1000 por requisição)
    const SUPABASE_LIMIT = 1000;
    let todosOsDados = [];
    let offset = 0;
    let temMais = true;
    
    while (temMais) {
      const { data, error, count } = await supabase
        .from('vendas_ml')
        .select('*', { count: 'exact' })
        .range(offset, offset + SUPABASE_LIMIT - 1);
      
      if (error) {
        console.error('Erro ao buscar vendas para métricas:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        temMais = false;
      } else {
        todosOsDados = todosOsDados.concat(data);
        offset += SUPABASE_LIMIT;
        
        // Parar se já temos mais do que o count total
        if (count && todosOsDados.length >= count) {
          temMais = false;
        }
      }
    }
    
    console.log(`📌 Total de vendas carregadas: ${todosOsDados.length}`);
    
    // Filtrar por mês/ano parseando a data DD/MM/YY HH:MM:SS
    const vendasDoMes = todosOsDados.filter(venda => {
      if (!venda.data_pedido) return false;
      
      // Parse: "08/01/25 11:52:28" -> { dia: 8, mes: 1, ano: 25 }
      const partes = venda.data_pedido.split(' ')[0].split('/');
      const dia = parseInt(partes[0]);
      const mes = parseInt(partes[1]);
      const anoYY = parseInt(partes[2]);
      
      // Converter YY para YYYY (25 -> 2025, 24 -> 2024)
      const ano = anoYY < 50 ? 2000 + anoYY : 1900 + anoYY;
      
      // Verificar se corresponde ao mês/ano solicitado
      return mes === mesReq && ano === anoReq;
    });
    
    console.log(`📌 Vendas encontradas em ${mesReq}/${anoReq}: ${vendasDoMes.length}`);
    
    // Calcular métricas
    let valor_total_vendido = 0;
    let total_unidades = 0;
    let total_lucro = 0;
    
    if (vendasDoMes && vendasDoMes.length > 0) {
      valor_total_vendido = vendasDoMes.reduce((sum, venda) => sum + (venda.valor_vendido || 0), 0);
      total_unidades = vendasDoMes.reduce((sum, venda) => sum + (venda.quantidade || 0), 0);
      total_lucro = vendasDoMes.reduce((sum, venda) => sum + (venda.lucro || 0), 0);
      
      console.log(`📌 Amostra de vendas (primeiras 2):`);
      vendasDoMes.slice(0, 2).forEach(v => {
        console.log(`   SKU: ${v.sku}, Quantidade: ${v.quantidade}, Valor: ${v.valor_vendido}`);
      });
    }
    
    const margem_media = valor_total_vendido > 0 
      ? (total_lucro / valor_total_vendido) * 100 
      : 0;
    
    const resultado = {
      valor_total_vendido: parseFloat(valor_total_vendido.toFixed(2)),
      total_unidades: parseInt(total_unidades),
      margem_media: parseFloat(margem_media.toFixed(2))
    };
    
    console.log(`✅ Métricas encontradas:`, resultado);
    return resultado;
  } catch (error) {
    console.error('Erro no serviço de métricas de vendas:', error);
    throw error;
  }
}

/**
 * Buscar vendas agrupadas por SKU para um mês/ano específico
 * @param {string} mesAno - Formato: "YYYY-MM" (ex: "2025-12")
 * @returns {Array} Array de { sku, produto, valor_vendido, unidades, lucro, margem_lucro }
 */
async function buscarVendasPorSku(mesAno) {
  try {
    const [anoReq, mesReq] = mesAno.split('-').map(Number);
    
    console.log(`📊 Buscando vendas por SKU para ${mesReq}/${anoReq}`);
    
    // Buscar TODAS as vendas com paginação (Supabase tem limite de 1000 por requisição)
    const SUPABASE_LIMIT = 1000;
    let todosOsDados = [];
    let offset = 0;
    let temMais = true;
    
    while (temMais) {
      const { data, error, count } = await supabase
        .from('vendas_ml')
        .select('*', { count: 'exact' })
        .range(offset, offset + SUPABASE_LIMIT - 1);
      
      if (error) {
        console.error('Erro ao buscar vendas por SKU:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        temMais = false;
      } else {
        todosOsDados = todosOsDados.concat(data);
        offset += SUPABASE_LIMIT;
        
        // Parar se já temos mais do que o count total
        if (count && todosOsDados.length >= count) {
          temMais = false;
        }
      }
    }
    
    console.log(`📌 Total de vendas carregadas: ${todosOsDados.length}`);
    
    // Filtrar por mês/ano parseando a data DD/MM/YY HH:MM:SS
    const vendasDoMes = todosOsDados.filter(venda => {
      if (!venda.data_pedido) return false;
      
      // Parse: "08/01/25 11:52:28" -> { dia: 8, mes: 1, ano: 25 }
      const partes = venda.data_pedido.split(' ')[0].split('/');
      const dia = parseInt(partes[0]);
      const mes = parseInt(partes[1]);
      const anoYY = parseInt(partes[2]);
      
      // Converter YY para YYYY (25 -> 2025, 24 -> 2024)
      const ano = anoYY < 50 ? 2000 + anoYY : 1900 + anoYY;
      
      // Verificar se corresponde ao mês/ano solicitado
      return mes === mesReq && ano === anoReq;
    });
    
    console.log(`📌 Vendas encontradas em ${mesReq}/${anoReq}: ${vendasDoMes.length}`);
    
    if (!vendasDoMes || vendasDoMes.length === 0) {
      console.log('⚠️ Nenhuma venda encontrada para este período');
      return [];
    }
    
    // Agrupar por SKU
    const vendasPorSku = {};
    
    vendasDoMes.forEach(venda => {
      if (!vendasPorSku[venda.sku]) {
        vendasPorSku[venda.sku] = {
          sku: venda.sku,
          produto: venda.descricao_produto || 'Sem descrição',
          valor_vendido: 0,
          unidades: 0,
          lucro: 0
        };
      }
      
      vendasPorSku[venda.sku].valor_vendido += venda.valor_vendido || 0;
      vendasPorSku[venda.sku].unidades += venda.quantidade || 0;
      vendasPorSku[venda.sku].lucro += venda.lucro || 0;
    });
    
    // Converter para array e calcular margem
    const resultado = Object.values(vendasPorSku)
      .map(sku => ({
        ...sku,
        valor_vendido: parseFloat(sku.valor_vendido.toFixed(2)),
        unidades: parseInt(sku.unidades),
        lucro: parseFloat(sku.lucro.toFixed(2)),
        margem_lucro: sku.valor_vendido > 0 
          ? parseFloat(((sku.lucro / sku.valor_vendido) * 100).toFixed(2))
          : 0
      }))
      .sort((a, b) => b.valor_vendido - a.valor_vendido);
    
    console.log(`✅ Encontrados ${resultado.length} SKUs com vendas`);
    return resultado;
  } catch (error) {
    console.error('Erro no serviço de vendas por SKU:', error);
    throw error;
  }
}

module.exports = {
  buscarMetricasVendas,
  buscarVendasPorSku
};
