import axios from 'axios';
import api from '../config/api';

const calcularStatus = (estoque, minimo) => {
    if (estoque === 0) return 'Sem Estoque';
    if (estoque < minimo) return 'Em reposição';
    if (estoque < minimo * 1.2) return 'Em negociação';
    if (estoque <= minimo * 1.5) return 'Em estoque';
    return 'Estoque alto';
};

/**
 * Calcula estatísticas de vendas para cada SKU baseado nas vendas do Mercado Livre
 * @param {Array} vendas - Array de vendas do ML (com data_pedido como string)
 * @returns {Object} Mapa SKU -> {vendas15dias, vendas30dias, vendas60dias}
 */
const calcularEstatisticasVendas = (vendas) => {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    
    // Definir períodos
    const data15DiasAtras = new Date(hoje);
    data15DiasAtras.setDate(data15DiasAtras.getDate() - 15);
    data15DiasAtras.setHours(0, 0, 0, 0);
    
    const data30DiasAtras = new Date(hoje);
    data30DiasAtras.setDate(data30DiasAtras.getDate() - 30);
    data30DiasAtras.setHours(0, 0, 0, 0);
    
    const data60DiasAtras = new Date(hoje);
    data60DiasAtras.setDate(data60DiasAtras.getDate() - 60);
    data60DiasAtras.setHours(0, 0, 0, 0);
    
    // Objeto para armazenar estatísticas por SKU
    const estatisticasPorSku = {};
    
    console.log(`📊 Calculando estatísticas de vendas:`);
    console.log(`  - Últimos 15 dias: ${data15DiasAtras.toLocaleDateString('pt-BR')} a ${hoje.toLocaleDateString('pt-BR')}`);
    console.log(`  - Últimos 30 dias: ${data30DiasAtras.toLocaleDateString('pt-BR')} a ${hoje.toLocaleDateString('pt-BR')}`);
    console.log(`  - Últimos 60 dias: ${data60DiasAtras.toLocaleDateString('pt-BR')} a ${hoje.toLocaleDateString('pt-BR')}`);
    
    // Processar todas as vendas e categorizar por período
    vendas.forEach((venda, index) => {
        let dataVenda = null;
        
        // Tentar parsear a data dependendo do formato
        if (venda.data_pedido && typeof venda.data_pedido === 'string') {
            // Formato: "08/01/25 11:52:28"
            try {
                const [datePart, timePart] = venda.data_pedido.split(' ');
                const [dia, mes, ano] = datePart.split('/');
                const [hora, minuto, segundo] = timePart.split(':');
                
                // Converter ano de 2 dígitos para 4 dígitos
                const anoCompleto = parseInt(ano) < 50 ? 2000 + parseInt(ano) : 1900 + parseInt(ano);
                
                dataVenda = new Date(anoCompleto, parseInt(mes) - 1, parseInt(dia), parseInt(hora), parseInt(minuto), parseInt(segundo));
            } catch (e) {
                console.warn('Erro ao fazer parse da data:', venda.data_pedido);
                dataVenda = null;
            }
        } else if (venda.data && venda.data instanceof Date) {
            // Se já é um Date object (caso já tenha sido parseado)
            dataVenda = new Date(venda.data);
        }
        
        if (dataVenda && !isNaN(dataVenda.getTime())) {
            const sku = venda.sku || venda.produto;
            const quantidade = Number(venda.quantidade) || Number(venda.unidades) || 0;
            
            // Inicializar estatísticas do SKU se não existir
            if (!estatisticasPorSku[sku]) {
                estatisticasPorSku[sku] = {
                    vendas15dias: 0,
                    vendas30dias: 0,
                    vendas60dias: 0
                };
            }
            
            // Categorizar venda por período
            if (dataVenda >= data15DiasAtras && dataVenda <= hoje) {
                estatisticasPorSku[sku].vendas15dias += quantidade;
            }
            if (dataVenda >= data30DiasAtras && dataVenda <= hoje) {
                estatisticasPorSku[sku].vendas30dias += quantidade;
            }
            if (dataVenda >= data60DiasAtras && dataVenda <= hoje) {
                estatisticasPorSku[sku].vendas60dias += quantidade;
            }
        }
    });
    
    console.log(`✅ Estatísticas de vendas calculadas para ${Object.keys(estatisticasPorSku).length} SKUs`);
    return estatisticasPorSku;
};

export const fetchEstoque = async () => {
    try {
        const response = await api.get('/api/estoque');
        
        // Buscar vendas do Mercado Livre para calcular vendas quinzenais
        let vendasML = [];
        try {
            console.log('🔄 Buscando vendas do ML para calcular quinzenais...');
            const vendasResponse = await api.get('/api/vendas-ml', { params: { limite: 10000 } });
            vendasML = vendasResponse.data.data || [];
            console.log(`✅ Carregadas ${vendasML.length} vendas do ML`);
            
            // Log das primeiras 3 vendas para debug
            if (vendasML.length > 0) {
                console.log('Amostra de vendas recebidas:', vendasML.slice(0, 3));
                
                // Verificar range de datas
                let datas = [];
                vendasML.forEach(v => {
                    if (v.data_pedido) datas.push(v.data_pedido);
                });
                if (datas.length > 0) {
                    console.log(`📅 Range de datas: ${datas[datas.length - 1]} a ${datas[0]}`);
                }
            }
        } catch (e) {
            console.warn('❌ Erro ao buscar vendas ML para calcular quinzenais:', e);
        }
        
        // Calcular estatísticas de vendas por SKU
        const estatisticasVendas = calcularEstatisticasVendas(vendasML);
        
        return response.data.map(item => {
            const stats = estatisticasVendas[item.sku] || { vendas15dias: 0, vendas30dias: 0, vendas60dias: 0 };
            
            // Calcular média de vendas diária usando múltiplos períodos (média ponderada)
            // 50% peso para últimos 30 dias, 30% para 15 dias, 20% para 60 dias
            const media30dias = stats.vendas30dias / 30;
            const media15dias = stats.vendas15dias / 15;
            const media60dias = stats.vendas60dias / 60;
            
            const mediaVendasDiaria = (media30dias * 0.5) + (media15dias * 0.3) + (media60dias * 0.2);
            
            // META: Estoque para 3,5 meses (105 dias)
            const DIAS_META = 105;
            const estoqueIdeal = Math.ceil(mediaVendasDiaria * DIAS_META);
            const estoqueAtual = Number(item.total) || 0;
            
            // Calcular previsão de dias com estoque atual
            const previsaoDias = mediaVendasDiaria > 0 
                ? Math.ceil(estoqueAtual / mediaVendasDiaria) 
                : null;
            
            // Calcular quanto falta para atingir o ideal
            const quantidadeParaComprar = Math.max(0, estoqueIdeal - estoqueAtual);
            
            // Calcular porcentagem do ideal que temos
            const percentualIdeal = estoqueIdeal > 0 
                ? (estoqueAtual / estoqueIdeal) * 100 
                : 100;
            
            // Determinar status baseado na porcentagem do ideal
            let statusCalculado;
            if (estoqueAtual === 0) {
                statusCalculado = 'Sem Estoque';
            } else if (percentualIdeal < 30) {
                statusCalculado = 'Crítico'; // < 1 mês
            } else if (percentualIdeal < 60) {
                statusCalculado = 'Em reposição'; // < 2 meses
            } else if (percentualIdeal < 90) {
                statusCalculado = 'Em negociação'; // 2-3 meses
            } else if (percentualIdeal <= 110) {
                statusCalculado = 'Em estoque'; // 3-4 meses (saudável)
            } else {
                statusCalculado = 'Estoque alto'; // > 4 meses
            }
            
            return {
                id: Number(item.id),
                sku: item.sku,
                produto: item.sku,
                estoque: estoqueAtual,
                minimo: estoqueIdeal, // Agora o "mínimo" é o estoque ideal para 3,5 meses
                precoCompra: Number(item.preco_compra) || 0,
                valorLiquidoMedio: 0,
                valorLiquidoTotal: estoqueAtual * (Number(item.preco_compra) || 0),
                mediaVendas: Math.round(mediaVendasDiaria * 10) / 10, // Arredonda para 1 casa decimal
                vendasQuinzenais: stats.vendas15dias,
                vendas30dias: stats.vendas30dias,
                vendas60dias: stats.vendas60dias,
                previsaoDias: previsaoDias,
                estoqueIdeal: estoqueIdeal,
                quantidadeParaComprar: quantidadeParaComprar,
                percentualIdeal: Math.round(percentualIdeal),
                totalVendas: 0,
                ultimaVenda: item.updated_at,
                status: statusCalculado,
                created_at: item.created_at,
                updated_at: item.updated_at,
                // Campos adicionais do Supabase
                bling: Number(item.bling) || 0,
                full_ml: Number(item.full_ml) || 0,
                magalu: Number(item.magalu) || 0,
            };
        });
    } catch (error) {
        console.error('Erro ao buscar estoque:', error);
        throw error;
    }
};

export const atualizarEstoque = async (sku, produto) => {
    try {
        const dadosParaEnviar = {
            produto: produto.produto,
            total: Number(produto.estoque), // Mapear estoque para total (campo do BD)
            preco_compra: Number(produto.precoCompra), // Novo campo
            minimo: Number(produto.minimo),
            valorLiquidoMedio: Number(produto.valorLiquidoMedio),
            status: produto.status
        };
        
        console.log('Dados que serão enviados para o backend:', dadosParaEnviar);
        
        const response = await api.put(`/api/estoque/${sku}`, dadosParaEnviar);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        throw error;
    }
};

export const atualizarQuantidade = async (sku, delta) => {
    try {
        const response = await api.post(`/api/estoque/${sku}/quantidade`, { delta });
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar quantidade:', error);
        throw error;
    }
}; 