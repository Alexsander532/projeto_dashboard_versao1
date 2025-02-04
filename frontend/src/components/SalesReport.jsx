import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

// Registrar fonte personalizada
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf'
});

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Roboto'
  },
  header: {
    marginBottom: 20,
    backgroundColor: '#1976D2',
    padding: 20,
    borderRadius: 5
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 5,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    textAlign: 'center'
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1976D2',
    marginBottom: 15,
    borderBottom: 2,
    borderBottomColor: '#1976D2',
    paddingBottom: 5
  },
  skuCard: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeft: 4
  },
  skuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  statusIcon: {
    fontSize: 18,
    marginRight: 10
  },
  skuTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center'
  },
  label: {
    width: '45%',
    fontSize: 12,
    color: '#616161'
  },
  value: {
    width: '55%',
    fontSize: 12,
    color: '#212121',
    fontWeight: 'bold'
  },
  comparisonSection: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 5,
    marginTop: 15
  },
  comparisonTitle: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 10,
    fontWeight: 'bold'
  },
  comparisonGrid: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  comparisonColumn: {
    width: '48%'
  },
  progressSection: {
    marginTop: 15,
    marginBottom: 15
  },
  progressLabel: {
    fontSize: 12,
    color: '#616161',
    marginBottom: 5
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 15
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  pageBreak: {
    height: 1,
    marginTop: 30,
    marginBottom: 30,
    borderTop: 1,
    borderTopColor: '#E0E0E0'
  },
  positive: {
    color: '#4CAF50'
  },
  negative: {
    color: '#F44336'
  }
});

const SalesReport = ({ data, goals, marginGoals }) => {
  const [previousDayData, setPreviousDayData] = useState({});
  const currentDate = new Date();
  const previousDate = new Date(currentDate);
  previousDate.setDate(previousDate.getDate() - 1);

  // Busca dados do dia anterior
  useEffect(() => {
    const fetchPreviousDayData = async () => {
      try {
        const response = await axios.get('http://localhost:3005/api/vendas', {
          params: {
            date: format(previousDate, 'yyyy-MM-dd')
          }
        });

        if (response.data && Array.isArray(response.data)) {
          // Agrupa os dados por SKU
          const previousData = response.data.reduce((acc, venda) => {
            const sku = venda.sku;
            if (!acc[sku]) {
              acc[sku] = {
                total: 0,
                quantity: 0,
                profit: 0
              };
            }
            acc[sku].total += Number(venda.valor_vendido) || 0;
            acc[sku].quantity += Number(venda.unidades) || 0;
            acc[sku].profit += Number(venda.lucro) || 0;
            return acc;
          }, {});

          setPreviousDayData(previousData);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dia anterior:', error);
      }
    };

    fetchPreviousDayData();
  }, []);

  // Função para calcular o progresso
  const calculateProgress = (current, goal) => {
    if (!goal) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  // Função para formatar a variação
  const formatVariation = (current, previous) => {
    if (!previous) return { value: 0, isPositive: true };
    const variation = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(variation).toFixed(1),
      isPositive: variation >= 0
    };
  };

  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Função para determinar o status do SKU
  const getSkuStatus = (goal, salesProgress) => {
    if (!goal) return 'undefined';
    if (salesProgress >= 100) return 'success';
    if (salesProgress >= 60) return 'reachable';
    if (salesProgress >= 40) return 'warning';
    return 'danger';
  };

  // Função para obter a cor do status
  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'reachable': return '#2196F3';
      case 'warning': return '#FF9800';
      case 'danger': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  // Função para obter o ícone do status (emoji como texto)
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'reachable': return '📈';
      case 'warning': return '⚠️';
      case 'danger': return '❗';
      default: return '🔍';
    }
  };

  // Função para obter a mensagem de status da margem
  const getMarginStatusMessage = (currentMargin, marginGoal) => {
    if (!marginGoal) return 'Meta de margem não definida';
    if (currentMargin >= marginGoal) {
      return 'Margem de lucro dentro da meta estipulada';
    }
    const difference = (marginGoal - currentMargin).toFixed(1);
    return `Necessário melhorar a margem em ${difference}%`;
  };

  // Agrupa os SKUs por status
  const skusByStatus = Object.entries(data).reduce((acc, [sku, skuData]) => {
    const goal = goals[sku] || 0;
    const salesProgress = calculateProgress(skuData.total || 0, goal);
    const status = getSkuStatus(goal, salesProgress);
    
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push({ sku, ...skuData, progress: salesProgress });
    return acc;
  }, {});

  // Ordem e títulos dos status
  const statusOrder = [
    { key: 'undefined', title: 'Meta Não Definida' },
    { key: 'success', title: 'Meta Alcançada (100%)' },
    { key: 'reachable', title: 'Meta Alcançável (60-99%)' },
    { key: 'warning', title: 'Atenção Necessária (40-60%)' },
    { key: 'danger', title: 'Risco Alto (0-40%)' }
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <Text style={styles.title}>Relatório de Vendas e Metas</Text>
          <Text style={styles.subtitle}>
            Gerado em {format(currentDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </Text>
        </View>

        {/* Resumo Geral */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Geral</Text>
          <View style={styles.skuCard}>
            <View style={styles.infoSection}>
              <View style={styles.row}>
                <Text style={styles.label}>Total de Vendas:</Text>
                <Text style={styles.value}>
                  {formatCurrency(Object.values(data).reduce((acc, curr) => acc + (curr.total || 0), 0))}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total de Unidades:</Text>
                <Text style={styles.value}>
                  {Object.values(data).reduce((acc, curr) => acc + (curr.quantity || 0), 0)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>SKUs com Meta:</Text>
                <Text style={styles.value}>
                  {Object.entries(goals).filter(([_, goal]) => goal > 0).length} de {Object.keys(data).length}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>SKUs com Meta Atingida:</Text>
                <Text style={styles.value}>
                  {(skusByStatus.success || []).length}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Detalhes por Status */}
        {statusOrder.map(({ key: status, title }) => {
          const skusInStatus = skusByStatus[status] || [];
          if (skusInStatus.length === 0) return null;

          return (
            <View key={status} style={styles.section} break>
              <Text style={styles.sectionTitle}>{title}</Text>
              {skusInStatus.map((skuData, index) => {
                const sku = skuData.sku;
                const goal = goals[sku] || 0;
                const marginGoal = marginGoals[sku] || 0;
                const currentSales = skuData.total || 0;
                const currentUnits = skuData.quantity || 0;
                const currentProfit = skuData.profit || 0;
                const currentMargin = currentSales > 0 ? (currentProfit / currentSales) * 100 : 0;
                const salesProgress = skuData.progress;
                
                const previousSkuData = previousDayData[sku] || {};
                const previousSales = previousSkuData.total || 0;
                const previousProfit = previousSkuData.profit || 0;
                
                const salesVariation = formatVariation(currentSales, previousSales);
                const profitVariation = formatVariation(currentProfit, previousProfit);

                return (
                  <View key={sku} style={[styles.skuCard, { borderLeftColor: getStatusColor(status) }]}>
                    <View style={styles.skuHeader}>
                      <Text style={styles.statusIcon}>{getStatusIcon(status)}</Text>
                      <Text style={[styles.skuTitle, { color: getStatusColor(status) }]}>{sku}</Text>
                    </View>
                    
                    {/* Informações Gerais */}
                    <View style={styles.infoSection}>
                      <View style={styles.row}>
                        <Text style={styles.label}>Meta de Vendas:</Text>
                        <Text style={styles.value}>{formatCurrency(goal)}</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Vendas Atuais:</Text>
                        <Text style={styles.value}>{formatCurrency(currentSales)}</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Unidades Vendidas:</Text>
                        <Text style={styles.value}>{currentUnits}</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Meta de Margem:</Text>
                        <Text style={styles.value}>{marginGoal.toFixed(1)}%</Text>
                      </View>
                      <View style={styles.row}>
                        <Text style={styles.label}>Margem Atual:</Text>
                        <Text style={styles.value}>{currentMargin.toFixed(1)}%</Text>
                      </View>
                    </View>

                    {/* Barra de Progresso Vendas */}
                    <View style={styles.progressSection}>
                      <Text style={styles.progressLabel}>Progresso Vendas:</Text>
                      <View style={styles.progressBar}>
                        <View style={[
                          styles.progressFill,
                          { 
                            width: `${salesProgress}%`,
                            backgroundColor: salesProgress >= 100 ? '#4CAF50' : '#1976D2'
                          }
                        ]} />
                      </View>
                    </View>

                    {/* Status e Projeção */}
                    <View style={styles.infoSection}>
                      {/* Status das Vendas */}
                      {goal > 0 && salesProgress < 100 && (
                        <Text style={[styles.value, { color: getStatusColor(status) }]}>
                          Faltam {Math.ceil((goal - currentSales) / (currentSales / currentUnits))} unidades para atingir a meta
                        </Text>
                      )}
                      {salesProgress >= 100 && (
                        <Text style={[styles.value, { color: '#4CAF50' }]}>
                          Meta atingida! Superou em {(salesProgress - 100).toFixed(1)}%
                          {salesProgress >= 200 && ` (${Math.floor(salesProgress / 100)}x a meta)`}
                        </Text>
                      )}

                      {/* Status da Margem */}
                      <Text style={[styles.value, { 
                        color: currentMargin >= marginGoal ? '#4CAF50' : '#FF9800',
                        marginTop: 10
                      }]}>
                        {getMarginStatusMessage(currentMargin, marginGoal)}
                      </Text>
                    </View>

                    {/* Comparação com Dia Anterior */}
                    <View style={styles.comparisonSection}>
                      <Text style={styles.comparisonTitle}>
                        Comparação com {format(previousDate, "dd/MM", { locale: ptBR })}
                      </Text>
                      
                      <View style={styles.comparisonGrid}>
                        <View style={styles.comparisonColumn}>
                          <View style={styles.row}>
                            <Text style={styles.label}>Vendas Ontem:</Text>
                            <Text style={styles.value}>{formatCurrency(previousSales)}</Text>
                          </View>
                          <View style={styles.row}>
                            <Text style={styles.label}>Vendas Hoje:</Text>
                            <Text style={styles.value}>{formatCurrency(currentSales)}</Text>
                          </View>
                          <View style={styles.row}>
                            <Text style={styles.label}>Variação:</Text>
                            <Text style={[styles.value, salesVariation.isPositive ? styles.positive : styles.negative]}>
                              {salesVariation.isPositive ? '+' : '-'}{salesVariation.value}%
                            </Text>
                          </View>
                        </View>

                        <View style={styles.comparisonColumn}>
                          <View style={styles.row}>
                            <Text style={styles.label}>Lucro Ontem:</Text>
                            <Text style={styles.value}>{formatCurrency(previousProfit)}</Text>
                          </View>
                          <View style={styles.row}>
                            <Text style={styles.label}>Lucro Hoje:</Text>
                            <Text style={styles.value}>{formatCurrency(currentProfit)}</Text>
                          </View>
                          <View style={styles.row}>
                            <Text style={styles.label}>Variação:</Text>
                            <Text style={[styles.value, profitVariation.isPositive ? styles.positive : styles.negative]}>
                              {profitVariation.isPositive ? '+' : '-'}{profitVariation.value}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Rodapé */}
        <Text style={styles.footer}>
          Dashboard de Vendas - Relatório gerado em {format(currentDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </Text>
      </Page>
    </Document>
  );
};

export default SalesReport;
