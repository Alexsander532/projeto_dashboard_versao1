import React from 'react';
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
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

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

export default function VendasTable({ vendas }) {
  const theme = useTheme();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(50);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatarValor = (valor) => {
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(numero)) return 'R$ 0.00';
    return `R$ ${numero.toFixed(2)}`;
  };

  const formatarPorcentagem = (valor) => {
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(numero)) return '0.00';
    return `${numero.toFixed(2)}`;
  };

  const formatarData = (data) => {
    try {
      if (!data) return '-';
      
      // Usa parseISO para garantir a precisão do fuso horário
      const dataObj = parseISO(data);

      if (isNaN(dataObj.getTime())) {
        console.error('Data inválida:', data);
        return '-';
      }

      // Formata a data para exibir apenas o dia
      return format(dataObj, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error, data);
      return '-';
    }
  };

  // Processamento dos dados com validação mais rigorosa e ordenação por data
  const dadosProcessados = vendas
    .map(venda => {
      if (typeof venda === 'object' && venda !== null) {
        return {
          pedido: venda.pedido || '-',
          data: venda.data,
          dataObj: new Date(venda.data || 0),
          sku: venda.sku || '-',
          qtd: venda.unidades || '1',
          valorComprado: Number(venda.valorComprado) || 0,
          valorVendido: Number(venda.valorVendido) || 0,
          taxas: Number(venda.taxas) || 0,
          frete: Number(venda.frete) || 0,
          ctl: Number(venda.ctl) || 0,
          valorLiquido: Number(venda.valorLiquido) || 0,
          lucro: Number(venda.lucro) || 0,
          margem: Number(venda.margemLucro) || 0,
          envio: venda.envio || 'FULL'
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => {
      // Ordenação por timestamp decrescente
      return b.dataObj - a.dataObj;
    });

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

  return (
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
              <StyledTableCell className="header">CTL</StyledTableCell>
              <StyledTableCell className="header">Valor Líquido</StyledTableCell>
              <StyledTableCell className="header">Lucro</StyledTableCell>
              <StyledTableCell className="header">Margem</StyledTableCell>
              <StyledTableCell className="header">Envio</StyledTableCell>
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
                  <StyledTableCell>{venda.qtd}</StyledTableCell>
                  <StyledTableCell>{formatarValor(venda.valorComprado)}</StyledTableCell>
                  <StyledTableCell>{formatarValor(venda.valorVendido)}</StyledTableCell>
                  <StyledTableCell>{formatarValor(venda.taxas)}</StyledTableCell>
                  <StyledTableCell>{formatarValor(venda.frete)}</StyledTableCell>
                  <StyledTableCell>{formatarValor(venda.ctl)}</StyledTableCell>
                  <StyledTableCell>{formatarValor(venda.valorLiquido)}</StyledTableCell>
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
                      color={venda.margem >= 0 ? 'success.main' : 'error.main'}
                      fontWeight="medium"
                    >
                      {formatarPorcentagem(venda.margem)}%
                    </Typography>
                  </StyledTableCell>
                  <StyledTableCell>
                    <EnvioChip
                      label={venda.envio}
                      type={venda.envio}
                      size="small"
                    />
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
  );
}