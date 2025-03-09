import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  LinearProgress, Box, Typography, Chip
} from '@mui/material';

const MetasTable = ({ vendas, goals, marginGoals, onGoalChange, onMarginGoalChange }) => {
  const [editingGoal, setEditingGoal] = useState({});
  const [editingMargin, setEditingMargin] = useState({});

  // Função para lidar com a mudança de meta de vendas
  const handleGoalChange = (sku, value) => {
    setEditingGoal({ ...editingGoal, [sku]: value });
  };

  // Função para lidar com a mudança de meta de margem
  const handleMarginChange = (sku, value) => {
    setEditingMargin({ ...editingMargin, [sku]: value });
  };

  // Função para salvar a meta de vendas
  const saveGoal = (sku) => {
    if (editingGoal[sku]) {
      onGoalChange(sku, parseFloat(editingGoal[sku]));
      setEditingGoal({ ...editingGoal, [sku]: '' });
    }
  };

  // Função para salvar a meta de margem
  const saveMargin = (sku) => {
    if (editingMargin[sku]) {
      onMarginGoalChange(sku, parseFloat(editingMargin[sku]));
      setEditingMargin({ ...editingMargin, [sku]: '' });
    }
  };

  // Calcular progresso para cada SKU
  const calcularProgresso = (valorAtual, meta) => {
    if (!meta || meta <= 0) return 0;
    const progresso = (valorAtual / meta) * 100;
    return Math.min(progresso, 100); // Limitar a 100%
  };

  // Determinar status baseado no progresso
  const getStatusVendas = (progresso) => {
    if (progresso >= 100) return { color: 'success', label: 'Meta Alcançada' };
    if (progresso >= 60) return { color: 'info', label: 'Meta Alcançável' };
    if (progresso >= 40) return { color: 'warning', label: 'Atenção' };
    return { color: 'error', label: 'Risco Alto' };
  };

  console.log('Vendas recebidas na tabela:', vendas);
  console.log('Metas recebidas na tabela:', goals);

  return (
    <TableContainer component={Paper} sx={{ mt: 3, overflow: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>SKU</TableCell>
            <TableCell>Produto</TableCell>
            <TableCell align="right">Vendas (R$)</TableCell>
            <TableCell align="right">Unidades</TableCell>
            <TableCell align="right">Margem (%)</TableCell>
            <TableCell align="right">Meta Vendas (R$)</TableCell>
            <TableCell align="right">Meta Margem (%)</TableCell>
            <TableCell align="center">Progresso</TableCell>
            <TableCell align="center">Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vendas.map((venda) => {
            // Calcular progresso com base no valor vendido e na meta
            const metaVendas = goals[venda.sku] || 0;
            const progressoVendas = calcularProgresso(venda.valor_vendido, metaVendas);
            const statusVendas = getStatusVendas(progressoVendas);
            
            // Calcular progresso da margem
            const metaMargem = marginGoals[venda.sku] || 0;
            const progressoMargem = calcularProgresso(venda.margem_lucro, metaMargem);
            
            return (
              <TableRow key={venda.sku}>
                <TableCell>{venda.sku}</TableCell>
                <TableCell>{venda.produto || 'Sem descrição'}</TableCell>
                <TableCell align="right">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(venda.valor_vendido)}
                </TableCell>
                <TableCell align="right">{venda.unidades}</TableCell>
                <TableCell align="right">{venda.margem_lucro.toFixed(2)}%</TableCell>
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={editingGoal[venda.sku] || ''}
                    onChange={(e) => handleGoalChange(venda.sku, e.target.value)}
                    onBlur={() => saveGoal(venda.sku)}
                    onKeyPress={(e) => e.key === 'Enter' && saveGoal(venda.sku)}
                    placeholder={goals[venda.sku] ? goals[venda.sku].toString() : '0'}
                    InputProps={{
                      startAdornment: <span style={{ marginRight: 4 }}>R$</span>,
                    }}
                    sx={{ width: '120px' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={editingMargin[venda.sku] || ''}
                    onChange={(e) => handleMarginChange(venda.sku, e.target.value)}
                    onBlur={() => saveMargin(venda.sku)}
                    onKeyPress={(e) => e.key === 'Enter' && saveMargin(venda.sku)}
                    placeholder={marginGoals[venda.sku] ? marginGoals[venda.sku].toString() : '0'}
                    InputProps={{
                      endAdornment: <span style={{ marginLeft: 4 }}>%</span>,
                    }}
                    sx={{ width: '100px' }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={progressoVendas} 
                        color={statusVendas.color}
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">
                        {`${Math.round(progressoVendas)}%`}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={statusVendas.label} 
                    color={statusVendas.color} 
                    size="small"
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