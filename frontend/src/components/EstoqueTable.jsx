import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  IconButton,
  TextField,
  Typography,
  Chip,
  LinearProgress,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Slider,
  Button,
  CircularProgress,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  ClickAwayListener
} from '@mui/material';
import {
  Edit as EditIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { fetchEstoque, atualizarEstoque, atualizarQuantidade } from '../services/estoqueService';
import EditProdutoDialog from './EditProdutoDialog';

export default function EstoqueTable({ onMetricasUpdate }) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState({ sku: null, field: null });
  const [tempValue, setTempValue] = useState();
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState([]);
  const [editingProduto, setEditingProduto] = useState(null);

  const calcularMediaVendas = (vendasDiarias) => {
    if (!vendasDiarias || !Array.isArray(vendasDiarias)) return 0;
    if (vendasDiarias.length === 0) return 0;
    const total = vendasDiarias.reduce((sum, vendas) => sum + (Number(vendas) || 0), 0);
    return Math.round(total / vendasDiarias.length);
  };

  const atualizarMetricas = useCallback((dadosEstoque) => {
    const novasMetricas = {
      totalEstoque: dadosEstoque.reduce((acc, item) => acc + (Number(item.estoque) || 0), 0),
      valorTotal: dadosEstoque.reduce((acc, item) => acc + ((Number(item.estoque) || 0) * (Number(item.valorLiquidoMedio) || 0)), 0),
      estoqueCritico: dadosEstoque.filter(item => item.status === 'Em reposição').length,
    };
    onMetricasUpdate(novasMetricas);
  }, [onMetricasUpdate]);

  const calcularStatus = (estoque, minimo) => {
    if (estoque === 0) return 'Sem Estoque';
    if (estoque < minimo) return 'Em reposição';
    if (estoque < minimo * 1.2) return 'Em negociação';
    if (estoque <= minimo * 1.5) return 'Em estoque';
    return 'Estoque alto';
  };

  const calcularValorLiquidoTotal = (estoque, valorLiquido) => {
    const qtd = Number(estoque) || 0;
    const valor = Number(valorLiquido) || 0;
    return qtd * valor;
  };

  const calcularPrevisao = (estoque, mediaVendas) => {
    const qtd = Number(estoque) || 0;
    const media = Number(mediaVendas) || 1; // Evita divisão por zero
    return Math.ceil(qtd / media);
  };

  // Atualiza os dados quando recebidos do backend
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const dadosEstoque = await fetchEstoque();
        
        const dadosProcessados = dadosEstoque.map(produto => ({
          ...produto,
          estoque: Number(produto.estoque) || 0,
          minimo: Number(produto.minimo) || 0,
          precoCompra: Number(produto.precoCompra) || 0,
          valorLiquidoMedio: Number(produto.valorLiquidoMedio) || 0,
          valorLiquidoTotal: Number(produto.valorLiquidoTotal) || 0,
          mediaVendas: Number(produto.mediaVendas) || 0,
          totalVendas: Number(produto.totalVendas) || 0,
          status: calcularStatus(
            Number(produto.estoque), 
            Number(produto.minimo)
          ),
          previsaoDias: calcularPrevisao(
            produto.estoque, 
            produto.mediaVendas
          )
        }));

        setProdutos(dadosProcessados);
        atualizarMetricas(dadosProcessados);
      } catch (error) {
        console.error('Erro ao carregar dados do estoque:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const [orderBy, setOrderBy] = useState('estoque');
  const [order, setOrder] = useState('desc');
  const [filters, setFilters] = useState({
    status: 'todos',
    previsao: 'todos',
    mediaVendas: 'todos',
    showFilters: false,
  });
  const [metricas, setMetricas] = useState({
    totalEstoque: 0,
    valorTotal: 0,
    estoqueCritico: 0,
    giroMedio: 0
  });

  // Função para calcular métricas
  const calcularMetricas = (produtosArray) => {
    const novasMetricas = produtosArray.reduce((acc, produto) => {
      // Total em estoque
      acc.totalEstoque += produto.estoque;
      
      // Valor total em estoque
      acc.valorTotal += produto.estoque * produto.valorLiquidoMedio;
      
      // Estoque crítico (produtos em reposição)
      const mediaVendas = calcularMediaVendas(produto.vendasDiarias);
      const status = calcularStatus(produto.estoque, produto.minimo);
      if (status === 'Em reposição') {
        acc.estoqueCritico += 1;
      }
      
      // Giro médio (média das médias de vendas)
      acc.giroMedio += mediaVendas;
      
      return acc;
    }, {
      totalEstoque: 0,
      valorTotal: 0,
      estoqueCritico: 0,
      giroMedio: 0
    });

    // Calcula a média do giro
    novasMetricas.giroMedio = +(novasMetricas.giroMedio / produtosArray.length).toFixed(1);

    setMetricas(novasMetricas);
  };

  // Atualiza métricas quando produtos mudam
  useEffect(() => {
    const novasMetricas = produtos.reduce((acc, produto) => {
      // Total em estoque
      acc.totalEstoque += produto.estoque;
      
      // Valor total em estoque
      acc.valorTotal += produto.estoque * produto.valorLiquidoMedio;
      
      // Estoque crítico (produtos em reposição)
      const mediaVendas = calcularMediaVendas(produto.vendasDiarias);
      const status = calcularStatus(produto.estoque, produto.minimo);
      if (status === 'Em reposição') {
        acc.estoqueCritico += 1;
      }
      
      // Giro médio (média das médias de vendas)
      acc.giroMedio += mediaVendas;
      
      return acc;
    }, {
      totalEstoque: 0,
      valorTotal: 0,
      estoqueCritico: 0,
      giroMedio: 0
    });

    // Calcula a média do giro
    novasMetricas.giroMedio = +(novasMetricas.giroMedio / produtos.length).toFixed(1);

    // Envia as métricas atualizadas para o componente pai
    onMetricasUpdate(novasMetricas);
  }, [produtos, onMetricasUpdate]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => (b[orderBy] < a[orderBy] ? -1 : 1)
      : (a, b) => (a[orderBy] < b[orderBy] ? -1 : 1);
  };

  // Componente para cabeçalho ordenável
  const SortableTableCell = ({ label, property, align = 'center' }) => (
    <TableCell align={align}>
      <TableSortLabel
        active={orderBy === property}
        direction={orderBy === property ? order : 'asc'}
        onClick={() => handleRequestSort(property)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  // Componente de Filtros
  const FilterSection = () => (
    <Box sx={{ mb: 3, backgroundColor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Filtros Avançados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Use os filtros abaixo para encontrar produtos específicos baseado em diferentes critérios
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ p: 2 }}>
        {/* Status do Estoque */}
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Status do Estoque
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                sx={{ mb: 1 }}
              >
                <MenuItem value="todos">Todos os Status</MenuItem>
                <MenuItem value="Sem Estoque">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', mr: 1 }} />
                    Sem Estoque
                  </Box>
                </MenuItem>
                <MenuItem value="Baixo Estoque">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', mr: 1 }} />
                    Baixo Estoque
                  </Box>
                </MenuItem>
                <MenuItem value="Em Estoque">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', mr: 1 }} />
                    Em Estoque
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              Filtre produtos por seu status atual de estoque
            </Typography>
          </Box>
        </Grid>

        {/* Previsão de Estoque */}
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Previsão de Estoque
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.previsao}
                onChange={(e) => handleFilterChange('previsao', e.target.value)}
                sx={{ mb: 1 }}
              >
                <MenuItem value="todos">Todas as Previsões</MenuItem>
                <MenuItem value="critico">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', mr: 1 }} />
                    Crítico (menos de 7 dias)
                  </Box>
                </MenuItem>
                <MenuItem value="alerta">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', mr: 1 }} />
                    Alerta (7-15 dias)
                  </Box>
                </MenuItem>
                <MenuItem value="adequado">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', mr: 1 }} />
                    Adequado (15-30 dias)
                  </Box>
                </MenuItem>
                <MenuItem value="excesso">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main', mr: 1 }} />
                    Excesso (mais de 30 dias)
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              Filtre com base na previsão de duração do estoque atual
            </Typography>
          </Box>
        </Grid>

        {/* Média de Vendas */}
        <Grid item xs={12} md={4}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
              Performance de Vendas
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={filters.mediaVendas}
                onChange={(e) => handleFilterChange('mediaVendas', e.target.value)}
                sx={{ mb: 1 }}
              >
                <MenuItem value="todos">Todas as Médias</MenuItem>
                <MenuItem value="alta">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', mr: 1 }} />
                    Alta Demanda (8+ un/dia)
                  </Box>
                </MenuItem>
                <MenuItem value="media">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'info.main', mr: 1 }} />
                    Média Demanda (4-7 un/dia)
                  </Box>
                </MenuItem>
                <MenuItem value="baixa">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', mr: 1 }} />
                    Baixa Demanda (0-3 un/dia)
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              Filtre produtos por sua média diária de vendas
            </Typography>
          </Box>
        </Grid>

        {/* Botões de Ação */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              onClick={() => setFilters({
                status: 'todos',
                previsao: 'todos',
                mediaVendas: 'todos',
                showFilters: true,
              })}
            >
              Limpar Filtros
            </Button>
            <Button
              variant="contained"
              onClick={() => handleFilterChange('showFilters', false)}
            >
              Aplicar Filtros
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const calcularMinimo = (mediaVendas) => {
    const media = Number(mediaVendas) || 0;
    return Math.ceil(media * 60); // Estoque necessário para 60 dias
  };

  const calcularMinimoNegociacao = (mediaVendas) => {
    const media = Number(mediaVendas) || 0;
    return Math.ceil(media * 70); // Estoque necessário para 70 dias
  };

  const handleQuantityChange = async (sku, delta) => {
    try {
      // Atualiza o estado local imediatamente
      setProdutos(produtos.map(p => {
        if (p.sku === sku) {
          return {
            ...p,
            estoque: p.estoque + delta
          };
        }
        return p;
      }));

      // Faz a requisição para o backend
      await atualizarQuantidade(sku, delta);
      
      // Atualiza as métricas
      const metricas = {
        totalEstoque: produtos.reduce((acc, p) => acc + (p.sku === sku ? p.estoque + delta : p.estoque), 0),
        valorTotal: produtos.reduce((acc, p) => acc + ((p.sku === sku ? p.estoque + delta : p.estoque) * p.valorLiquidoMedio), 0),
        estoqueCritico: produtos.filter(p => p.estoque < p.minimo).length
      };
      onMetricasUpdate(metricas);

    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      // Em caso de erro, reverte a alteração local
      setProdutos(produtos.map(p => {
        if (p.sku === sku) {
          return {
            ...p,
            estoque: p.estoque - delta
          };
        }
        return p;
      }));
    }
  };

  const handleCellEdit = async (sku, field, value) => {
    try {
      const produto = produtos.find(p => p.sku === sku);
      if (produto) {
        const novoProduto = {
          ...produto,
          [field]: value
        };
        await atualizarEstoque(sku, novoProduto);
        
        // Atualiza o estado local após confirmação do servidor
        const dadosEstoque = await fetchEstoque();
        setProdutos(dadosEstoque);
        atualizarMetricas(dadosEstoque);
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
    }
    setEditingCell({ sku: null, field: null });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Sem Estoque': return 'error';
      case 'Em reposição': return 'warning';
      case 'Em negociação': return 'warning';
      default: return 'success';
    }
  };

  const getBarColor = (quantidade, minimo) => {
    const max = Math.ceil(minimo * 1.5); // Máximo é 150% do mínimo
    const porcentagem = (quantidade / max) * 100;

    if (quantidade === 0) return theme.palette.error.main; // vermelho
    if (quantidade < minimo) return theme.palette.warning.main; // laranja
    if (quantidade < minimo * 1.2) return theme.palette.secondary.main; // roxo
    if (quantidade <= minimo * 1.5) return theme.palette.success.main; // verde
    return theme.palette.info.main; // azul
  };

  function EditableCell({ produto, field, value, type = 'text' }) {
    const [tempValue, setTempValue] = useState(value);
    const isEditing = editingCell.sku === produto.sku && editingCell.field === field;

    useEffect(() => {
      setTempValue(value);
    }, [value]);

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleCellEdit(produto.sku, field, tempValue);
      } else if (e.key === 'Escape') {
        setEditingCell({ sku: null, field: null });
        setTempValue(value);
      }
    };

    if (isEditing) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <TextField
            size="small"
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
            sx={{ 
              width: type === 'number' ? 100 : 'auto',
              '& .MuiInputBase-input': {
                textAlign: 'center',
                py: 0.5,
                px: 1
              }
            }}
          />
          <IconButton 
            size="small" 
            onClick={() => handleCellEdit(produto.sku, field, tempValue)}
            sx={{ color: 'success.main' }}
          >
            <CheckIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => {
              setEditingCell({ sku: null, field: null });
              setTempValue(value);
            }}
            sx={{ color: 'error.main' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    }

    return (
      <Typography
        variant="body2"
        onClick={() => {
          setEditingCell({ sku: produto.sku, field: field });
          setTempValue(value);
        }}
        sx={{ 
          cursor: 'pointer', 
          '&:hover': { 
            textDecoration: 'underline',
            color: 'primary.main'
          }
        }}
      >
        {type === 'number' && typeof value === 'number' ? 
          field.includes('preco') || field.includes('valor') ? 
            `R$ ${value.toFixed(2)}` : 
            value.toLocaleString('pt-BR') : 
          value}
      </Typography>
    );
  }

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        produto.produto.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'todos' || produto.status === filters.status;
    
    const mediaVendas = calcularMediaVendas(produto.vendasDiarias);
    const matchesMediaVendas = filters.mediaVendas === 'todos' ||
      (filters.mediaVendas === 'baixa' && mediaVendas <= 3) ||
      (filters.mediaVendas === 'media' && mediaVendas > 3 && mediaVendas <= 7) ||
      (filters.mediaVendas === 'alta' && mediaVendas > 7);

    const previsaoDias = produto.estoque / mediaVendas;
    const matchesPrevisao = filters.previsao === 'todos' ||
      (filters.previsao === 'critico' && previsaoDias < 7) ||
      (filters.previsao === 'alerta' && previsaoDias >= 7 && previsaoDias < 15) ||
      (filters.previsao === 'adequado' && previsaoDias >= 15 && previsaoDias < 30) ||
      (filters.previsao === 'excesso' && previsaoDias >= 30);

    return matchesSearch && matchesStatus && matchesMediaVendas && matchesPrevisao;
  });

  const calcularProgressoEstoque = (estoque, minimo) => {
    if (minimo === 0) return 0;
    return Math.min((estoque / minimo) * 100, 100);
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const getCorProgresso = (progresso) => {
    if (progresso <= 30) return theme.palette.error.main;
    if (progresso <= 70) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  // Componente da barra de progresso
  const ProgressBar = ({ produto, onQuantityChange }) => {
    if (!produto) return null;
    const [editingQuantity, setEditingQuantity] = useState(false);
    const [quantidade, setQuantidade] = useState(produto.estoque);
    const theme = useTheme();

    // Atualiza o estado local quando o produto muda
    useEffect(() => {
      setQuantidade(produto.estoque);
    }, [produto.estoque]);

    // Função para incrementar estoque
    const handleIncrement = () => {
      const newValue = quantidade + 1;
      setQuantidade(newValue);
      onQuantityChange(produto.sku, 1);
    };

    // Função para decrementar estoque
    const handleDecrement = () => {
      if (quantidade > 0) {
        const newValue = quantidade - 1;
        setQuantidade(newValue);
        onQuantityChange(produto.sku, -1);
      }
    };

    // Função para edição manual
    const handleManualEdit = (value) => {
      const newValue = parseInt(value);
      if (!isNaN(newValue) && newValue >= 0) {
        const delta = newValue - quantidade;
        setQuantidade(newValue);
        onQuantityChange(produto.sku, delta);
        setEditingQuantity(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleManualEdit(e.target.value);
      }
      if (e.key === 'Escape') {
        setQuantidade(produto.estoque);
        setEditingQuantity(false);
      }
    };

  return (
    <Box sx={{ width: '100%' }}>
        {/* Controles de Estoque */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 1,
          mb: 2
        }}>
          {/* Botão de Diminuir */}
          <IconButton
            onClick={handleDecrement}
            disabled={quantidade <= 0}
            sx={{
              width: 32,
              height: 32,
              border: `1px solid ${theme.palette.divider}`,
              '&:hover': {
                bgcolor: theme.palette.action.hover,
              },
              '&:disabled': {
                borderColor: theme.palette.action.disabled,
              }
            }}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>

          {/* Campo de Quantidade */}
          <Box sx={{ position: 'relative', minWidth: 60 }}>
            {editingQuantity ? (
                <TextField
                autoFocus
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={(e) => handleManualEdit(e.target.value)}
                  size="small"
                  sx={{
                  width: '80px',
                  '& input': {
                    textAlign: 'center',
                    padding: '4px',
                    fontSize: '1rem',
                    fontWeight: 'medium',
                  }
                }}
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            ) : (
              <Typography
                onClick={() => setEditingQuantity(true)}
                sx={{
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'medium',
                  textAlign: 'center',
                  minWidth: '60px',
                  padding: '4px 8px',
                  border: `1px solid transparent`,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                    border: `1px solid ${theme.palette.primary.main}`,
                  }
                }}
              >
                {quantidade}
              </Typography>
            )}
          </Box>

          {/* Botão de Aumentar */}
          <IconButton
            onClick={handleIncrement}
            sx={{
              width: 32,
              height: 32,
              border: `1px solid ${theme.palette.divider}`,
                '&:hover': {
                bgcolor: theme.palette.action.hover,
              }
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>

          {/* Informação Min/Max */}
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ ml: 2 }}
          >
            Min: {produto.minimo} | Max: {Math.ceil(produto.minimo * 1.5)}
          </Typography>
        </Box>

        {/* Barra de Progresso */}
        <Box sx={{ width: '100%', maxWidth: 200 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min((quantidade / (produto.minimo * 1.5)) * 100, 100)}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.grey[200], 0.5),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: getBarColor(quantidade, produto.minimo),
                transition: 'all 0.3s'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
            Min: {produto.minimo} | Atual: {quantidade} | Max: {Math.ceil(produto.minimo * 1.5)}
          </Typography>
        </Box>
      </Box>
    );
  };

  const CustomTableRow = ({ produto, onQuantityChange, onEdit }) => {
    const [quantidade, setQuantidade] = useState(produto.estoque);
    const [editingQuantity, setEditingQuantity] = useState(false);
    const theme = useTheme();

    // Atualiza o estado local quando o produto muda
    useEffect(() => {
      setQuantidade(produto.estoque);
    }, [produto.estoque]);

    const handleQuantityChange = async (delta) => {
      try {
        const novaQuantidade = quantidade + delta;
        if (novaQuantidade >= 0) {
          await onQuantityChange(produto.sku, delta);
          setQuantidade(novaQuantidade);
        }
      } catch (error) {
        console.error('Erro ao atualizar quantidade:', error);
      }
    };

    const handleManualEdit = async (value) => {
      const newValue = parseInt(value);
      if (!isNaN(newValue) && newValue >= 0) {
        const delta = newValue - quantidade;
        try {
          await onQuantityChange(produto.sku, delta);
          setQuantidade(newValue);
        } catch (error) {
          console.error('Erro ao atualizar quantidade:', error);
        }
      }
      setEditingQuantity(false);
    };
                  
                  return (
      <TableRow
        hover
        sx={{
          '&:nth-of-type(odd)': {
            backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.common.black, 0.02),
          },
        }}
      >
        <TableCell align="center">{produto.sku}</TableCell>
        <TableCell align="center">{produto.produto}</TableCell>
                      <TableCell align="center">
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            width: '100%',
            gap: 1 
          }}>
            {/* Controles de Estoque */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: 200
            }}>
                            <IconButton
                onClick={() => handleQuantityChange(-1)}
                disabled={quantidade <= 0}
                              size="small"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>

              {editingQuantity ? (
                <TextField
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleManualEdit(e.target.value);
                    if (e.key === 'Escape') {
                      setQuantidade(produto.estoque);
                      setEditingQuantity(false);
                    }
                  }}
                  onBlur={(e) => handleManualEdit(e.target.value)}
                  size="small"
                  autoFocus
                  sx={{ 
                    width: '80px',
                    '& input': { 
                      textAlign: 'center',
                      fontSize: '1rem',
                      fontWeight: 'medium'
                    }
                  }}
                  inputProps={{ min: 0 }}
                />
              ) : (
                <Typography
                  onClick={() => setEditingQuantity(true)}
                  sx={{
                    width: '80px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    py: 1,
                    fontSize: '1rem',
                    fontWeight: 'medium',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      borderRadius: 1
                    }
                  }}
                >
                  {quantidade}
                            </Typography>
              )}

                            <IconButton
                onClick={() => handleQuantityChange(1)}
                              size="small"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>

            {/* Limites de Estoque */}
            <Typography variant="caption" color="text.secondary">
              Min: {produto.minimo} | Max: {Math.ceil(produto.minimo * 1.5)}
            </Typography>

            {/* Barra de Progresso */}
            <Box sx={{ width: '100%', maxWidth: 200 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min((quantidade / (produto.minimo * 1.5)) * 100, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.grey[200], 0.5),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    bgcolor: getBarColor(quantidade, produto.minimo),
                    transition: 'all 0.3s'
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
                Min: {produto.minimo} | Atual: {quantidade} | Max: {Math.ceil(produto.minimo * 1.5)}
              </Typography>
            </Box>

            {/* Legenda da Barra */}
                            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 0.5, 
              justifyContent: 'center',
              mt: 0.5 
            }}>
              <Typography variant="caption" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                fontSize: '0.65rem' 
              }}>
                              <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: theme.palette.error.main 
                }} />
                Sem Estoque
              </Typography>
              <Typography variant="caption" sx={{ 
                                display: 'flex',
                alignItems: 'center', 
                gap: 0.5,
                fontSize: '0.65rem' 
              }}>
                              <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: theme.palette.warning.main 
                }} />
                Em Reposição
              </Typography>
              <Typography variant="caption" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                fontSize: '0.65rem' 
              }}>
                              <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: theme.palette.secondary.main 
                }} />
                Em Negociação
              </Typography>
              <Typography variant="caption" sx={{ 
                                display: 'flex',
                alignItems: 'center', 
                gap: 0.5,
                fontSize: '0.65rem' 
              }}>
                              <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: theme.palette.success.main 
                }} />
                Em Estoque
              </Typography>
              <Typography variant="caption" sx={{ 
                                display: 'flex',
                alignItems: 'center', 
                gap: 0.5,
                fontSize: '0.65rem' 
              }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: theme.palette.info.main 
                }} />
                Estoque Alto
              </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
          {`R$ ${produto.precoCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </TableCell>
                      <TableCell align="center">
          {`R$ ${produto.valorLiquidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={produto.status}
            color={getStatusColor(produto.status)}
                          size="small"
            sx={{ minWidth: 100 }}
                        />
                      </TableCell>
                      <TableCell align="center">
          <Typography>
            {produto.mediaVendas ? produto.mediaVendas.toFixed(1) : '0'}/dia
                          </Typography>
                      </TableCell>
                      <TableCell align="center">
          <Typography>
            {produto.previsaoDias ? `${produto.previsaoDias} dias` : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                          {produto.ultimaVenda ? new Date(produto.ultimaVenda).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
            onClick={() => onEdit(produto)}
                          sx={{ 
                            '&:hover': {
                              color: theme.palette.primary.main,
                              bgcolor: alpha(theme.palette.primary.main, 0.1)
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
  };

  const getPrevisaoColor = (dias) => {
    if (dias <= 15) return 'error.main';
    if (dias <= 30) return 'warning.main';
    return 'success.main';
  };

  const handleEdit = (produto) => {
    setEditingProduto({...produto}); // Cria uma cópia do produto
  };

  const handleSaveEdit = async (produtoEditado) => {
    try {
      await atualizarEstoque(produtoEditado.sku, produtoEditado);
      await fetchProdutos(); // Recarrega os dados após atualização
      setEditingProduto(null);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const columns = [
    { id: 'sku', label: 'SKU', minWidth: 100 },
    { id: 'produto', label: 'Produto', minWidth: 200 },
    { id: 'estoque', label: 'Estoque', minWidth: 150 },
    { id: 'precoCompra', label: 'Preço Compra', minWidth: 120 },
    { id: 'valorLiquidoTotal', label: 'Valor Líquido Total', minWidth: 120 },
    { id: 'status', label: 'Status', minWidth: 120 },
    { id: 'mediaVendas', label: 'Média Vendas', minWidth: 120 },
    { id: 'previsaoDias', label: 'Previsão', minWidth: 100 },
    { id: 'ultimaVenda', label: 'Última Venda', minWidth: 120 },
    { id: 'acoes', label: 'Ações', minWidth: 80 }
  ];

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={handleSearch}
                  size="small"
                  sx={{
                    backgroundColor: 'background.paper',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'divider',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => handleFilterChange('showFilters', !filters.showFilters)}
                >
                  Filtros
                </Button>
              </Grid>
            </Grid>
          </Box>

          {filters.showFilters && <FilterSection />}

          <TableContainer 
            component={Paper}
            sx={{
              mt: 2,
              overflow: 'auto',
              '& .MuiTable-root': {
                minWidth: 1200,
              }
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align="center"
                      sx={{
                        minWidth: column.minWidth,
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                        fontWeight: 'bold',
                        '& .MuiTableSortLabel-root': {
                          color: 'white',
                          '&:hover': {
                            color: alpha(theme.palette.common.white, 0.7),
                          },
                          '&.Mui-active': {
                            color: 'white',
                            '& .MuiTableSortLabel-icon': {
                              color: 'white',
                            },
                          },
                        },
                      }}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProdutos.map((produto) => (
                  <CustomTableRow 
                    key={produto.sku} 
                    produto={produto}
                    onQuantityChange={handleQuantityChange}
                    onEdit={handleEdit}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <EditProdutoDialog
            open={!!editingProduto}
            onClose={() => setEditingProduto(null)}
            produto={editingProduto}
            onSave={handleSaveEdit}
          />
        </>
      )}
    </Box>
  );
}