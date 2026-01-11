// frontend/src/pages/Financeiro.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    Button,
    IconButton,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    LinearProgress,
    Divider,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Tooltip
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    AccountBalance as AccountBalanceIcon,
    Receipt as ReceiptIcon,
    LocalShipping as ShippingIcon,
    Inventory as InventoryIcon,
    AttachMoney as MoneyIcon,
    CreditCard as CreditCardIcon,
    PieChart as PieChartIcon,
    BarChart as BarChartIcon,
    ArrowUpward as ArrowUpIcon,
    ArrowDownward as ArrowDownIcon,
    Refresh as RefreshIcon,
    FileDownload as DownloadIcon,
    CalendarMonth as CalendarIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import { useSidebar } from '../contexts/SidebarContext';
import Sidebar from '../components/Sidebar';

// ============================================
// DADOS MOCKADOS - Substituir por API depois
// ============================================

const MOCK_RESUMO_FINANCEIRO = {
    faturamentoBruto: 285000,
    custoMercadorias: 142500,
    despesasOperacionais: 35000,
    impostos: 28500,
    lucroLiquido: 79000,
    margemLiquida: 27.7,
    ticketMedio: 189.50,
    variacaoMensal: 12.5
};

const MOCK_FLUXO_CAIXA = [
    { mes: 'Ago', entradas: 245000, saidas: 198000, saldo: 47000 },
    { mes: 'Set', entradas: 268000, saidas: 215000, saldo: 53000 },
    { mes: 'Out', entradas: 312000, saidas: 248000, saldo: 64000 },
    { mes: 'Nov', entradas: 345000, saidas: 278000, saldo: 67000 },
    { mes: 'Dez', entradas: 420000, saidas: 335000, saldo: 85000 },
    { mes: 'Jan', entradas: 285000, saidas: 206000, saldo: 79000 }
];

const MOCK_CUSTOS_IMPORTACAO = [
    { nome: 'Custo FOB (Produto)', valor: 98500, percentual: 45 },
    { nome: 'Frete Internacional', valor: 18700, percentual: 8.5 },
    { nome: 'Seguro (Cargo)', valor: 4500, percentual: 2 },
    { nome: 'Impostos (II, IPI, ICMS, PIS, COFINS)', valor: 52800, percentual: 24 },
    { nome: 'Despachante / Taxas Alfandegárias', valor: 8500, percentual: 3.9 },
    { nome: 'Frete Nacional', valor: 12500, percentual: 5.7 },
    { nome: 'Armazenagem', valor: 5200, percentual: 2.4 },
    { nome: 'Outros', valor: 18800, percentual: 8.5 }
];

const MOCK_CONTAS_PAGAR = [
    { id: 1, descricao: 'Pedido #52 - Shenzhen Electronics', valor: 22000, vencimento: '2026-01-15', status: 'pendente', categoria: 'Fornecedor Internacional' },
    { id: 2, descricao: 'ICMS Importação - Dezembro', valor: 15800, vencimento: '2026-01-20', status: 'pendente', categoria: 'Impostos' },
    { id: 3, descricao: 'Frete Marítimo - Hamburg Süd', valor: 8500, vencimento: '2026-01-10', status: 'vencido', categoria: 'Logística' },
    { id: 4, descricao: 'Despachante - Alpha Comex', valor: 3200, vencimento: '2026-01-25', status: 'pendente', categoria: 'Serviços' },
    { id: 5, descricao: 'Armazenagem - LogPort', valor: 4800, vencimento: '2026-01-18', status: 'pendente', categoria: 'Logística' },
    { id: 6, descricao: 'Pedido #45 - Guangzhou Tech', valor: 15000, vencimento: '2026-01-08', status: 'pago', categoria: 'Fornecedor Internacional' }
];

const MOCK_CONTAS_RECEBER = [
    { id: 1, descricao: 'Vendas ML - Semana 1 Jan', valor: 45000, vencimento: '2026-01-15', status: 'pendente', origem: 'Mercado Livre' },
    { id: 2, descricao: 'Vendas Magalu - Dezembro', valor: 28500, vencimento: '2026-01-10', status: 'pendente', origem: 'Magazine Luiza' },
    { id: 3, descricao: 'Vendas ML - Semana 2 Jan', valor: 52000, vencimento: '2026-01-22', status: 'pendente', origem: 'Mercado Livre' },
    { id: 4, descricao: 'Venda Atacado - Cliente X', valor: 18000, vencimento: '2026-01-05', status: 'recebido', origem: 'Atacado' }
];

const CORES_GRAFICO = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6b7280'];

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend, trendValue }) => {
    const theme = useTheme();
    const isPositive = trend === 'up';

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 1
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        bgcolor: alpha(color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: color
                    }}
                >
                    <Icon />
                </Box>
                {trend && (
                    <Chip
                        size="small"
                        icon={isPositive ? <ArrowUpIcon sx={{ fontSize: '14px !important' }} /> : <ArrowDownIcon sx={{ fontSize: '14px !important' }} />}
                        label={`${trendValue}%`}
                        sx={{
                            height: 24,
                            bgcolor: isPositive ? alpha('#22c55e', 0.1) : alpha('#ef4444', 0.1),
                            color: isPositive ? '#22c55e' : '#ef4444',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': { color: 'inherit' }
                        }}
                    />
                )}
            </Box>
            <Box>
                <Typography variant="h5" fontWeight="800" sx={{ mb: 0.5 }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.disabled">
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function Financeiro() {
    const theme = useTheme();
    const { isHovered } = useSidebar();
    const [tabAtiva, setTabAtiva] = useState(0);
    const [periodo, setPeriodo] = useState('mes');

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pago':
            case 'recebido':
                return { bg: '#dcfce7', color: '#22c55e' };
            case 'pendente':
                return { bg: '#fef9c3', color: '#eab308' };
            case 'vencido':
                return { bg: '#fee2e2', color: '#ef4444' };
            default:
                return { bg: '#f3f4f6', color: '#6b7280' };
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <Sidebar />
            <Box component="main" sx={{ flexGrow: 1, p: 3, ml: isHovered ? '200px' : '64px', transition: 'margin 0.3s' }}>
                <Container maxWidth={false} sx={{ py: 1, maxWidth: '1600px' }}>

                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box>
                            <Typography variant="h5" fontWeight="800" sx={{ mb: 0.5 }}>
                                Painel Financeiro
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Controle financeiro completo para importação
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <Select
                                    value={periodo}
                                    onChange={(e) => setPeriodo(e.target.value)}
                                    sx={{ borderRadius: '8px' }}
                                >
                                    <MenuItem value="semana">Esta Semana</MenuItem>
                                    <MenuItem value="mes">Este Mês</MenuItem>
                                    <MenuItem value="trimestre">Trimestre</MenuItem>
                                    <MenuItem value="ano">Este Ano</MenuItem>
                                </Select>
                            </FormControl>
                            <Button startIcon={<DownloadIcon />} variant="outlined" sx={{ textTransform: 'none', borderRadius: '8px' }}>
                                Exportar
                            </Button>
                            <Button startIcon={<RefreshIcon />} variant="contained" sx={{ textTransform: 'none', borderRadius: '8px', boxShadow: 'none' }}>
                                Atualizar
                            </Button>
                        </Box>
                    </Box>

                    {/* Cards de Métricas Principais */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard
                                title="Faturamento Bruto"
                                value={formatarMoeda(MOCK_RESUMO_FINANCEIRO.faturamentoBruto)}
                                icon={MoneyIcon}
                                color="#3b82f6"
                                trend="up"
                                trendValue={MOCK_RESUMO_FINANCEIRO.variacaoMensal}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard
                                title="Lucro Líquido"
                                value={formatarMoeda(MOCK_RESUMO_FINANCEIRO.lucroLiquido)}
                                subtitle={`Margem: ${MOCK_RESUMO_FINANCEIRO.margemLiquida}%`}
                                icon={TrendingUpIcon}
                                color="#22c55e"
                                trend="up"
                                trendValue={8.3}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard
                                title="Custo das Mercadorias"
                                value={formatarMoeda(MOCK_RESUMO_FINANCEIRO.custoMercadorias)}
                                subtitle="CMV Total"
                                icon={InventoryIcon}
                                color="#f59e0b"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <MetricCard
                                title="Ticket Médio"
                                value={formatarMoeda(MOCK_RESUMO_FINANCEIRO.ticketMedio)}
                                subtitle="Por venda"
                                icon={ReceiptIcon}
                                color="#8b5cf6"
                            />
                        </Grid>
                    </Grid>

                    {/* Gráficos */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        {/* Fluxo de Caixa */}
                        <Grid item xs={12} lg={8}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
                                    Fluxo de Caixa - Últimos 6 Meses
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={MOCK_FLUXO_CAIXA}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                            <XAxis dataKey="mes" stroke={theme.palette.text.secondary} fontSize={12} />
                                            <YAxis stroke={theme.palette.text.secondary} fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                            <RechartsTooltip
                                                contentStyle={{
                                                    backgroundColor: theme.palette.background.paper,
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    borderRadius: 8
                                                }}
                                                formatter={(value) => formatarMoeda(value)}
                                            />
                                            <Area type="monotone" dataKey="entradas" stackId="1" stroke="#22c55e" fill={alpha('#22c55e', 0.3)} name="Entradas" />
                                            <Area type="monotone" dataKey="saidas" stackId="2" stroke="#ef4444" fill={alpha('#ef4444', 0.3)} name="Saídas" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Composição de Custos */}
                        <Grid item xs={12} lg={4}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
                                <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
                                    Composição de Custos (Importação)
                                </Typography>
                                <Box sx={{ height: 220 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={MOCK_CUSTOS_IMPORTACAO.slice(0, 5)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={2}
                                                dataKey="valor"
                                                nameKey="nome"
                                            >
                                                {MOCK_CUSTOS_IMPORTACAO.slice(0, 5).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(value) => formatarMoeda(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                    {MOCK_CUSTOS_IMPORTACAO.slice(0, 5).map((item, idx) => (
                                        <Chip
                                            key={idx}
                                            size="small"
                                            label={`${item.nome.split(' ')[0]} ${item.percentual}%`}
                                            sx={{
                                                fontSize: '0.65rem',
                                                height: 20,
                                                bgcolor: alpha(CORES_GRAFICO[idx], 0.1),
                                                color: CORES_GRAFICO[idx],
                                                fontWeight: 600
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Tabs: Contas a Pagar / Receber */}
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }}>
                        <Tabs value={tabAtiva} onChange={(e, v) => setTabAtiva(v)} sx={{ mb: 2 }}>
                            <Tab label="Contas a Pagar" icon={<TrendingDownIcon />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
                            <Tab label="Contas a Receber" icon={<TrendingUpIcon />} iconPosition="start" sx={{ textTransform: 'none', fontWeight: 600 }} />
                        </Tabs>

                        {tabAtiva === 0 && (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Categoria</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="right">Valor</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Vencimento</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {MOCK_CONTAS_PAGAR.map((conta) => {
                                            const statusStyle = getStatusColor(conta.status);
                                            return (
                                                <TableRow key={conta.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="500">{conta.descricao}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={conta.categoria} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight="700" color="error.main">
                                                            {formatarMoeda(conta.valor)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                            <Typography variant="body2">{new Date(conta.vencimento).toLocaleDateString('pt-BR')}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={conta.status.charAt(0).toUpperCase() + conta.status.slice(1)}
                                                            size="small"
                                                            icon={conta.status === 'vencido' ? <WarningIcon sx={{ fontSize: '14px !important' }} /> : undefined}
                                                            sx={{
                                                                bgcolor: statusStyle.bg,
                                                                color: statusStyle.color,
                                                                fontWeight: 600,
                                                                fontSize: '0.7rem',
                                                                height: 24,
                                                                '& .MuiChip-icon': { color: 'inherit' }
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {tabAtiva === 1 && (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Origem</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="right">Valor</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Vencimento</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {MOCK_CONTAS_RECEBER.map((conta) => {
                                            const statusStyle = getStatusColor(conta.status);
                                            return (
                                                <TableRow key={conta.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="500">{conta.descricao}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={conta.origem} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22 }} />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight="700" color="success.main">
                                                            {formatarMoeda(conta.valor)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                            <Typography variant="body2">{new Date(conta.vencimento).toLocaleDateString('pt-BR')}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={conta.status.charAt(0).toUpperCase() + conta.status.slice(1)}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: statusStyle.bg,
                                                                color: statusStyle.color,
                                                                fontWeight: 600,
                                                                fontSize: '0.7rem',
                                                                height: 24
                                                            }}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>

                </Container>
            </Box>
        </Box>
    );
}

export default Financeiro;
