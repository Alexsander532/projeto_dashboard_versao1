import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Chip,
    Tooltip,
    useTheme
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    History as HistoryIcon,
    Warning as WarningIcon,
    CalendarToday as CalendarIcon,
    AccessTime as TimeIcon,
    KeyboardArrowDown,
    KeyboardArrowUp
} from '@mui/icons-material';
import { Collapse } from '@mui/material';
import { Draggable } from '@hello-pangea/dnd';

const KanbanCard = ({
    pedido,
    index,
    colunaCor,
    onEdit,
    onDelete,
    onHistory,
    estaAtrasado,
    formatarValor,
    calcularDiasEmEtapa
}) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const [expanded, setExpanded] = useState(false); // Default collapsed as requested
    const open = Boolean(anchorEl);

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const diasNaEtapa = calcularDiasEmEtapa(pedido);

    // Calcular prazo da etapa atual
    let prazoEtapa = 0;
    if (pedido.status === 'fabricacao') prazoEtapa = pedido.prazo_fabricacao;
    if (pedido.status === 'transito') prazoEtapa = pedido.prazo_transito;
    if (pedido.status === 'alfandega') prazoEtapa = pedido.prazo_alfandega;

    const diasRestantes = prazoEtapa - diasNaEtapa;
    const estaAtrasadoEtapa = prazoEtapa > 0 && diasRestantes < 0;
    const avisoProximo = prazoEtapa > 0 && diasRestantes <= 2 && diasRestantes >= 0;

    const textoPrazo = () => {
        if (!prazoEtapa) return `${diasNaEtapa} dias aqui`;
        if (estaAtrasadoEtapa) return `Atrasado há ${Math.abs(diasRestantes)} dias`;
        if (diasRestantes === 0) return 'Vence hoje';
        return `Vence em ${diasRestantes} dias`;
    };

    const corPrazo = () => {
        if (estaAtrasadoEtapa) return 'error.main';
        if (avisoProximo) return 'warning.main';
        return 'text.secondary';
    };

    const bgPrazo = () => {
        if (estaAtrasadoEtapa) return '#ffebee';
        if (avisoProximo) return '#fff3e0';
        return 'action.hover';
    };

    const atrasado = estaAtrasado(pedido) || estaAtrasadoEtapa;

    return (
        <Draggable draggableId={String(pedido.id)} index={index}>
            {(provided, snapshot) => (
                <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    elevation={snapshot.isDragging ? 8 : 1}
                    sx={{
                        mb: expanded ? 2 : 1,
                        borderRadius: '12px',
                        borderLeft: atrasado ? `4px solid ${theme.palette.error.main}` : `4px solid ${colunaCor}`,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        bgcolor: 'background.paper',
                        '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-2px)'
                        },
                        ...provided.draggableProps.style
                    }}
                >
                    <CardContent sx={{ p: expanded ? '16px !important' : '6px 12px !important', '&:last-child': { pb: expanded ? '16px !important' : '6px !important' } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: expanded ? 'flex-start' : 'center', mb: expanded ? 1 : 0 }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: expanded ? '1rem' : '0.85rem' }}>
                                    Pedido #{pedido.id}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {atrasado && !expanded && (
                                    <Tooltip title="Pedido atrasado">
                                        <WarningIcon color="error" sx={{ fontSize: 16, mr: 0.5 }} />
                                    </Tooltip>
                                )}
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                                    sx={{ p: 0.5, bgcolor: 'transparent', '&:hover': { bgcolor: 'action.hover' } }}
                                >
                                    {expanded ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={handleMenuClick}
                                    sx={{ p: 0.5, ml: 0.5, bgcolor: 'transparent', '&:hover': { bgcolor: 'action.hover' } }}
                                >
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>

                        {/* Menu de Ações */}
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={() => { onEdit(pedido); handleMenuClose(); }}>
                                <EditIcon fontSize="small" sx={{ mr: 1 }} /> Editar
                            </MenuItem>
                            <MenuItem onClick={() => { onHistory(pedido); handleMenuClose(); }}>
                                <HistoryIcon fontSize="small" sx={{ mr: 1 }} /> Histórico
                            </MenuItem>
                            <MenuItem onClick={() => { onDelete(pedido); handleMenuClose(); }} sx={{ color: 'error.main' }}>
                                <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Excluir
                            </MenuItem>
                        </Menu>

                        {/* Collapsible Content */}
                        <Collapse in={expanded} timeout="auto" unmountOnExit>

                            {/* Value - Visible here when expanded */}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="h5" color="primary.main" fontWeight="bold">
                                    {formatarValor(pedido.valor)}
                                </Typography>
                            </Box>
                            {/* Date and Delivery info (Moved from Header) */}
                            <Box sx={{ mb: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {(pedido.data_pedido || pedido.dataPedido) && (
                                    <Typography variant="caption" color="text.secondary">
                                        📅 Data: {new Date(pedido.data_pedido || pedido.dataPedido).toLocaleDateString('pt-BR')}
                                    </Typography>
                                )}

                                {pedido.previsao_entrega && (
                                    <Box>
                                        <Chip
                                            icon={<CalendarIcon sx={{ fontSize: '1rem !important' }} />}
                                            label={`Entrega: ${new Date(pedido.previsao_entrega).toLocaleDateString('pt-BR').slice(0, 5)}`}
                                            size="small"
                                            variant="outlined"
                                            color="info"
                                            sx={{ height: 24, fontSize: '0.75rem' }}
                                        />
                                    </Box>
                                )}
                            </Box>

                            {/* Vendor */}
                            <Box sx={{ mb: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Fornecedor:
                                </Typography>
                                <Typography variant="body2" color="text.primary" noWrap>
                                    {pedido.fornecedor}
                                </Typography>
                            </Box>

                            {/* Products Tags */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                                <Typography variant="caption" color="text.secondary" width="100%" sx={{ mb: 0.5 }}>
                                    Produtos:
                                </Typography>
                                {(pedido.produtos || pedido.itens || []).map((prod, idx) => (
                                    <Chip
                                        key={idx}
                                        label={`${prod.sku} (${prod.quantidade})`}
                                        size="small"
                                        sx={{
                                            height: 24,
                                            fontSize: '0.75rem',
                                            bgcolor: `${colunaCor}20`,
                                            border: `1px solid ${colunaCor}40`
                                        }}
                                    />
                                ))}
                            </Box>
                        </Collapse>

                        {/* Footer with Days in Stage - Visible only when expanded OR if delayed (optional, but requested minimize) -> Hiding when minimized, using border/icon for alert */}
                        {expanded && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, pt: 1, borderTop: '1px dashed #eee' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <TimeIcon sx={{ fontSize: 16, color: corPrazo() }} />
                                    <Typography variant="caption" sx={{ color: corPrazo(), bgcolor: bgPrazo(), px: 1, py: 0.5, borderRadius: 1, fontWeight: 'bold' }}>
                                        {textoPrazo()}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                    </CardContent>
                </Card>
            )}
        </Draggable>
    );
};

export default KanbanCard;
