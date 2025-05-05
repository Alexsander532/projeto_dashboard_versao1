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
        iconColor="#2196F3" // Azul
        backgroundColor="rgba(33, 150, 243, 0.1)"
        title="Total em Estoque"
        value={metricas.totalEstoque}
        isInteger
      />
      
      <MetricCard
        icon={<MoneyIcon />}
        iconColor="#4CAF50" // Verde
        backgroundColor="rgba(76, 175, 80, 0.1)"
        title="Valor em Estoque"
        value={metricas.valorTotal}
        isCurrency
      />
      
      <MetricCard
        icon={<WarningIcon />}
        iconColor="#FF9800" // Laranja
        backgroundColor="rgba(255, 152, 0, 0.1)"
        title="Em Reposição"
        value={metricas.estoqueCritico}
        isInteger
      />
    </Box>
  );
}
