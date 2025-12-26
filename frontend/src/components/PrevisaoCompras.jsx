import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  AddShoppingCart as AddShoppingCartIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ShoppingCart as ShoppingCartIcon,
  Check as CheckIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { fetchEstoque } from '../services/estoqueService';

export default function PrevisaoCompras({ onAddToPedido }) {
  const theme = useMuiTheme();
  const [previsoes, setPrevisoes] = useState([]);
  const [selecionados, setSelecionados] = useState(new Set());
  const [dialogAberto, setDialogAberto] = useState(false);

  // Ordem de prioridade para sorting
  const statusPriority = {
    'Crítico': 1,
    'Em reposição': 2,
    'Em negociação': 3
  };

  // Gerenciar seleção individual
  const toggleSelecao = (sku) => {
    const novo = new Set(selecionados);
    if (novo.has(sku)) {
      novo.delete(sku);
    } else {
      novo.add(sku);
    }
    setSelecionados(novo);
  };

  // Selecionar/desselecionar todos
  const toggleSelecionarTodos = () => {
    if (selecionados.size === previsoes.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(previsoes.map(p => p.sku)));
    }
  };

  // Gerar pedido consolidado
  const gerarPedidoConsolidado = () => {
    const itensSelect = previsoes.filter(p => selecionados.has(p.sku));
    if (itensSelect.length === 0) return;

    // Chamar a função para cada item (ou consolidar em um pedido único)
    itensSelect.forEach(item => {
      onAddToPedido(item);
    });

    setSelecionados(new Set());
    setDialogAberto(false);
  };

  // Calcular totais dos itens selecionados
  const itensSelecionados = previsoes.filter(p => selecionados.has(p.sku));
  const totalQtd = itensSelecionados.reduce((sum, item) => sum + item.quantidadeParaComprar, 0);
  const totalValor = itensSelecionados.reduce((sum, item) => sum + (item.quantidadeParaComprar * item.precoCompra), 0);

  // Cores de background para cada status
  const statusBgColor = {
    'Crítico': '#ffebee',
    'Em reposição': '#fff8e1',
    'Em negociação': '#e3f2fd'
  };

  // Funções de cálculo atualizadas para 3,5 meses
  const determinarStatus = (percentualIdeal) => {
    // Baseado no % do estoque ideal que você tem
    if (percentualIdeal < 30) return 'Crítico';
    if (percentualIdeal < 60) return 'Em reposição';
    if (percentualIdeal < 90) return 'Em negociação';
    if (percentualIdeal <= 110) return 'Em estoque';
    return 'Estoque alto';
  };

  useEffect(() => {
    // Carregar dados do estoque
    const carregarDados = async () => {
      try {
        const dadosEstoque = await fetchEstoque();
        
        // Processar cada item do estoque usando dados reais calculados
        let novasPrevisoes = dadosEstoque
          .map(item => {
            const status = determinarStatus(item.percentualIdeal || 0);
            
            // Incluir APENAS itens que estão em Crítico, Em reposição ou Em negociação
            if (!['Crítico', 'Em reposição', 'Em negociação'].includes(status)) {
              return null; // Ignora En estoque e Estoque alto
            }

            // Usar quantidadeParaComprar já calculada no backend
            const quantidadeParaComprar = item.quantidadeParaComprar || 0;

            return {
              sku: item.sku,
              produto: item.produto,
              status,
              estoqueAtual: item.estoque,
              mediaVendas: item.mediaVendas || 0,
              vendasMensais: Math.ceil((item.mediaVendas || 0) * 30),
              estoqueIdeal: item.estoqueIdeal || 0,
              quantidadeParaComprar: quantidadeParaComprar,
              percentualIdeal: item.percentualIdeal || 0,
              precoCompra: item.precoCompra || 0,
              previsaoEntrega: null // Pode ser preenchido depois
            };
          })
          .filter(Boolean); // Remover itens null

        // Auto-sort por status (Crítico primeiro)
        novasPrevisoes.sort((a, b) => {
          const priorityA = statusPriority[a.status] || 999;
          const priorityB = statusPriority[b.status] || 999;
          return priorityA - priorityB;
        });

        setPrevisoes(novasPrevisoes);
        console.log(`📊 Previsão de Compras atualizada: ${novasPrevisoes.length} itens precisam de atenção (Crítico, Em reposição, Em negociação)`);
      } catch (error) {
        console.error('Erro ao carregar dados do estoque:', error);
      }
    };

    carregarDados();
  }, []);

  const getStatusColor = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'sem estoque') return theme.palette.error.main;
    if (statusLower === 'em reposicao') return theme.palette.warning.main;
    if (statusLower === 'em negociacao') return theme.palette.info.main;
    return theme.palette.text.primary;
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Calcular valor total de reposição necessária
  const valorTotalReposicao = previsoes.reduce((total, item) => {
    return total + (item.quantidadeParaComprar * item.precoCompra);
  }, 0);

  return (
    <Paper 
      elevation={0}
      sx={{ 
        mt: 4, 
        p: 3,
        borderRadius: '12px',
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, #fff8e1 0%, #ffe0b2 100%)`
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-start',
        gap: 3, 
        mb: 3 
      }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <WarningIcon sx={{ color: theme.palette.warning.main }} />
            <Typography variant="h6" component="h2">
              Previsão de Compras
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 5 }}>
            Produtos que precisam de reposição (Crítico, Em reposição, Em negociação)
          </Typography>
        </Box>
        <Box sx={{ 
          textAlign: 'right',
          p: 2,
          bgcolor: '#fff9f0',
          borderRadius: '8px',
          borderLeft: '3px solid #FF9800',
          minWidth: '250px'
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            💰 Investimento Total Estipulado
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#FF9800', mb: 1 }}>
            {formatarMoeda(valorTotalReposicao)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {previsoes.length} itens precisam de atenção
          </Typography>
        </Box>
      </Box>

      {selecionados.size > 0 && (
        <Alert 
          severity="info" 
          sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Box>
            <Typography variant="body2">
              <strong>{selecionados.size}</strong> produto(s) selecionado(s) • <strong>{totalQtd}</strong> unidades • <strong>{formatarMoeda(totalValor)}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              size="small"
              startIcon={<ShoppingCartIcon />}
              onClick={() => setDialogAberto(true)}
            >
              Gerar Pedido Único
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<ClearIcon />}
              onClick={() => setSelecionados(new Set())}
            >
              Limpar
            </Button>
          </Box>
        </Alert>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5' }}>
              <TableCell padding="checkbox" sx={{ width: '50px' }}>
                <Checkbox 
                  checked={selecionados.size === previsoes.length && previsoes.length > 0}
                  indeterminate={selecionados.size > 0 && selecionados.size < previsoes.length}
                  onChange={toggleSelecionarTodos}
                />
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  SKU
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Status
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Estoque Atual
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Vendas/Dia
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Estoque Ideal (3,5m)
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Comprar (un.)
                  </Typography>
                  <Tooltip title="Quantidade a comprar para atingir o estoque ideal de 3,5 meses">
                    <InfoIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    % Ideal
                  </Typography>
                  <Tooltip title="Percentual do estoque em relação ao ideal de 3,5 meses">
                    <InfoIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Valor (R$)
                  </Typography>
                  <Tooltip title="Custo total da compra (quantidade × preço unitário)">
                    <InfoIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Ações
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {previsoes.map((item) => (
              <TableRow 
                key={item.sku}
                sx={{
                  backgroundColor: selecionados.has(item.sku) 
                    ? `${theme.palette.primary.main}15`
                    : statusBgColor[item.status] || 'transparent',
                  '&:hover': {
                    backgroundColor: selecionados.has(item.sku)
                      ? `${theme.palette.primary.main}25`
                      : statusBgColor[item.status] ? `${statusBgColor[item.status]}dd` : theme.palette.action.hover,
                  },
                  transition: 'background-color 0.2s ease'
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox 
                    checked={selecionados.has(item.sku)}
                    onChange={() => toggleSelecao(item.sku)}
                  />
                </TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={item.status}
                    size="small"
                    sx={{ 
                      color: getStatusColor(item.status),
                      bgcolor: `${getStatusColor(item.status)}25`
                    }}
                  />
                </TableCell>
                <TableCell align="center">{item.estoqueAtual}</TableCell>
                <TableCell align="center">
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {Math.ceil(item.mediaVendas)}/dia
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {Math.ceil(item.estoqueIdeal)} un.
                    </Typography>
                    <Tooltip title="Quantidade necessária para 3,5 meses">
                      <InfoIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Typography 
                    sx={{
                      color: item.quantidadeParaComprar > 0 ? theme.palette.error.main : theme.palette.success.main,
                      fontWeight: 700,
                      fontSize: '1.1rem'
                    }}
                  >
                    {item.quantidadeParaComprar > 0 ? item.quantidadeParaComprar : '✓'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography 
                    sx={{
                      color: item.percentualIdeal < 90 ? theme.palette.warning.main : theme.palette.success.main,
                      fontWeight: 600
                    }}
                  >
                    {item.percentualIdeal.toFixed(1)}%
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatarMoeda(item.quantidadeParaComprar * item.precoCompra)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Adicionar ao pedido de compra">
                    <IconButton
                      size="small"
                      onClick={() => onAddToPedido(item)}
                      sx={{ color: theme.palette.primary.main }}
                    >
                      <AddShoppingCartIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de Confirmação do Pedido Consolidado */}
      <Dialog open={dialogAberto} onClose={() => setDialogAberto(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingCartIcon />
            Gerar Pedido Consolidado
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Você está prestes a criar um pedido único consolidando todos os itens selecionados.
            </Typography>
            
            <Paper sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Resumo do Pedido:
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Produtos selecionados:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{itensSelecionados.length}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total de unidades:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{totalQtd}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Valor total:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                  {formatarMoeda(totalValor)}
                </Typography>
              </Box>
            </Paper>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Os itens serão adicionados ao pedido de compra. Você poderá revisar antes de enviar.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAberto(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={gerarPedidoConsolidado} 
            variant="contained"
            startIcon={<CheckIcon />}
          >
            Confirmar e Gerar Pedido
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
} 