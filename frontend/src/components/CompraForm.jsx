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
  Paper,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { fetchEstoque } from '../services/estoqueService';
import { criarPedido, atualizarPedido } from '../services/comprasService';

export default function CompraForm({ open, onClose, onSubmit, produtoInicial, pedidoParaEditar }) {
  const [formData, setFormData] = useState({
    fornecedor: '',
    valor: '',
    produtos: [],
    previsaoEntrega: '',
    dataPedido: new Date().toISOString().split('T')[0],
    observacoes: '',
    prazos: {
      fabricacao: 0,
      transito: 0,
      alfandega: 0
    }
  });

  const [produtoTemp, setProdutoTemp] = useState({
    sku: '',
    quantidade: '',
    precoCompra: 0
  });

  const [produtos, setProdutos] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);

  // Passos do formulário - Novo order: Produtos → Dados → Confirmação
  const steps = ['Produtos', 'Dados Básicos', 'Confirmação'];

  // Carregar produtos do banco de dados quando o diálogo abre
  useEffect(() => {
    if (open) {
      const carregarProdutos = async () => {
        try {
          setCarregandoProdutos(true);
          const dadosEstoque = await fetchEstoque();
          console.log('📦 Dados do estoque carregados:', dadosEstoque.slice(0, 3));
          // Mapear para formato compatível com Autocomplete
          const produtosFormatados = dadosEstoque.map(item => ({
            sku: item.sku,
            nome: item.produto,
            preco_compra: item.precoCompra || 0, // ← CORRIGIDO: usar precoCompra (camelCase)
            id: item.sku // usar SKU como ID único
          }));
          console.log('💰 Produtos formatados (primeiros 3):', produtosFormatados.slice(0, 3));
          setProdutos(produtosFormatados);
        } catch (error) {
          console.error('Erro ao carregar produtos:', error);
          setErrors(prev => ({
            ...prev,
            produtos: 'Erro ao carregar produtos do estoque'
          }));
        } finally {
          setCarregandoProdutos(false);
        }
      };
      carregarProdutos();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (pedidoParaEditar) {
        // Modo edição: carregar dados do pedido existente
        setFormData({
          fornecedor: pedidoParaEditar.fornecedor || '',
          valor: pedidoParaEditar.valor?.toString() || '',
          produtos: (pedidoParaEditar.produtos || []).map(p => ({
            sku: p.sku,
            quantidade: p.quantidade,
            precoCompra: p.preco_unitario || p.precoCompra || 0
          })),
          previsaoEntrega: pedidoParaEditar.previsao_entrega
            ? new Date(pedidoParaEditar.previsao_entrega).toISOString().split('T')[0]
            : '',
          dataPedido: pedidoParaEditar.data_pedido
            ? new Date(pedidoParaEditar.data_pedido).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          observacoes: pedidoParaEditar.observacoes || '',
          prazos: {
            fabricacao: pedidoParaEditar.prazo_fabricacao || 0,
            transito: pedidoParaEditar.prazo_transito || 0,
            alfandega: pedidoParaEditar.prazo_alfandega || 0
          }
        });
      } else if (produtoInicial) {
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
          observacoes: '',
          prazos: {
            fabricacao: 0,
            transito: 0,
            alfandega: 0
          }
        });
      }
      setProdutoTemp({
        sku: '',
        quantidade: '',
        precoCompra: 0
      });
      setActiveStep(0);
    }
  }, [open, produtoInicial, pedidoParaEditar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper para calcular data estimada
  const calcularDataEstimada = (dias) => {
    if (!formData.dataPedido || !dias) return null;
    const data = new Date(formData.dataPedido);
    data.setDate(data.getDate() + parseInt(dias));
    return data.toLocaleDateString('pt-BR');
  };

  const handlePrazosChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const novosPrazos = {
        ...prev.prazos,
        [name]: parseInt(value) || 0
      };

      // Recalcular previsão de entrega baseado nos prazos e data do pedido
      const dataPedido = new Date(prev.dataPedido);
      const totalDias = novosPrazos.fabricacao + novosPrazos.transito + novosPrazos.alfandega;
      dataPedido.setDate(dataPedido.getDate() + totalDias);

      return {
        ...prev,
        prazos: novosPrazos,
        previsaoEntrega: dataPedido.toISOString().split('T')[0]
      };
    });
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
        quantidade: '',
        precoCompra: 0
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

    // Fornecedor agora é opcional

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
    submitarPedido();
  };

  const submitarPedido = async () => {
    try {
      setLoading(true);

      // Preparar dados para enviar à API
      const dadosPedido = {
        fornecedor: formData.fornecedor || null,
        valor: parseFloat(formData.valor) || 0,
        dataPedido: formData.dataPedido,
        previsaoEntrega: formData.previsaoEntrega || null,
        observacoes: formData.observacoes || null,
        produtos: formData.produtos.map(prod => ({
          sku: prod.sku,
          quantidade: parseInt(prod.quantidade) || 0,
          precoCompra: parseFloat(prod.precoCompra) || 0
        })),
        prazos: formData.prazos
      };

      let resultado;

      if (pedidoParaEditar) {
        // Modo edição: atualizar pedido existente
        console.log('📝 Atualizando pedido:', pedidoParaEditar.id, dadosPedido);
        resultado = await atualizarPedido(pedidoParaEditar.id, dadosPedido);
        console.log('✅ Pedido atualizado com sucesso:', resultado);
      } else {
        // Modo criação: criar novo pedido
        console.log('📨 Enviando pedido para API:', dadosPedido);
        resultado = await criarPedido(dadosPedido);
        console.log('✅ Pedido criado com sucesso:', resultado);
      }

      // Chamar callback do componente pai
      onSubmit({
        ...dadosPedido,
        id: resultado.id,
        status: resultado.status || 'pedido',
        created_at: resultado.created_at
      });

      // Resetar formulário
      setFormData({
        fornecedor: '',
        valor: '',
        produtos: [],
        previsaoEntrega: '',
        dataPedido: new Date().toISOString().split('T')[0],
        observacoes: '',
        prazos: {
          fabricacao: 0,
          transito: 0,
          alfandega: 0
        }
      });

      setActiveStep(0);
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('❌ Erro ao salvar pedido:', error);
      setErrors({
        submit: error.response?.data?.error || 'Erro ao salvar pedido. Tente novamente.'
      });
      setLoading(false);
    }
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
        {pedidoParaEditar
          ? `Editar Pedido #${pedidoParaEditar.id}`
          : produtoInicial
            ? 'Criar Pedido de Compra para Reposição'
            : 'Novo Pedido de Compra'}
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
          {/* Mensagem de erro geral */}
          {errors.submit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.submit}
            </Alert>
          )}

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

                  {carregandoProdutos ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">Carregando produtos...</Typography>
                    </Box>
                  ) : (
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
                  )}
                </Box>
              )}

              {/* Lista de produtos selecionados */}
              <>
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
              </>
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

                <Grid item xs={12}>
                  <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                      ⏱️ Definição de Prazos (em dias)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          name="fabricacao"
                          label="Fabricação"
                          type="number"
                          size="small"
                          fullWidth
                          value={formData.prazos.fabricacao}
                          onChange={handlePrazosChange}
                          inputProps={{ min: 0 }}
                          helperText={
                            formData.prazos.fabricacao > 0 &&
                            `Até: ${calcularDataEstimada(formData.prazos.fabricacao)}`
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          name="transito"
                          label="Trânsito"
                          type="number"
                          size="small"
                          fullWidth
                          value={formData.prazos.transito}
                          onChange={handlePrazosChange}
                          inputProps={{ min: 0 }}
                          helperText={
                            formData.prazos.transito > 0 &&
                            `Até: ${calcularDataEstimada(formData.prazos.fabricacao + formData.prazos.transito)}`
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          name="alfandega"
                          label="Alfândega"
                          type="number"
                          size="small"
                          fullWidth
                          value={formData.prazos.alfandega}
                          onChange={handlePrazosChange}
                          inputProps={{ min: 0 }}
                          helperText={
                            formData.prazos.alfandega > 0 &&
                            `Até: ${calcularDataEstimada(formData.prazos.fabricacao + formData.prazos.transito + formData.prazos.alfandega)}`
                          }
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mt: 1 }}>
                          <CalendarIcon fontSize="small" />
                          <Typography variant="caption">
                            Previsão de Entrega Final: <strong>{calcularDataEstimada(formData.prazos.fabricacao + formData.prazos.transito + formData.prazos.alfandega)}</strong>
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
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
          <Button onClick={onClose} disabled={loading}>Cancelar</Button>

          {activeStep > 0 && (
            <Button onClick={() => setActiveStep(activeStep - 1)} disabled={loading}>
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
                  // Fornecedor agora é opcional
                  if (!formData.dataPedido) novosErros.dataPedido = 'Obrigatório';
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
              disabled={loading}
            >
              Próximo
            </Button>
          ) : (
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
              {loading ? 'Salvando...' : pedidoParaEditar ? 'Salvar Alterações' : 'Criar Pedido'}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
} 