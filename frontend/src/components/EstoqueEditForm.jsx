import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  useTheme,
} from '@mui/material';

export default function EstoqueEditForm({ open, onClose, product, onSave }) {
  const theme = useTheme();
  const [editedProduct, setEditedProduct] = useState(product);

  const handleChange = (field) => (event) => {
    setEditedProduct(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedProduct);
  };

  const calculateMargin = () => {
    const cost = parseFloat(editedProduct.precoCompra);
    const price = parseFloat(editedProduct.precoVenda);
    if (cost && price) {
      return ((price - cost) / cost * 100).toFixed(2);
    }
    return '0.00';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          Editar Produto
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
            SKU: {editedProduct.sku}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Informações Básicas */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Informações Básicas
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Produto"
                value={editedProduct.nome}
                onChange={handleChange('nome')}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Fornecedor</InputLabel>
                <Select
                  value={editedProduct.fornecedor}
                  onChange={handleChange('fornecedor')}
                  label="Fornecedor"
                >
                  <MenuItem value="Distribuidor KG">Distribuidor KG</MenuItem>
                  <MenuItem value="GP Distribuidora">GP Distribuidora</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Informações de Estoque */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Informações de Estoque
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Quantidade em Estoque"
                value={editedProduct.quantidade}
                onChange={handleChange('quantidade')}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Estoque Mínimo"
                value={editedProduct.minimo}
                onChange={handleChange('minimo')}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={editedProduct.status}
                  onChange={handleChange('status')}
                  label="Status"
                >
                  <MenuItem value="Em Estoque">Em Estoque</MenuItem>
                  <MenuItem value="Baixo Estoque">Baixo Estoque</MenuItem>
                  <MenuItem value="Sem Estoque">Sem Estoque</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Informações de Preço */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Informações de Preço
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Preço de Compra (R$)"
                value={editedProduct.precoCompra}
                onChange={handleChange('precoCompra')}
                size="small"
                inputProps={{ step: "0.01" }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Preço de Venda (R$)"
                value={editedProduct.precoVenda}
                onChange={handleChange('precoVenda')}
                size="small"
                inputProps={{ step: "0.01" }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 2,
                  height: '100%',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.palette.success.main + '15',
                  color: theme.palette.success.main,
                }}
              >
                <Typography variant="h6">
                  {calculateMargin()}% margem
                </Typography>
              </Box>
            </Grid>

            {/* Informações de Marketplace */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Informações de Marketplace
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Marketplace</InputLabel>
                <Select
                  value={editedProduct.marketplace}
                  onChange={handleChange('marketplace')}
                  label="Marketplace"
                >
                  <MenuItem value="Mercado Livre">Mercado Livre</MenuItem>
                  <MenuItem value="Magalu">Magalu</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Vendas nos Últimos 30 dias"
                value={editedProduct.vendas30d}
                onChange={handleChange('vendas30d')}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="contained"
            sx={{ px: 4 }}
          >
            Salvar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
