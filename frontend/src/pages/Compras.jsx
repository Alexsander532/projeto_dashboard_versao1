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
  Schedule as ScheduleIcon
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

        {/* Kanban Board */}
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
                          transition: 'transform 0.2s'
                        }}
                      >
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                            Pedido #{pedido.id}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Fornecedor: {pedido.fornecedor}
              </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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