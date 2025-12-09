import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  useTheme,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  LocalShipping as LocalShippingIcon,
  Factory as FactoryIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import CompraForm from '../components/CompraForm';
import PrevisaoCompras from '../components/PrevisaoCompras';

const colunas = [
  {
    id: 'pedido',
    titulo: 'Pedido Realizado',
    cor: '#4CAF50',
    icon: <AttachMoneyIcon />
  },
  {
    id: 'fabricacao',
    titulo: 'Em Fabricação',
    cor: '#2196F3',
    icon: <FactoryIcon />
  },
  {
    id: 'transito',
    titulo: 'Em Trânsito',
    cor: '#FF9800',
    icon: <LocalShippingIcon />
  },
  {
    id: 'alfandega',
    titulo: 'Em Alfândega',
    cor: '#9C27B0',
    icon: <ScheduleIcon />
  },
  {
    id: 'recebido',
    titulo: 'Recebido',
    cor: '#4CAF50',
    icon: <InventoryIcon />
  }
];

export default function Compras() {
  const theme = useTheme();
  const [formOpen, setFormOpen] = useState(false);
  const [produtoParaAdicionar, setProdutoParaAdicionar] = useState(null);
  const [pedidos, setPedidos] = useState(() => {
    const savedPedidos = localStorage.getItem('pedidos_compra');
    return savedPedidos ? JSON.parse(savedPedidos) : [];
  });

  useEffect(() => {
    localStorage.setItem('pedidos_compra', JSON.stringify(pedidos));
  }, [pedidos]);

  const handleMoverPedido = (pedidoId, novoStatus) => {
    setPedidos(pedidos.map(pedido => 
      pedido.id === pedidoId ? { ...pedido, status: novoStatus } : pedido
    ));
  };

  const handleSubmitPedido = (novoPedido) => {
    const id = pedidos.length > 0 ? Math.max(...pedidos.map(p => p.id)) + 1 : 1;
    setPedidos([...pedidos, { ...novoPedido, id, status: 'pedido' }]);
    setFormOpen(false);
    setProdutoParaAdicionar(null);
  };

  const handleAddToPedido = (produto) => {
    setProdutoParaAdicionar(produto);
    setFormOpen(true);
  };

  const getProximoStatus = (statusAtual) => {
    const indices = {
      pedido: 'fabricacao',
      fabricacao: 'transito',
      transito: 'alfandega',
      alfandega: 'recebido'
    };
    return indices[statusAtual];
  };

  const getStatusAnterior = (statusAtual) => {
    const indices = {
      fabricacao: 'pedido',
      transito: 'fabricacao',
      alfandega: 'transito',
      recebido: 'alfandega'
    };
    return indices[statusAtual];
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Calcular métricas financeiras
  const calcularMetricasFinanceiras = () => {
    const totalPorEtapa = {
      pedido: 0,
      fabricacao: 0,
      transito: 0,
      alfandega: 0,
      recebido: 0
    };

    pedidos.forEach(pedido => {
      const valor = parseFloat(pedido.valor) || 0;
      totalPorEtapa[pedido.status] = (totalPorEtapa[pedido.status] || 0) + valor;
    });

    return {
      totalPedidos: totalPorEtapa.pedido,
      totalTransito: totalPorEtapa.fabricacao + totalPorEtapa.transito + totalPorEtapa.alfandega,
      totalRecebido: totalPorEtapa.recebido,
      totalPendente: totalPorEtapa.pedido + totalPorEtapa.fabricacao + totalPorEtapa.transito + totalPorEtapa.alfandega,
      totalGeral: Object.values(totalPorEtapa).reduce((a, b) => a + b, 0)
    };
  };

  // Calcular dias em cada etapa para cada pedido
  const calcularDiasEmEtapa = (pedido) => {
    // Se não tem data de criação, retorna 0
    if (!pedido.dataPedido) return 0;
    
    const dataCriacao = new Date(pedido.dataPedido);
    const hoje = new Date();
    const dias = Math.floor((hoje - dataCriacao) / (1000 * 60 * 60 * 24));
    return dias;
  };

  // Verificar se pedido está atrasado
  const estaAtrasado = (pedido) => {
    if (!pedido.previsaoEntrega) return false;
    const previsao = new Date(pedido.previsaoEntrega);
    const hoje = new Date();
    return hoje > previsao && pedido.status !== 'recebido';
  };

  const metricas = calcularMetricasFinanceiras();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Sidebar />
      
      <Box sx={{ flexGrow: 1, p: 3, ml: '64px' }}>
          {/* Header */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: '12px',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}
        >
            <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                Pedidos de Compra
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Acompanhe seus pedidos de compra em tempo real
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
              sx={{
              bgcolor: 'success.main',
                '&:hover': {
                bgcolor: 'success.dark',
                },
                borderRadius: '8px',
                textTransform: 'none',
                px: 3
              }}
            >
              Novo Pedido
            </Button>
        </Paper>

        {/* Resumo Financeiro - FASE 1 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                borderRadius: '12px',
                bgcolor: '#e8f5e9',
                borderLeft: '4px solid #4CAF50'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AttachMoneyIcon sx={{ fontSize: 32, color: '#4CAF50' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Pedidos
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                    {formatarValor(metricas.totalPedidos)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pedidos.filter(p => p.status === 'pedido').length} pedidos
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                borderRadius: '12px',
                bgcolor: '#fff3e0',
                borderLeft: '4px solid #FF9800'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LocalShippingIcon sx={{ fontSize: 32, color: '#FF9800' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Em Trânsito
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                    {formatarValor(metricas.totalTransito)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pedidos.filter(p => ['fabricacao', 'transito', 'alfandega'].includes(p.status)).length} pedidos
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                borderRadius: '12px',
                bgcolor: '#e3f2fd',
                borderLeft: '4px solid #2196F3'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <InventoryIcon sx={{ fontSize: 32, color: '#2196F3' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Recebido
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                    {formatarValor(metricas.totalRecebido)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pedidos.filter(p => p.status === 'recebido').length} pedidos
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 2, 
                borderRadius: '12px',
                bgcolor: '#fce4ec',
                borderLeft: '4px solid #E91E63'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 32, color: '#E91E63' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Geral
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#E91E63' }}>
                    {formatarValor(metricas.totalGeral)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pedidos.length} pedidos no total
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          {colunas.map((coluna, index) => (
            <Grid item xs={12} md={2.4} key={coluna.id}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  height: '100%',
                  bgcolor: `${coluna.cor}10`
                }}
              >
          <Box sx={{ 
            display: 'flex',
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2,
                  color: coluna.cor
          }}>
                  {coluna.icon}
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    {coluna.titulo}
              </Typography>
                  <Badge 
                    badgeContent={pedidos.filter(p => p.status === coluna.id).length} 
                    color="primary"
                    sx={{ ml: 'auto' }}
                  />
            </Box>

            <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 2,
                  minHeight: '500px'
            }}>
                  {pedidos
                    .filter(pedido => pedido.status === coluna.id)
                    .map(pedido => (
                      <Card 
                        key={pedido.id}
                        sx={{ 
                          bgcolor: 'background.paper',
                          '&:hover': { transform: 'translateY(-2px)' },
                          transition: 'transform 0.2s',
                          borderLeft: estaAtrasado(pedido) ? '4px solid #f44336' : '4px solid transparent'
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              Pedido #{pedido.id}
                            </Typography>
                            {estaAtrasado(pedido) && (
                              <Tooltip title="Pedido atrasado!">
                                <WarningIcon sx={{ color: '#f44336', fontSize: 20 }} />
                              </Tooltip>
                            )}
                          </Box>
                          
                          {/* Data do Pedido - FASE 2 */}
                          {pedido.dataPedido && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              📅 {new Date(pedido.dataPedido).toLocaleDateString('pt-BR')}
                            </Typography>
                          )}
                          
                          {/* Previsão de Entrega - FASE 2 */}
                          {pedido.previsaoEntrega && (
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block', 
                                mb: 0.5,
                                color: estaAtrasado(pedido) ? '#f44336' : 'text.secondary'
                              }}
                            >
                              ⏰ Previsão: {new Date(pedido.previsaoEntrega).toLocaleDateString('pt-BR')}
                            </Typography>
                          )}
                          
                          {/* Dias em cada etapa - FASE 2 */}
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            ⏱️ {calcularDiasEmEtapa(pedido)} dia(s) nesta etapa
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Fornecedor: {pedido.fornecedor}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: '#E91E63' }}>
                            Valor: {formatarValor(pedido.valor)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            {pedido.produtos.map((prod, idx) => (
                              <Chip 
                                key={idx}
                                label={`${prod.sku} (${prod.quantidade})`}
                                size="small"
                                sx={{ bgcolor: `${coluna.cor}20` }}
                              />
                            ))}
            </Box>
            <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            mt: 1 
            }}>
                            {/* Botão para voltar */}
                            {index > 0 && (
                              <Tooltip title="Voltar para etapa anterior">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleMoverPedido(pedido.id, getStatusAnterior(pedido.status))}
                                  sx={{ 
                                    color: colunas[index - 1].cor,
                                    '&:hover': { bgcolor: `${colunas[index - 1].cor}20` }
                                  }}
                                >
                                  <ArrowBackIcon />
                                </IconButton>
                              </Tooltip>
                            )}

                            {/* Botão para avançar */}
                            {pedido.status !== 'recebido' && (
                              <Tooltip title="Avançar para próxima etapa">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleMoverPedido(pedido.id, getProximoStatus(pedido.status))}
                                  sx={{ 
                                    color: coluna.cor,
                                    '&:hover': { bgcolor: `${coluna.cor}20` }
                                  }}
                                >
                                  <ArrowForwardIcon />
                                </IconButton>
                              </Tooltip>
                            )}
            </Box>
                        </CardContent>
                      </Card>
                    ))}
          </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Previsão de Compras */}
        <PrevisaoCompras onAddToPedido={handleAddToPedido} />

        {/* Formulário de Novo Pedido */}
        <CompraForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setProdutoParaAdicionar(null);
          }}
          onSubmit={handleSubmitPedido}
          produtoInicial={produtoParaAdicionar}
        />
      </Box>
    </Box>
  );
} 