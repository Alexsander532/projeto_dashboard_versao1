// frontend/src/pages/Alertas.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  DoneAll as DoneAllIcon,
  Inventory2Outlined as InventoryIcon,
  ShoppingCartOutlined as ShoppingCartIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  NotificationsNone as NotificationsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useSidebar } from '../contexts/SidebarContext';
import Sidebar from '../components/Sidebar';
import AlertCard from '../components/alertas/AlertCard';
import AlertasSummary from '../components/alertas/AlertasSummary';

import {
  fetchAlertas,
  fetchContagemAlertas,
  marcarAlertaComoLido,
  marcarTodosComoLidos,
  descartarAlerta
} from '../services/alertasService';

const tabs = [
  { id: 'todos', label: 'Visão Geral', icon: NotificationsIcon },
  { id: 'estoque', label: 'Estoque', icon: InventoryIcon },
  { id: 'compras', label: 'Compras', icon: ShoppingCartIcon },
  { id: 'metas', label: 'Metas', icon: TrendingUpIcon },
  { id: 'financeiro', label: 'Financeiro', icon: AttachMoneyIcon }
];

function Alertas() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isHovered } = useSidebar();

  const [alertas, setAlertas] = useState([]);
  const [contagem, setContagem] = useState({});
  const [loading, setLoading] = useState(true);
  const [tabAtiva, setTabAtiva] = useState('todos');
  const [filtroSeveridade, setFiltroSeveridade] = useState('todos');
  const [busca, setBusca] = useState('');
  const [mostrarLidos, setMostrarLidos] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const filtros = {};
      if (tabAtiva !== 'todos') filtros.tipo = tabAtiva;
      if (filtroSeveridade !== 'todos') filtros.severidade = filtroSeveridade;
      if (!mostrarLidos) filtros.lido = false;

      const [alertasData, contagemData] = await Promise.all([
        fetchAlertas(filtros),
        fetchContagemAlertas()
      ]);

      let alertasFiltrados = alertasData;
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        alertasFiltrados = alertasData.filter(a =>
          a.titulo.toLowerCase().includes(termo) ||
          a.mensagem.toLowerCase().includes(termo) ||
          a.sku?.toLowerCase().includes(termo)
        );
      }

      setAlertas(alertasFiltrados);
      setContagem(contagemData);
    } catch (error) {
      console.error('Erro:', error);
      setSnackbar({ open: true, message: 'Erro ao carregar dados', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [tabAtiva, filtroSeveridade, mostrarLidos, busca]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleTabChange = (e, val) => setTabAtiva(val);
  const handleMarcarLido = async (id) => { await marcarAlertaComoLido(id); carregarDados(); };
  const handleDescartar = async (id) => { await descartarAlerta(id); carregarDados(); };
  const handleMarcarTodos = async () => { await marcarTodosComoLidos(); carregarDados(); setSnackbar({ open: true, message: 'Todos marcados como lidos', severity: 'success' }) };

  const handleAcao = (alerta, acao) => {
    switch (acao) {
      case 'ver_produto': navigate('/estoque'); break;
      case 'criar_pedido': navigate('/compras', { state: { abrirFormulario: true, skuInicial: alerta.sku } }); break;
      case 'ver_pedido': navigate('/compras'); break;
      case 'ver_metas': navigate('/metas'); break;
      default: console.log('Ação:', acao);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: isHovered ? '200px' : '64px', transition: 'margin 0.3s' }}>

        <Container maxWidth={false} sx={{ py: 1, maxWidth: '1600px' }}>

          {/* Header Compacto */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight="800" sx={{ mb: 0.5 }}>
                Central de Alertas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visão geral de notificações e pendências
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                startIcon={<RefreshIcon />}
                onClick={carregarDados}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Atualizar
              </Button>
              <Button
                variant="contained"
                startIcon={<DoneAllIcon />}
                onClick={handleMarcarTodos}
                disabled={contagem.naoLidos === 0}
                size="small"
                sx={{ textTransform: 'none', borderRadius: '8px', boxShadow: 'none' }}
              >
                Marcar todos como lidos
              </Button>
            </Box>
          </Box>

          {/* Cards de Resumo Horizontal (Nova Versão) */}
          <AlertasSummary
            contagem={contagem}
            filtroAtivo={filtroSeveridade}
            onFiltrar={(sev) => setFiltroSeveridade(sev === filtroSeveridade ? 'todos' : sev)}
          />

          {/* Barra de Ferramentas Compacta */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              mb: 3,
              borderRadius: '12px',
              border: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 2,
              justifyContent: 'space-between'
            }}
          >
            <Tabs
              value={tabAtiva}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 40,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  minHeight: 40,
                  borderRadius: '8px',
                  mr: 0.5,
                  py: 0,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                  }
                },
                '& .MuiTabs-indicator': { display: 'none' }
              }}
            >
              {tabs.map(tab => (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  label={tab.label}
                  icon={<tab.icon fontSize="small" />}
                  iconPosition="start"
                />
              ))}
            </Tabs>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: 280 }}>
              <TextField
                placeholder="Buscar..."
                size="small"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                sx={{ width: 220, '& .MuiInputBase-root': { fontSize: '0.9rem', height: 36 } }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
                  sx: { borderRadius: '8px' }
                }}
              />
              <Select
                value={mostrarLidos ? 'todos' : 'naoLidos'}
                onChange={(e) => setMostrarLidos(e.target.value === 'todos')}
                size="small"
                sx={{ borderRadius: '8px', minWidth: 120, height: 36, fontSize: '0.9rem' }}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="naoLidos">Não lidos</MenuItem>
              </Select>
            </Box>
          </Paper>

          {/* Lista de Alertas */}
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
          ) : alertas.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }}>
              <NotificationsIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 1.5 }} />
              <Typography variant="h6" color="text.secondary">Tudo limpo!</Typography>
              <Typography variant="body2" color="text.disabled">Nenhum alerta encontrado com os filtros atuais.</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {alertas.map(alerta => (
                <AlertCard
                  key={alerta.id}
                  alerta={alerta}
                  onMarcarLido={handleMarcarLido}
                  onDescartar={handleDescartar}
                  onAcao={handleAcao}
                />
              ))}
            </Box>
          )}

        </Container>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Alertas;