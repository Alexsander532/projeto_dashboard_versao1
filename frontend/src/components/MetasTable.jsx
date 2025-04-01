import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  LinearProgress, Box, Typography, Chip
} from '@mui/material';
import { updateMeta } from '../services/metasService';
import api from '../config/api';

const MetasTable = ({ vendas, goals, marginGoals, onGoalChange, onMarginGoalChange }) => {
  const [editingGoal, setEditingGoal] = useState({});
  const [editingMargin, setEditingMargin] = useState({});

  // Função para formatar valor para exibição
  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para converter string monetária em número
  const parseCurrencyToNumber = (value) => {
    if (!value) return 0;
    return Number(value.replace(/[^0-9,-]/g, '').replace(',', '.'));
  };

  // Função para salvar meta (similar ao test-insert.js)
  const saveMeta = async (sku, metaVendas, metaMargem) => {
    try {
      const currentDate = new Date();
      const mesAno = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;

      console.log(`Inserindo meta para SKU=${sku}, Vendas=${metaVendas}, Margem=${metaMargem}, Mês=${mesAno}`);

      // Verificar se já existe uma meta para este SKU/mês
      const checkResponse = await api.get(`/api/metas?mes_ano=${mesAno}`);
      const existingMeta = checkResponse.data.find(meta => meta.sku === sku);

      let response;
      if (existingMeta) {
        // Atualizar meta existente
        response = await api.post(`/api/metas/${sku}`, {
          meta_vendas: metaVendas,
          meta_margem: metaMargem,
          mes_ano: mesAno
        });
        console.log('Meta atualizada:', response.data);
      } else {
        // Inserir nova meta
        response = await api.post(`/api/metas/${sku}`, {
          meta_vendas: metaVendas,
          meta_margem: metaMargem,
          mes_ano: mesAno
        });
        console.log('Nova meta criada:', response.data);
      }

      // Verificar se o registro foi inserido/atualizado
      const checkResult = await api.get(`/api/metas?mes_ano=${mesAno}`);
      const savedMeta = checkResult.data.find(meta => meta.sku === sku);
      
      if (savedMeta) {
        console.log('Meta confirmada no banco:', savedMeta);
        return true;
      } else {
        console.error('Meta não encontrada após salvamento');
        return false;
      }
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      return false;
    }
  };

  // Manipular mudança no input de meta de vendas
  const handleGoalChange = (sku, value) => {
    setEditingGoal(prev => ({
      ...prev,
      [sku]: value
    }));
  };

  // Manipular mudança no input de meta de margem
  const handleMarginChange = (sku, value) => {
    setEditingMargin(prev => ({
      ...prev,
      [sku]: value
    }));
  };

  // Manipular quando o usuário termina a edição da meta de vendas
  const handleGoalBlur = async (sku) => {
    try {
      const value = editingGoal[sku];
      if (!value) return;

      const metaVendas = parseCurrencyToNumber(value);
      if (isNaN(metaVendas)) {
        console.error('Valor inválido para meta de vendas:', value);
        return;
      }

      const metaMargem = marginGoals[sku] || 0;
      const success = await saveMeta(sku, metaVendas, metaMargem);
      
      if (success) {
        // Atualizar o estado global
        onGoalChange(sku, metaVendas);
        
        // Limpar o estado de edição
        setEditingGoal(prev => {
          const newState = { ...prev };
          delete newState[sku];
          return newState;
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar meta de vendas:', error);
    }
  };

  // Manipular quando o usuário termina a edição da meta de margem
  const handleMarginBlur = async (sku) => {
    try {
      const value = editingMargin[sku];
      if (!value) return;

      const metaMargem = parseFloat(value);
      if (isNaN(metaMargem)) {
        console.error('Valor inválido para meta de margem:', value);
        return;
      }

      const metaVendas = goals[sku] || 0;
      const success = await saveMeta(sku, metaVendas, metaMargem);
      
      if (success) {
        // Atualizar o estado global
        onMarginGoalChange(sku, metaMargem);
        
        // Limpar o estado de edição
        setEditingMargin(prev => {
          const newState = { ...prev };
          delete newState[sku];
          return newState;
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar meta de margem:', error);
    }
  };

  // Manipular tecla pressionada para meta de vendas
  const handleGoalKeyPress = (e, sku) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGoalBlur(sku);
    }
  };

  // Manipular tecla pressionada para meta de margem
  const handleMarginKeyPress = (e, sku) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleMarginBlur(sku);
    }
  };

  const formatPercentage = (value) => {
    const numValue = Number(value);
    return `${isNaN(numValue) ? 0 : numValue.toFixed(2)}%`;
  };

  // Calcular o progresso real baseado no valor vendido e na meta
  const calcularProgressoVendas = (valorVendido, metaVendas) => {
    // Converter para números para garantir cálculo correto
    const vendas = Number(valorVendido) || 0;
    const meta = Number(metaVendas) || 0;
    
    // Se não houver meta, retorna 0% de progresso
    if (meta <= 0) return 0;
    
    // Calcular a porcentagem de progresso e limitar a 100%
    const progresso = (vendas / meta) * 100;
    return Math.min(progresso, 100);
  };

  const getStatusVendas = (progresso) => {
    if (progresso >= 100) return { color: 'success', label: 'Meta Alcançada' };
    if (progresso >= 60) return { color: 'info', label: 'Meta Alcançável' };
    if (progresso >= 40) return { color: 'warning', label: 'Atenção' };
    return { color: 'error', label: 'Risco Alto' };
  };

  console.log('Vendas recebidas na tabela:', vendas);

  // Ordenar vendas por progresso (do maior para o menor)
  const vendasOrdenadas = [...vendas].map(venda => {
    const metaVendas = Number(goals[venda.sku]) || 0;
    const vendasRealizadas = Number(venda.valor_vendido) || 0;
    const progressoVendas = calcularProgressoVendas(vendasRealizadas, metaVendas);
    
    return {
      ...venda,
      progresso: progressoVendas
    };
  }).sort((a, b) => b.progresso - a.progresso);

  return (
    <TableContainer component={Paper} sx={{ mt: 3, overflow: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#1976d2' }}>
            <TableCell 
              sx={{ 
                color: 'white', 
                fontWeight: 'bold',
                textAlign: 'center'
              }}
            >
              SKU
            </TableCell>
            <TableCell 
              align="center"
              sx={{ 
                color: 'white', 
                fontWeight: 'bold' 
              }}
            >
              Vendas Realizadas
            </TableCell>
            <TableCell 
              align="center"
              sx={{ 
                color: 'white', 
                fontWeight: 'bold' 
              }}
            >
              Meta de Vendas
            </TableCell>
            <TableCell 
              align="center"
              sx={{ 
                color: 'white', 
                fontWeight: 'bold' 
              }}
            >
              Progresso
            </TableCell>
            <TableCell 
              align="center"
              sx={{ 
                color: 'white', 
                fontWeight: 'bold' 
              }}
            >
              Margem Atual
            </TableCell>
            <TableCell 
              align="center"
              sx={{ 
                color: 'white', 
                fontWeight: 'bold' 
              }}
            >
              Meta de Margem
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vendasOrdenadas.map((venda, index) => {
            const metaVendas = Number(goals[venda.sku]) || 0;
            const vendasRealizadas = Number(venda.valor_vendido) || 0;
            const progressoVendas = calcularProgressoVendas(vendasRealizadas, metaVendas);
            const statusVendas = getStatusVendas(progressoVendas);
            const margemAtual = Number(venda.margem_lucro) || 0;
            
            return (
              <TableRow 
                key={`${venda.sku}-${index}`}
                sx={{
                  '&:nth-of-type(odd)': {
                    backgroundColor: '#f5f5f5',
                  },
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  }
                }}
              >
                <TableCell align="center">{venda.sku || ''}</TableCell>
                <TableCell align="center">
                  {formatCurrency(vendasRealizadas)}
                </TableCell>
                <TableCell align="center">
                  <TextField
                    value={editingGoal[venda.sku] !== undefined 
                      ? editingGoal[venda.sku] 
                      : (goals[venda.sku] ? formatCurrency(goals[venda.sku]) : '')}
                    onChange={(e) => handleGoalChange(venda.sku, e.target.value)}
                    onBlur={() => handleGoalBlur(venda.sku)}
                    onKeyPress={(e) => handleGoalKeyPress(e, venda.sku)}
                    size="small"
                    placeholder="R$ 0,00"
                    inputProps={{
                      style: { textAlign: 'center' }
                    }}
                    sx={{ 
                      width: '150px',
                      '& .MuiInputBase-input': {
                        padding: '8px 4px'
                      }
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 0.5 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={progressoVendas} 
                      sx={{ 
                        width: '100%', 
                        height: 8, 
                        borderRadius: 1,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: theme => theme.palette[statusVendas.color].main
                        }
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="caption">
                        {progressoVendas.toFixed(0)}% 
                        {metaVendas > 0 && ` (${formatCurrency(vendasRealizadas)} / ${formatCurrency(metaVendas)})`}
                      </Typography>
                      <Chip 
                        label={statusVendas.label} 
                        color={statusVendas.color} 
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  {formatPercentage(margemAtual)}
                </TableCell>
                <TableCell align="center">
                  <TextField
                    value={editingMargin[venda.sku] !== undefined 
                      ? editingMargin[venda.sku] 
                      : (marginGoals[venda.sku] || '')}
                    onChange={(e) => handleMarginChange(venda.sku, e.target.value)}
                    onBlur={() => handleMarginBlur(venda.sku)}
                    onKeyPress={(e) => handleMarginKeyPress(e, venda.sku)}
                    size="small"
                    placeholder="0,00%"
                    inputProps={{
                      style: { textAlign: 'center' }
                    }}
                    sx={{ 
                      width: '100px',
                      '& .MuiInputBase-input': {
                        padding: '8px 4px'
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MetasTable; 