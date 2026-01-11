// frontend/src/components/alertas/AlertCard.jsx
import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Chip,
    IconButton,
    Button,
    Grid,
    Divider,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
    Warning as WarningIcon,
    Error as ErrorIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
    PriorityHigh as PriorityHighIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    DeleteOutline as DeleteIcon,
    ShoppingCartOutlined as ShoppingCartIcon,
    Inventory2Outlined as InventoryIcon,
    TrendingUp as TrendingUpIcon,
    AttachMoney as AttachMoneyIcon,
    ArrowForward as ArrowIcon,
    Storefront as StoreIcon
} from '@mui/icons-material';

// Configurações mantidas, apenas visual ajustado no componente
const severidadeConfig = {
    critico: { cor: '#ef4444', bg: '#fee2e2', label: 'Crítico', icon: ErrorIcon },
    alto: { cor: '#f97316', bg: '#ffedd5', label: 'Alto', icon: WarningIcon },
    medio: { cor: '#eab308', bg: '#fef9c3', label: 'Médio', icon: PriorityHighIcon },
    sucesso: { cor: '#22c55e', bg: '#dcfce7', label: 'Sucesso', icon: CheckCircleIcon },
    info: { cor: '#3b82f6', bg: '#dbeafe', label: 'Info', icon: InfoIcon }
};

const tipoConfig = {
    estoque: { icon: InventoryIcon, label: 'Estoque', color: '#8b5cf6' },
    compras: { icon: ShoppingCartIcon, label: 'Compras', color: '#06b6d4' },
    metas: { icon: TrendingUpIcon, label: 'Metas', color: '#f59e0b' },
    financeiro: { icon: AttachMoneyIcon, label: 'Financeiro', color: '#10b981' }
};

const AlertCard = ({ alerta, onMarcarLido, onDescartar, onAcao }) => {
    const theme = useTheme();

    const sev = severidadeConfig[alerta.severidade] || severidadeConfig.info;
    const tipo = tipoConfig[alerta.tipo] || tipoConfig.estoque;
    const SevIcon = sev.icon;
    const TipoIcon = tipo.icon;

    const formatarValor = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const DataItem = ({ label, value, color = 'text.primary', highlight = false }) => (
        <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.2 }}>
                {label}
            </Typography>
            <Typography
                variant="body2"
                fontWeight={highlight ? 700 : 500}
                color={color}
                sx={{ fontSize: highlight ? '1rem' : '0.9rem' }}
            >
                {value}
            </Typography>
        </Box>
    );

    const renderDetalhesGrid = () => {
        const { dados } = alerta;
        if (!dados) return null;

        let items = [];
        if (alerta.tipo === 'estoque') {
            if (dados.estoqueAtual !== undefined) items.push(<DataItem label="Em Estoque" value={`${dados.estoqueAtual} un.`} highlight color={dados.estoqueAtual === 0 ? 'error.main' : 'text.primary'} />);
            if (dados.minimo !== undefined) items.push(<DataItem label="Mínimo" value={`${dados.minimo} un.`} />);
            if (dados.mediaVendas !== undefined) items.push(<DataItem label="Média/Dia" value={dados.mediaVendas} />);
            if (dados.previsaoZerar !== undefined) items.push(<DataItem label="Previsão Zerar" value={`${dados.previsaoZerar} dias`} color="error.main" highlight />);
            if (dados.valorParado !== undefined) items.push(<DataItem label="Valor Parado" value={formatarValor(dados.valorParado)} />);
        }
        else if (alerta.tipo === 'compras') {
            if (dados.valor !== undefined) items.push(<DataItem label="Valor" value={formatarValor(dados.valor)} highlight />);
            if (dados.produtos !== undefined) items.push(<DataItem label="Itens" value={dados.produtos} />);
            if (dados.status) items.push(<DataItem label="Etapa" value={dados.status.toUpperCase()} color="primary.main" />);
            if (dados.diasAtrasado) items.push(<DataItem label="Atraso" value={`${dados.diasAtrasado} dias`} color="error.main" highlight />);
            if (dados.previsaoEntrega) items.push(<DataItem label="Entrega" value={new Date(dados.previsaoEntrega).toLocaleDateString('pt-BR')} />);
        }
        else if (alerta.tipo === 'metas') {
            if (dados.progresso !== undefined) items.push(<DataItem label="Progresso" value={`${dados.progresso}%`} color={dados.progresso < 50 ? 'error.main' : 'success.main'} highlight />);
            if (dados.metaVendas !== undefined) items.push(<DataItem label="Meta" value={formatarValor(dados.metaVendas)} />);
            if (dados.vendidoAtual !== undefined) items.push(<DataItem label="Realizado" value={formatarValor(dados.vendidoAtual)} />);
            if (dados.projecao !== undefined) items.push(<DataItem label="Projeção" value={formatarValor(dados.projecao)} />);
        }
        else if (alerta.tipo === 'financeiro') {
            if (dados.margemAtual !== undefined) items.push(<DataItem label="Margem" value={`${dados.margemAtual}%`} color="warning.main" highlight />);
            if (dados.lucroEstimado !== undefined) items.push(<DataItem label="Lucro Est." value={formatarValor(dados.lucroEstimado)} />);
        }

        return (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {items.map((item, idx) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={idx}>
                        {item}
                    </Grid>
                ))}
            </Grid>
        );
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 0,
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
                transition: 'all 0.2s',
                '&:hover': {
                    boxShadow: theme.shadows[2],
                    borderColor: alpha(sev.cor, 0.5)
                },
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', bgcolor: sev.cor }} />

            <Box sx={{ p: 2, pl: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}> {/* Padding reduzido */}

                {/* Header Compacto */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Box
                            sx={{
                                width: 40, // Reduzido de 48
                                height: 40,
                                borderRadius: '10px',
                                bgcolor: alpha(sev.cor, 0.1),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: sev.cor,
                                flexShrink: 0
                            }}
                        >
                            <SevIcon fontSize="small" />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="subtitle1" fontWeight="700" sx={{ lineHeight: 1.2 }}>
                                    {alerta.titulo}
                                </Typography>
                                <Chip
                                    label={sev.label}
                                    size="small"
                                    sx={{
                                        bgcolor: sev.bg,
                                        color: sev.cor,
                                        fontWeight: 700,
                                        fontSize: '0.65rem',
                                        height: 20,
                                        borderRadius: '4px'
                                    }}
                                />
                                <Chip
                                    icon={<TipoIcon style={{ color: tipo.color }} />}
                                    label={tipo.label}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                        borderColor: alpha(tipo.color, 0.3),
                                        color: tipo.color,
                                        fontWeight: 600,
                                        fontSize: '0.65rem',
                                        height: 20,
                                        borderRadius: '4px',
                                        '& .MuiChip-icon': { fontSize: '0.9rem', ml: 0.5 }
                                    }}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.3 }}>
                                {alerta.mensagem}
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => onMarcarLido?.(alerta.id)} sx={{ padding: 0.5, color: 'text.secondary' }}>
                            {alerta.lido ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" onClick={() => onDescartar?.(alerta.id)} sx={{ padding: 0.5, color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {/* Dados Principais (Grid Inline) */}
                {renderDetalhesGrid()}

                {/* Footer Contexto + Ações na mesma linha se possível */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}`, flexWrap: 'wrap', gap: 1 }}>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {/* Contexto simplificado */}
                        {(alerta.sku || alerta.fornecedor) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary', fontSize: '0.8rem' }}>
                                {alerta.sku && <span><strong>SKU:</strong> {alerta.sku}</span>}
                                {alerta.fornecedor && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <StoreIcon sx={{ fontSize: 14 }} /> {alerta.fornecedor}
                                    </span>
                                )}
                                {alerta.produto && <span sx={{ opacity: 0.8 }}>• {alerta.produto}</span>}
                            </Box>
                        )}
                    </Box>

                    {/* Botão de Ação */}
                    {alerta.acoes && alerta.acoes.length > 0 && (
                        <Button
                            size="small"
                            variant="outlined"
                            endIcon={<ArrowIcon sx={{ fontSize: '1rem !important' }} />}
                            onClick={() => onAcao?.(alerta, alerta.acoes[0])}
                            sx={{
                                fontWeight: 600,
                                textTransform: 'none',
                                borderRadius: '6px',
                                height: 28,
                                fontSize: '0.8rem',
                                ml: 'auto'
                            }}
                        >
                            Resolver
                        </Button>
                    )}
                </Box>
            </Box>
        </Paper>
    );
};

export default AlertCard;
