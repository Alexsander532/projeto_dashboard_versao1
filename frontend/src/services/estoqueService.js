import axios from 'axios';

const calcularStatus = (estoque, minimo) => {
    if (estoque === 0) return 'Sem Estoque';
    if (estoque < minimo) return 'Em reposição';
    if (estoque < minimo * 1.2) return 'Em negociação';
    if (estoque <= minimo * 1.5) return 'Em estoque';
    return 'Estoque alto';
};

export const fetchEstoque = async () => {
    try {
        const response = await axios.get('http://localhost:3001/api/estoque');
        return response.data.map(item => ({
            id: Number(item.id),
            sku: item.sku,
            produto: item.descricao,
            estoque: Number(item.estoque) || 0,
            minimo: Number(item.minimo) || 0,
            precoCompra: Number(item.cmv) || 0,
            valorLiquidoMedio: Number(item.valor_liquido) || 0,
            valorLiquidoTotal: Number(item.valor_liquido * item.estoque) || 0,
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
        const response = await axios.put(`http://localhost:3001/api/estoque/${sku}`, {
            descricao: produto.produto,
            estoque: Number(produto.estoque),
            minimo: Number(produto.minimo),
            cmv: Number(produto.precoCompra),
            valor_liquido: Number(produto.precoCompra) * Number(produto.estoque), // <-- ajuste aqui!
            media_vendas: Number(produto.mediaVendas),
            total_vendas: Number(produto.totalVendas),
            ultima_venda: produto.ultimaVenda,
            status: produto.status
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        throw error;
    }
};

export const atualizarQuantidade = async (sku, delta) => {
    try {
        const response = await axios.post(`http://localhost:3001/api/estoque/${sku}/quantidade`, { delta });
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar quantidade:', error);
        throw error;
    }
}; 