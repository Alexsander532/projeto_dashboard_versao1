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
  ClickAwayListener,
  TablePagination
} from '@mui/material';
import {
  Edit as EditIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  FilterList as FilterListIcon,
  VisibilityOff as VisibilityOffIcon,
  Visibility as VisibilityIcon,
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [hiddenSkus, setHiddenSkus] = useState([]);
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
          valorLiquidoTotal: Number(produto.precoCompra) * Number(produto.estoque) || 0,
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

  // Função de atualização de quantidade removida

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
        {value}
      </Typography>
    );
  }

  // Filtra e ordena os produtos para exibição
  const filteredProdutos = produtos
    .filter(produto => {
      // Filtro de busca
      const matchesSearch = produto.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (produto.produto && produto.produto.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtro de status
      const matchesStatus = filters.status === 'todos' || 
                          produto.status.toLowerCase() === filters.status.toLowerCase();
      
      // Filtro de previsão
      let matchesPrevisao = true;
      if (filters.previsao === 'critico') {
        matchesPrevisao = produto.previsaoDias <= 15;
      } else if (filters.previsao === 'baixo') {
        matchesPrevisao = produto.previsaoDias > 15 && produto.previsaoDias <= 30;
      } else if (filters.previsao === 'bom') {
        matchesPrevisao = produto.previsaoDias > 30;
      }
      
      // Filtro de média de vendas
      let matchesMedia = true;
      if (filters.mediaVendas === 'alta') {
        matchesMedia = produto.mediaVendas >= 1;
      } else if (filters.mediaVendas === 'baixa') {
        matchesMedia = produto.mediaVendas < 1 && produto.mediaVendas > 0;
      } else if (filters.mediaVendas === 'zero') {
        matchesMedia = produto.mediaVendas === 0;
      }
      
      return matchesSearch && matchesStatus && matchesPrevisao && matchesMedia;
    })
    .sort((a, b) => {
      // Primeiro ordena por visibilidade (itens escondidos vão para o final)
      const aHidden = hiddenSkus.includes(a.sku);
      const bHidden = hiddenSkus.includes(b.sku);
      
      if (aHidden && !bHidden) return 1;
      if (!aHidden && bHidden) return -1;
      
      // Se ambos estão escondidos ou ambos estão visíveis, usa a ordenação normal
      if (order === 'asc') {
        return a[orderBy] < b[orderBy] ? -1 : 1;
      } else {
        return a[orderBy] > b[orderBy] ? -1 : 1;
      }
    });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Função para alternar a visibilidade de um SKU
  const toggleSkuVisibility = (sku) => {
    setHiddenSkus(prev => {
      if (prev.includes(sku)) {
        return prev.filter(item => item !== sku);
      } else {
        return [...prev, sku];
      }
    });
  };

  const handleEdit = (produto) => {
    setEditingProduto({...produto}); // Cria uma cópia do produto
  };

  const handleSaveEdit = async (produtoEditado) => {
    try {
      await atualizarEstoque(produtoEditado.sku, produtoEditado);
      const dadosEstoque = await fetchEstoque(); // Recarrega os dados após atualização
      setProdutos(dadosEstoque);
      setEditingProduto(null);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
    }
  };

  const columns = [
    { id: 'acoes', label: 'Ações', minWidth: 120 },
    { id: 'sku', label: 'SKU', minWidth: 100 },
    { id: 'estoque', label: 'Estoque', minWidth: 150 },
    { id: 'precoCompra', label: 'Preço Compra', minWidth: 120 },
    { id: 'valorLiquidoTotal', label: 'Valor Líquido Total', minWidth: 120 },
    { id: 'status', label: 'Status', minWidth: 120 },
    { id: 'vendasQuinzenais', label: 'Vendas Quinzenais', minWidth: 120 },
    { id: 'previsaoDias', label: 'Previsão', minWidth: 100 },
    { id: 'ultimaVenda', label: 'Última Venda', minWidth: 120 }
  ];

  return (
    <Box sx={{ width: '100%' }}>
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
                {filteredProdutos
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((produto) => {
                    const isHidden = hiddenSkus.includes(produto.sku);
                    return (
                      <TableRow
                        hover
                        key={produto.sku}
                        sx={{
                          '&:nth-of-type(odd)': {
                            backgroundColor: theme.palette.mode === 'dark' ? 
                              alpha(theme.palette.common.white, 0.05) : 
                              alpha(theme.palette.common.black, 0.02),
                          },
                          opacity: isHidden ? 0.5 : 1,
                          filter: isHidden ? 'grayscale(50%)' : 'none',
                          transition: 'opacity 0.3s, filter 0.3s',
                        }}
                      >
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(produto)}
                              sx={{ 
                                '&:hover': {
                                  color: theme.palette.primary.main,
                                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <Tooltip title={hiddenSkus.includes(produto.sku) ? "Mostrar SKU" : "Esconder SKU"}>
                              <IconButton
                                size="small"
                                onClick={() => toggleSkuVisibility(produto.sku)}
                                sx={{ 
                                  color: hiddenSkus.includes(produto.sku) ? theme.palette.success.main : theme.palette.text.secondary,
                                  '&:hover': {
                                    bgcolor: alpha(hiddenSkus.includes(produto.sku) ? theme.palette.success.main : theme.palette.text.secondary, 0.1)
                                  }
                                }}
                              >
                                {hiddenSkus.includes(produto.sku) ? 
                                  <VisibilityIcon fontSize="small" /> : 
                                  <VisibilityOffIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{produto.sku}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            width: '100%',
                            gap: 1 
                          }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              width: '100%',
                              maxWidth: 200
                            }}>
                              <Typography
                                sx={{
                                  width: '80px',
                                  textAlign: 'center',
                                  py: 1,
                                  fontSize: '1rem',
                                  fontWeight: 'medium'
                                }}
                              >
                                {produto.estoque}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Min: {produto.minimo} | Max: {Math.ceil(produto.minimo * 1.5)}
                            </Typography>
                            <Box sx={{ width: '100%', maxWidth: 200 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min((produto.estoque / (produto.minimo * 1.5)) * 100, 100)}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: alpha(theme.palette.grey[200], 0.5),
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    bgcolor: getBarColor(produto.estoque, produto.minimo),
                                    transition: 'all 0.3s'
                                  }
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <EditableCell
                            produto={produto}
                            field="precoCompra"
                            value={produto.precoCompra}
                            type="number"
                          />
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
                            {produto.vendasQuinzenais ? produto.vendasQuinzenais : '0'} un.
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
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Paginação */}
          <TablePagination
            rowsPerPageOptions={[10, 15, 20]}
            component="div"
            count={filteredProdutos.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />

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