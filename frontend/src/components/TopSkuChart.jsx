import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme as useMuiTheme,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  Fade,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  CalendarMonth,
  FilterList,
  ShowChart,
  Inventory,
  AttachMoney,
} from '@mui/icons-material';
import { subDays, endOfDay, isAfter, isBefore } from 'date-fns';

function TopSkuChart({ vendas, vertical = true }) {
  const theme = useMuiTheme();
  const [topN, setTopN] = useState(5);
  const [metricType, setMetricType] = useState('unidades');
  const [dateRange, setDateRange] = useState('7D');
  const [anchorEl, setAnchorEl] = useState(null);

  const metricLabels = {
    unidades: 'Unidades Vendidas',
    lucro: 'Lucro Total',
    vendas: 'Valor em Vendas'
  };

  const formatValue = (value, type) => {
    if (type === 'unidades') return value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getMetricColor = (type) => {
    switch(type) {
      case 'unidades': return theme.palette.info.main;
      case 'lucro': return theme.palette.success.main;
      case 'vendas': return theme.palette.primary.main;
      default: return theme.palette.primary.main;
    }
  };

  // Filtra dados baseado no dateRange
  const filteredData = useMemo(() => {
    if (!vendas?.length) return [];
    
    if (dateRange === 'ALL') return vendas;
    
    const hoje = new Date();
    const dias = parseInt(dateRange);
    const dataInicial = subDays(hoje, dias);
    
    return vendas.filter(venda => {
      const dataVenda = new Date(venda.data);
      return isAfter(dataVenda, dataInicial) && isBefore(dataVenda, endOfDay(hoje));
    });
  }, [vendas, dateRange]);

  // Atualiza o processedData para usar filteredData em vez de vendas
  const processedData = useMemo(() => {
    // Agrupa por SKU
    const skuData = filteredData.reduce((acc, venda) => {
      const { sku } = venda;
      if (!acc[sku]) {
        acc[sku] = {
          sku,
          unidades: 0,
          lucro: 0,
          vendas: 0
        };
      }
      acc[sku].unidades += Number(venda.unidades) || 0;
      acc[sku].lucro += Number(venda.lucro) || 0;
      acc[sku].vendas += Number(venda.valor_vendido) || 0;
      return acc;
    }, {});

    // Converte para array e ordena
    return Object.values(skuData)
      .sort((a, b) => b[metricType] - a[metricType])
      .slice(0, topN)
      .map(item => ({
        ...item,
        formattedValue: formatValue(item[metricType], metricType)
      }));
  }, [filteredData, metricType, topN]);

  return (
    <Card sx={{ p: 3, height: '100%' }}>
      {/* Cabeçalho do Card */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 600,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(45deg, #f1f5f9 30%, #e2e8f0 90%)'
              : 'linear-gradient(45deg, #1e293b 30%, #334155 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Top SKUs por Performance
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ opacity: 0.8 }}
        >
          Análise comparativa dos produtos mais vendidos
        </Typography>
      </Box>

      {/* Barra de Filtros */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4,
        gap: 2,
        flexWrap: 'wrap'
      }}>
        {/* Filtro de Métrica */}
        <ToggleButtonGroup
          value={metricType}
          exclusive
          onChange={(_, value) => value && setMetricType(value)}
          size="small"
          sx={{ 
            '& .MuiToggleButton-root': {
              px: 2,
              py: 1,
              borderRadius: '8px !important',
              border: `1px solid ${theme.palette.divider} !important`,
              '&.Mui-selected': {
                backgroundColor: `${getMetricColor(metricType)}15 !important`,
                color: `${getMetricColor(metricType)} !important`,
              }
            }
          }}
        >
          <ToggleButton value="unidades">
            <Inventory sx={{ mr: 1, fontSize: '1.1rem' }} />
            Unidades
          </ToggleButton>
          <ToggleButton value="lucro">
            <ShowChart sx={{ mr: 1, fontSize: '1.1rem' }} />
            Lucro
          </ToggleButton>
          <ToggleButton value="vendas">
            <AttachMoney sx={{ mr: 1, fontSize: '1.1rem' }} />
            Vendas
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Filtro de Quantidade */}
          <ToggleButtonGroup
            value={topN}
            exclusive
            onChange={(_, value) => value && setTopN(value)}
            size="small"
            sx={{ 
              '& .MuiToggleButton-root': {
                borderRadius: '8px !important',
                border: `1px solid ${theme.palette.divider} !important`,
                '&.Mui-selected': {
                  backgroundColor: `${theme.palette.primary.main}15 !important`,
                  color: theme.palette.primary.main,
                }
              }
            }}
          >
            <ToggleButton value={5}>Top 5</ToggleButton>
            <ToggleButton value={7}>Top 7</ToggleButton>
            <ToggleButton value={10}>Top 10</ToggleButton>
          </ToggleButtonGroup>

          {/* Filtro de Período */}
          <IconButton 
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              p: 1
            }}
          >
            <CalendarMonth />
          </IconButton>
        </Box>
      </Box>

      {/* Gráfico modificado para vertical */}
      <Box sx={{ height: 300, width: '100%' }}>
        <ResponsiveContainer>
          <BarChart
            data={processedData}
            layout={vertical ? 'vertical' : 'horizontal'}
            margin={{ left: 20, right: 20, bottom: 20, top: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            {vertical ? (
              <>
                <XAxis type="category" dataKey="sku" />
                <YAxis type="number" />
              </>
            ) : (
              <>
                <XAxis type="number" />
                <YAxis type="category" dataKey="sku" />
              </>
            )}
            <RechartsTooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px'
              }}
              formatter={(value) => [formatValue(value, metricType), metricLabels[metricType]]}
            />
            <Bar
              dataKey={metricType}
              fill={getMetricColor(metricType)}
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Menu de Período */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        TransitionComponent={Fade}
      >
        <MenuItem onClick={() => { setDateRange('7D'); setAnchorEl(null); }}>
          Últimos 7 dias
        </MenuItem>
        <MenuItem onClick={() => { setDateRange('15D'); setAnchorEl(null); }}>
          Últimos 15 dias
        </MenuItem>
        <MenuItem onClick={() => { setDateRange('30D'); setAnchorEl(null); }}>
          Últimos 30 dias
        </MenuItem>
        <MenuItem onClick={() => { setDateRange('ALL'); setAnchorEl(null); }}>
          Todo o período
        </MenuItem>
      </Menu>
    </Card>
  );
}

export default TopSkuChart; 