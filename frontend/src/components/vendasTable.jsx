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
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function VendasTable({ vendas }) {
  const theme = useTheme();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

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

  const cellStyle = {
    whiteSpace: 'nowrap',
    padding: '8px 16px',
    fontSize: '0.875rem',
    borderBottom: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    textAlign: 'center',
    '& > *': {
      margin: '0 auto'
    }
  };

  const headerCellStyle = {
    ...cellStyle,
    backgroundColor: theme.palette.mode === 'dark' 
      ? alpha(theme.palette.primary.dark, 0.15)
      : alpha(theme.palette.primary.light, 0.15),
    color: theme.palette.text.secondary,
    fontWeight: 500,
    padding: '12px 16px',
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '100%',
      '& .MuiTableCell-root': {
        textAlign: 'center'
      }
    }}>
      <TableContainer>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellStyle}>Pedido</TableCell>
              <TableCell sx={headerCellStyle}>Data</TableCell>
              <TableCell sx={headerCellStyle}>SKU</TableCell>
              <TableCell sx={headerCellStyle}>Qtd</TableCell>
              <TableCell sx={headerCellStyle}>Comprado</TableCell>
              <TableCell sx={headerCellStyle}>Vendido</TableCell>
              <TableCell sx={headerCellStyle}>Taxas</TableCell>
              <TableCell sx={headerCellStyle}>Frete</TableCell>
              <TableCell sx={headerCellStyle}>CTL</TableCell>
              <TableCell sx={headerCellStyle}>Valor Líquido</TableCell>
              <TableCell sx={headerCellStyle}>Lucro</TableCell>
              <TableCell sx={headerCellStyle}>Margem</TableCell>
              <TableCell sx={headerCellStyle}>Envio</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dadosProcessados
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((venda, index) => (
                <TableRow 
                  key={venda.pedido + index}
                  sx={{
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover
                    }
                  }}
                >
                  <TableCell sx={{ ...cellStyle, color: theme.palette.primary.main }}>{venda.pedido}</TableCell>
                  <TableCell sx={cellStyle}>{formatarData(venda.data)}</TableCell>
                  <TableCell sx={cellStyle}>{venda.sku}</TableCell>
                  <TableCell sx={cellStyle}>{venda.qtd}</TableCell>
                  <TableCell sx={cellStyle}>{formatarValor(venda.valorComprado)}</TableCell>
                  <TableCell sx={cellStyle}>{formatarValor(venda.valorVendido)}</TableCell>
                  <TableCell sx={cellStyle}>{formatarValor(venda.taxas)}</TableCell>
                  <TableCell sx={cellStyle}>{formatarValor(venda.frete)}</TableCell>
                  <TableCell sx={cellStyle}>{formatarValor(venda.ctl)}</TableCell>
                  <TableCell sx={{
                    ...cellStyle,
                    color: theme.palette.info.main
                  }}>
                    {formatarValor(venda.valorLiquido)}
                  </TableCell>
                  <TableCell sx={{
                    ...cellStyle,
                    color: theme.palette.success.main
                  }}>
                    {formatarValor(venda.lucro)}
                  </TableCell>
                  <TableCell sx={{
                    ...cellStyle,
                    color: theme.palette.success.main
                  }}>
                    {formatarPorcentagem(venda.margem)}%
                  </TableCell>
                  <TableCell sx={{
                    ...cellStyle,
                    color: theme.palette.success.main
                  }}>
                    {venda.envio}
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={dadosProcessados.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{
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
    </Box>
  );
}