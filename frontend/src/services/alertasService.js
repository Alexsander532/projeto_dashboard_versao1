// frontend/src/services/alertasService.js
// Service para gerenciamento de alertas
// TODO: Substituir dados mockados por chamadas à API quando o backend estiver pronto

import api from '../config/api';

// ============================================
// DADOS MOCKADOS - Substituir por API depois
// ============================================

const MOCK_ALERTAS = [
    // Alertas de Estoque
    {
        id: 'est-001',
        tipo: 'estoque',
        severidade: 'critico',
        titulo: 'Sem Estoque',
        mensagem: 'Produto com estoque zerado há 3 dias',
        sku: 'SKU-001',
        produto: 'Fone Bluetooth Premium',
        dados: {
            estoqueAtual: 0,
            mediaVendas: 2.5,
            diasZerado: 3,
            ultimaVenda: '2026-01-08'
        },
        criadoEm: '2026-01-08T10:00:00Z',
        lido: false,
        acoes: ['ver_produto', 'criar_pedido']
    },
    {
        id: 'est-002',
        tipo: 'estoque',
        severidade: 'critico',
        titulo: 'Sem Estoque',
        mensagem: 'Produto zerado - alta demanda',
        sku: 'SKU-015',
        produto: 'Carregador Turbo 65W',
        dados: {
            estoqueAtual: 0,
            mediaVendas: 4.2,
            diasZerado: 1,
            ultimaVenda: '2026-01-10'
        },
        criadoEm: '2026-01-10T14:30:00Z',
        lido: false,
        acoes: ['ver_produto', 'criar_pedido']
    },
    {
        id: 'est-003',
        tipo: 'estoque',
        severidade: 'alto',
        titulo: 'Em Reposição',
        mensagem: 'Estoque abaixo do mínimo recomendado',
        sku: 'SKU-008',
        produto: 'Capa Silicone iPhone 15',
        dados: {
            estoqueAtual: 45,
            minimo: 120,
            mediaVendas: 2.0,
            previsaoZerar: 22
        },
        criadoEm: '2026-01-11T08:00:00Z',
        lido: false,
        acoes: ['ver_produto', 'criar_pedido']
    },
    {
        id: 'est-004',
        tipo: 'estoque',
        severidade: 'alto',
        titulo: 'Previsão Crítica',
        mensagem: 'Estoque acabará em menos de 15 dias',
        sku: 'SKU-022',
        produto: 'Película 3D Samsung S24',
        dados: {
            estoqueAtual: 28,
            mediaVendas: 2.1,
            previsaoZerar: 13
        },
        criadoEm: '2026-01-11T09:15:00Z',
        lido: true,
        acoes: ['ver_produto', 'criar_pedido']
    },
    {
        id: 'est-005',
        tipo: 'estoque',
        severidade: 'medio',
        titulo: 'Em Negociação',
        mensagem: 'Estoque entre 60-70 dias de cobertura',
        sku: 'SKU-033',
        produto: 'Suporte Veicular Magnético',
        dados: {
            estoqueAtual: 130,
            minimo: 120,
            mediaVendas: 1.9,
            previsaoZerar: 68
        },
        criadoEm: '2026-01-10T16:00:00Z',
        lido: true,
        acoes: ['ver_produto']
    },
    {
        id: 'est-006',
        tipo: 'estoque',
        severidade: 'info',
        titulo: 'Estoque Alto',
        mensagem: 'Capital parado - considere promoção',
        sku: 'SKU-041',
        produto: 'Hub USB-C 7 em 1',
        dados: {
            estoqueAtual: 450,
            minimo: 90,
            mediaVendas: 1.5,
            valorParado: 13500
        },
        criadoEm: '2026-01-09T11:00:00Z',
        lido: true,
        acoes: ['ver_produto']
    },

    // Alertas de Compras/Pedidos
    {
        id: 'ped-001',
        tipo: 'compras',
        severidade: 'critico',
        titulo: 'Pedido Atrasado',
        mensagem: 'Ultrapassou prazo da etapa de Fabricação',
        pedidoId: 45,
        fornecedor: 'Shenzhen Electronics Co.',
        dados: {
            status: 'fabricacao',
            diasNaEtapa: 35,
            prazoEtapa: 30,
            diasAtrasado: 5,
            valor: 15000,
            produtos: 8
        },
        criadoEm: '2026-01-06T10:00:00Z',
        lido: false,
        acoes: ['ver_pedido', 'editar_pedido']
    },
    {
        id: 'ped-002',
        tipo: 'compras',
        severidade: 'critico',
        titulo: 'Pedido Atrasado',
        mensagem: 'Ultrapassou prazo de Trânsito Internacional',
        pedidoId: 38,
        fornecedor: 'Guangzhou Tech Supply',
        dados: {
            status: 'transito',
            diasNaEtapa: 22,
            prazoEtapa: 20,
            diasAtrasado: 2,
            valor: 8500,
            produtos: 5
        },
        criadoEm: '2026-01-09T14:00:00Z',
        lido: false,
        acoes: ['ver_pedido', 'editar_pedido']
    },
    {
        id: 'ped-003',
        tipo: 'compras',
        severidade: 'alto',
        titulo: 'Vence Hoje',
        mensagem: 'Prazo da etapa Alfândega vence hoje',
        pedidoId: 52,
        fornecedor: 'Hong Kong Imports Ltd',
        dados: {
            status: 'alfandega',
            diasNaEtapa: 7,
            prazoEtapa: 7,
            valor: 22000,
            produtos: 12
        },
        criadoEm: '2026-01-11T06:00:00Z',
        lido: false,
        acoes: ['ver_pedido', 'editar_pedido']
    },
    {
        id: 'ped-004',
        tipo: 'compras',
        severidade: 'medio',
        titulo: 'Vence em 2 Dias',
        mensagem: 'Prazo de Fabricação vence em breve',
        pedidoId: 58,
        fornecedor: 'Dongguan Manufacturing',
        dados: {
            status: 'fabricacao',
            diasNaEtapa: 28,
            prazoEtapa: 30,
            diasRestantes: 2,
            valor: 18500,
            produtos: 10
        },
        criadoEm: '2026-01-11T08:00:00Z',
        lido: true,
        acoes: ['ver_pedido']
    },
    {
        id: 'ped-005',
        tipo: 'compras',
        severidade: 'info',
        titulo: 'Entrega Próxima',
        mensagem: 'Previsão de chegada nos próximos 5 dias',
        pedidoId: 41,
        fornecedor: 'Shenzhen Electronics Co.',
        dados: {
            status: 'alfandega',
            previsaoEntrega: '2026-01-16',
            diasParaChegar: 5,
            valor: 12000,
            produtos: 6
        },
        criadoEm: '2026-01-11T07:00:00Z',
        lido: true,
        acoes: ['ver_pedido']
    },

    // Alertas de Metas
    {
        id: 'meta-001',
        tipo: 'metas',
        severidade: 'critico',
        titulo: 'Meta em Risco',
        mensagem: 'Projeção muito abaixo da meta mensal',
        sku: 'SKU-005',
        produto: 'Power Bank 20000mAh',
        dados: {
            metaVendas: 5000,
            vendidoAtual: 1200,
            progresso: 24,
            projecao: 2800,
            diasRestantes: 20
        },
        criadoEm: '2026-01-11T00:00:00Z',
        lido: false,
        acoes: ['ver_metas', 'ver_produto']
    },
    {
        id: 'meta-002',
        tipo: 'metas',
        severidade: 'alto',
        titulo: 'Atenção Necessária',
        mensagem: 'Vendas abaixo do ritmo esperado',
        sku: 'SKU-012',
        produto: 'Smartwatch Fitness Pro',
        dados: {
            metaVendas: 8000,
            vendidoAtual: 3500,
            progresso: 44,
            projecao: 6800,
            diasRestantes: 20
        },
        criadoEm: '2026-01-11T00:00:00Z',
        lido: true,
        acoes: ['ver_metas', 'ver_produto']
    },
    {
        id: 'meta-003',
        tipo: 'metas',
        severidade: 'medio',
        titulo: 'Meta Alcançável',
        mensagem: 'No caminho certo para atingir a meta',
        sku: 'SKU-019',
        produto: 'Cabo USB-C Premium 2m',
        dados: {
            metaVendas: 3000,
            vendidoAtual: 2100,
            progresso: 70,
            projecao: 3800,
            diasRestantes: 20
        },
        criadoEm: '2026-01-11T00:00:00Z',
        lido: true,
        acoes: ['ver_metas']
    },
    {
        id: 'meta-004',
        tipo: 'metas',
        severidade: 'sucesso',
        titulo: 'Meta Superada!',
        mensagem: 'Parabéns! Meta já foi ultrapassada',
        sku: 'SKU-027',
        produto: 'Fone TWS ANC Premium',
        dados: {
            metaVendas: 6000,
            vendidoAtual: 7200,
            progresso: 120,
            diasRestantes: 20
        },
        criadoEm: '2026-01-10T18:00:00Z',
        lido: true,
        acoes: ['ver_metas']
    },
    {
        id: 'meta-005',
        tipo: 'metas',
        severidade: 'info',
        titulo: 'Sem Meta Definida',
        mensagem: 'Produto vendendo sem meta configurada',
        sku: 'SKU-055',
        produto: 'Adaptador HDMI USB-C',
        dados: {
            vendidoAtual: 1800,
            unidadesVendidas: 45
        },
        criadoEm: '2026-01-11T00:00:00Z',
        lido: true,
        acoes: ['definir_meta']
    },

    // Alertas Financeiros
    {
        id: 'fin-001',
        tipo: 'financeiro',
        severidade: 'critico',
        titulo: 'Margem Crítica',
        mensagem: 'Produto vendido com margem muito baixa',
        sku: 'SKU-009',
        produto: 'Mousepad Gamer RGB',
        dados: {
            margemAtual: 5.2,
            margemMeta: 25,
            vendasMes: 2500,
            lucroEstimado: 130
        },
        criadoEm: '2026-01-11T10:00:00Z',
        lido: false,
        acoes: ['ver_produto', 'ajustar_preco']
    },
    {
        id: 'fin-002',
        tipo: 'financeiro',
        severidade: 'alto',
        titulo: 'Margem Abaixo da Meta',
        mensagem: 'Margem 40% abaixo do esperado',
        sku: 'SKU-018',
        produto: 'Teclado Mecânico Compacto',
        dados: {
            margemAtual: 15,
            margemMeta: 25,
            vendasMes: 4200,
            lucroEstimado: 630
        },
        criadoEm: '2026-01-11T08:00:00Z',
        lido: true,
        acoes: ['ver_produto', 'ajustar_preco']
    },
    {
        id: 'fin-003',
        tipo: 'financeiro',
        severidade: 'medio',
        titulo: 'Alto Valor em Compras',
        mensagem: 'R$ 85.000 em pedidos abertos',
        dados: {
            totalPedidosAbertos: 85000,
            quantidadePedidos: 8,
            maiorPedido: 22000
        },
        criadoEm: '2026-01-11T06:00:00Z',
        lido: true,
        acoes: ['ver_compras']
    },
    {
        id: 'fin-004',
        tipo: 'financeiro',
        severidade: 'info',
        titulo: 'Capital em Estoque',
        mensagem: 'R$ 125.000 investidos em estoque',
        dados: {
            valorTotalEstoque: 125000,
            produtosEmEstoque: 156,
            mediaGiro: 45
        },
        criadoEm: '2026-01-11T00:00:00Z',
        lido: true,
        acoes: ['ver_estoque']
    }
];

// ============================================
// FUNÇÕES DO SERVICE
// ============================================

/**
 * Busca todos os alertas
 * TODO: Substituir por chamada à API: GET /api/alertas
 */
export const fetchAlertas = async (filtros = {}) => {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));

    let alertas = [...MOCK_ALERTAS];

    // Aplicar filtros
    if (filtros.tipo && filtros.tipo !== 'todos') {
        alertas = alertas.filter(a => a.tipo === filtros.tipo);
    }

    if (filtros.severidade && filtros.severidade !== 'todos') {
        alertas = alertas.filter(a => a.severidade === filtros.severidade);
    }

    if (filtros.lido !== undefined) {
        alertas = alertas.filter(a => a.lido === filtros.lido);
    }

    // Ordenar por severidade (crítico primeiro) e depois por data
    const ordemSeveridade = { critico: 0, alto: 1, medio: 2, sucesso: 3, info: 4 };
    alertas.sort((a, b) => {
        const sevA = ordemSeveridade[a.severidade] ?? 5;
        const sevB = ordemSeveridade[b.severidade] ?? 5;
        if (sevA !== sevB) return sevA - sevB;
        return new Date(b.criadoEm) - new Date(a.criadoEm);
    });

    return alertas;

    // TODO: Quando o backend estiver pronto, usar:
    // const params = new URLSearchParams(filtros);
    // const response = await api.get(`/api/alertas?${params}`);
    // return response.data;
};

/**
 * Busca contagem de alertas por severidade
 * TODO: Substituir por chamada à API: GET /api/alertas/contagem
 */
export const fetchContagemAlertas = async () => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const contagem = {
        critico: MOCK_ALERTAS.filter(a => a.severidade === 'critico').length,
        alto: MOCK_ALERTAS.filter(a => a.severidade === 'alto').length,
        medio: MOCK_ALERTAS.filter(a => a.severidade === 'medio').length,
        sucesso: MOCK_ALERTAS.filter(a => a.severidade === 'sucesso').length,
        info: MOCK_ALERTAS.filter(a => a.severidade === 'info').length,
        total: MOCK_ALERTAS.length,
        naoLidos: MOCK_ALERTAS.filter(a => !a.lido).length
    };

    return contagem;

    // TODO: const response = await api.get('/api/alertas/contagem');
    // return response.data;
};

/**
 * Marca um alerta como lido
 * TODO: Substituir por chamada à API: PUT /api/alertas/:id/lido
 */
export const marcarAlertaComoLido = async (alertaId) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const alerta = MOCK_ALERTAS.find(a => a.id === alertaId);
    if (alerta) {
        alerta.lido = true;
    }

    return { success: true };

    // TODO: const response = await api.put(`/api/alertas/${alertaId}/lido`);
    // return response.data;
};

/**
 * Marca todos os alertas como lidos
 * TODO: Substituir por chamada à API: PUT /api/alertas/marcar-todos-lidos
 */
export const marcarTodosComoLidos = async () => {
    await new Promise(resolve => setTimeout(resolve, 300));

    MOCK_ALERTAS.forEach(a => a.lido = true);

    return { success: true };

    // TODO: const response = await api.put('/api/alertas/marcar-todos-lidos');
    // return response.data;
};

/**
 * Descarta/arquiva um alerta
 * TODO: Substituir por chamada à API: DELETE /api/alertas/:id
 */
export const descartarAlerta = async (alertaId) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const index = MOCK_ALERTAS.findIndex(a => a.id === alertaId);
    if (index > -1) {
        MOCK_ALERTAS.splice(index, 1);
    }

    return { success: true };

    // TODO: const response = await api.delete(`/api/alertas/${alertaId}`);
    // return response.data;
};

export default {
    fetchAlertas,
    fetchContagemAlertas,
    marcarAlertaComoLido,
    marcarTodosComoLidos,
    descartarAlerta
};
