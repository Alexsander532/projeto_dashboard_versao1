import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '@mui/material';

const data = [
  { data: '01/12', vendas: 4000, lucro: 2400, valorCompra: 1800 },
  { data: '02/12', vendas: 3500, lucro: 2100, valorCompra: 1600 },
  { data: '03/12', vendas: 3200, lucro: 1900, valorCompra: 1500 },
  { data: '04/12', vendas: 2800, lucro: 1600, valorCompra: 1400 },
  { data: '05/12', vendas: 2600, lucro: 1500, valorCompra: 1300 },
  { data: '06/12', vendas: 4500, lucro: 2700, valorCompra: 2000 },
  { data: '07/12', vendas: 4200, lucro: 2500, valorCompra: 1900 }
];

export default function TendenciaChart() {
  const theme = useTheme();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2196f3" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#2196f3" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4caf50" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#4caf50" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorCompra" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ff9800" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#ff9800" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false}
          stroke={theme.palette.divider}
        />
        <XAxis 
          dataKey="data" 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: theme.palette.divider }}
        />
        <YAxis 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: theme.palette.divider }}
          tickFormatter={(value) => `R$ ${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px'
          }}
          formatter={(value) => [`R$ ${value}`, '']}
        />
        <Area
          type="monotone"
          dataKey="vendas"
          stroke="#2196f3"
          strokeWidth={2}
          fill="url(#colorVendas)"
          name="Vendas"
        />
        <Area
          type="monotone"
          dataKey="lucro"
          stroke="#4caf50"
          strokeWidth={2}
          fill="url(#colorLucro)"
          name="Lucro"
        />
        <Area
          type="monotone"
          dataKey="valorCompra"
          stroke="#ff9800"
          strokeWidth={2}
          fill="url(#colorCompra)"
          name="Valor Compra"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
} 