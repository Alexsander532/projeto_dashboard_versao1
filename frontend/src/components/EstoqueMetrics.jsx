import React from 'react';
import { Box } from '@mui/material';
import MetricCard from './MetricCard';
import {
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

export default function EstoqueMetrics({ metricas }) {
  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
      gap: 3,
      mb: 4,
      mt: 3,
      mx: 1
    }}>
      <MetricCard
        icon={<InventoryIcon />}
        iconColor="info"
        title="Total em Estoque"
        value={metricas.totalEstoque}
      />
      
      <MetricCard
        icon={<MoneyIcon />}
        iconColor="success"
        title="Valor em Estoque"
        value={`R$ ${metricas.valorTotal.toLocaleString('pt-BR', { 
          minimumFractionDigits: 2,
          maximumFractionDigits: 2 
        })}`}
      />
      
      <MetricCard
        icon={<WarningIcon />}
        iconColor="warning"
        title="Em Reposição"
        value={metricas.estoqueCritico}
      />
    </Box>
  );
}
