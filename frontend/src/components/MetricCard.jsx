import React from 'react';
import { Paper, Box, Typography } from '@mui/material';

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  iconColor, 
  backgroundColor, 
  isCurrency,
  isInteger,
  isPercentage 
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

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        backgroundColor: backgroundColor || 'background.paper',
        borderRadius: 2,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 1,
              borderRadius: 1,
              color: iconColor || 'primary.main',
            }}
          >
            {icon}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {formatValue(value)}
        </Typography>
      </Box>
    </Paper>
  );
};

export default MetricCard; 