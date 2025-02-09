import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export default function EditProdutoDialog({ open, onClose, produto, onSave }) {
  const [formData, setFormData] = useState({
    sku: '',
    produto: '',
    estoque: 0,
    minimo: 0,
    precoCompra: 0,
    valorLiquidoMedio: 0
  });

  useEffect(() => {
    if (produto) {
      setFormData({
        sku: produto.sku || '',
        produto: produto.produto || '',
        estoque: produto.estoque || 0,
        minimo: produto.minimo || 0,
        precoCompra: produto.precoCompra || 0,
        valorLiquidoMedio: produto.valorLiquidoMedio || 0
      });
    }
  }, [produto]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Editar Produto
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              disabled
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Produto"
              name="produto"
              value={formData.produto}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estoque"
              name="estoque"
              type="number"
              value={formData.estoque}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estoque Mínimo"
              name="minimo"
              type="number"
              value={formData.minimo}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Preço de Compra"
              name="precoCompra"
              type="number"
              value={formData.precoCompra}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Valor Líquido Médio"
              name="valorLiquidoMedio"
              type="number"
              value={formData.valorLiquidoMedio}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained">Salvar</Button>
      </DialogActions>
    </Dialog>
  );
} 