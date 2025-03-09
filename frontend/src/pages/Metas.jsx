import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, List, ListItem, ListItemIcon, ListItemText, Typography, 
  IconButton, Collapse, Divider, Paper, Grid, Tabs, Tab,
  CircularProgress, Badge, InputAdornment, TextField,
  Container, useTheme, alpha, Button, Chip, Alert, AlertTitle,
  LinearProgress, Card, Tooltip, Accordion, AccordionSummary, AccordionDetails,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import PerformanceAlert from '../components/PerformanceAlert';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { 
  Store as StoreIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon,
  TrendingUp,
  Brightness4,
  Brightness7,
  Edit as EditIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  TrendingDown,
  SaveAlt as SaveAltIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  ViewList as ViewListIcon,
  TrendingUp as TrendingUpIcon,
  PriorityHigh as PriorityHighIcon,
  SearchOff as SearchOffIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  ViewModule as ViewModuleIcon
} from '@mui/icons-material';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { toast } from 'react-toastify';
import { PDFDownloadLink } from '@react-pdf/renderer';
import SalesReport from '../components/SalesReport';

const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
  marginTop: theme.spacing(2),
  maxWidth: '100%',
  [theme.breakpoints.up('lg')]: {
    maxWidth: '1400px',
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.dark})`
    : `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.paper})`,
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  padding: theme.spacing(2.5),
  border: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.common.black}`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  }
}));

const TabPanel = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? theme.palette.background.paper
    : theme.palette.background.paper,
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  marginTop: theme.spacing(3),
  padding: theme.spacing(2),
}));

const MarketplaceTab = styled(Tab)(({ theme }) => ({
  minHeight: 60,
  borderRadius: '12px',
  margin: theme.spacing(0, 0.5),
  color: theme.palette.text.secondary,
  '&.Mui-selected': {
    color: theme.palette.primary.main,
    background: theme.palette.mode === 'dark'
      ? theme.palette.primary.main
      : theme.palette.primary.main,
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  overflow: 'visible',
  background: theme.palette.mode === 'dark' 
    ? `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[900]} 100%)`
    : `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[100]} 100%)`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[10],
    '&::before': {
      opacity: 1,
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 'inherit',
    border: '2px solid transparent',
    background: 'linear-gradient(45deg, #00b0ff, #00e676)',
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  }
}));

const ProgressIndicator = styled(Box)(({ theme, value }) => ({
  position: 'relative',
  width: '100%',
  height: '8px',
  borderRadius: '4px',
  backgroundColor: theme.palette.grey[theme.palette.mode === 'dark' ? 800 : 200],
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${Math.min(value, 100)}%`,
    background: value >= 100 
      ? 'linear-gradient(45deg, #00e676, #00b0ff)'
      : value >= 70
        ? 'linear-gradient(45deg, #ffa726, #fb8c00)'
        : 'linear-gradient(45deg, #29b6f6, #0288d1)',
    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  }
}));

const AnimatedCircularProgress = ({ value, size = 40 }) => {
  const theme = useTheme();
  const color = value >= 100 ? '#00e676' : value >= 70 ? '#ffa726' : '#29b6f6';
  
  return (
    <Box position="relative" display="inline-flex">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
      >
        <CircularProgress
          variant="determinate"
          value={Math.min(value, 100)}
          size={size}
          thickness={4}
          sx={{ color }}
        />
      </motion.div>
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          {value >= 100 ? (
            <CheckCircleIcon sx={{ color: '#00e676', fontSize: size * 0.5 }} />
          ) : value >= 70 ? (
            <WarningIcon sx={{ color: '#ffa726', fontSize: size * 0.5 }} />
          ) : (
            <ErrorIcon sx={{ color: '#29b6f6', fontSize: size * 0.5 }} />
          )}
        </motion.div>
      </Box>
    </Box>
  );
};

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { scale: 1.02, transition: { duration: 0.2 } }
};

const filterOptions = [
  { value: 'all', label: 'Todos os SKUs', icon: <ViewListIcon /> },
  { value: 'undefined', label: 'Meta Não Definida', icon: <SearchOffIcon /> },
  { value: 'success', label: 'Meta Alcançada (100%)', icon: <CheckCircleIcon /> },
  { value: 'reachable', label: 'Meta Alcançável (60-99%)', icon: <TrendingUpIcon /> },
  { value: 'warning', label: 'Atenção Necessária (40-60%)', icon: <WarningIcon /> },
  { value: 'danger', label: 'Risco Alto (0-40%)', icon: <PriorityHighIcon /> }
];

function Metas() {
  // Estados
  const [vendas, setVendas] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState({});
  const [marginGoals, setMarginGoals] = useState({});
  const [editingGoal, setEditingGoal] = useState(null);
  const [editingMarginGoal, setEditingMarginGoal] = useState(null);
  const [tempGoal, setTempGoal] = useState('');
  const [tempMarginGoal, setTempMarginGoal] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [skuTotals, setSkuTotals] = useState({});
  const { isDark, setIsDark } = useAppTheme();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [sortBy, setSortBy] = useState('progress');
  const [expandedSection, setExpandedSection] = useState('both');
  const [marginsBySku, setMarginsBySku] = useState({});
  const [minimizedCards, setMinimizedCards] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});
  const [totalStats, setTotalStats] = useState({
    totalVendas: 0,
    totalUnidades: 0,
    margemMedia: 0
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [mesAno, setMesAno] = useState(new Date().toISOString().slice(0, 7) + '-01'); // Formato: YYYY-MM-01
  const API_URL = 'http://localhost:3005/api';

  // Função para formatar a data corretamente
  const formatDate = (year, month) => {
    // Garante que o mês tenha dois dígitos
    const formattedMonth = month.toString().padStart(2, '0');
    // Retorna a data no formato YYYY-MM-01
    return `${year}-${formattedMonth}-01`;
  };

  const handleSectionChange = (section) => (event, isExpanded) => {
    if (section === 'filters') {
      // Se os filtros forem minimizados, minimiza tudo
      if (!isExpanded) {
        setExpandedSection(false);
      } else {
        setExpandedSection('both');
      }
    } else if (section === 'cards') {
      // Se os cards forem expandidos e os filtros estiverem minimizados, mantém só os cards
      if (isExpanded && expandedSection === false) {
        setExpandedSection('cards');
      } else if (isExpanded) {
        setExpandedSection('both');
      } else {
        setExpandedSection('filters');
      }
    }
  };

  // Helper para verificar se uma seção está expandida
  const isSectionExpanded = (section) => {
    return expandedSection === 'both' || expandedSection === section;
  };

  // Função para buscar as margens do backend
  const fetchMargins = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/vendas/margins`);
      const data = await response.json();
      
      if (data.success) {
        setMarginsBySku(data.margins);
      } else {
        console.error('Erro ao buscar margens:', data.message);
      }
    } catch (error) {
      console.error('Erro ao buscar margens:', error);
    }
  }, []);

  // Carrega as margens quando o componente montar
  useEffect(() => {
    fetchMargins();
  }, [fetchMargins]);

  // Função para calcular a média de margem de lucro
  const calculateAverageMargin = (sku) => {
    return marginsBySku[sku] || 0;
  };

  // Função para gerar a mensagem de status da margem
  const getMarginStatusMessage = (currentMargin, targetMargin) => {
    if (!targetMargin) return 'Meta não definida';
    
    if (currentMargin >= targetMargin) {
      return 'Meta atingida! ';
    } else {
      const difference = (targetMargin - currentMargin).toFixed(1);
      return `Faltam ${difference}% para atingir a meta`;
    }
  };

  // Calcula os totais por SKU quando as vendas mudarem
  useEffect(() => {
    const totals = {};
    
    vendas.forEach(venda => {
      const sku = venda.sku;
      // Verifica se o SKU já existe no objeto totals
      if (!totals[sku]) {
        totals[sku] = {
          total: 0,
          quantity: 0,
          orders: [],
          lastUpdate: null,
          margins: [] // Array para armazenar as margens
        };
      }
      
      // Adiciona os valores básicos
      totals[sku].total += Number(venda.valor_vendido) || 0;
      totals[sku].quantity += Number(venda.unidades) || 0;
      
      // Calcula e armazena a margem deste pedido
      const valorVendido = Number(venda.valor_vendido) || 0;
      const valorCusto = Number(venda.valor_custo) || 0;
      let margin = 0;
      
      if (valorVendido > 0 && valorCusto > 0) {
        margin = ((valorVendido - valorCusto) / valorVendido) * 100;
        totals[sku].margins.push(margin);
      }
      
      // Armazena o pedido completo
      totals[sku].orders.push({
        margin: margin,
        quantity: Number(venda.unidades) || 0,
        date: new Date(venda.data)
      });
      
      // Atualiza a data mais recente
      const vendaDate = new Date(venda.data);
      if (!totals[sku].lastUpdate || vendaDate > totals[sku].lastUpdate) {
        totals[sku].lastUpdate = vendaDate;
      }
    });

    setSkuTotals(totals);
  }, [vendas]);

  useEffect(() => {
    const fetchMetricas = async () => {
      try {
        const response = await axios.get(`${API_URL}/vendas/metricas?mes_ano=${mesAno}`);
        const data = response.data;
        setTotalStats({
          totalVendas: Number(data.valor_total_vendido) || 0,
          totalUnidades: Number(data.total_unidades) || 0,
          margemMedia: Number(data.margem_media) || 0
        });
      } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        // Em caso de erro, mantém os valores zerados
        setTotalStats({
          totalVendas: 0,
          totalUnidades: 0,
          margemMedia: 0
        });
      }
    };

    fetchMetricas();
  }, [mesAno]);

  // Função para buscar metas do backend
  const fetchMetas = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/metas?mes_ano=${mesAno}`);
      const metas = response.data;
      
      // Converter os dados para o formato usado pelo componente
      const newGoals = {};
      const newMarginGoals = {};
      
      metas.forEach(meta => {
        if (meta.meta_vendas) newGoals[meta.sku] = parseFloat(meta.meta_vendas);
        if (meta.meta_margem) newMarginGoals[meta.sku] = parseFloat(meta.meta_margem);
      });
      
      setGoals(newGoals);
      setMarginGoals(newMarginGoals);
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      toast.error('Erro ao carregar metas do banco de dados');
    }
  }, [mesAno]);

  // Carregar metas quando o mês/ano mudar
  useEffect(() => {
    fetchMetas();
  }, [fetchMetas, mesAno]);

  // Atualiza mesAno quando ano ou mês mudam
  useEffect(() => {
    const formattedDate = formatDate(selectedYear, selectedMonth);
    console.log('Data formatada:', formattedDate);
    setMesAno(formattedDate);
  }, [selectedYear, selectedMonth]);

  // Função para salvar meta de vendas
  const handleGoalChange = async (sku, value) => {
    try {
      const formattedDate = formatDate(selectedYear, selectedMonth);
      console.log('Enviando requisição com:', {
        sku,
        value,
        mes_ano: formattedDate,
        marginGoal: marginGoals[sku] || 0
      });
      
      await axios.post(`${API_URL}/metas/${sku}`, {
        meta_vendas: value,
        meta_margem: marginGoals[sku] || 0,
        mes_ano: formattedDate
      });
      
      await fetchMetas();
      toast.success('Meta de vendas atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar meta:', error.response?.data || error.message);
      toast.error(`Erro ao atualizar meta de vendas: ${error.response?.data?.error || error.message}`);
    }
  };

  // Função para salvar meta de margem
  const handleMarginGoalChange = async (sku, value) => {
    try {
      const formattedDate = formatDate(selectedYear, selectedMonth);
      console.log('Enviando requisição de margem com:', {
        sku,
        value,
        mes_ano: formattedDate,
        salesGoal: goals[sku] || 0
      });
      
      await axios.post(`${API_URL}/metas/${sku}`, {
        meta_vendas: goals[sku] || 0,
        meta_margem: value,
        mes_ano: formattedDate
      });
      
      await fetchMetas();
      toast.success('Meta de margem atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar meta de margem:', error.response?.data || error.message);
      toast.error(`Erro ao atualizar meta de margem: ${error.response?.data?.error || error.message}`);
    }
  };

  useEffect(() => {
    const fetchVendas = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/vendas?mes_ano=${mesAno}`);
        
        if (response.data && Array.isArray(response.data)) {
          setVendas(response.data);
        } else {
          setError('Formato de dados inválido');
        }
        setLoading(false);
      } catch (err) {
        console.error('Erro ao buscar vendas:', err);
        setError('Erro ao carregar dados de vendas');
        setLoading(false);
      }
    };

    fetchVendas();
  }, [mesAno]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const sortSkus = (items) => {
    return [...items].sort((a, b) => {
      const progressA = (a.total / (goals[a.sku] || 1)) * 100;
      const progressB = (b.total / (goals[b.sku] || 1)) * 100;
      
      if (sortBy === 'progress') {
        return progressB - progressA; // Maior progresso primeiro
      } else {
        return progressA - progressB; // Menor progresso primeiro
      }
    });
  };

  const handleKeyPress = (e, sku) => {
    if (e.key === 'Enter') {
      handleGoalChange(sku, tempGoal);
      setEditingGoal(null);
      setTempGoal('');
    }
  };

  const startEditing = (sku, currentGoal) => {
    setEditingGoal(sku);
    setTempGoal(currentGoal?.toString() || '');
  };

  const calculateProgress = (current, goal) => {
    if (!goal) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return '#00e676';
    if (progress >= 70) return '#ffa726';
    return '#29b6f6';
  };

  const getProgressIcon = (progress) => {
    if (progress >= 100) return <CheckCircleIcon color="#00e676" />;
    if (progress >= 70) return <WarningIcon color="#ffa726" />;
    return <ErrorIcon color="#29b6f6" />;
  };

  const getCardStatus = (currentSales, goal, progress) => {
    if (!goal || goal === 0) return 'undefined';
    if (progress >= 100) return 'success';
    if (progress >= 60) return 'reachable';
    if (progress >= 40) return 'warning';
    return 'danger';
  };

  const getCardStyle = (progress) => {
    if (progress >= 100) {
      return {
        borderColor: '#00e676',
        backgroundColor: alpha('#00e676', 0.1),
        icon: <CheckCircleIcon sx={{ color: '#00e676' }} />
      };
    } else if (progress >= 60 && progress < 100) {  
      return {
        borderColor: '#2196f3',
        backgroundColor: alpha('#2196f3', 0.1),
        icon: <TrendingUpIcon sx={{ color: '#2196f3' }} />
      };
    } else if (progress >= 40 && progress < 60) {  
      return {
        borderColor: '#ff9800',
        backgroundColor: alpha('#ff9800', 0.1),
        icon: <WarningIcon sx={{ color: '#ff9800' }} />
      };
    } else {
      return {
        borderColor: '#f44336',
        backgroundColor: alpha('#f44336', 0.1),
        icon: <ErrorIcon sx={{ color: '#f44336' }} />
      };
    }
  };

  const getSkuStatus = (currentSales, goal, dailyAverage, daysInMonth) => {
    if (!goal) return 'success';
    const progress = (currentSales / goal) * 100;
    const projectedSales = dailyAverage * daysInMonth;
    
    if (currentSales >= goal) return 'success';
    if (projectedSales >= goal) return 'reachable';
    if (progress >= 40) return 'warning';
    return 'danger';
  };

  const getStatusIcon = (currentSales, goal, progress) => {
    if (!goal || goal === 0) {
      return <SearchOffIcon sx={{ color: theme.palette.text.secondary }} />;
    }
    if (progress >= 100) {
      return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
    }
    if (progress >= 60 && progress < 100) {  
      return <TrendingUpIcon sx={{ color: theme.palette.info.main }} />;
    }
    if (progress >= 40 && progress < 60) {  
      return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
    }
    return <PriorityHighIcon sx={{ color: theme.palette.error.main }} />;
  };

  const getStatusColor = (currentSales, goal, progress) => {
    if (!goal || goal === 0) {
      return theme.palette.text.secondary;
    }
    if (progress >= 100) {
      return theme.palette.success.main;
    }
    if (progress >= 60 && progress < 100) {  
      return theme.palette.info.main;
    }
    if (progress >= 40 && progress < 60) {  
      return theme.palette.warning.main;
    }
    return theme.palette.error.main;
  };

  const getStatusMessage = (currentSales, goal, totalUnits, daysLeft) => {
    if (!goal || goal === 0) {
      return "Meta não definida";
    }

    if (currentSales >= goal) {
      const percentageOver = ((currentSales - goal) / goal * 100).toFixed(1);
      return `Meta atingida! Superou em ${percentageOver}%`;
    }

    // Calcula o valor médio por unidade
    const averageValuePerUnit = totalUnits > 0 ? currentSales / totalUnits : 0;
    
    // Calcula quantas unidades faltam para atingir a meta
    const remainingValue = goal - currentSales;
    const remainingUnits = Math.ceil(remainingValue / averageValuePerUnit);
    
    // Calcula quantas unidades precisam ser vendidas por dia
    const unitsPerDay = Math.ceil(remainingUnits / daysLeft);

    return `Faltam ${remainingUnits} unidades para atingir a meta! Você tem que vender ${unitsPerDay} unidades por dia até atingir a meta!`;
  };

  const getFilteredSkus = useCallback(() => {
    return Object.entries(skuTotals).map(([sku, data]) => {
      const currentSales = data.total || 0;
      const goal = goals[sku] || 0;
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const currentDay = new Date().getDate();
      const dailyAverage = currentDay > 0 ? currentSales / currentDay : 0;
      const progress = goal > 0 ? (currentSales / goal) * 100 : 0;
      
      // Primeiro verifica o filtro
      const cardStatus = getCardStatus(currentSales, goal, progress);
      let passesFilter = performanceFilter === 'all' || cardStatus === performanceFilter;

      if (!passesFilter) {
        return null;
      }

      const status = getSkuStatus(currentSales, goal, dailyAverage, daysInMonth);
      
      return {
        sku,
        data,
        goal,
        status,
        progress: goal > 0 ? (currentSales / goal) * 100 : 0,
        remainingToGoal: Math.max(0, goal - currentSales),
        dailyAverage,
        currentSales
      };
    }).filter(Boolean);
  }, [skuTotals, goals, performanceFilter]);

  // Calcular métricas gerais
  const progressoGeral = calculateProgress(totalStats.totalVendas, totalStats.totalMetas);

  // Função para filtrar SKUs
  

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const cardContainerStyle = {
    transition: 'all 0.3s ease',
    height: minimizedCards ? '100px' : 'auto',
    overflow: 'hidden',
  };

  const getProgressBarColor = (currentSales, goal, progress) => {
    if (!goal || goal === 0) {
      return theme.palette.text.secondary; // Cinza para meta não definida
    }
    if (progress >= 100) {
      return theme.palette.success.main;
    }
    if (progress >= 60) {
      return theme.palette.info.main;
    }
    if (progress >= 40) {
      return theme.palette.warning.main;
    }
    return theme.palette.error.main;
  };

  const getStatusText = (currentSales, goal) => {
    if (!goal || goal === 0) {
      return "Meta não definida";
    }
    if (currentSales >= goal) {
      const percentage = ((currentSales - goal) / goal) * 100;
      return `Meta atingida! Superou em ${percentage.toFixed(1)}%`;
    }
    return `Meta atingida! Superou em Infinity%`;
  };

  const toggleCard = (sku) => {
    setExpandedCards(prev => ({
      ...prev,
      [sku]: !prev[sku]
    }));
  };

  const statusFilters = [
    { 
      value: 'all', 
      label: 'Todos os SKUs',
      icon: <ViewListIcon />,
      count: Object.keys(skuTotals).length,
      color: '#666666'
    },
    { 
      value: 'undefined', 
      label: 'Meta Não Definida',
      icon: <SearchOffIcon />,
      count: Object.entries(skuTotals).filter(([sku]) => !goals[sku] || goals[sku] === 0).length,
      color: theme.palette.text.secondary
    },
    { 
      value: 'success', 
      label: 'Meta Alcançada',
      icon: <CheckCircleIcon />,
      count: Object.entries(skuTotals).filter(([sku, data]) => {
        const progress = ((data.total || 0) / (goals[sku] || 1)) * 100;
        return progress >= 100 && goals[sku] > 0;
      }).length,
      color: theme.palette.success.main
    },
    { 
      value: 'reachable', 
      label: 'Meta Alcançável',
      icon: <TrendingUpIcon />,
      count: Object.entries(skuTotals).filter(([sku, data]) => {
        const progress = ((data.total || 0) / (goals[sku] || 1)) * 100;
        return progress >= 60 && progress < 100 && goals[sku] > 0;
      }).length,
      color: theme.palette.info.main
    },
    { 
      value: 'warning', 
      label: 'Atenção Necessária',
      icon: <WarningIcon />,
      count: Object.entries(skuTotals).filter(([sku, data]) => {
        const progress = ((data.total || 0) / (goals[sku] || 1)) * 100;
        return progress >= 40 && progress < 60 && goals[sku] > 0;
      }).length,
      color: theme.palette.warning.main
    },
    { 
      value: 'danger', 
      label: 'Risco Alto',
      icon: <PriorityHighIcon />,
      count: Object.entries(skuTotals).filter(([sku, data]) => {
        const progress = ((data.total || 0) / (goals[sku] || 1)) * 100;
        return progress < 40 && goals[sku] > 0;
      }).length,
      color: theme.palette.error.main
    }
  ];

  const years = Array.from({ length: new Date().getFullYear() - 2023 }, (_, i) => new Date().getFullYear() - i);
  
  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const handleYearChange = (event) => {
    const year = parseInt(event.target.value);
    setSelectedYear(year);
    updateMesAno(year, selectedMonth);
  };

  const handleMonthChange = (event) => {
    const month = parseInt(event.target.value);
    setSelectedMonth(month);
    updateMesAno(selectedYear, month);
  };

  const updateMesAno = (year, month) => {
    const monthStr = month.toString().padStart(2, '0');
    const newMesAno = `${year}-${monthStr}-01`;
    setMesAno(newMesAno);
  };

  return (
    <Box sx={{ 
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: theme => theme.palette.background.default
    }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Metas de Vendas
              </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <IconButton onClick={() => setIsDark(!isDark)}>
                {isDark ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Ano</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={handleYearChange}
                    label="Ano"
                  >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Mês</InputLabel>
                  <Select
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    label="Mês"
                  >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <MenuItem key={month} value={month}>
                    {format(new Date(2021, month - 1), 'MMMM', { locale: ptBR })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
            </Box>
          </Box>

        {/* Filtros e Ordenação */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filtrar por Status</InputLabel>
            <Select
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value)}
              label="Filtrar por Status"
            >
              {filterOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  <ListItemIcon>
                              {option.icon}
                  </ListItemIcon>
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Ordenar por"
            >
              <MenuItem value="progress">Progresso</MenuItem>
              <MenuItem value="sales">Vendas</MenuItem>
              <MenuItem value="goal">Meta</MenuItem>
              <MenuItem value="sku">SKU</MenuItem>
            </Select>
          </FormControl>
          <IconButton 
            onClick={() => setMinimizedCards(!minimizedCards)}
            sx={{ ml: 'auto' }}
          >
            {minimizedCards ? <ViewListIcon /> : <ViewModuleIcon />}
          </IconButton>
                </Box>

        {/* Conteúdo Principal */}
        <Grid container spacing={3}>
          {/* ... existing grid content ... */}
                                      </Grid>
        </Container>
    </Box>
  );
}

export default Metas;
