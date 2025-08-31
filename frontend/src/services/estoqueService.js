import axios from 'axios';
import api from '../config/api';

const calcularStatus = (estoque, minimo) => {
    if (estoque === 0) return 'Sem Estoque';
    if (estoque < minimo) return 'Em reposição';
    if (estoque < minimo * 1.2) return 'Em negociação';
    if (estoque <= minimo * 1.5) return 'Em estoque';
    return 'Estoque alto';
};

export const fetchEstoque = async () => {
    try {
        const response = await api.get('/api/estoque');
        return response.data.map(item => ({
            id: Number(item.id),
            sku: item.sku,
            produto: item.descricao,
            estoque: Number(item.estoque) || 0,
            minimo: Number(item.minimo) || 0,
            precoCompra: Number(item.cmv) || 0,
            valorLiquidoMedio: Number(item.valor_liquido) || 0,
            valorLiquidoTotal: (Number(item.estoque) || 0) * (Number(item.cmv) || 0),
            mediaVendas: Number(item.media_vendas) || 0,
            vendasQuinzenais: Number(item.vendas_quinzenais) || 0,
            previsaoDias: item.previsao_dias ? Number(item.previsao_dias) : null,
            totalVendas: Number(item.total_vendas) || 0,
            ultimaVenda: item.ultima_venda,
            status: calcularStatus(Number(item.estoque), Number(item.minimo)),
            created_at: item.created_at,
            updated_at: item.updated_at
        }));
    } catch (error) {
        console.error('Erro ao buscar estoque:', error);
        throw error;
    }
};

export const atualizarEstoque = async (sku, produto) => {
    try {
        const dadosParaEnviar = {
            produto: produto.produto,
            estoque: Number(produto.estoque),
            minimo: Number(produto.minimo),
            precoCompra: Number(produto.precoCompra),
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