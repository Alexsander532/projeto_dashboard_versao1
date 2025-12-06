import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  useTheme,
  alpha,
  Typography,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Snackbar,
  Button
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';

// Componente de linha animada
const AnimatedTableRow = styled(motion.tr)(({ theme }) => ({
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.02)',
    transition: 'all 0.3s ease'
  }
}));

// Componente de célula estilizada
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: '12px 16px',
  fontSize: '0.875rem',
  borderBottom: `1px solid ${theme.palette.divider}`,
  textAlign: 'center',
  whiteSpace: 'nowrap',
  '&.header': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? theme.palette.grey[900] 
      : theme.palette.grey[50],
    fontWeight: 600,
    color: theme.palette.text.primary,
    textAlign: 'center'
  }
}));

// Chip de envio estilizado
const EnvioChip = styled(Chip)(({ type, theme }) => {
  const colors = {
    FULL: {
      bg: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
      color: '#4CAF50',
      border: '1px solid rgba(76, 175, 80, 0.3)'
    },
    FLEX: {
      bg: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
      color: '#2196F3',
      border: '1px solid rgba(33, 150, 243, 0.3)'
    },
    COLETAGEM: {
      bg: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
      color: '#FF9800',
      border: '1px solid rgba(255, 152, 0, 0.3)'
    }
  };

  const envioColor = colors[type] || colors.FULL;

  return {
    backgroundColor: envioColor.bg,
    color: envioColor.color,
    border: envioColor.border,
    fontWeight: 500,
    '&:hover': {
      backgroundColor: envioColor.bg
    }
  };
});

export default function VendasTable({ vendas, onVendaUpdate }) {
  const theme = useTheme();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(50);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    type: 'info'
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    pedido: null,
    campo: null,
    valorAntigo: null,
    valorNovo: null
  });
  const [filtroData, setFiltroData] = useState('');
  const [filtroSku, setFiltroSku] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatarValor = (valor) => {
    if (valor === null || valor === undefined) return 'R$ 0,00';
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(numero)) return 'R$ 0,00';
    return `R$ ${numero.toFixed(2).replace('.', ',')}`;
  };

  const formatarPorcentagem = (valor) => {
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(numero)) return '0.00';
    return `${numero.toFixed(2)}`;
  };

  const formatarData = (data) => {
    try {
      if (!data) return '-';
      
      let dataObj;
      
      // Se já é um objeto Date, usa direto
      if (data instanceof Date) {
        dataObj = data;
      } else {
        // Se é string, tenta fazer parse
        dataObj = parseISO(data);
      }

      if (isNaN(dataObj.getTime())) {
        console.error('Data inválida:', data);
        return '-';
      }

      // Formata a data e hora: "08/01/25 11:52"
      return format(dataObj, "dd/MM/yy HH:mm", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error, data);
      return '-';
    }
  };

  // Processamento dos dados com os campos originais da tabela vendas_ml
  const dadosProcessados = vendas
    .map(venda => ({
      pedido: venda.pedido || '',
          data: venda.data,
          dataObj: new Date(venda.data || 0),
      sku: venda.sku || '',
      unidades: venda.unidades || 0,
      valor_comprado: venda.valor_comprado || 0,
      valor_vendido: venda.valor_vendido || 0,
      taxas: venda.taxas || 0,
      frete: venda.frete || 0,

      valor_liquido: venda.valor_liquido || 0,
      lucro: venda.lucro || 0,
      margem_lucro: venda.margem_lucro || 0
    }))
    .filter(venda => {
      // Filtro por SKU
      if (filtroSku && !venda.sku.toLowerCase().includes(filtroSku.toLowerCase())) {
        return false;
      }

      // Filtro por data (compara apenas a data, não a hora)
      if (filtroData) {
        const dataFiltro = new Date(filtroData);
        const dataVenda = new Date(venda.dataObj);
        
        // Zera a hora para comparar apenas a data
        dataFiltro.setHours(0, 0, 0, 0);
        dataVenda.setHours(0, 0, 0, 0);
        
        if (dataFiltro.getTime() !== dataVenda.getTime()) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => b.dataObj - a.dataObj);

  // Animação para as linhas
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: 'easeOut'
      }
    })
  };

  const editableCells = ['unidades', 'valor_comprado', 'valor_vendido', 'taxas', 'frete'];

  const handleStartEdit = (pedido, campo, valor) => {
    setEditingCell({ pedido, campo });
    setEditValue(valor.toString());
  };

  const handleSaveEdit = async (pedido, campo) => {
    const venda = vendas.find(v => v.pedido === pedido);
    const valorAntigo = venda[campo];
    const valorNovo = Number(editValue);

    setConfirmDialog({
      open: true,
      pedido,
      campo,
      valorAntigo,
      valorNovo
    });
  };

  const handleConfirmEdit = async () => {
    const { pedido, campo, valorNovo } = confirmDialog;
    
    try {
      await axios.put(`/api/vendas/${pedido}`, {
        [campo]: valorNovo
      });

      setSnackbar({
        open: true,
        message: `Valor alterado com sucesso!`,
        type: 'success'
      });

      // Atualiza os dados
      if (onVendaUpdate) {
        onVendaUpdate();
      }
    } catch (error) {
      console.error('Erro ao atualizar valor:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao atualizar valor',
        type: 'error'
      });
    }

    setConfirmDialog({ ...confirmDialog, open: false });
    setEditingCell(null);
  };

  return (
    <>
      <Paper 
        elevation={0}
        sx={{
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: theme.palette.divider,
          height: 'calc(100vh - 100px)',
      display: 'flex', 
          flexDirection: 'column'
        }}
      >
        {/* Barra de Filtros */}
        <Box
          sx={{
            padding: '16px',
            borderBottom: '1px solid',
            borderColor: theme.palette.divider,
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            flexWrap: 'wrap',
            backgroundColor: theme.palette.mode === 'dark' 
              ? theme.palette.grey[900]
              : theme.palette.grey[50]
          }}
        >
          <TextField
            label="Filtrar por Data"
            type="date"
            value={filtroData}
            onChange={(e) => {
              setFiltroData(e.target.value);
              setPage(0);
            }}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: '180px' }}
          />
          <TextField
            label="Filtrar por SKU"
            value={filtroSku}
            onChange={(e) => {
              setFiltroSku(e.target.value);
              setPage(0);
            }}
            placeholder="Digite o SKU..."
            size="small"
            sx={{ minWidth: '200px' }}
          />
          {(filtroData || filtroSku) && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setFiltroData('');
                setFiltroSku('');
                setPage(0);
              }}
            >
              Limpar Filtros
            </Button>
          )}
          <Typography variant="caption" sx={{ marginLeft: 'auto', color: 'text.secondary' }}>
            {dadosProcessados.length} de {vendas.length} registros
          </Typography>
        </Box>

        <TableContainer sx={{ flexGrow: 1 }}>
          <Table stickyHeader>
          <TableHead>
            <TableRow>
                <StyledTableCell className="header">Pedido</StyledTableCell>
                <StyledTableCell className="header">Data</StyledTableCell>
                <StyledTableCell className="header">SKU</StyledTableCell>
                <StyledTableCell className="header">Qtd</StyledTableCell>
                <StyledTableCell className="header">Comprado</StyledTableCell>
                <StyledTableCell className="header">Vendido</StyledTableCell>
                <StyledTableCell className="header">Taxas</StyledTableCell>
            <StyledTableCell className="header">Frete</StyledTableCell>
            <StyledTableCell className="header">Valor Líquido</StyledTableCell>
                <StyledTableCell className="header">Lucro</StyledTableCell>
                <StyledTableCell className="header">Margem</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dadosProcessados
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((venda, index) => (
                  <AnimatedTableRow
                    key={venda.pedido}
                    component={motion.tr}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                  >
                    <StyledTableCell>{venda.pedido}</StyledTableCell>
                    <StyledTableCell>{formatarData(venda.data)}</StyledTableCell>
                    <StyledTableCell>{venda.sku}</StyledTableCell>
                    <StyledTableCell>
                      {editingCell?.pedido === venda.pedido && editingCell?.campo === 'unidades' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            size="small"
                            type="number"
                            autoFocus
                            sx={{ width: '80px' }}
                          />
                          <IconButton size="small" onClick={() => handleSaveEdit(venda.pedido, 'unidades')}>
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setEditingCell(null)}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box onClick={() => handleStartEdit(venda.pedido, 'unidades', venda.unidades)}>
                          {venda.unidades}
                        </Box>
                      )}
                    </StyledTableCell>
                    <StyledTableCell>
                      {editingCell?.pedido === venda.pedido && editingCell?.campo === 'valor_comprado' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            size="small"
                            type="number"
                            autoFocus
                            sx={{ width: '100px' }}
                          />
                          <IconButton size="small" onClick={() => handleSaveEdit(venda.pedido, 'valor_comprado')}>
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setEditingCell(null)}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box onClick={() => handleStartEdit(venda.pedido, 'valor_comprado', venda.valor_comprado)}>
                          {formatarValor(venda.valor_comprado)}
                        </Box>
                      )}
                    </StyledTableCell>
                    <StyledTableCell>
                      {editingCell?.pedido === venda.pedido && editingCell?.campo === 'valor_vendido' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            size="small"
                            type="number"
                            autoFocus
                            sx={{ width: '100px' }}
                          />
                          <IconButton size="small" onClick={() => handleSaveEdit(venda.pedido, 'valor_vendido')}>
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setEditingCell(null)}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box onClick={() => handleStartEdit(venda.pedido, 'valor_vendido', venda.valor_vendido)}>
                          {formatarValor(venda.valor_vendido)}
                        </Box>
                      )}
                    </StyledTableCell>
                    <StyledTableCell>
                      {editingCell?.pedido === venda.pedido && editingCell?.campo === 'taxas' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            size="small"
                            type="number"
                            autoFocus
                            sx={{ width: '100px' }}
                          />
                          <IconButton size="small" onClick={() => handleSaveEdit(venda.pedido, 'taxas')}>
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setEditingCell(null)}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box onClick={() => handleStartEdit(venda.pedido, 'taxas', venda.taxas)}>
                          {formatarValor(venda.taxas)}
                        </Box>
                      )}
                    </StyledTableCell>
                    <StyledTableCell>
                      {editingCell?.pedido === venda.pedido && editingCell?.campo === 'frete' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            size="small"
                            type="number"
                            autoFocus
                            sx={{ width: '100px' }}
                          />
                          <IconButton size="small" onClick={() => handleSaveEdit(venda.pedido, 'frete')}>
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setEditingCell(null)}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box onClick={() => handleStartEdit(venda.pedido, 'frete', venda.frete)}>
                          {formatarValor(venda.frete)}
                        </Box>
                      )}
                    </StyledTableCell>
                    <StyledTableCell>{formatarValor(venda.valor_liquido)}</StyledTableCell>
                    <StyledTableCell>
                      <Typography 
                        color={venda.lucro >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="medium"
                      >
                    {formatarValor(venda.lucro)}
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography 
                        color={venda.margem_lucro >= 0 ? 'success.main' : 'error.main'}
                        fontWeight="medium"
                      >
                        {formatarPorcentagem(venda.margem_lucro)}%
                      </Typography>
                    </StyledTableCell>
                  </AnimatedTableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
            rowsPerPageOptions={[50, 100, 200]}
          component="div"
          count={dadosProcessados.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{
              borderTop: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.secondary,
            '.MuiTablePagination-select': {
              color: theme.palette.text.primary
            },
            '.MuiTablePagination-selectIcon': {
              color: theme.palette.text.secondary
            }
          }}
        />
      </TableContainer>
      </Paper>

      {/* Diálogo de Confirmação */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>Confirmar Alteração</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Deseja alterar o valor do campo {confirmDialog.campo} do pedido {confirmDialog.pedido}?
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography>
              De: {formatarValor(confirmDialog.valorAntigo)}
            </Typography>
            <Typography>
              Para: {formatarValor(confirmDialog.valorNovo)}
            </Typography>
    </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmEdit} 
            variant="contained" 
            color="primary"
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de Confirmação */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.type}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}