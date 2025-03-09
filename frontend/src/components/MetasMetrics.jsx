import React from 'react';
import { Box } from '@mui/material';
import MetricCard from './MetricCard';
import {
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const MetasMetrics = ({ stats }) => {
  console.log('MetasMetrics recebeu stats:', stats);
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Garantir que os valores sejam números válidos - exatamente como na página do ML
  const totalVendas = Number(stats.totalVendas || 0);
  const totalUnidades = Number(stats.totalUnidades || 0);
  const margemMedia = Number(stats.margemMedia || 0);

  console.log('Valores processados para exibição:', {
    totalVendas,
    totalUnidades,
    margemMedia
  });

  return (
    <Box sx={{ 
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
      gap: 3,
      mb: 4
    }}>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3 }}
      >
        <MetricCard
          title="Total de Vendas"
          value={totalVendas}
          icon={<MoneyIcon />}
          iconColor="#00B1EA"
          backgroundColor="rgba(0, 177, 234, 0.1)"
          isCurrency
        />
      </motion.div>
      
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <MetricCard
          title="Total de Unidades"
          value={totalUnidades}
          icon={<InventoryIcon />}
          iconColor="#A020F0"
          backgroundColor="rgba(160, 32, 240, 0.1)"
          isInteger
        />
      </motion.div>
      
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <MetricCard
          title="Margem Média"
          value={margemMedia}
          icon={<TrendingUpIcon />}
          iconColor="#4CAF50"
          backgroundColor="rgba(76, 175, 80, 0.1)"
          isPercentage
        />
      </motion.div>
    </Box>
  );
};

export default MetasMetrics; 