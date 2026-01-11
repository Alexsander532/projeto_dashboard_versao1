// frontend/src/components/alertas/AlertasSummary.jsx
import React from 'react';
import { Box, Paper, Typography, alpha, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Error as ErrorIcon,
    Warning as WarningIcon,
    PriorityHigh as PriorityHighIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
    NotificationsActive as NotificationsActiveIcon
} from '@mui/icons-material';

const severidades = [
    { id: 'critico', label: 'Críticos', icon: ErrorIcon, cor: '#ef4444' },
    { id: 'alto', label: 'Altos', icon: WarningIcon, cor: '#f97316' },
    { id: 'medio', label: 'Médios', icon: PriorityHighIcon, cor: '#eab308' },
    { id: 'sucesso', label: 'Resolvidos', icon: CheckCircleIcon, cor: '#22c55e' },
    { id: 'info', label: 'Info', icon: InfoIcon, cor: '#3b82f6' }
];

const SummaryCard = ({ title, count, icon: Icon, color, isActive, onClick, isTotal = false }) => {
    const theme = useTheme();

    return (
        <Paper
            elevation={isActive ? 4 : 0}
            onClick={onClick}
            sx={{
                p: 2, // Padding reduzido
                minWidth: 0, // Permite encolher se necessário
                flex: 1, // Divide espaço igualmente
                borderRadius: '16px',
                cursor: 'pointer',
                border: isActive
                    ? `2px solid ${color}`
                    : `1px solid ${theme.palette.divider}`,
                transition: 'all 0.2s ease',
                bgcolor: isActive
                    ? alpha(color, 0.08)
                    : theme.palette.background.paper,
                display: 'flex',
                alignItems: 'center',
                gap: 2, // Espaço entre ícone e texto
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4],
                    borderColor: color,
                }
            }}
        >
            {/* Ícone Redondo */}
            <Box
                sx={{
                    width: 42,
                    height: 42,
                    borderRadius: '12px',
                    bgcolor: isTotal ? 'primary.main' : alpha(color, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isTotal ? '#fff' : color,
                    flexShrink: 0
                }}
            >
                <Icon sx={{ fontSize: 22 }} />
            </Box>

            {/* Textos */}
            <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Typography
                    variant="h5"
                    fontWeight="800"
                    sx={{
                        color: isTotal ? 'primary.main' : 'text.primary',
                        lineHeight: 1
                    }}
                >
                    {count}
                </Typography>
                <Typography
                    variant="caption"
                    fontWeight="600"
                    color="text.secondary"
                    noWrap // Evita quebra de linha
                >
                    {title}
                </Typography>
            </Box>

            {/* Bolinha indicador de ativo (opcional, canto superior direito) */}
            {isActive && (
                <Box sx={{
                    ml: 'auto',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: color,
                    alignSelf: 'flex-start',
                    mt: 0.5
                }} />
            )}
        </Paper>
    );
};

const AlertasSummary = ({ contagem, onFiltrar, filtroAtivo }) => {
    const theme = useTheme();
    // Se for mobile, usa wrap. Se desktop, mantém numa linha.
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const items = [
        {
            id: 'todos',
            label: 'Total',
            icon: NotificationsActiveIcon,
            count: contagem?.total || 0,
            cor: theme.palette.primary.main,
            isTotal: true
        },
        ...severidades.map(s => ({
            ...s,
            count: contagem?.[s.id] || 0
        }))
    ];

    return (
        <Box sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            flexWrap: isMobile ? 'wrap' : 'nowrap', // Garante linha única em telas maiores
            width: '100%',
            // Garante scroll horizontal suave se a tela for menor que MD mas maior que SM
            overflowX: isMobile ? 'visible' : 'auto',
            pb: isMobile ? 0 : 1
        }}>
            {items.map((item) => (
                <SummaryCard
                    key={item.id}
                    title={item.label}
                    count={item.count}
                    icon={item.icon}
                    color={item.cor}
                    isActive={filtroAtivo === item.id}
                    onClick={() => onFiltrar?.(item.id)}
                    isTotal={item.isTotal}
                />
            ))}
        </Box>
    );
};

export default AlertasSummary;
