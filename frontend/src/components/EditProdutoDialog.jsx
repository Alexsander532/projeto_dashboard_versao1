import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box
} from '@mui/material';

export default function EditProdutoDialog({ open, produto, onClose, onSave }) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (produto) {
      setFormData({
        sku: produto.sku,
        produto: produto.produto,
        estoque: produto.estoque,
        minimo: produto.minimo,
        precoCompra: produto.precoCompra,
        valorLiquidoMedio: produto.valorLiquidoMedio
      });
    }
  }, [produto]);

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async () => {
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      TransitionProps={{
        unmountOnExit: true // Garante que o componente seja desmontado ao fechar
      }}
    >
      <DialogTitle>Editar Produto</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="SKU"
            value={formData.sku || ''}
            disabled
          />
          <TextField
            label="Produto"
            value={formData.produto || ''}
            onChange={handleChange('produto')}
          />
          <TextField
            label="Estoque"
            type="number"
            value={formData.estoque || ''}
            onChange={handleChange('estoque')}
          />
          <TextField
            label="Mínimo"
            type="number"
            value={formData.minimo || ''}
            onChange={handleChange('minimo')}
          />
          <TextField
            label="Preço de Compra"
            type="number"
            value={formData.precoCompra || ''}
            onChange={handleChange('precoCompra')}
          />
          <TextField
            label="Valor Líquido Médio"
            type="number"
            value={formData.valorLiquidoMedio || ''}
            onChange={handleChange('valorLiquidoMedio')}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Salvar</Button>
      </DialogActions>
    </Dialog>
  );
} 