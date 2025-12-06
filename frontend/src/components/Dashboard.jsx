import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  IconButton,
  Button,
  Menu,
  MenuItem,
  TextField,
  Popover
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  FilterList as FilterListIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  NotificationsNone as NotificationsIcon
} from '@mui/icons-material';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import Sidebar from './Sidebar';
import DashboardCharts from './DashboardCharts';
import MetricCard from './MetricCard';
import { fetchVendasML } from '../services/vendasMLService';
import { fetchVendasMagalu, fetchMetricasMagalu } from '../services/vendasMagaluService';
import VendasTable from './vendasTable';
import api from '../config/api';

export default function Dashboard({ marketplace = 'mercadolivre' }) {
  const theme = useTheme();
  const { isDark, setIsDark } = useAppTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [metricas, setMetricas] = useState({
    vendasTotais: 0,
    despesas: 0,
    lucroLiquido: 0,
    unidadesVendidas: 0,
    mediaDiariaVendas: 0,
    mediaDiariaLucro: 0,
    crescimentoPeriodo: 0
  });
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [dataInicial, setDataInicial] = useState(null);
  const [dataFinal, setDataFinal] = useState(null);
  const [skuSelecionado, setSkuSelecionado] = useState('todos');
  const [skus, setSkus] = useState([]);
  const [dadosVendas, setDadosVendas] = useState([]);

  useEffect(() => {
    const hoje = new Date();
    
    // Definir data inicial como o primeiro dia do mês atual
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    primeiroDiaDoMes.setHours(0, 0, 0, 0);
    
    // Data final é hoje
    const dataAtual = new Date();
    dataAtual.setHours(23, 59, 59, 999);
    
    setDataInicial(primeiroDiaDoMes);
    setDataFinal(dataAtual);
  }, []);

  useEffect(() => {
    if (dataInicial && dataFinal) {
    carregarDados();
    }
  }, [dataInicial, dataFinal, skuSelecionado, marketplace]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Usa o serviço correto baseado no marketplace
      const todosOsDados = marketplace === 'magalu' 
        ? await fetchVendasMagalu({})
        : await fetchVendasML({});
      setDadosVendas(todosOsDados);
      
      // NÃO FILTRAR POR DATA - mostrar todos os dados da tabela
      const dadosParaCalcular = todosOsDados;

      if (dadosParaCalcular.length === 0) {
        setMetricas({
          vendasTotais: 0,
          despesas: 0,
          lucroLiquido: 0,
          unidadesVendidas: 0,
          mediaDiariaVendas: 0,
          mediaDiariaLucro: 0,
          crescimentoPeriodo: 0
        });
        return;
      }

      // Calcula as métricas com TODOS os dados
      const metricas = dadosParaCalcular.reduce((acc, venda) => {
        // Pega os valores diretamente do banco
        const valorVendido = Number(venda.valorVendido) || 0;
        const lucro = Number(venda.lucro) || 0;
        const unidades = Number(venda.unidades) || 0;
      
        // Soma os valores
        acc.vendasTotais += valorVendido;
        acc.lucroLiquido += lucro;
        acc.unidadesVendidas += unidades;

        return acc;
      }, {
        vendasTotais: 0,
        lucroLiquido: 0,
        unidadesVendidas: 0
      });

      // Calcula médias diárias baseado no período de todos os dados
      // Encontra a data mais antiga e mais recente
      const datas = dadosParaCalcular.map(v => new Date(v.data)).sort((a, b) => a - b);
      const dataMaisAntiga = datas[0];
      const dataMaisRecente = datas[datas.length - 1];
      
      const dias = Math.max(1, Math.ceil((dataMaisRecente - dataMaisAntiga) / (1000 * 60 * 60 * 24)));
      const mediaDiariaVendas = metricas.vendasTotais / dias;
      const mediaDiariaLucro = metricas.lucroLiquido / dias;

      // Crescimento é 0 pois estamos mostrando todos os dados
      const crescimentoPeriodo = 0;

      // Atualiza o estado com as métricas calculadas
      setMetricas({
        vendasTotais: Number(metricas.vendasTotais.toFixed(2)),
        despesas: Number((metricas.vendasTotais - metricas.lucroLiquido).toFixed(2)),
        lucroLiquido: Number(metricas.lucroLiquido.toFixed(2)),
        unidadesVendidas: Number(metricas.unidadesVendidas),
        mediaDiariaVendas: Number(mediaDiariaVendas.toFixed(2)),
        mediaDiariaLucro: Number(mediaDiariaLucro.toFixed(2)),
        crescimentoPeriodo: Number(crescimentoPeriodo.toFixed(2))
      });

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  const handleOpenFilter = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // REMOVIDO: fetchVendas() estava trazendo dados duplicados de /api/vendas
  // Agora usamos apenas fetchVendasML() e fetchVendasMagalu() em carregarDados()

  useEffect(() => {
    // Dados são carregados em carregarDados() que é chamado quando as datas mudam
  }, [marketplace]);

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
          marginLeft: '50px', // Espaço para o sidebar
          height: '100vh',
          overflow: 'auto', // Permite scroll apenas no conteúdo
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
        }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.text.primary }}>
            {marketplace === 'magalu' ? 'Magazine Luiza' : 'Mercado Livre'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<FilterListIcon />}
              onClick={handleOpenFilter}
              sx={{
                bgcolor: '#00B4D8',
                color: 'white',
                '&:hover': {
                  bgcolor: '#0095b3',
                },
                borderRadius: '8px',
                textTransform: 'none',
                px: 2,
                py: 1
              }}
            >
              Filtrar
            </Button>
            <IconButton 
              onClick={() => setIsDark(!isDark)}
              sx={{ 
                width: 40,
                height: 40,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: theme.palette.mode === 'dark' ? '#fff' : '#000'
              }}
            >
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <IconButton
              sx={{ 
                width: 40,
                height: 40,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: theme.palette.mode === 'dark' ? '#fff' : '#000'
              }}
            >
              <NotificationsIcon />
            </IconButton>
          </Box>
        </Box>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCloseFilter}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ p: 2, width: 300 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Filtros</Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Período Predefinido
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    setDataInicial(hoje);
                    setDataFinal(new Date());
                    handleCloseFilter();
                  }}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Hoje
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const ontem = new Date();
                    ontem.setDate(ontem.getDate() - 1);
                    ontem.setHours(0, 0, 0, 0);
                    setDataInicial(ontem);
                    setDataFinal(new Date());
                    handleCloseFilter();
                  }}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Ontem
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const seteDias = new Date();
                    seteDias.setDate(seteDias.getDate() - 7);
                    seteDias.setHours(0, 0, 0, 0);
                    setDataInicial(seteDias);
                    setDataFinal(new Date());
                    handleCloseFilter();
                  }}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Últimos 7 dias
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const quinzeDias = new Date();
                    quinzeDias.setDate(quinzeDias.getDate() - 15);
                    quinzeDias.setHours(0, 0, 0, 0);
                    setDataInicial(quinzeDias);
                    setDataFinal(new Date());
                    handleCloseFilter();
                  }}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Últimos 15 dias
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    const trintaDias = new Date();
                    trintaDias.setDate(trintaDias.getDate() - 30);
                    trintaDias.setHours(0, 0, 0, 0);
                    setDataInicial(trintaDias);
                    setDataFinal(new Date());
                    handleCloseFilter();
                  }}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Últimos 30 dias
                </Button>
              </Box>
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              Período Personalizado
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <DatePicker
                  label="Data Inicial"
                  value={dataInicial}
                  onChange={setDataInicial}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  maxDate={new Date()}
                />
                <DatePicker
                  label="Data Final"
                  value={dataFinal}
                  onChange={setDataFinal}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  maxDate={new Date()}
                  minDate={dataInicial}
                />
                <TextField
                  select
                  label="SKU"
                  value={skuSelecionado}
                  onChange={(e) => setSkuSelecionado(e.target.value)}
                  fullWidth
                  size="small"
                >
                  {skus.map((sku) => (
                    <MenuItem key={sku} value={sku}>
                      {sku === 'todos' ? 'Todos os SKUs' : sku}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </LocalizationProvider>
          </Box>
        </Popover>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '12px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 180, 216, 0.1)' : 'rgba(0, 180, 216, 0.05)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 180, 216, 0.2)' : 'rgba(0, 180, 216, 0.1)',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 4px 20px rgba(0, 180, 216, 0.15)'
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'rgba(0, 180, 216, 0.1)',
                color: '#00B4D8'
              }}>
                <AttachMoneyIcon />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Vendas Totais
              </Typography>
              <Typography variant="h5" sx={{ color: '#00B4D8', fontWeight: 'bold' }}>
                R$ {metricas.vendasTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '12px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.05)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 4px 20px rgba(255, 152, 0, 0.15)'
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'rgba(255, 152, 0, 0.1)',
                color: '#FF9800'
              }}>
                <ReceiptIcon />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Despesas
              </Typography>
              <Typography variant="h5" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
                R$ {metricas.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '12px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.05)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 4px 20px rgba(76, 175, 80, 0.15)'
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'rgba(76, 175, 80, 0.1)',
                color: '#4CAF50'
              }}>
                <TrendingUpIcon />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Lucro Líquido
              </Typography>
              <Typography variant="h5" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                R$ {metricas.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '12px',
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.1)' : 'rgba(156, 39, 176, 0.05)',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 4px 20px rgba(156, 39, 176, 0.15)'
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: 'rgba(156, 39, 176, 0.1)',
                color: '#9C27B0'
              }}>
                <ShoppingCartIcon />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Unidades Vendidas
              </Typography>
              <Typography variant="h5" sx={{ color: '#9C27B0', fontWeight: 'bold' }}>
                {metricas.unidadesVendidas}
              </Typography>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 3, mb: 3 }}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: '12px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 136, 254, 0.1)' : 'rgba(0, 136, 254, 0.05)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              height: '100%',
              justifyContent: 'space-between'
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 3, color: theme.palette.text.primary }}>
                  Resumo do Período
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Média Diária de Vendas
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#00B4D8', fontWeight: 'bold' }}>
                      R$ {metricas.mediaDiariaVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Média Diária de Lucro
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      R$ {metricas.mediaDiariaLucro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Crescimento no Período
                    </Typography>
                    <Typography variant="h5" sx={{ 
                      color: metricas.crescimentoPeriodo >= 0 ? '#4CAF50' : '#f44336',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}>
                      {metricas.crescimentoPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                      {metricas.crescimentoPeriodo >= 0 ? 
                        <TrendingUpIcon sx={{ fontSize: '1.2em' }} /> : 
                        <TrendingUpIcon sx={{ fontSize: '1.2em', transform: 'rotate(180deg)' }} />
                      }
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>

          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: '12px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
              height: '100%',
              minHeight: '500px'
            }}
          >
            <DashboardCharts vendas={dadosVendas} />
          </Paper>
        </Box>

        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.background.paper,
            width: '100%'
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'medium', color: theme.palette.text.primary }}>
            Detalhamento de Pedidos
          </Typography>
          <VendasTable 
            vendas={dadosVendas} 
            onVendaUpdate={() => carregarDados()} 
          />
        </Paper>
      </Box>
    </Box>
  );
}
