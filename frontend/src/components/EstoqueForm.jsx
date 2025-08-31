import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  useTheme,
  InputAdornment
} from '@mui/material';

function EstoqueForm({ open, onClose, onSubmit, produto }) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    sku: '',
    descricao: '',
    estoque: '',
    cmv: '',
    minimo: '',
    valor_liquido: ''
  });

  useEffect(() => {
    if (produto) {
      setFormData({
        sku: produto.sku || '',
        descricao: produto.produto || produto.descricao || '',
        estoque: produto.estoque || '',
        cmv: produto.precoCompra || produto.cmv || '',
        minimo: produto.minimo || '',
        valor_liquido: produto.valorLiquidoMedio || produto.valor_liquido || ''
      });
    } else {
      setFormData({
        sku: '',
        descricao: '',
        estoque: '',
        cmv: '',
        minimo: '',
        valor_liquido: ''
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      produto: formData.descricao,
      estoque: Number(formData.estoque),
      precoCompra: Number(formData.cmv),
      minimo: Number(formData.minimo),
      valorLiquidoMedio: Number(formData.valor_liquido),
      sku: formData.sku
    });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'none'
        }
      }}
    >
      <DialogTitle>
        {produto ? 'Editar Produto' : 'Novo Produto'}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="sku"
                label="SKU"
                value={formData.sku}
                onChange={handleChange}
                fullWidth
                required
                disabled={!!produto}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="estoque"
                label="Quantidade em Estoque"
                type="number"
                value={formData.estoque}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                name="descricao"
                label="Descrição do Produto"
                value={formData.descricao}
                onChange={handleChange}
                fullWidth
                required
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="cmv"
                label="CMV"
                type="number"
                value={formData.cmv}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="valor_liquido"
                label="Valor Líquido"
                type="number"
                value={formData.valor_liquido}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="minimo"
                label="Estoque Mínimo"
                type="number"
                value={formData.minimo}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="contained"
            sx={{
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
            }}
          >
            {produto ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default EstoqueForm; 