import axios from 'axios';

const calcularStatus = (estoque, mediaVendas, minimo) => {
    const estoqueAtual = Number(estoque) || 0;
    const minimoEstoque = Number(minimo) || 0;
    const media = Number(mediaVendas) || 0;

    if (estoqueAtual === 0) return 'Sem Estoque';
    if (estoqueAtual < minimoEstoque) return 'Em reposição';
    if (estoqueAtual < minimoEstoque * 1.2) return 'Em negociação';
    if (estoqueAtual <= minimoEstoque * 1.5) return 'Em estoque';
    return 'Estoque alto';
};

export const fetchEstoque = async () => {
    try {
        const response = await axios.get('http://localhost:3001/api/estoque');
        return response.data.map(item => {
            const estoque = Number(item.estoque) || 0;
            const minimo = Number(item.minimo) || 0;
            const mediaVendas = Number(item.media_vendas) || 0;
            
            return {
                id: Number(item.id),
                sku: item.sku,
                produto: item.descricao,
                estoque: estoque,
                minimo: minimo,
                precoCompra: Number(item.cmv) || 0,
                valorLiquidoMedio: Number(item.valor_liquido) || 0,
                mediaVendas: mediaVendas,
                totalVendas: Number(item.total_vendas) || 0,
                ultimaVenda: item.ultima_venda,
                status: calcularStatus(estoque, mediaVendas, minimo),
                vendasDiarias: Array.isArray(item.vendas_diarias) ? item.vendas_diarias : []
            };
        });
    } catch (error) {
        console.error('Erro ao buscar dados do estoque:', error);
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
            valor_liquido: Number(produto.valorLiquidoMedio),
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

export const atualizarQuantidade = async (sku, quantidade) => {
    try {
        const response = await axios.put(`http://localhost:3001/api/estoque/${sku}/quantidade`, {
            estoque: Number(quantidade)
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar quantidade:', error);
        throw error;
    }
}; 