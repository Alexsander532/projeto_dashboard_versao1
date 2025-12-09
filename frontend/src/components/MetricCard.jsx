import React from 'react';
import { Paper, Box, Typography, Tooltip, IconButton } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  iconColor, 
  backgroundColor, 
  isCurrency,
  isInteger,
  isPercentage,
  tooltip
}) => {
  const formatValue = (val) => {
    if (isCurrency) {
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(val);
    }
    
    if (isInteger) {
      return Math.round(val).toLocaleString('pt-BR');
    }
    
    if (isPercentage) {
      return `${val.toFixed(2)}%`;
    }
    
    return val;
  };

  // Tooltips padrão baseados no tipo de métrica
  const defaultTooltips = {
    'Total de Vendas': 'Soma total do valor de todas as vendas realizadas no mês selecionado',
    'Total de Unidades': 'Quantidade total de unidades/itens vendidos no mês',
    'Margem Média': 'Percentual médio de lucro em relação ao valor total de vendas (lucro ÷ vendas × 100)'
  };

  const tooltipText = tooltip || defaultTooltips[title] || '';

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        height: '100%',
        backgroundColor: backgroundColor || 'background.paper',
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        border: `1px solid ${backgroundColor ? backgroundColor.replace('0.1', '0.3') : 'transparent'}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1.5,
                borderRadius: 2,
                color: iconColor || 'primary.main',
                backgroundColor: backgroundColor ? backgroundColor.replace('0.1', '0.2') : 'transparent',
              }}
            >
              {icon}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          {tooltipText && (
            <Tooltip title={tooltipText} arrow placement="top">
              <IconButton size="small" sx={{ ml: 'auto' }}>
                <InfoIcon sx={{ fontSize: '1.2rem', color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {formatValue(value)}
        </Typography>
      </Box>
    </Paper>
  );
};

export default MetricCard; 