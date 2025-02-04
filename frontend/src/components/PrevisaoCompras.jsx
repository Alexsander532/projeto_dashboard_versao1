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
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  AddShoppingCart as AddShoppingCartIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { fetchEstoque } from '../services/estoqueService';

export default function PrevisaoCompras({ onAddToPedido }) {
  const theme = useMuiTheme();
  const [previsoes, setPrevisoes] = useState([]);
  const [checked, setChecked] = useState(() => {
    const saved = localStorage.getItem('previsoes_checked');
    return saved ? JSON.parse(saved) : {};
  });

  // Funções de cálculo do EstoqueTable
  const calcularMediaVendas = (vendasDiarias) => {
    if (!vendasDiarias || vendasDiarias.length === 0) return 0;
    return vendasDiarias.reduce((sum, vendas) => sum + vendas, 0) / vendasDiarias.length;
  };

  const calcularMinimo = (mediaVendas) => {
    return Math.ceil(mediaVendas * 60); // 60 dias de estoque mínimo
  };

  const determinarStatus = (estoque, mediaVendas) => {
    const minimo = calcularMinimo(mediaVendas);
    const minimoNegociacao = Math.ceil(minimo * 1.2); // 20% acima do mínimo

    if (estoque === 0) return 'sem estoque';
    if (estoque < minimo) return 'em reposicao';
    if (estoque < minimoNegociacao) return 'em negociacao';
    if (estoque <= minimo * 1.5) return 'em estoque';
    return 'estoque alto';
  };

  useEffect(() => {
    // Carregar dados do estoque
    const carregarDados = async () => {
      try {
        const dadosEstoque = await fetchEstoque();
        
        // Processar cada item do estoque
        const novasPrevisoes = dadosEstoque
          .map(item => {
            const mediaVendas = calcularMediaVendas(item.vendasDiarias || []);
            const status = determinarStatus(item.estoque, mediaVendas);
            
            // Incluir apenas itens que precisam de reposição
            if (!['em negociacao', 'em reposicao', 'sem estoque'].includes(status)) {
              return null;
            }

            // Calcular previsão para 3,5 meses
            const previsaoCompra = Math.ceil(mediaVendas * 105); // 3,5 meses = 105 dias

            return {
              sku: item.sku,
              produto: item.produto,
              status,
              estoqueAtual: item.estoque,
              vendasMensais: Math.ceil(mediaVendas * 30), // Média diária × 30 dias
              previsaoCompra,
              precoCompra: item.precoCompra || 0
            };
          })
          .filter(Boolean); // Remover itens null

        setPrevisoes(novasPrevisoes);
      } catch (error) {
        console.error('Erro ao carregar dados do estoque:', error);
      }
    };

    carregarDados();
  }, []);

  useEffect(() => {
    localStorage.setItem('previsoes_checked', JSON.stringify(checked));
  }, [checked]);

  const handleToggleCheck = (sku) => {
    setChecked(prev => ({
      ...prev,
      [sku]: !prev[sku]
    }));
  };

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

  return (
    <Paper 
      elevation={0}
      sx={{ 
        mt: 4, 
        p: 3,
        borderRadius: '12px',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 3 
      }}>
        <WarningIcon sx={{ color: theme.palette.warning.main }} />
        <Typography variant="h6" component="h2">
          Previsão de Compras
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {previsoes.length} itens precisam de atenção
        </Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Comprado
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  SKU
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Produto
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
                  Vendas Mensais
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Previsão de Compra
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Valor Total
                </Typography>
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
                  '&:nth-of-type(odd)': {
                    backgroundColor: theme.palette.action.hover,
                  },
                  opacity: checked[item.sku] ? 0.5 : 1
                }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={checked[item.sku] || false}
                    onChange={() => handleToggleCheck(item.sku)}
                  />
                </TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell>{item.produto}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={item.status}
                    size="small"
                    sx={{ 
                      color: getStatusColor(item.status),
                      bgcolor: `${getStatusColor(item.status)}15`
                    }}
                  />
                </TableCell>
                <TableCell align="center">{item.estoqueAtual}</TableCell>
                <TableCell align="center">{item.vendasMensais}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {item.previsaoCompra}
                    <Tooltip title="Quantidade calculada para 3,5 meses de estoque">
                      <InfoIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  {formatarMoeda(item.previsaoCompra * item.precoCompra)}
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
    </Paper>
  );
} 