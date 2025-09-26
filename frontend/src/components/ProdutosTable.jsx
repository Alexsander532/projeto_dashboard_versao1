import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  useTheme,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  TextField,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Importando as novas funções que trabalham com dados do estoque
import { 
  fetchProdutosEstoque, 
  updateProdutoCMV, 
  formatarMoeda, 
  validarSKU 
} from '../services/produtosService';

/**
 * Componente ProdutosTable - Nova versão baseada em dados do estoque
 * 
 * Esta versão foi completamente reformulada para:
 * 1. Buscar dados diretamente da tabela estoque
 * 2. Exibir apenas as colunas essenciais: SKU, Nome, CMV, Estoque
 * 3. Permitir edição inline do CMV
 * 4. Manter sincronização automática com o estoque
 * 
 * Funcionalidades:
 * - Carregamento automático de todos os SKUs do estoque
 * - Edição inline do CMV (Custo da Mercadoria Vendida)
 * - Paginação para melhor performance
 * - Feedback visual para operações
 * - Logs detalhados para debug
 */
export default function ProdutosTable() {
  // ========================================
  // ESTADOS DO COMPONENTE
  // ========================================
  
  const theme = useTheme();
  
  // Estados para paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para dados
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para edição inline
  const [editingProduct, setEditingProduct] = useState(null); // SKU do produto sendo editado
  const [editValue, setEditValue] = useState(''); // Valor temporário durante edição
  const [saving, setSaving] = useState(false); // Estado de salvamento
  
  // Estados para feedback
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // ========================================
  // EFEITOS E CARREGAMENTO DE DADOS
  // ========================================

  /**
   * useEffect principal - Carrega produtos do estoque quando o componente monta
   * 
   * Este efeito é executado apenas uma vez quando o componente é montado.
   * Ele chama a função loadProdutos() que busca todos os dados do estoque.
   */
  useEffect(() => {
    loadProdutos();
  }, []);

  /**
   * Função para carregar produtos da tabela estoque
   * 
   * Esta função:
   * 1. Ativa o estado de loading
   * 2. Chama a API para buscar dados do estoque
   * 3. Formata os dados para exibição
   * 4. Trata erros e exibe feedback
   */
  const loadProdutos = async () => {
    try {
      console.log('🔄 Iniciando carregamento de produtos do estoque...');
      setLoading(true);
      setError(null);
      
      // Chama a nova função que busca dados do estoque
      const data = await fetchProdutosEstoque();
      
      console.log(`✅ ${data.length} produtos carregados com sucesso`);
      
      // Formata os dados para garantir tipos corretos
      const formattedData = data.map(item => ({
        sku: item.sku,
        nome: item.nome || 'Nome não informado',
        cmv_atual: Number(item.cmv_atual) || 0,
        estoque: Number(item.estoque) || 0,
        status: item.status || 'ativo'
      }));
      
      setProdutos(formattedData);
      
      // Feedback de sucesso
      setSnackbar({
        open: true,
        message: `${formattedData.length} produtos carregados com sucesso!`,
        severity: 'success'
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      
      setError('Erro ao carregar produtos do estoque. Tente novamente.');
      
      // Feedback de erro
      setSnackbar({
        open: true,
        message: 'Erro ao carregar produtos. Verifique sua conexão.',
        severity: 'error'
      });
      
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // FUNÇÕES DE PAGINAÇÃO
  // ========================================

  /**
   * Manipula mudança de página na paginação
   */
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  /**
   * Manipula mudança na quantidade de itens por página
   */
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Volta para primeira página
  };

  // ========================================
  // FUNÇÕES DE EDIÇÃO INLINE
  // ========================================

  /**
   * Inicia edição de um produto
   * 
   * @param {Object} produto - Produto a ser editado
   */
  const handleStartEdit = (produto) => {
    console.log(`✏️ Iniciando edição do produto ${produto.sku}`);
    setEditingProduct(produto.sku);
    setEditValue(produto.cmv_atual.toString());
  };

  /**
   * Cancela edição em andamento
   */
  const handleCancelEdit = () => {
    console.log('❌ Cancelando edição');
    setEditingProduct(null);
    setEditValue('');
  };

  /**
   * Salva alterações do CMV
   * 
   * Esta função:
   * 1. Valida os dados inseridos
   * 2. Chama a API para atualizar o CMV
   * 3. Atualiza a lista local de produtos
   * 4. Fornece feedback visual
   */
  const handleSaveEdit = async () => {
    try {
      setSaving(true);
      
      // Validações básicas
      const newCMV = parseFloat(editValue);
      
      if (isNaN(newCMV) || newCMV < 0) {
        setSnackbar({
          open: true,
          message: 'CMV deve ser um número positivo',
          severity: 'error'
        });
        return;
      }
      
      console.log(`💾 Salvando CMV ${newCMV} para produto ${editingProduct}`);
      
      // Chama a API para atualizar o CMV
      await updateProdutoCMV(editingProduct, newCMV);
      
      // Atualiza a lista local de produtos
      setProdutos(prevProdutos => 
        prevProdutos.map(produto => 
          produto.sku === editingProduct 
            ? { ...produto, cmv_atual: newCMV }
            : produto
        )
      );
      
      // Limpa estados de edição
      setEditingProduct(null);
      setEditValue('');
      
      // Feedback de sucesso
      setSnackbar({
        open: true,
        message: `CMV do produto ${editingProduct} atualizado com sucesso!`,
        severity: 'success'
      });
      
      console.log('✅ CMV atualizado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao salvar CMV:', error);
      
      setSnackbar({
        open: true,
        message: `Erro ao atualizar CMV: ${error.message}`,
        severity: 'error'
      });
      
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================

  /**
   * Fecha o snackbar de feedback
   */
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  /**
   * Força recarregamento dos dados
   */
  const handleRefresh = () => {
    console.log('🔄 Recarregando dados...');
    loadProdutos();
  };

  // ========================================
  // RENDERIZAÇÃO CONDICIONAL
  // ========================================

  // Estado de carregamento
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>🔄 Carregando produtos do estoque...</Typography>
      </Box>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
        <Button variant="contained" onClick={handleRefresh} startIcon={<RefreshIcon />}>
          Tentar Novamente
        </Button>
      </Box>
    );
  }

  // ========================================
  // RENDERIZAÇÃO PRINCIPAL
  // ========================================

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: { xs: 2, sm: 3, md: 4 },
      minHeight: '100vh',
      backgroundColor: 'background.default'
    }}>
      {/* Cabeçalho melhorado com design mais elegante */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mb: 0.5 }}>
              📦 Produtos do Estoque
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {produtos.length} itens cadastrados
            </Typography>
          </Box>
          
          <Button 
            variant="contained" 
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Atualizar
          </Button>
        </Box>
      </Paper>

      {/* Container da tabela centralizado */}
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {/* Cabeçalho SKU */}
              <TableCell 
                align="center"
                sx={{
                  fontWeight: 700,
                  backgroundColor: '#667eea',
                  color: 'white',
                  fontSize: '0.95rem',
                  py: 2,
                  borderBottom: 'none'
                }}
              >
                📋 SKU
              </TableCell>
              
              {/* Cabeçalho Nome */}
              <TableCell 
                align="left"
                sx={{
                  fontWeight: 700,
                  backgroundColor: '#667eea',
                  color: 'white',
                  fontSize: '0.95rem',
                  py: 2,
                  borderBottom: 'none'
                }}
              >
                🏷️ Nome do Produto
              </TableCell>
              
              {/* Cabeçalho CMV */}
              <TableCell 
                align="center"
                sx={{
                  fontWeight: 700,
                  backgroundColor: '#667eea',
                  color: 'white',
                  fontSize: '0.95rem',
                  py: 2,
                  borderBottom: 'none'
                }}
              >
                💰 CMV Atual
              </TableCell>
              
              {/* Cabeçalho Estoque */}
              <TableCell 
                align="center"
                sx={{
                  fontWeight: 700,
                  backgroundColor: '#667eea',
                  color: 'white',
                  fontSize: '0.95rem',
                  py: 2,
                  borderBottom: 'none'
                }}
              >
                📦 Estoque
              </TableCell>
              
              {/* Cabeçalho Ações */}
              <TableCell 
                align="center"
                sx={{
                  fontWeight: 700,
                  backgroundColor: '#667eea',
                  color: 'white',
                  fontSize: '0.95rem',
                  py: 2,
                  borderBottom: 'none'
                }}
              >
                ⚙️ Ações
              </TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {produtos
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((produto) => (
                <TableRow 
                  key={produto.sku} 
                  hover
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.08)',
                      transform: 'scale(1.001)',
                      transition: 'all 0.2s ease-in-out'
                    },
                    '& .MuiTableCell-root': {
                      borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
                      py: 1.5
                    }
                  }}
                >
                  {/* Coluna SKU */}
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold">
                      {produto.sku}
                    </Typography>
                  </TableCell>
                  
                  {/* Coluna Nome */}
                  <TableCell align="left">
                    <Typography variant="body2">
                      {produto.nome}
                    </Typography>
                  </TableCell>
                  
                  {/* Coluna CMV (editável) */}
                  <TableCell align="center">
                    {editingProduct === produto.sku ? (
                      // Modo de edição
                      <TextField
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        type="number"
                        size="small"
                        inputProps={{ 
                          min: 0, 
                          step: 0.01,
                          style: { textAlign: 'center' }
                        }}
                        sx={{ width: 100 }}
                        autoFocus
                      />
                    ) : (
                      // Modo de visualização
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {formatarMoeda(produto.cmv_atual)}
                      </Typography>
                    )}
                  </TableCell>
                  
                  {/* Coluna Estoque */}
                  <TableCell align="center">
                    <Chip 
                      label={produto.estoque}
                      size="small"
                      color={produto.estoque > 0 ? 'success' : 'error'}
                      sx={{ minWidth: 60 }}
                    />
                  </TableCell>
                  
                  {/* Coluna Ações */}
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      {editingProduct === produto.sku ? (
                        // Botões de salvar/cancelar durante edição
                        <>
                          <Tooltip title="Salvar">
                            <IconButton 
                              size="small" 
                              onClick={handleSaveEdit}
                              disabled={saving}
                              sx={{
                                color: theme.palette.success.main,
                                '&:hover': {
                                  backgroundColor: theme.palette.success.lighter,
                                }
                              }}
                            >
                              <SaveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancelar">
                            <IconButton 
                              size="small" 
                              onClick={handleCancelEdit}
                              disabled={saving}
                              sx={{
                                color: theme.palette.error.main,
                                '&:hover': {
                                  backgroundColor: theme.palette.error.lighter,
                                }
                              }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        // Botão de editar quando não está editando
                        <Tooltip title="Editar CMV">
                          <IconButton 
                            size="small" 
                            onClick={() => handleStartEdit(produto)}
                            sx={{
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: theme.palette.primary.lighter,
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>
        
        {/* Paginação melhorada */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={produtos.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Itens por página"
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
            '& .MuiTablePagination-toolbar': {
              padding: { xs: 1, sm: 2 }
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.875rem',
              fontWeight: 500
            }
          }}
        />
      </Paper>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}