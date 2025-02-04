import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  IconButton,
  Typography,
  Autocomplete,
  InputAdornment,
  Divider
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

export default function CompraForm({ open, onClose, onSubmit, produtoInicial }) {
  const [formData, setFormData] = useState({
    fornecedor: '',
    valor: '',
    produtos: [],
    previsaoEntrega: '',
    observacoes: ''
  });

  const [produtoTemp, setProdutoTemp] = useState({
    sku: '',
    quantidade: ''
  });

  const [produtos, setProdutos] = useState(() => {
    const savedProdutos = localStorage.getItem('produtos');
    return savedProdutos ? JSON.parse(savedProdutos) : [];
  });

  useEffect(() => {
    if (open) {
      if (produtoInicial) {
        // Se houver um produto inicial, adiciona ele automaticamente
        setFormData(prev => ({
          ...prev,
          produtos: [produtoInicial]
        }));
      } else {
        // Caso contrário, limpa o formulário
        setFormData({
          fornecedor: '',
          valor: '',
          produtos: [],
          previsaoEntrega: '',
          observacoes: ''
        });
      }
      setProdutoTemp({
        sku: '',
        quantidade: ''
      });
    }
  }, [open, produtoInicial]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProdutoTempChange = (e) => {
    const { name, value } = e.target;
    setProdutoTemp(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddProduto = () => {
    if (produtoTemp.sku && produtoTemp.quantidade) {
      setFormData(prev => ({
        ...prev,
        produtos: [...prev.produtos, { ...produtoTemp }]
      }));
      setProdutoTemp({
        sku: '',
        quantidade: ''
      });
    }
  };

  const handleRemoveProduto = (index) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.produtos.length === 0) {
      alert('Adicione pelo menos um produto ao pedido');
      return;
    }
    onSubmit(formData);
  };

  // Calcula o valor total baseado nos produtos e seus preços
  const calcularValorTotal = () => {
    return formData.produtos.reduce((total, prod) => {
      const produto = produtos.find(p => p.sku === prod.sku);
      if (produto) {
        return total + (produto.cmv * prod.quantidade);
      }
      return total;
    }, 0);
  };

  // Atualiza o valor total quando produtos são adicionados/removidos
  useEffect(() => {
    const valorTotal = calcularValorTotal();
    setFormData(prev => ({
      ...prev,
      valor: valorTotal.toString()
    }));
  }, [formData.produtos]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {produtoInicial ? 'Criar Pedido de Compra para Reposição' : 'Novo Pedido de Compra'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                name="fornecedor"
                label="Fornecedor"
                fullWidth
                value={formData.fornecedor}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                name="valor"
                label="Valor Total"
                type="number"
                fullWidth
                value={formData.valor}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  readOnly: true
                }}
              />
            </Grid>

            {!produtoInicial && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Produtos
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Autocomplete
                      options={produtos}
                      getOptionLabel={(option) => `${option.sku} - ${option.nome}`}
                      value={produtos.find(p => p.sku === produtoTemp.sku) || null}
                      onChange={(_, newValue) => {
                        setProdutoTemp(prev => ({
                          ...prev,
                          sku: newValue ? newValue.sku : ''
                        }));
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Produto"
                          required
                          sx={{ minWidth: 300 }}
                        />
                      )}
                    />
                    <TextField
                      required
                      name="quantidade"
                      label="Quantidade"
                      type="number"
                      value={produtoTemp.quantidade}
                      onChange={handleProdutoTempChange}
                      sx={{ width: 150 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddProduto}
                      startIcon={<AddIcon />}
                    >
                      Adicionar
                    </Button>
                  </Box>
                </Grid>
              </>
            )}

            {formData.produtos.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Produtos Adicionados
                  </Typography>
                  {formData.produtos.map((prod, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1,
                        mb: 1,
                        bgcolor: 'background.default',
                        borderRadius: 1
                      }}
                    >
                      <Typography>
                        {prod.sku} - {produtos.find(p => p.sku === prod.sku)?.nome}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography color="text.secondary">
                          Qtd: {prod.quantidade}
                        </Typography>
                        {!produtoInicial && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveProduto(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                required
                name="previsaoEntrega"
                label="Previsão de Entrega"
                type="date"
                fullWidth
                value={formData.previsaoEntrega}
                onChange={handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                name="observacoes"
                label="Observações"
                multiline
                rows={4}
                fullWidth
                value={formData.observacoes}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={formData.produtos.length === 0}
          >
            Criar Pedido
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 