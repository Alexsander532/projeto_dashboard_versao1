import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, IconButton, Button } from '@mui/material';
import { 
  Inventory as InventoryIcon, 
  AttachMoney as AttachMoneyIcon, 
  Warning as WarningIcon, 
  Autorenew as AutorenewIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  NotificationsNone as NotificationsIcon,
  PictureAsPdf as PictureAsPdfIcon
} from '@mui/icons-material';
import EstoqueTable from '../components/EstoqueTable';
import MetricCard from '../components/MetricCard';
import { useTheme } from '@mui/material/styles';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useTheme as useAppTheme } from '../contexts/ThemeContext';
import { fetchEstoque } from '../services/estoqueService';
import Sidebar from '../components/Sidebar';

export default function Estoque() {
  const theme = useTheme();
  const { isDark, setIsDark } = useAppTheme();
  const [metricas, setMetricas] = useState({
    totalEstoque: 0,
    valorTotal: 0,
    estoqueCritico: 0,
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleMetricasUpdate = (novasMetricas) => {
    setMetricas(novasMetricas);
  };

  const calcularMinimo = (mediaVendas) => {
    // Mínimo é calculado para 60 dias de estoque
    return Math.ceil(mediaVendas * 60);
  };

  const calcularMinimoNegociacao = (mediaVendas) => {
    // Mínimo para negociação é calculado para 70 dias de estoque
    return Math.ceil(mediaVendas * 70);
  };

  const calcularPrevisao = (estoque, mediaVendas) => {
    if (mediaVendas === 0) return 0;
    // Previsão em dias é o estoque atual dividido pela média diária
    return Math.ceil(estoque / mediaVendas);
  };

  const gerarRelatorio = async () => {
    try {
      // Buscar dados do banco
      const dadosEstoque = await fetchEstoque();
      
      const doc = new jsPDF();
      
      // Configuração inicial
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.setTextColor(44, 62, 80);
      
      // Título
      doc.text('Relatório de Estoque', 105, 25, { align: 'center' });
      doc.setDrawColor(52, 152, 219);
      doc.setLineWidth(0.5);
      doc.line(20, 30, 190, 30);
      
      // Data do relatório
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(108, 117, 125);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 40);
      
      // Métricas principais
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80);
      doc.text('Métricas Principais', doc.internal.pageSize.width / 2, 55, { align: 'center' });
      
      const metricsData = [
        ['Total em Estoque', metricas.totalEstoque.toString()],
        ['Valor em Estoque', `R$ ${metricas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
        ['Estoque em Reposição', metricas.estoqueCritico.toString()]
      ];
      
      // Primeira tabela (Métricas Principais)
      doc.autoTable({
        startY: 65,
        head: [['Métrica', 'Valor']],
        body: metricsData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 12,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 8
        },
        styles: {
          fontSize: 11,
          cellPadding: 8,
          lineColor: [189, 195, 199],
          lineWidth: 0.1,
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 70 }
        },
        alternateRowStyles: {
          fillColor: [241, 245, 249]
        }
      });
      
      // Produtos em estoque
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(44, 62, 80);
      doc.text('Produtos em Estoque', doc.internal.pageSize.width / 2, doc.autoTable.previous.finalY + 30, { align: 'center' });

      // Preparar dados para a tabela
      const productsData = dadosEstoque.map(item => {
        const previsao = item.mediaVendas > 0 ? Math.ceil(item.estoque / item.mediaVendas) : 0;
        
        return [
          item.sku,
          item.produto,
          item.estoque.toString(),
          item.minimo.toString(),
          `R$ ${item.precoCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `R$ ${item.valorLiquidoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          item.status,
          item.mediaVendas.toFixed(2),
          previsao.toString()
        ];
      }).sort((a, b) => {
        // Função para atribuir peso ao status
        const getPesoStatus = (status) => {
          const statusLower = status.toLowerCase();
          if (statusLower === 'sem estoque') return 1;
          if (statusLower === 'em reposição') return 2;
          if (statusLower === 'em negociação') return 3;
          if (statusLower === 'em estoque') return 4;
          if (statusLower === 'estoque alto') return 5;
          return 6;
        };

        // Comparar primeiro por status
        const statusA = getPesoStatus(a[6]);
        const statusB = getPesoStatus(b[6]);
        
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        
        // Se o status for igual, ordenar por previsão
        const previsaoA = parseInt(a[8]) || 0;
        const previsaoB = parseInt(b[8]) || 0;
        return previsaoA - previsaoB;
      });

      // Segunda tabela (Produtos em Estoque)
      doc.autoTable({
        startY: doc.autoTable.previous.finalY + 40,
        head: [['SKU', 'Produto', 'Estoque', 'Mínimo', 'CMV', 'Valor Líq.', 'Status', 'Média', 'Previsão']],
        body: productsData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 2,
          minCellHeight: 10
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [189, 195, 199],
          lineWidth: 0.1,
          minCellHeight: 10,
          valign: 'middle',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 20 },      // SKU
          1: { cellWidth: 40 },      // Produto
          2: { cellWidth: 16 },      // Estoque
          3: { cellWidth: 16 },      // Mínimo
          4: { cellWidth: 22 },      // CMV
          5: { cellWidth: 22 },      // Valor Líq.
          6: { cellWidth: 25 },      // Status
          7: { cellWidth: 14 },      // Média
          8: { cellWidth: 16 }       // Previsão
        },
        alternateRowStyles: {
          fillColor: [241, 245, 249]
        },
        margin: { left: 5, right: 5 },
        didDrawCell: function(data) {
          // Destacar células com estoque abaixo do mínimo
          if (data.column.index === 2 && data.row.index < productsData.length) {
            try {
              const estoque = parseInt(data.cell.text) || 0;
              const minimo = parseInt(productsData[data.row.index][3]) || 0;
              if (estoque < minimo) {
                doc.setTextColor(231, 76, 60); // vermelho
              } else {
                doc.setTextColor(44, 62, 80); // cor padrão
              }
            } catch (error) {
              doc.setTextColor(44, 62, 80); // cor padrão em caso de erro
            }
          }
        },
        didParseCell: function(data) {
          // Estilizar a coluna de status
          if (data.column.index === 6) {
            if (data.row.section === 'head') {
              data.cell.styles.textColor = [255, 255, 255]; // Branco para o cabeçalho
            } else {
              const status = String(data.cell.text || '').trim().toLowerCase();
              if (status === 'sem estoque') {
                data.cell.styles.textColor = [244, 67, 54]; // Vermelho
              } else if (status === 'em reposição') {
                data.cell.styles.textColor = [255, 152, 0]; // Laranja
              } else if (status === 'em negociação') {
                data.cell.styles.textColor = [156, 39, 176]; // Roxo
              } else if (status === 'em estoque') {
                data.cell.styles.textColor = [76, 175, 80]; // Verde
              } else if (status === 'estoque alto') {
                data.cell.styles.textColor = [33, 150, 243]; // Azul
              }
            }
          }
        }
      });
      
      // Adicionar rodapé com numeração de página
      const pageCount = doc.internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(108, 117, 125);
        doc.text(
          `Página ${i} de ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
      
      // Salvar o PDF
      doc.save(`relatorio_estoque_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório. Por favor, tente novamente.');
    }
  };

  // Função auxiliar para converter cor hex para RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  const determinarStatus = (estoque, mediaVendas) => {
    const minimo = calcularMinimo(mediaVendas);
    const minimoNegociacao = calcularMinimoNegociacao(mediaVendas);

    if (estoque === 0) return 'sem estoque';
    if (estoque < minimo) return 'em reposição';
    if (estoque < minimoNegociacao) return 'em negociação';
    if (estoque <= minimo * 1.5) return 'em estoque';
    return 'estoque alto';
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ 
      display: 'flex',
      width: '100%',
      height: '100vh',
    }}>
      <Sidebar 
        open={sidebarOpen} 
        onToggle={handleToggleSidebar}
        sx={{ 
          width: 240,
          flexShrink: 0,
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100%'
        }}
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginLeft: '50px',
          height: '100vh',
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              Controle de Estoque
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton onClick={() => setIsDark(!isDark)}>
                {isDark ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
              <IconButton>
                <NotificationsIcon />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                onClick={gerarRelatorio}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }}
              >
                Gerar Relatório
              </Button>
            </Box>
          </Box>

          {/* Métricas */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Total em Estoque"
                value={metricas.totalEstoque}
                icon={<InventoryIcon />}
                color="#0ea5e9"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <MetricCard
                title="Valor em Estoque"
                value={metricas.valorTotal}
                icon={<AttachMoneyIcon />}
                color="#22c55e"
                isCurrency
              />
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              <MetricCard
                title="Em Reposição"
                value={metricas.estoqueCritico}
                icon={<WarningIcon />}
                color="#f97316"
              />
            </Grid>
          </Grid>

          {/* Tabela de Estoque */}
          <EstoqueTable onMetricasUpdate={handleMetricasUpdate} />
        </Container>
      </Box>
    </Box>
  );
}