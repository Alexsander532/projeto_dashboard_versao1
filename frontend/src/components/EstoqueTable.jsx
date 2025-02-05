import React, { useState, useEffect, useCallback } from 'react';
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
  useTheme
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

export default function EstoqueTable({ onMetricasUpdate }) {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState({ sku: null, field: null });
  const [tempValue, setTempValue] = useState();
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState([]);

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
      giroMedio: dadosEstoque.length > 0 ? 
        +(dadosEstoque.reduce((acc, item) => acc + (Number(item.mediaVendas) || 0), 0) / dadosEstoque.length).toFixed(1) : 
        0
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
        
        // Processa os dados antes de atualizar o estado
        const dadosProcessados = dadosEstoque.map(produto => ({
          ...produto,
          estoque: Number(produto.estoque) || 0,
          minimo: Number(produto.minimo) || 0,
          precoCompra: Number(produto.precoCompra) || 0,
          valorLiquidoMedio: Number(produto.valorLiquidoMedio) || 0,
          valorLiquidoTotal: calcularValorLiquidoTotal(
            produto.estoque, 
            produto.valorLiquidoMedio
          ),
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
      await atualizarQuantidade(sku, delta);
      const dadosAtualizados = await fetchEstoque();
      setProdutos(dadosAtualizados);
      atualizarMetricas(dadosAtualizados);
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
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
      case 'Sem Estoque': return '#f44336'; // Vermelho
      case 'Em reposição': return '#ff9800'; // Laranja
      case 'Em negociação': return '#9c27b0'; // Roxo
      case 'Em estoque': return '#4caf50'; // Verde
      case 'Estoque alto': return '#2196f3'; // Azul
      default: return '#757575'; // Cinza
    }
  };

  const getBarColor = (estoque, mediaVendas, minimo) => {
    const estoqueAtual = Number(estoque) || 0;
    const media = Number(mediaVendas) || 0;
    const minimoCalculado = calcularMinimo(media);
    const minimoNegociacao = calcularMinimoNegociacao(media);

    if (estoqueAtual === 0) return '#f44336';
    if (estoqueAtual < minimoCalculado) return '#ff9800';
    if (estoqueAtual < minimoNegociacao) return '#9c27b0';
    if (estoqueAtual <= minimoCalculado * 1.5) return '#4caf50';
    return '#2196f3';
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
    }).format(valor);
  };

  const getCorProgresso = (progresso) => {
    if (progresso <= 30) return theme.palette.error.main;
    if (progresso <= 70) return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  // Componente da barra de progresso
  const ProgressBar = ({ estoque, minimo, maximo }) => {
    const progresso = (estoque / maximo) * 100;

    return (
      <Box sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {estoque} un
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Min: {minimo} | Max: {maximo}
          </Typography>
        </Box>
        <Box sx={{ position: 'relative', height: 8 }}>
          <LinearProgress
            variant="determinate"
            value={progresso}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: theme.palette.success.main
              }
            }}
          />
          <Box sx={{ 
            position: 'absolute',
            bottom: -20,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            px: 0.5,
            fontSize: '0.65rem'
          }}>
            <Typography variant="caption" sx={{ color: 'error.main', fontSize: 'inherit' }}>
              Sem<br/>estoque
            </Typography>
            <Typography variant="caption" sx={{ color: 'warning.main', fontSize: 'inherit' }}>
              Em<br/>reposição
            </Typography>
            <Typography variant="caption" sx={{ color: '#FFB74D', fontSize: 'inherit' }}>
              Em<br/>negociação
            </Typography>
            <Typography variant="caption" sx={{ color: 'success.light', fontSize: 'inherit' }}>
              Em<br/>estoque
            </Typography>
            <Typography variant="caption" sx={{ color: 'success.dark', fontSize: 'inherit' }}>
              Estoque<br/>alto
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const CustomTableRow = ({ produto, onQuantityChange }) => {
    const handleQuantityChange = async (delta) => {
      const novaQuantidade = produto.estoque + delta;
      if (novaQuantidade >= 0) {
        await onQuantityChange(produto.sku, delta);
      }
    };

    return (
      <TableRow hover>
        <TableCell>{produto.sku}</TableCell>
        <TableCell>{produto.produto}</TableCell>
        <TableCell sx={{ minWidth: 300, pb: 4 }}>
          <Box>
            <ProgressBar 
              estoque={produto.estoque} 
              minimo={produto.minimo} 
              maximo={produto.minimo * 1.5} 
            />
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
              <IconButton 
                size="small" 
                onClick={() => handleQuantityChange(-1)}
                disabled={produto.estoque <= 0}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography>{produto.estoque}</Typography>
              <IconButton 
                size="small"
                onClick={() => handleQuantityChange(1)}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          {formatarValor(produto.precoCompra)}
        </TableCell>
        <TableCell>
          <Box>
            <Typography>
              {formatarValor(produto.valorLiquidoTotal)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Média: {formatarValor(produto.valorLiquidoMedio)}/un
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={produto.status}
            color={
              produto.status === 'Sem Estoque' ? 'error' :
              produto.status === 'Em reposição' ? 'warning' :
              produto.status === 'Em negociação' ? 'warning' :
              'success'
            }
            sx={{ 
              bgcolor: produto.status === 'Em negociação' ? '#FFB74D' : undefined,
              minWidth: 110
            }}
          />
        </TableCell>
        <TableCell>
          <Box>
            <Typography>
              {produto.mediaVendas.toFixed(1)} un/dia
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total: {produto.totalVendas} un
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Typography
            color={
              produto.previsaoDias <= 15 ? 'error.main' :
              produto.previsaoDias <= 30 ? 'warning.main' :
              'success.main'
            }
          >
            {produto.previsaoDias} dias
          </Typography>
        </TableCell>
        <TableCell>
          {produto.ultimaVenda ? 
            new Date(produto.ultimaVenda).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit'
            }) : 
            '-'
          }
        </TableCell>
        <TableCell>
          <IconButton size="small">
            <EditIcon fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  };

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
                  <TableCell>SKU</TableCell>
                  <TableCell>Produto</TableCell>
                  <TableCell sx={{ minWidth: 300 }}>Estoque</TableCell>
                  <TableCell>Preço Compra</TableCell>
                  <TableCell>Valor Líquido Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Média Vendas</TableCell>
                  <TableCell>Previsão</TableCell>
                  <TableCell>Última Venda</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProdutos.map((produto) => (
                  <CustomTableRow 
                    key={produto.sku} 
                    produto={produto} 
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}