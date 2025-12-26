// frontend/src/components/PedidoDetalhesModal.jsx

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Grid,
  Autocomplete
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { buscarHistoricoPedido, atualizarPedido } from '../services/comprasService';
import { buscarProdutos } from '../services/estoqueService';

// TabPanel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pedido-tabpanel-${index}`}
      aria-labelledby={`pedido-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function PedidoDetalhesModal({ 
  open, 
  onClose, 
  pedido, 
  onPedidoAtualizado,
  abaInicial = 0 // 0 = Edição, 1 = Histórico
}) {
  const [abaAtiva, setAbaAtiva] = useState(abaInicial);
  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [produtos, setProdutos] = useState([]);
  
  // Estados do formulário de edição
  const [formData, setFormData] = useState({
    fornecedor: '',
    valor: '',
    produtos: [],
    previsaoEntrega: '',
    dataPedido: '',
    observacoes: ''
  });

  // Carregar dados quando o modal abrir
  useEffect(() => {
    if (open && pedido) {
      setAbaAtiva(abaInicial);
      
      // Preencher formulário com dados do pedido
      setFormData({
        fornecedor: pedido.fornecedor || '',
        valor: pedido.valor?.toString() || '',
        produtos: (pedido.produtos || []).map(p => ({
          sku: p.sku,
          quantidade: p.quantidade,
          precoCompra: p.preco_unitario || p.precoCompra || 0
        })),
        previsaoEntrega: pedido.previsao_entrega 
          ? new Date(pedido.previsao_entrega).toISOString().split('T')[0] 
          : '',
        dataPedido: pedido.data_pedido 
          ? new Date(pedido.data_pedido).toISOString().split('T')[0] 
          : '',
        observacoes: pedido.observacoes || ''
      });

      // Carregar produtos para o autocomplete
      carregarProdutos();
      
      // Se abrir na aba de histórico, carregar histórico
      if (abaInicial === 1) {
        carregarHistorico();
      }
    }
  }, [open, pedido, abaInicial]);

  // Carregar histórico quando mudar para a aba de histórico
  useEffect(() => {
    if (abaAtiva === 1 && pedido && historico.length === 0) {
      carregarHistorico();
    }
  }, [abaAtiva]);

  const carregarProdutos = async () => {
    try {
      const data = await buscarProdutos();
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const carregarHistorico = async () => {
    if (!pedido) return;
    
    try {
      setCarregandoHistorico(true);
      const data = await buscarHistoricoPedido(pedido.id);
      setHistorico(data);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const handleChangeAba = (event, newValue) => {
    setAbaAtiva(newValue);
  };

  const handleAddProduto = () => {
    setFormData(prev => ({
      ...prev,
      produtos: [...prev.produtos, { sku: '', quantidade: 1, precoCompra: 0 }]
    }));
  };

  const handleRemoveProduto = (index) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.filter((_, i) => i !== index)
    }));
  };

  const handleProdutoChange = (index, field, value) => {
    setFormData(prev => {
      const novosProdutos = [...prev.produtos];
      novosProdutos[index] = { ...novosProdutos[index], [field]: value };
      return { ...prev, produtos: novosProdutos };
    });
  };

  const handleSelectProduto = (index, produto) => {
    if (produto) {
      setFormData(prev => {
        const novosProdutos = [...prev.produtos];
        novosProdutos[index] = {
          ...novosProdutos[index],
          sku: produto.sku,
          precoCompra: produto.custo || 0
        };
        return { ...prev, produtos: novosProdutos };
      });
    }
  };

  const calcularValorTotal = () => {
    return formData.produtos.reduce((total, p) => {
      return total + (parseFloat(p.precoCompra) || 0) * (parseInt(p.quantidade) || 0);
    }, 0);
  };

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      
      const dadosAtualizados = {
        fornecedor: formData.fornecedor || null,
        valor: parseFloat(formData.valor) || calcularValorTotal(),
        previsao_entrega: formData.previsaoEntrega || null,
        data_pedido: formData.dataPedido || null,
        observacoes: formData.observacoes || null,
        produtos: formData.produtos.map(p => ({
          sku: p.sku,
          quantidade: parseInt(p.quantidade) || 1,
          preco_unitario: parseFloat(p.precoCompra) || 0
        }))
      };

      await atualizarPedido(pedido.id, dadosAtualizados);
      
      if (onPedidoAtualizado) {
        onPedidoAtualizado();
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
    } finally {
      setSalvando(false);
    }
  };

  const formatarStatus = (status) => {
    const statusMap = {
      'pedido': 'Pedido Realizado',
      'fabricacao': 'Em Fabricação',
      'transito': 'Em Trânsito',
      'alfandega': 'Em Alfândega',
      'recebido': 'Recebido'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pedido': '#4CAF50',
      'fabricacao': '#2196F3',
      'transito': '#FF9800',
      'alfandega': '#9C27B0',
      'recebido': '#4CAF50'
    };
    return colorMap[status] || '#757575';
  };

  if (!pedido) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '12px' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Pedido #{pedido.id}
          </Typography>
          <Chip 
            label={formatarStatus(pedido.status)} 
            size="small"
            sx={{ 
              bgcolor: `${getStatusColor(pedido.status)}20`,
              color: getStatusColor(pedido.status),
              fontWeight: 'bold'
            }}
          />
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={abaAtiva} onChange={handleChangeAba}>
          <Tab 
            icon={<EditIcon sx={{ fontSize: 18 }} />} 
            iconPosition="start" 
            label="Edição" 
          />
          <Tab 
            icon={<HistoryIcon sx={{ fontSize: 18 }} />} 
            iconPosition="start" 
            label="Histórico" 
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ minHeight: 400 }}>
        {/* Aba de Edição */}
        <TabPanel value={abaAtiva} index={0}>
          <Grid container spacing={2}>
            {/* Fornecedor */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fornecedor"
                value={formData.fornecedor}
                onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                size="small"
                placeholder="Nome do fornecedor (opcional)"
              />
            </Grid>

            {/* Valor Total */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Valor Total (R$)"
                type="number"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                size="small"
                helperText={`Calculado: R$ ${calcularValorTotal().toFixed(2)}`}
              />
            </Grid>

            {/* Data do Pedido */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Data do Pedido"
                type="date"
                value={formData.dataPedido}
                onChange={(e) => setFormData(prev => ({ ...prev, dataPedido: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Previsão de Entrega */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Previsão de Entrega"
                type="date"
                value={formData.previsaoEntrega}
                onChange={(e) => setFormData(prev => ({ ...prev, previsaoEntrega: e.target.value }))}
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Observações */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                size="small"
                multiline
                rows={2}
              />
            </Grid>

            {/* Produtos */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Produtos do Pedido
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddProduto}
                  variant="outlined"
                >
                  Adicionar Produto
                </Button>
              </Box>

              {formData.produtos.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Nenhum produto adicionado
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {formData.produtos.map((produto, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        alignItems: 'center',
                        p: 1.5,
                        bgcolor: '#f5f5f5',
                        borderRadius: '8px'
                      }}
                    >
                      <Autocomplete
                        size="small"
                        sx={{ flex: 2 }}
                        options={produtos}
                        getOptionLabel={(option) => option.sku || ''}
                        value={produtos.find(p => p.sku === produto.sku) || null}
                        onChange={(_, newValue) => handleSelectProduto(index, newValue)}
                        renderInput={(params) => (
                          <TextField {...params} label="SKU" placeholder="Selecione o produto" />
                        )}
                        renderOption={(props, option) => (
                          <li {...props}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {option.sku}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.nome}
                              </Typography>
                            </Box>
                          </li>
                        )}
                      />
                      <TextField
                        size="small"
                        label="Qtd"
                        type="number"
                        value={produto.quantidade}
                        onChange={(e) => handleProdutoChange(index, 'quantidade', e.target.value)}
                        sx={{ width: 80 }}
                        inputProps={{ min: 1 }}
                      />
                      <TextField
                        size="small"
                        label="Preço Unit."
                        type="number"
                        value={produto.precoCompra}
                        onChange={(e) => handleProdutoChange(index, 'precoCompra', e.target.value)}
                        sx={{ width: 120 }}
                        InputProps={{ startAdornment: 'R$' }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 80, fontWeight: 'bold' }}>
                        = R$ {((produto.precoCompra || 0) * (produto.quantidade || 0)).toFixed(2)}
                      </Typography>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleRemoveProduto(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Aba de Histórico */}
        <TabPanel value={abaAtiva} index={1}>
          {carregandoHistorico ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : historico.length > 0 ? (
            <List>
              {historico.map((item, index) => (
                <React.Fragment key={item.id || index}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ color: getStatusColor(item.status_novo) }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.status_anterior ? (
                            <>
                              <Chip 
                                label={formatarStatus(item.status_anterior)} 
                                size="small"
                                sx={{ 
                                  bgcolor: `${getStatusColor(item.status_anterior)}20`,
                                  color: getStatusColor(item.status_anterior)
                                }}
                              />
                              <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Chip 
                                label={formatarStatus(item.status_novo)} 
                                size="small"
                                sx={{ 
                                  bgcolor: `${getStatusColor(item.status_novo)}20`,
                                  color: getStatusColor(item.status_novo)
                                }}
                              />
                            </>
                          ) : (
                            <Chip 
                              label={formatarStatus(item.status_novo)} 
                              size="small"
                              sx={{ 
                                bgcolor: `${getStatusColor(item.status_novo)}20`,
                                color: getStatusColor(item.status_novo)
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            📅 {new Date(item.data_movimentacao).toLocaleString('pt-BR')}
                          </Typography>
                          {item.observacao && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              💬 {item.observacao}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < historico.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">
                Nenhuma movimentação registrada para este pedido
              </Typography>
            </Box>
          )}
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        {abaAtiva === 0 && (
          <Button 
            variant="contained" 
            onClick={handleSalvar}
            disabled={salvando}
            sx={{ 
              bgcolor: 'success.main',
              '&:hover': { bgcolor: 'success.dark' }
            }}
          >
            {salvando ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
