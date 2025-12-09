const supabase = require('../config/supabase');

// Buscar todas as metas por mês/ano
async function buscarMetasPorMes(mesAno) {
  try {
    const [ano, mes] = mesAno.split('-').map(Number);
    
    console.log(`Buscando metas para ${mes}/${ano}`);
    
    // Calcular data de início e fim do mês
    const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
    
    // Calcular próximo mês corretamente (não pode ter mês 13)
    let proxAno = ano;
    let proxMes = mes + 1;
    if (proxMes > 12) {
      proxMes = 1;
      proxAno = ano + 1;
    }
    const dataFim = `${proxAno}-${String(proxMes).padStart(2, '0')}-01`;
    
    const { data, error } = await supabase
      .from('metas_ml')
      .select('*')
      .gte('mes_ano', dataInicio)
      .lt('mes_ano', dataFim)
      .order('sku', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar metas:', error);
      throw error;
    }
    
    console.log(`Encontradas ${data.length} metas`);
    return data;
  } catch (error) {
    console.error('Erro no serviço de metas:', error);
    throw error;
  }
}

// Buscar meta específica por SKU e mês
async function buscarMetaPorSkuMes(sku, mesAno) {
  try {
    const [ano, mes] = mesAno.split('-').map(Number);
    
    // Calcular data de início e fim do mês
    const dataInicio = `${ano}-${String(mes).padStart(2, '0')}-01`;
    
    // Calcular próximo mês corretamente (não pode ter mês 13)
    let proxAno = ano;
    let proxMes = mes + 1;
    if (proxMes > 12) {
      proxMes = 1;
      proxAno = ano + 1;
    }
    const dataFim = `${proxAno}-${String(proxMes).padStart(2, '0')}-01`;
    
    const { data, error } = await supabase
      .from('metas_ml')
      .select('*')
      .eq('sku', sku)
      .gte('mes_ano', dataInicio)
      .lt('mes_ano', dataFim)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error('Erro ao buscar meta específica:', error);
    throw error;
  }
}

// Criar ou atualizar meta
async function criarOuAtualizarMeta(sku, mesAno, metaVendas, metaMargem) {
  try {
    console.log('Dados recebidos:', { sku, mesAno, metaVendas, metaMargem });
    
    // Converter para formato DATE (primeiro dia do mês)
    const [ano, mes] = mesAno.split('-').map(Number);
    const dataFormatada = `${ano}-${String(mes).padStart(2, '0')}-01`;
    
    // Verificar se já existe
    const metaExistente = await buscarMetaPorSkuMes(sku, mesAno);
    
    if (metaExistente) {
      // Atualizar
      const { data, error } = await supabase
        .from('metas_ml')
        .update({
          meta_vendas: metaVendas,
          meta_margem: metaMargem,
          updated_at: new Date().toISOString()
        })
        .eq('sku', sku)
        .eq('mes_ano', dataFormatada)
        .select()
        .single();
      
      if (error) throw error;
      console.log('Meta atualizada:', data);
      return data;
    } else {
      // Inserir
      const { data, error } = await supabase
        .from('metas_ml')
        .insert({
          sku,
          mes_ano: dataFormatada,
          meta_vendas: metaVendas,
          meta_margem: metaMargem
        })
        .select()
        .single();
      
      if (error) throw error;
      console.log('Meta criada:', data);
      return data;
    }
  } catch (error) {
    console.error('Erro ao criar/atualizar meta:', error);
    throw error;
  }
}

// Deletar meta
async function deletarMeta(sku, mesAno) {
  try {
    const [ano, mes] = mesAno.split('-').map(Number);
    const dataFormatada = `${ano}-${String(mes).padStart(2, '0')}-01`;
    
    const { error } = await supabase
      .from('metas_ml')
      .delete()
      .eq('sku', sku)
      .eq('mes_ano', dataFormatada);
    
    if (error) throw error;
    console.log('Meta deletada:', { sku, mesAno });
    return true;
  } catch (error) {
    console.error('Erro ao deletar meta:', error);
    throw error;
  }
}

// Copiar metas do mês anterior para novo mês
async function copiarMetasDesMesAnterior(mesAno) {
  try {
    const [ano, mes] = mesAno.split('-').map(Number);
    
    // Mês anterior
    const mesAnterior = mes === 1 ? 12 : mes - 1;
    const anoAnterior = mes === 1 ? ano - 1 : ano;
    const mesAnteriorStr = `${anoAnterior}-${String(mesAnterior).padStart(2, '0')}`;
    
    // Buscar metas do mês anterior
    const metasAnterior = await buscarMetasPorMes(mesAnteriorStr);
    
    if (metasAnterior.length === 0) {
      console.log('Nenhuma meta encontrada no mês anterior');
      return { message: 'Nenhuma meta para copiar' };
    }
    
    // Inserir para novo mês
    const dataFormatada = `${ano}-${String(mes).padStart(2, '0')}-01`;
    
    const { data, error } = await supabase
      .from('metas_ml')
      .insert(
        metasAnterior.map(meta => ({
          sku: meta.sku,
          mes_ano: dataFormatada,
          meta_vendas: meta.meta_vendas,
          meta_margem: meta.meta_margem
        }))
      )
      .select();
    
    if (error) throw error;
    console.log(`${data.length} metas copiadas do mês anterior`);
    return { message: `${data.length} metas criadas com sucesso`, data };
  } catch (error) {
    console.error('Erro ao copiar metas:', error);
    throw error;
  }
}

module.exports = {
  buscarMetasPorMes,
  buscarMetaPorSkuMes,
  criarOuAtualizarMeta,
  deletarMeta,
  copiarMetasDesMesAnterior
};
