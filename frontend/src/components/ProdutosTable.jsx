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
  Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import ProdutoForm from './ProdutoForm';
import { fetchProdutos, addProduto, updateProduto, deleteProduto } from '../services/produtosService';

export default function ProdutosTable({ formOpen, setFormOpen }) {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [produtos, setProdutos] = useState([]);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProdutos = async () => {
      try {
        setLoading(true);
        const data = await fetchProdutos();
        
        const formattedData = data.map(item => ({
          id: item.id,
          sku: item.sku,
          nome: item.nome,
          cmv: Number(item.cmv_atual),
          estoque: Number(item.estoque),
          status: item.status.toLowerCase(),
          imagemUrl: item.imagem_url || ''
        }));
        
        setProdutos(formattedData);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      const mockProdutos = [
        {
          id: 1,
          sku: 'MLB123',
          nome: 'Produto Teste ML',
          cmv: 79.90,
          estoque: 50,
          status: 'ativo',
          imagemUrl: ''
        },
        {
          id: 2,
          sku: 'MAG456',
          nome: 'Produto Teste Magalu',
          cmv: 129.90,
          estoque: 30,
          status: 'ativo',
          imagemUrl: ''
        }
      ];
      setProdutos(mockProdutos);
      } finally {
        setLoading(false);
    }
    };

    loadProdutos();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (produto) => {
    setSelectedProduto(produto);
    setFormOpen(true);
  };

  const handleDelete = (produto) => {
    setProdutoToDelete(produto);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteProduto(produtoToDelete.sku);
      
      const newProdutos = produtos.filter(p => p.sku !== produtoToDelete.sku);
    setProdutos(newProdutos);
    setDeleteDialogOpen(false);
    setProdutoToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto. Tente novamente.');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
    let newProdutos;
      
    if (selectedProduto) {
        const updatedProduto = await updateProduto(selectedProduto.sku, {
          nome: formData.nome,
          cmv_atual: formData.cmv,
          estoque: formData.estoque,
          status: formData.status,
          imagem_url: formData.imagemUrl
        });
        
      newProdutos = produtos.map(p =>
          p.sku === selectedProduto.sku ? {
            id: p.id,
            sku: p.sku,
            nome: updatedProduto.nome,
            cmv: Number(updatedProduto.cmv_atual),
            estoque: Number(updatedProduto.estoque),
            status: updatedProduto.status.toLowerCase(),
            imagemUrl: updatedProduto.imagem_url || ''
          } : p
      );
    } else {
        const newProduto = await addProduto({
          sku: formData.sku,
          nome: formData.nome,
          cmv_atual: formData.cmv,
          estoque: formData.estoque,
          status: formData.status,
          imagem_url: formData.imagemUrl
        });
        
        newProdutos = [...produtos, {
          id: newProduto.id,
          sku: newProduto.sku,
          nome: newProduto.nome,
          cmv: Number(newProduto.cmv_atual),
          estoque: Number(newProduto.estoque),
          status: newProduto.status.toLowerCase(),
          imagemUrl: newProduto.imagem_url || ''
        }];
    }
      
    setProdutos(newProdutos);
    setFormOpen(false);
    setSelectedProduto(null);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Carregando produtos...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3, color: 'error.main' }}>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell 
                align="center"
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontSize: '0.95rem'
                }}
              >
                Imagem
              </TableCell>
              <TableCell 
                align="center"
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontSize: '0.95rem'
                }}
              >
                SKU
              </TableCell>
              <TableCell 
                align="center"
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontSize: '0.95rem'
                }}
              >
                Nome
              </TableCell>
              <TableCell 
                align="center"
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontSize: '0.95rem'
                }}
              >
                CMV Atual
              </TableCell>
              <TableCell 
                align="center"
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontSize: '0.95rem'
                }}
              >
                Estoque
              </TableCell>
              <TableCell 
                align="center"
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontSize: '0.95rem'
                }}
              >
                Status
              </TableCell>
              <TableCell 
                align="center"
                sx={{
                  fontWeight: 'bold',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontSize: '0.95rem'
                }}
              >
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {produtos
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((produto) => (
                <TableRow 
                  key={produto.id} 
                  hover
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  <TableCell align="center">
                    {produto.imagemUrl ? (
                      <Box
                        component="img"
                        src={produto.imagemUrl}
                        alt={produto.nome}
                        sx={{
                          width: 50,
                          height: 50,
                          objectFit: 'contain',
                          borderRadius: 1
                        }}
                      />
                    ) : (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 50,
                          height: 50,
                          border: '1px dashed',
                          borderColor: 'divider',
                          borderRadius: 1,
                          fontSize: '0.7rem',
                          textAlign: 'center',
                          lineHeight: 1.2,
                          margin: '0 auto'
                        }}
                      >
                        Coloque a imagem
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">{produto.sku}</TableCell>
                  <TableCell align="center">{produto.nome}</TableCell>
                  <TableCell align="center">
                    {Number(produto.cmv).toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </TableCell>
                  <TableCell align="center">{produto.estoque}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={produto.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      size="small"
                      color={produto.status === 'ativo' ? 'success' : 'error'}
                      sx={{ minWidth: 80 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Tooltip title="Editar">
                        <IconButton 
                          size="small" 
                          onClick={() => handleEdit(produto)}
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
                      <Tooltip title="Excluir">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDelete(produto)}
                          sx={{
                            color: theme.palette.error.main,
                            '&:hover': {
                              backgroundColor: theme.palette.error.lighter,
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={produtos.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Itens por página"
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper'
        }}
      />

      {/* Formulário de Edição/Criação */}
      <ProdutoForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedProduto(null);
        }}
        onSubmit={handleFormSubmit}
        produto={selectedProduto}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o produto "{produtoToDelete?.nome}"?
            Esta ação não poderá ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmDelete} 
            variant="contained" 
            color="error"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 