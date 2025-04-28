import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFDownloadLink,
  PDFViewer,
  Font 
} from '@react-pdf/renderer';
import { format, addMonths } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

// Registrar fontes
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' }
  ]
});

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: 'white',
    padding: 30,
    fontFamily: 'Roboto'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 10
  },
  tableRow: {
    flexDirection: 'row'
  },
  tableColHeader: {
    backgroundColor: '#1e3799',
    color: 'white',
    padding: 5,
    fontWeight: 'bold',
    fontSize: 10
  },
  tableCol: {
    padding: 5,
    fontSize: 9
  },
  tableCell: {
    textAlign: 'center'
  },
  statusSuccess: {
    backgroundColor: '#E8F5E9'
  },
  statusReachable: {
    backgroundColor: '#E3F2FD'
  },
  statusWarning: {
    backgroundColor: '#FFF3E0'
  },
  statusDanger: {
    backgroundColor: '#FFEBEE'
  },
  statusUndefined: {
    backgroundColor: '#F5F5F5'
  }
});

// Função para formatar valores monetários
const formatarMoeda = (valor) => {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Função para determinar o status baseado no progresso
const determinarStatus = (progresso) => {
  if (progresso >= 100) return { text: 'Meta atingida!', style: styles.statusSuccess };
  if (progresso >= 60) return { text: 'Meta alcançável', style: styles.statusReachable };
  if (progresso >= 40) return { text: 'Atenção necessária', style: styles.statusWarning };
  return { text: 'Risco alto', style: styles.statusDanger };
};

// Componente do relatório
const RelatorioMetas = ({ vendas, metas, marginMetas, mesAno, mesDisplay }) => {
  // Obter todos os SKUs únicos de vendas e metas
  const todosSkus = [...new Set([
    ...Object.keys(metas),
    ...vendas.map(v => v.sku)
  ])];

  // Log para verificar os dados de vendas recebidos
  console.log('Dados de vendas recebidos no RelatorioMetas (primeiros 3 itens):', JSON.stringify(vendas.slice(0, 3), null, 2));

  // Processar os dados de vendas para obter informações por SKU
  const dadosVendasPorSku = vendas.reduce((acc, venda) => {
    const sku = venda.sku;
    if (!acc[sku]) {
      acc[sku] = {
        totalVendido: 0,
        totalUnidades: 0,
        totalLucro: 0,
        vendas: []
      };
    }
    
    // Garantir que estamos usando os valores numéricos
    const valorVendido = typeof venda.valor_vendido === 'number' ? venda.valor_vendido : 
                        (typeof venda.valorVendido === 'number' ? venda.valorVendido : 
                        parseFloat(venda.valor_vendido || venda.valorVendido || 0));
    
    const unidades = typeof venda.unidades === 'number' ? venda.unidades : 
                    parseFloat(venda.unidades || 0);
    
    // Usar o campo lucro diretamente das vendas do Mercado Livre
    const lucro = typeof venda.lucro === 'number' ? venda.lucro : 
                parseFloat(venda.lucro || 0);
    
    console.log(`Processando SKU ${sku}: valorVendido=${valorVendido}, unidades=${unidades}, lucro=${lucro}`);
    
    acc[sku].totalVendido += valorVendido;
    acc[sku].totalUnidades += unidades;
    acc[sku].totalLucro += lucro;
    acc[sku].vendas.push(venda);
    
    return acc;
  }, {});

  // Log para verificar os dados processados por SKU
  console.log('Dados processados por SKU (primeiros 3):', 
    JSON.stringify(Object.entries(dadosVendasPorSku).slice(0, 3).map(([sku, dados]) => ({ 
      sku, 
      totalVendido: dados.totalVendido,
      totalUnidades: dados.totalUnidades,
      totalLucro: dados.totalLucro
    })), null, 2)
  );

  // Preparar dados para o resumo de vendas
  const resumoVendas = todosSkus.map(sku => {
    const dadosVenda = dadosVendasPorSku[sku] || { totalVendido: 0, totalUnidades: 0, totalLucro: 0 };
    
    // Obter a margem atual diretamente dos dados de vendas
    const margemAtual = vendas.find(v => v.sku === sku)?.margem_lucro || 0;
    
    return {
      sku,
      totalVendido: dadosVenda.totalVendido,
      totalUnidades: dadosVenda.totalUnidades,
      totalLucro: dadosVenda.totalLucro,
      margemMedia: parseFloat(margemAtual)
    };
  }).sort((a, b) => b.totalLucro - a.totalLucro); // Ordenar por lucro total decrescente

  // Preparar dados para acompanhamento de metas
  const dadosMetas = todosSkus.map(sku => {
    const dadosVenda = dadosVendasPorSku[sku] || { totalVendido: 0, totalUnidades: 0, totalLucro: 0 };
    const metaVendas = metas[sku] || 0;
    const progresso = metaVendas > 0 ? (dadosVenda.totalVendido / metaVendas) * 100 : 0;
    const status = metaVendas > 0 ? determinarStatus(progresso) : { text: 'Meta não definida', style: styles.statusUndefined };
    
    // Obter a margem atual diretamente dos dados de vendas
    const margemAtual = vendas.find(v => v.sku === sku)?.margem_lucro || 0;

    return {
      sku,
      totalVendido: dadosVenda.totalVendido,
      totalUnidades: dadosVenda.totalUnidades,
      totalLucro: dadosVenda.totalLucro,
      margemMedia: parseFloat(margemAtual),
      metaVendas,
      progresso,
      status
    };
  }).sort((a, b) => b.progresso - a.progresso); // Ordenar por progresso decrescente

  console.log('Data formatada para o título:', {
    mesAno,
    mesDisplay
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Título do relatório */}
        <Text style={styles.title}>Relatório Mensal de Metas - {mesDisplay}</Text>
        
        {/* Resumo de Vendas por SKU */}
        <Text style={styles.subtitle}>Resumo de Vendas por SKU</Text>
        <View style={styles.table}>
          {/* Cabeçalho da tabela */}
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: '25%' }]}>
              <Text style={styles.tableCell}>SKU</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '30%' }]}>
              <Text style={styles.tableCell}>Total de Vendas</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '20%' }]}>
              <Text style={styles.tableCell}>Unidades</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '25%' }]}>
              <Text style={styles.tableCell}>Margem Média</Text>
            </View>
          </View>
          
          {/* Linhas da tabela */}
          {resumoVendas.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '25%' }]}>
                <Text style={styles.tableCell}>{item.sku}</Text>
              </View>
              <View style={[styles.tableCol, { width: '30%' }]}>
                <Text style={styles.tableCell}>{formatarMoeda(item.totalVendido)}</Text>
              </View>
              <View style={[styles.tableCol, { width: '20%' }]}>
                <Text style={styles.tableCell}>{item.totalUnidades}</Text>
              </View>
              <View style={[styles.tableCol, { width: '25%' }]}>
                <Text style={styles.tableCell}>{item.margemMedia.toFixed(1)}%</Text>
              </View>
            </View>
          ))}
        </View>
        
        {/* Acompanhamento de Metas */}
        <Text style={styles.subtitle}>Acompanhamento de Metas</Text>
        <View style={styles.table}>
          {/* Cabeçalho da tabela */}
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, { width: '15%' }]}>
              <Text style={styles.tableCell}>SKU</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '20%' }]}>
              <Text style={styles.tableCell}>Meta Mensal</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '20%' }]}>
              <Text style={styles.tableCell}>Vendas Atual</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '10%' }]}>
              <Text style={styles.tableCell}>Unidades</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '15%' }]}>
              <Text style={styles.tableCell}>Progresso</Text>
            </View>
            <View style={[styles.tableColHeader, { width: '20%' }]}>
              <Text style={styles.tableCell}>Status</Text>
            </View>
          </View>
          
          {/* Linhas da tabela */}
          {dadosMetas.map((item, index) => (
            <View key={index} style={[styles.tableRow, item.status.style]}>
              <View style={[styles.tableCol, { width: '15%' }]}>
                <Text style={styles.tableCell}>{item.sku}</Text>
              </View>
              <View style={[styles.tableCol, { width: '20%' }]}>
                <Text style={styles.tableCell}>{formatarMoeda(item.metaVendas)}</Text>
              </View>
              <View style={[styles.tableCol, { width: '20%' }]}>
                <Text style={styles.tableCell}>{formatarMoeda(item.totalVendido)}</Text>
              </View>
              <View style={[styles.tableCol, { width: '10%' }]}>
                <Text style={styles.tableCell}>{item.totalUnidades}</Text>
              </View>
              <View style={[styles.tableCol, { width: '15%' }]}>
                <Text style={styles.tableCell}>{item.progresso.toFixed(1)}%</Text>
              </View>
              <View style={[styles.tableCol, { width: '20%' }]}>
                <Text style={styles.tableCell}>{item.status.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

// Componente para download do relatório
export const RelatorioDownloadLink = ({ vendas, metas, marginMetas, mesAno, mesDisplay }) => {
  const dataFormatada = format(new Date(mesAno), 'yyyy-MM');
  const fileName = `relatorio_mensal_metas_${dataFormatada}.pdf`;
  
  return (
    <PDFDownloadLink 
      document={<RelatorioMetas vendas={vendas} metas={metas} marginMetas={marginMetas} mesAno={mesAno} mesDisplay={mesDisplay} />} 
      fileName={fileName}
      style={{
        textDecoration: 'none',
        display: 'inline-block',
        width: '100%',
        height: '100%'
      }}
    >
      {({ blob, url, loading, error }) => 
        loading ? 'Gerando relatório...' : 'Relatório pronto!'
      }
    </PDFDownloadLink>
  );
};

export default RelatorioMetas;
