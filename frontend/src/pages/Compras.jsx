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
  Badge,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse
} from '@mui/material';
import { useSidebar } from '../contexts/SidebarContext';
import {
  Add as AddIcon,
  LocalShipping as LocalShippingIcon,
  Factory as FactoryIcon,
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import Sidebar from '../components/Sidebar';
import CompraForm from '../components/CompraForm';
import PrevisaoCompras from '../components/PrevisaoCompras';
import { buscarPedidos, atualizarStatusPedido, deletarPedido, buscarMetricasFinanceiras } from '../services/comprasService';
import PedidoDetalhesModal from '../components/PedidoDetalhesModal';
import KanbanBoard from '../components/kanban/KanbanBoard';

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
  const { isHovered } = useSidebar();
  const [formOpen, setFormOpen] = useState(false);
  const [produtoParaAdicionar, setProdutoParaAdicionar] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [metricas, setMetricas] = useState({
    totalPedidos: 0,
    totalTransito: 0,
    totalRecebido: 0,
    totalPendente: 0,
    totalGeral: 0
  });
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [pedidoParaDeletar, setPedidoParaDeletar] = useState(null);
  const [deletando, setDeletando] = useState(false);
  const [pedidoParaEditar, setPedidoParaEditar] = useState(null);

  // Estados para filtros e busca
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroFornecedor, setFiltroFornecedor] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estados para modal de detalhes (edição + histórico)
  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [abaInicialModal, setAbaInicialModal] = useState(0);

  // Carregar pedidos ao montar o componente
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);

      console.log('📡 Iniciando carregamento de dados...');
      const [pedidosData, metricasData] = await Promise.all([
        buscarPedidos(),
        buscarMetricasFinanceiras()
      ]);

      console.log('✅ Dados de compras carregados:', pedidosData);
      console.log('✅ Métricas carregadas:', metricasData);

      setPedidos(pedidosData || []);
      setMetricas(metricasData || {
        totalPedidos: 0,
        totalTransito: 0,
        totalRecebido: 0,
        totalPendente: 0,
        totalGeral: 0
      });
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      console.error('❌ Detalhes do erro:', error.message);
      setErro(`Erro ao carregar pedidos: ${error.message || 'Verifique sua conexão.'}`);

      // Inicializar com dados vazios para evitar tela branca
      setPedidos([]);
      setMetricas({
        totalPedidos: 0,
        totalTransito: 0,
        totalRecebido: 0,
        totalPendente: 0,
        totalGeral: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoverPedido = async (pedidoId, novoStatus) => {
    try {
      console.log(`🔄 Movendo pedido ${pedidoId} para status ${novoStatus}`);
      const pedidoAtualizado = await atualizarStatusPedido(pedidoId, novoStatus);

      // Atualizar lista local
      setPedidos(pedidos.map(p => p.id === pedidoId ? pedidoAtualizado : p));

      // Recarregar métricas
      const novasMetricas = await buscarMetricasFinanceiras();
      setMetricas(novasMetricas);

      console.log('✅ Pedido movido com sucesso');
    } catch (error) {
      console.error('❌ Erro ao mover pedido:', error);
      setErro('Erro ao atualizar status do pedido');
    }
  };

  const handleSubmitPedido = async (novoPedido) => {
    // Recarregar dados após criar novo pedido
    await carregarDados();
  };

  const handleDeletePedido = async () => {
    if (!pedidoParaDeletar) return;

    try {
      setDeletando(true);
      console.log(`🗑️ Deletando pedido ${pedidoParaDeletar.id}`);

      await deletarPedido(pedidoParaDeletar.id);

      // Remover da lista local
      setPedidos(pedidos.filter(p => p.id !== pedidoParaDeletar.id));

      // Recarregar métricas
      const novasMetricas = await buscarMetricasFinanceiras();
      setMetricas(novasMetricas);

      setPedidoParaDeletar(null);
      console.log('✅ Pedido deletado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar pedido:', error);
      setErro('Erro ao deletar pedido');
    } finally {
      setDeletando(false);
    }
  };

  // Função para abrir modal de detalhes na aba de edição
  const handleEditarPedido = (pedido) => {
    setPedidoSelecionado(pedido);
    setAbaInicialModal(0); // Aba de edição
    setDetalhesModalOpen(true);
  };

  // Função para abrir modal de detalhes na aba de histórico
  const handleVerHistorico = (pedido) => {
    setPedidoSelecionado(pedido);
    setAbaInicialModal(1); // Aba de histórico
    setDetalhesModalOpen(true);
  };

  // Função para fechar modal de detalhes
  const handleFecharDetalhesModal = () => {
    setDetalhesModalOpen(false);
    setPedidoSelecionado(null);
  };

  // Função para limpar filtros
  const limparFiltros = () => {
    setBusca('');
    setFiltroStatus('');
    setFiltroFornecedor('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
  };

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter(pedido => {
    // Filtro de busca (ID ou SKU)
    if (busca) {
      const buscaLower = busca.toLowerCase();
      const matchId = pedido.id.toString().includes(busca);
      const matchSku = (pedido.produtos || []).some(p =>
        p.sku.toLowerCase().includes(buscaLower)
      );
      const matchFornecedor = pedido.fornecedor?.toLowerCase().includes(buscaLower);
      if (!matchId && !matchSku && !matchFornecedor) return false;
    }

    // Filtro de status
    if (filtroStatus && pedido.status !== filtroStatus) return false;

    // Filtro de fornecedor
    if (filtroFornecedor && !pedido.fornecedor?.toLowerCase().includes(filtroFornecedor.toLowerCase())) {
      return false;
    }

    // Filtro de data
    if (filtroDataInicio) {
      const dataPedido = new Date(pedido.data_pedido || pedido.dataPedido);
      const dataInicio = new Date(filtroDataInicio);
      if (dataPedido < dataInicio) return false;
    }

    if (filtroDataFim) {
      const dataPedido = new Date(pedido.data_pedido || pedido.dataPedido);
      const dataFim = new Date(filtroDataFim);
      dataFim.setHours(23, 59, 59);
      if (dataPedido > dataFim) return false;
    }

    return true;
  });

  // Obter lista única de fornecedores para o filtro
  const fornecedoresUnicos = [...new Set(pedidos.map(p => p.fornecedor).filter(Boolean))];

  const getProximoStatus = (statusAtual) => {
    const indices = {
      pedido: 'fabricacao',
      fabricacao: 'transito',
      transito: 'alfandega',
      alfandega: 'recebido'
    };
    return indices[statusAtual];
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const pedidoId = parseInt(draggableId);
    const novoStatus = destination.droppableId;

    // Encontrar o pedido atual
    const pedido = pedidos.find(p => p.id === pedidoId);

    // Verificar se houve mudança de status
    if (pedido && pedido.status !== novoStatus) {
      handleMoverPedido(pedidoId, novoStatus);
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Calcular dias em cada etapa para cada pedido
  const calcularDiasEmEtapa = (pedido) => {
    // Se não tem data de criação, retorna 0
    if (!pedido.data_pedido && !pedido.dataPedido) return 0;

    const dataCriacao = new Date(pedido.data_pedido || pedido.dataPedido);
    const hoje = new Date();
    const dias = Math.floor((hoje - dataCriacao) / (1000 * 60 * 60 * 24));
    return dias;
  };

  // Verificar se pedido está atrasado
  const estaAtrasado = (pedido) => {
    if (!pedido.previsao_entrega && !pedido.previsaoEntrega) return false;
    const previsao = new Date(pedido.previsao_entrega || pedido.previsaoEntrega);
    const hoje = new Date();
    return hoje > previsao && pedido.status !== 'recebido';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Sidebar />
        <Box sx={{
          flexGrow: 1,
          p: 3,
          ml: isHovered ? '200px' : '64px',
          transition: 'margin-left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}>
          <CircularProgress />
          <Typography color="text.secondary">Carregando dados de compras...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{
        flexGrow: 1,
        p: 3,
        ml: isHovered ? '200px' : '64px',
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Mostrar erro se houver */}
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro}
            <Button size="small" onClick={carregarDados} sx={{ ml: 2 }}>
              Tentar novamente
            </Button>
          </Alert>
        )}

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
            onClick={() => {
              setPedidoParaEditar(null);
              setProdutoParaAdicionar(null);
              setFormOpen(true);
            }}
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

        {/* Barra de Busca e Filtros */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: '12px' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Campo de Busca */}
            <TextField
              size="small"
              placeholder="Buscar por ID, SKU ou fornecedor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: busca && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setBusca('')}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Botão de Filtros */}
            <Button
              variant={mostrarFiltros ? 'contained' : 'outlined'}
              startIcon={<FilterListIcon />}
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              sx={{ borderRadius: '8px' }}
            >
              Filtros
              {(filtroStatus || filtroFornecedor || filtroDataInicio || filtroDataFim) && (
                <Chip
                  size="small"
                  label={[filtroStatus, filtroFornecedor, filtroDataInicio, filtroDataFim].filter(Boolean).length}
                  sx={{ ml: 1, height: 20 }}
                />
              )}
            </Button>

            {/* Limpar Filtros */}
            {(busca || filtroStatus || filtroFornecedor || filtroDataInicio || filtroDataFim) && (
              <Button
                variant="text"
                startIcon={<ClearIcon />}
                onClick={limparFiltros}
                color="error"
              >
                Limpar
              </Button>
            )}

            {/* Contador de resultados */}
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              {pedidosFiltrados.length} de {pedidos.length} pedidos
            </Typography>
          </Box>

          {/* Filtros Expandidos */}
          <Collapse in={mostrarFiltros}>
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              {/* Filtro de Status */}
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filtroStatus}
                  label="Status"
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="pedido">Pedido Realizado</MenuItem>
                  <MenuItem value="fabricacao">Em Fabricação</MenuItem>
                  <MenuItem value="transito">Em Trânsito</MenuItem>
                  <MenuItem value="alfandega">Em Alfândega</MenuItem>
                  <MenuItem value="recebido">Recebido</MenuItem>
                </Select>
              </FormControl>

              {/* Filtro de Fornecedor */}
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Fornecedor</InputLabel>
                <Select
                  value={filtroFornecedor}
                  label="Fornecedor"
                  onChange={(e) => setFiltroFornecedor(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {fornecedoresUnicos.map(f => (
                    <MenuItem key={f} value={f}>{f}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Filtro de Data Início */}
              <TextField
                size="small"
                type="date"
                label="Data Início"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 160 }}
              />

              {/* Filtro de Data Fim */}
              <TextField
                size="small"
                type="date"
                label="Data Fim"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 160 }}
              />
            </Box>
          </Collapse>
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
        <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
          <KanbanBoard
            pedidos={pedidosFiltrados}
            colunas={colunas}
            onDragEnd={handleDragEnd}
            onEdit={handleEditarPedido}
            onDelete={(pedido) => {
              setPedidoParaDeletar(pedido);
              setDeletando(true); // Ou abrir um dialog de confirmação se já não houver
            }}
            onHistory={handleVerHistorico}
            estaAtrasado={estaAtrasado}
            formatarValor={formatarValor}
            calcularDiasEmEtapa={calcularDiasEmEtapa}
          />
        </Box>

        {/* Previsão de Compras */}
        < PrevisaoCompras onAddToPedido={(produto) => {
          setProdutoParaAdicionar(produto);
          setFormOpen(true);
        }} />

        {/* Formulário de Novo Pedido */}
        <CompraForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setProdutoParaAdicionar(null);
            setPedidoParaEditar(null);
          }}
          onSubmit={handleSubmitPedido}
          produtoInicial={produtoParaAdicionar}
          pedidoParaEditar={pedidoParaEditar}
        />

        {/* Dialog de confirmação de exclusão */}
        <Dialog open={!!pedidoParaDeletar} onClose={() => setPedidoParaDeletar(null)}>
          <DialogTitle>Confirmar exclusão</DialogTitle>
          <DialogContent>
            <Typography>
              Tem certeza que deseja deletar o pedido #{pedidoParaDeletar?.id}? Esta ação não pode ser desfeita.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPedidoParaDeletar(null)}>Cancelar</Button>
            <Button
              color="error"
              variant="contained"
              onClick={handleDeletePedido}
              disabled={deletando}
            >
              {deletando ? 'Deletando...' : 'Deletar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de Detalhes do Pedido (Edição + Histórico) */}
        <PedidoDetalhesModal
          open={detalhesModalOpen}
          onClose={handleFecharDetalhesModal}
          pedido={pedidoSelecionado}
          onPedidoAtualizado={carregarDados}
          abaInicial={abaInicialModal}
        />
      </Box >
    </Box >
  );
}
