import { useState, useEffect, useMemo } from 'react';
import { Box, Container, Grid, Card, Typography, Tooltip, useTheme } from '@mui/material';
import MetricCard from '../components/MetricCard';
import {
  AttachMoneyOutlined,
  AccountBalanceWalletOutlined,
  ShowChartOutlined,
  LocalShippingOutlined,
  InfoOutlined,
  Store as StoreIcon,
  ShoppingCart as MLIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from 'recharts';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import api from '../config/api';

function VisaoGeral() {
  const theme = useTheme();
  const [overviewData, setOverviewData] = useState({
    totalVendas: 0,
    totalLucro: 0,
    totalPedidos: 0,
    mercadoLivre: {
      vendas: 0,
      lucro: 0,
      pedidos: 0,
      historico: []
    },
    magazineLuiza: {
      vendas: 0,
      lucro: 0,
      pedidos: 0,
      historico: []
    },
    estoque: {
      total: 0,
      disponivel: 0,
      reservado: 0,
      categorias: []
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar dados do Mercado Livre
        const mlResponse = await api.get('/api/vendas/mercadolivre/overview');
        const mlData = mlResponse.data;

        // Buscar dados da Magazine Luiza
        const magaluResponse = await api.get('/api/vendas/magazineluiza/overview');
        const magaluData = magaluResponse.data;

        // Buscar dados do Estoque
        const estoqueResponse = await api.get('/api/estoque/overview');
        const estoqueData = estoqueResponse.data;

        // Consolidar dados
        const consolidatedData = {
          totalVendas: mlData.vendas + magaluData.vendas,
          totalLucro: mlData.lucro + magaluData.lucro,
          totalPedidos: mlData.pedidos + magaluData.pedidos,
          mercadoLivre: {
            ...mlData,
            historico: mlData.historico || []
          },
          magazineLuiza: {
            ...magaluData,
            historico: magaluData.historico || []
          },
          estoque: estoqueData
        };

        setOverviewData(consolidatedData);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchData();
    
    // Atualizar dados a cada 5 minutos
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Dados para o gráfico de tendências
  const trendData = useMemo(() => {
    const allDates = new Set([
      ...overviewData.mercadoLivre.historico.map(h => h.data),
      ...overviewData.magazineLuiza.historico.map(h => h.data)
    ]);

    return Array.from(allDates).sort().map(date => {
      const mlData = overviewData.mercadoLivre.historico.find(h => h.data === date) || {};
      const magaluData = overviewData.magazineLuiza.historico.find(h => h.data === date) || {};

      return {
        data: date,
        'Mercado Livre': mlData.vendas || 0,
        'Magazine Luiza': magaluData.vendas || 0,
        'Total': (mlData.vendas || 0) + (magaluData.vendas || 0)
      };
    });
  }, [overviewData]);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ 
      display: 'flex',
      width: '100%',
      height: '100vh',
    }}>
      <Sidebar 
        open={sidebarOpen} 
        onToggle={handleToggleSidebar}
        sx={{ 
          width: 240,
          flexShrink: 0,
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100%'
        }}
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginLeft: '50px',
          height: '100vh',
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(45deg, #f1f5f9 30%, #e2e8f0 90%)'
                  : 'linear-gradient(45deg, #1e293b 30%, #334155 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-1px'
              }}
            >
              Visão Geral
            </Typography>
            
            {/* Período de Análise */}
            <Box sx={{ 
              backgroundColor: theme.palette.background.paper,
              padding: '8px 16px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: `1px solid ${theme.palette.divider}`
            }}>
              <Typography variant="body2" color="text.secondary">
                Período: Dezembro/2023
              </Typography>
            </Box>
          </Box>

          {/* Cards Principais */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Vendas Totais"
                value={overviewData.totalVendas}
                icon={<AttachMoneyOutlined />}
                color="#0ea5e9"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Lucro Total"
                value={overviewData.totalLucro}
                icon={<ShowChartOutlined />}
                color="#22c55e"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Total de Pedidos"
                value={overviewData.totalPedidos}
                icon={<LocalShippingOutlined />}
                color="#8b5cf6"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <MetricCard
                title="Produtos em Estoque"
                value={overviewData.estoque.total}
                icon={<InventoryIcon />}
                color="#f97316"
              />
            </Grid>
          </Grid>

          {/* Gráficos Principais */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Tendência de Vendas */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ 
                p: 3, 
                height: '100%',
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(180deg, rgba(30,41,59,0.7) 0%, rgba(30,41,59,0.9) 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${theme.palette.divider}`
              }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Tendência de Vendas por Marketplace
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="ml" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="magalu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis 
                      dataKey="data"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                    />
                    <YAxis 
                      tickFormatter={(value) => new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        notation: 'compact'
                      }).format(value)}
                    />
                    <RechartsTooltip 
                      formatter={(value) => new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="Mercado Livre"
                      stroke="#0ea5e9"
                      fillOpacity={1}
                      fill="url(#ml)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Magazine Luiza"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#magalu)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default VisaoGeral; 