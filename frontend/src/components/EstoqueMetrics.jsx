import React from 'react';
import { Box } from '@mui/material';
import MetricCard from './MetricCard';
import {
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export default function EstoqueMetrics({ metricas }) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
      gap: 3,
      mb: 4,
      mt: 3,
      mx: 1
    }}>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3 }}
      >
        <MetricCard
          icon={<InventoryIcon />}
          iconColor="#2196F3" // Azul
          backgroundColor="rgba(33, 150, 243, 0.1)"
          title="Total em Estoque"
          value={metricas.totalEstoque}
          isInteger
        />
      </motion.div>
      
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <MetricCard
          icon={<MoneyIcon />}
          iconColor="#4CAF50" // Verde
          backgroundColor="rgba(76, 175, 80, 0.1)"
          title="Valor em Estoque"
          value={metricas.valorTotal}
          isCurrency
        />
      </motion.div>
      
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <MetricCard
          icon={<WarningIcon />}
          iconColor="#FF9800" // Laranja
          backgroundColor="rgba(255, 152, 0, 0.1)"
          title="Em Reposição"
          value={metricas.estoqueCritico}
          isInteger
        />
      </motion.div>
    </Box>
  );
}
