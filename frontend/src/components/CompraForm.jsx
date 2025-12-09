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
  Divider,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Paper
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

export default function CompraForm({ open, onClose, onSubmit, produtoInicial }) {
  const [formData, setFormData] = useState({
    fornecedor: '',
    valor: '',
    produtos: [],
    previsaoEntrega: '',
    dataPedido: new Date().toISOString().split('T')[0],
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

  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});

  // Passos do formulário - Novo order: Produtos → Dados → Confirmação
  const steps = ['Produtos', 'Dados Básicos', 'Confirmação'];

  useEffect(() => {
    if (open) {
      if (produtoInicial) {
        // Se houver um produto inicial, adiciona ele automaticamente com quantidade corrigida
        setFormData(prev => ({
          ...prev,
          produtos: [{
            sku: produtoInicial.sku,
            quantidade: produtoInicial.quantidadeParaComprar || 1,
            precoCompra: produtoInicial.precoCompra || 0
          }]
        }));
      } else {
        // Caso contrário, limpa o formulário
        setFormData({
          fornecedor: '',
          valor: '',
          produtos: [],
          previsaoEntrega: '',
          dataPedido: new Date().toISOString().split('T')[0],
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

  const handleEditarQuantidade = (index, novaQuantidade) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.map((prod, i) => 
        i === index 
          ? { ...prod, quantidade: novaQuantidade }
          : prod
      )
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validações
    const novosErros = {};
    
    if (!formData.fornecedor.trim()) {
      novosErros.fornecedor = 'Fornecedor é obrigatório';
    }
    
    if (!formData.dataPedido) {
      novosErros.dataPedido = 'Data do pedido é obrigatória';
    }
    
    if (formData.previsaoEntrega && formData.dataPedido) {
      const dataPedido = new Date(formData.dataPedido);
      const previsaoEntrega = new Date(formData.previsaoEntrega);
      
      if (previsaoEntrega <= dataPedido) {
        novosErros.previsaoEntrega = 'Previsão de entrega deve ser posterior à data do pedido';
      }
    }
    
    if (formData.produtos.length === 0) {
      novosErros.produtos = 'Adicione pelo menos um produto ao pedido';
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      novosErros.valor = 'Valor deve ser maior que zero';
    }
    
    if (Object.keys(novosErros).length > 0) {
      setErrors(novosErros);
      return;
    }
    
    setErrors({});
    onSubmit({
      ...formData,
      valor: parseFloat(formData.valor) || 0
    });
  };

  // Calcula o valor total baseado nos produtos e seus preços de compra
  const calcularValorTotal = () => {
    return formData.produtos.reduce((total, prod) => {
      // Agora usa precoCompra do item ao invés de cmv
      const preco = parseFloat(prod.precoCompra) || 0;
      const quantidade = parseFloat(prod.quantidade) || 0;
      return total + (preco * quantidade);
    }, 0);
  };

  // Atualiza o valor total quando produtos são adicionados/removidos
  useEffect(() => {
    const valorTotal = calcularValorTotal();
    if (valorTotal > 0 || formData.produtos.length > 0) {
      setFormData(prev => ({
        ...prev,
        valor: valorTotal.toFixed(2)
      }));
    }
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
      
      {/* Stepper para visualizar progresso */}
      <Stepper activeStep={activeStep} sx={{ px: 2, pt: 2 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 3 }}>
          {/* Passo 0: Produtos (AGORA PRIMEIRO) */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                📦 Selecione os Produtos
              </Typography>

              {/* Se não for reposição, permite adicionar produtos */}
              {!produtoInicial && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Adicionar Produto
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Autocomplete
                      options={produtos}
                      getOptionLabel={(option) => `${option.sku} - ${option.nome}`}
                      value={produtos.find(p => p.sku === produtoTemp.sku) || null}
                      onChange={(_, newValue) => {
                        setProdutoTemp(prev => ({
                          ...prev,
                          sku: newValue ? newValue.sku : '',
                          precoCompra: newValue ? newValue.preco_compra || 0 : ''
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
                      inputProps={{ min: 1 }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddProduto}
                      startIcon={<AddIcon />}
                      sx={{ mt: 1 }}
                    >
                      Adicionar
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Lista de produtos selecionados */}
              {formData.produtos.length > 0 ? (
                <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    ✅ {formData.produtos.length} Produto{formData.produtos.length > 1 ? 's' : ''} Selecionado{formData.produtos.length > 1 ? 's' : ''}
                  </Typography>
                  {formData.produtos.map((prod, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        mb: 1,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          {prod.sku}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Quantidade:
                          </Typography>
                          <TextField
                            type="number"
                            size="small"
                            value={parseFloat(prod.quantidade) || 0}
                            onChange={(e) => handleEditarQuantidade(index, e.target.value)}
                            inputProps={{ min: 1 }}
                            sx={{ width: 80 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            un. × R$ {(parseFloat(prod.precoCompra) || 0).toFixed(2)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', color: 'success.main', fontWeight: 600 }}>
                          Subtotal: R$ {((parseFloat(prod.quantidade) || 0) * (parseFloat(prod.precoCompra) || 0)).toFixed(2)}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveProduto(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  ))}
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Valor Total dos Produtos
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      R$ {calcularValorTotal().toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Nenhum produto selecionado ainda
                </Alert>
              )}
              {errors.produtos && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {errors.produtos}
                </Alert>
              )}
            </Box>
          )}

          {/* Passo 1: Dados Básicos (AGORA SEGUNDO) */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                📋 Dados do Pedido
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    name="fornecedor"
                    label="Fornecedor"
                    fullWidth
                    value={formData.fornecedor}
                    onChange={handleChange}
                    error={!!errors.fornecedor}
                    helperText={errors.fornecedor}
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
                    error={!!errors.valor}
                    helperText={errors.valor || `(Auto-calculado: R$ ${calcularValorTotal().toFixed(2)})`}
                    inputProps={{
                      step: '0.01',
                      min: '0'
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="dataPedido"
                    label="Data do Pedido"
                    type="date"
                    fullWidth
                    value={formData.dataPedido}
                    onChange={handleChange}
                    error={!!errors.dataPedido}
                    helperText={errors.dataPedido}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="previsaoEntrega"
                    label="Previsão de Entrega"
                    type="date"
                    fullWidth
                    value={formData.previsaoEntrega}
                    onChange={handleChange}
                    error={!!errors.previsaoEntrega}
                    helperText={errors.previsaoEntrega}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    name="observacoes"
                    label="Observações"
                    multiline
                    rows={3}
                    fullWidth
                    value={formData.observacoes}
                    onChange={handleChange}
                    placeholder="Adicione anotações sobre o pedido..."
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Passo 2: Confirmação (AGORA TERCEIRO) */}
          {activeStep === 2 && (
            <Box>
              <Paper sx={{ p: 3, bgcolor: '#f5f5f5', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Resumo do Pedido
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Fornecedor
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formData.fornecedor}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Data do Pedido
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {new Date(formData.dataPedido).toLocaleDateString('pt-BR')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Previsão de Entrega
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formData.previsaoEntrega ? new Date(formData.previsaoEntrega).toLocaleDateString('pt-BR') : 'Não definida'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary">
                      Valor Total
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      R$ {parseFloat(formData.valor).toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Produtos ({formData.produtos.length})
                </Typography>
                {formData.produtos.map((prod, index) => (
                  <Box key={index} sx={{ mb: 1, pb: 1, borderBottom: '1px solid #ddd' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">{prod.sku}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {prod.quantidade} un. × R$ {(prod.precoCompra || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Paper>

              {formData.observacoes && (
                <Paper sx={{ p: 2, bgcolor: '#fff3cd', border: '1px solid #ffc107' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Observações
                  </Typography>
                  <Typography variant="body2">
                    {formData.observacoes}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose}>Cancelar</Button>
          
          {activeStep > 0 && (
            <Button onClick={() => setActiveStep(activeStep - 1)}>
              Voltar
            </Button>
          )}
          
          {activeStep < steps.length - 1 ? (
            <Button 
              variant="contained"
              onClick={() => {
                const novosErros = {};

                // Validação do Passo 0: Produtos
                if (activeStep === 0) {
                  if (formData.produtos.length === 0) {
                    setErrors({ produtos: 'Adicione pelo menos um produto' });
                    return;
                  }
                }

                // Validação do Passo 1: Dados Básicos
                if (activeStep === 1) {
                  if (!formData.fornecedor.trim()) novosErros.fornecedor = 'Obrigatório';
                  if (!formData.dataPedido) novosErros.dataPedido = 'Obrigatório';
                  if (!formData.previsaoEntrega) novosErros.previsaoEntrega = 'Obrigatório';
                  if (formData.previsaoEntrega && formData.dataPedido) {
                    const dataPedido = new Date(formData.dataPedido);
                    const previsaoEntrega = new Date(formData.previsaoEntrega);
                    if (previsaoEntrega <= dataPedido) {
                      novosErros.previsaoEntrega = 'Deve ser posterior ao pedido';
                    }
                  }
                  if (Object.keys(novosErros).length > 0) {
                    setErrors(novosErros);
                    return;
                  }
                }

                setErrors({});
                setActiveStep(activeStep + 1);
              }}
            >
              Próximo
            </Button>
          ) : (
            <Button 
              type="submit" 
              variant="contained"
              color="success"
            >
              Criar Pedido
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
} 