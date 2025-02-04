import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Button,
  Menu,
  MenuItem
} from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardCharts({ vendas }) {
  const theme = useTheme();
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [periodoSelecionado, setPeriodoSelecionado] = useState('30d');

  useEffect(() => {
    processarDados();
  }, [vendas, periodoSelecionado]);

  const processarDados = () => {
    // Filtra os dados baseado no período selecionado
    const hoje = new Date();
    let dataInicial = new Date();
    
    switch (periodoSelecionado) {
      case 'hoje':
        dataInicial = new Date();
        dataInicial.setHours(0, 0, 0, 0);
        break;
      case 'ontem':
        dataInicial = new Date();
        dataInicial.setDate(dataInicial.getDate() - 1);
        dataInicial.setHours(0, 0, 0, 0);
        break;
      case '7d':
        dataInicial.setDate(dataInicial.getDate() - 7);
        break;
      case '15d':
        dataInicial.setDate(dataInicial.getDate() - 15);
        break;
      case '30d':
        dataInicial.setDate(dataInicial.getDate() - 30);
        break;
      default:
        dataInicial.setDate(dataInicial.getDate() - 30);
    }

    let dadosFiltrados = [];
    if (periodoSelecionado === 'ontem') {
      // Para "ontem", pega dados de hoje e ontem para comparação
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      ontem.setHours(0, 0, 0, 0);
      const ontemFim = new Date(ontem);
      ontemFim.setHours(23, 59, 59, 999);

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeFim = new Date();
      hojeFim.setHours(23, 59, 59, 999);

      const dadosOntem = vendas.filter(venda => {
        const dataVenda = new Date(venda.data);
        return dataVenda >= ontem && dataVenda <= ontemFim;
      });

      const dadosHoje = vendas.filter(venda => {
        const dataVenda = new Date(venda.data);
        return dataVenda >= hoje && dataVenda <= hojeFim;
      });

      dadosFiltrados = [...dadosOntem, ...dadosHoje];
    } else {
      dadosFiltrados = vendas.filter(venda => {
        const dataVenda = new Date(venda.data);
        return dataVenda >= dataInicial && dataVenda <= hoje;
      });
    }

    // Agrupa os dados por data
    const dadosPorData = dadosFiltrados.reduce((acc, venda) => {
      let data;
      if (periodoSelecionado === 'hoje') {
        data = format(new Date(), "dd/MM/yyyy");
      } else if (periodoSelecionado === 'ontem') {
        const dataVenda = new Date(venda.data);
        const hoje = new Date();
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        data = dataVenda.getDate() === hoje.getDate() ? 'Hoje' : 'Ontem';
      } else {
        data = format(new Date(venda.data), 'dd/MM', { locale: ptBR });
      }
      
      if (!acc[data]) {
        acc[data] = {
          data,
          vendas: 0,
          lucro: 0,
          valorCompra: 0
        };
      }
      
      acc[data].vendas += parseFloat(venda.valorVendido) || 0;
      acc[data].lucro += parseFloat(venda.lucro) || 0;
      acc[data].valorCompra += parseFloat(venda.valorComprado) || 0;
      
      return acc;
    }, {});

    // Converte o objeto em array e ordena por data
    let dadosOrdenados = Object.values(dadosPorData);
    
    if (periodoSelecionado === 'ontem') {
      // Garante que "Ontem" venha antes de "Hoje" no gráfico
      dadosOrdenados = dadosOrdenados.sort((a, b) => {
        if (a.data === 'Ontem') return -1;
        if (b.data === 'Ontem') return 1;
        return 0;
      });
    } else if (periodoSelecionado !== 'hoje') {
      dadosOrdenados = dadosOrdenados.sort((a, b) => {
        const [diaA, mesA] = a.data.split('/');
        const [diaB, mesB] = b.data.split('/');
        return new Date(2024, parseInt(mesA) - 1, parseInt(diaA)) - new Date(2024, parseInt(mesB) - 1, parseInt(diaB));
      });
    }

    setDadosGrafico(dadosOrdenados);
  };

  const handleOpenPeriodoMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePeriodoMenu = () => {
    setAnchorEl(null);
  };

  const handlePeriodoChange = (periodo) => {
    setPeriodoSelecionado(periodo);
    handleClosePeriodoMenu();
  };

  const formatarValor = (valor) => {
    return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <Box sx={{ height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', color: theme.palette.text.primary }}>
          Tendência de Vendas e Lucro
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleOpenPeriodoMenu}
          sx={{
            borderColor: theme.palette.divider,
            color: theme.palette.text.secondary,
            textTransform: 'none',
            borderRadius: '20px',
            px: 2,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              bgcolor: 'transparent'
            }
          }}
        >
          {periodoSelecionado === 'hoje' ? 'Hoje' :
           periodoSelecionado === 'ontem' ? 'Ontem' :
           periodoSelecionado === '7d' ? 'Últimos 7 dias' :
           periodoSelecionado === '15d' ? 'Últimos 15 dias' :
           periodoSelecionado === '30d' ? 'Últimos 30 dias' : 'Período Personalizado'}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClosePeriodoMenu}
        >
          <MenuItem onClick={() => handlePeriodoChange('hoje')}>Hoje</MenuItem>
          <MenuItem onClick={() => handlePeriodoChange('ontem')}>Ontem</MenuItem>
          <MenuItem onClick={() => handlePeriodoChange('7d')}>Últimos 7 dias</MenuItem>
          <MenuItem onClick={() => handlePeriodoChange('15d')}>Últimos 15 dias</MenuItem>
          <MenuItem onClick={() => handlePeriodoChange('30d')}>Últimos 30 dias</MenuItem>
        </Menu>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0088FE' }} />
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Vendas</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4CAF50' }} />
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Lucro</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FF9800' }} />
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Valor Compra</Typography>
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart 
          data={dadosGrafico}
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <defs>
            <linearGradient id="vendas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0088FE" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="lucro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="valorCompra" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF9800" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#FF9800" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis 
            dataKey="data" 
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: theme.palette.divider }}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis 
            stroke={theme.palette.text.secondary}
            tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: theme.palette.divider }}
            tickFormatter={formatarValor}
            width={80}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value, name) => [
              formatarValor(value),
              name === 'vendas' ? 'Vendas' :
              name === 'lucro' ? 'Lucro' : 'Valor Compra'
            ]}
            labelFormatter={(label) => `Data: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="vendas"
            stroke="#0088FE"
            fillOpacity={1}
            fill="url(#vendas)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="lucro"
            stroke="#4CAF50"
            fillOpacity={1}
            fill="url(#lucro)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="valorCompra"
            stroke="#FF9800"
            fillOpacity={1}
            fill="url(#valorCompra)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}

