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
            produto: item.sku, // Usar SKU como nome do produto
            estoque: Number(item.total) || 0, // IMPORTANTE: Mapear 'total' como 'estoque'
            minimo: 10, // Valor padrão
            precoCompra: Number(item.preco_compra) || 0, // Vem do banco de dados
            valorLiquidoMedio: 0, // Valor padrão
            valorLiquidoTotal: (Number(item.total) || 0) * (Number(item.preco_compra) || 0), // Calculado
            mediaVendas: 0, // Valor padrão
            vendasQuinzenais: 0, // Valor padrão
            previsaoDias: null, // Valor padrão
            totalVendas: 0, // Valor padrão
            ultimaVenda: item.updated_at,
            status: calcularStatus(Number(item.total), 10), // total mapeado como estoque
            created_at: item.created_at,
            updated_at: item.updated_at,
            // Campos adicionais do Supabase
            bling: Number(item.bling) || 0,
            full_ml: Number(item.full_ml) || 0,
            magalu: Number(item.magalu) || 0,
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