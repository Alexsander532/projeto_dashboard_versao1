import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import {
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

const MetricCard = ({ icon, iconColor, title, value }) => (
  <Card sx={{ 
    height: '140px',
    display: 'flex',
    position: 'relative',
    overflow: 'visible',
    minWidth: '100%',
    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
    borderRadius: '16px',
    backgroundColor: '#fff',
    '&:hover': {
      boxShadow: '0 8px 25px 0 rgba(0,0,0,0.1)',
      transform: 'translateY(-4px)',
    },
    transition: 'all 0.3s ease',
  }}>
    <Box
      sx={{
        position: 'absolute',
        top: -20,
        left: 20,
        height: 50,
        width: 50,
        borderRadius: '12px',
        backgroundColor: `${iconColor}.main`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px 0 rgba(0,0,0,0.15)',
      }}
    >
      {icon}
    </Box>
    <CardContent sx={{ 
      width: '100%', 
      pt: 4, 
      px: 2.5,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'space-between'
    }}>
      <Typography 
        variant="subtitle1" 
        color="text.secondary" 
        sx={{ 
          fontSize: '0.875rem',
          fontWeight: 500,
          mb: 1
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="h3" 
        component="div" 
        sx={{ 
          fontWeight: 600,
          fontSize: title === 'Valor em Estoque' ? '2rem' : '2.5rem',
          lineHeight: 1.2,
          color: '#1a237e',
          alignSelf: 'center',
          mt: 'auto',
          mb: 1
        }}
      >
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export default function EstoqueMetrics({ produtos }) {
  const totalEstoque = produtos.reduce((acc, prod) => acc + prod.estoque, 0);
  
  const valorTotalEstoque = produtos.reduce((acc, prod) => 
    acc + (prod.estoque * prod.valorLiquidoMedio), 0
  );

  const produtosBaixoEstoque = produtos.filter(prod => 
    prod.status === 'Baixo Estoque' || prod.status === 'Sem Estoque'
  ).length;

  const mediaVendasDiarias = produtos.reduce((acc, prod) => {
    const mediaVendas = prod.vendasDiarias.reduce((sum, vendas) => sum + vendas, 0) / 15;
    return acc + mediaVendas;
  }, 0) / produtos.length;

  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
      gap: 4,
      mb: 4,
      mt: 3,
      mx: 1
    }}>
      <MetricCard
        icon={<InventoryIcon sx={{ fontSize: 28, color: 'white' }} />}
        iconColor="primary"
        title="Total em Estoque"
        value={totalEstoque}
      />
      <MetricCard
        icon={<MoneyIcon sx={{ fontSize: 28, color: 'white' }} />}
        iconColor="success"
        title="Valor em Estoque"
        value={`R$ ${valorTotalEstoque.toLocaleString('pt-BR', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        })}`}
      />
      <MetricCard
        icon={<WarningIcon sx={{ fontSize: 28, color: 'white' }} />}
        iconColor="warning"
        title="Estoque Crítico"
        value={produtosBaixoEstoque}
      />
      <MetricCard
        icon={<TrendingUpIcon sx={{ fontSize: 28, color: 'white' }} />}
        iconColor="info"
        title="Giro Médio"
        value={mediaVendasDiarias.toFixed(1)}
      />
    </Box>
  );
}
