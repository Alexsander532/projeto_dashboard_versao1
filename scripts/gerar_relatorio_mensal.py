import os
import sys
from datetime import datetime, timedelta
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch
import psycopg2
from dotenv import load_dotenv
from babel.numbers import format_currency

# Carrega variáveis de ambiente
load_dotenv()

# Configurações do banco de dados
DB_HOST = 'localhost'
DB_NAME = 'ml sales'
DB_USER = 'postgres'
DB_PASS = 'Cefet2020.'
DB_PORT = 5432

def conectar_banco():
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        port=DB_PORT
    )

def buscar_dados_vendas(conn, mes_ano):
    query = """
    SELECT 
        v.sku,
        COUNT(*) as total_vendas,
        SUM(v.unidades) as unidades_vendidas,
        SUM(v.lucro) as lucro_total,
        AVG(v.margem_lucro) as margem_media,
        SUM(v.valor_vendido) as valor_total_vendido
    FROM vendas_ml v
    WHERE DATE_TRUNC('month', v.data) = DATE_TRUNC('month', %s::date)
    GROUP BY v.sku
    ORDER BY v.sku
    """
    return pd.read_sql_query(query, conn, params=[mes_ano])

def buscar_metas(conn, mes_ano):
    query = """
    SELECT m.sku, m.meta_vendas, m.meta_margem
    FROM metas_ml m
    WHERE DATE_TRUNC('month', m.mes_ano) = DATE_TRUNC('month', %s::date)
    """
    return pd.read_sql_query(query, conn, params=[mes_ano])

def formatar_moeda(valor):
    return format_currency(valor, 'BRL', locale='pt_BR')

def calcular_status_meta(vendas, meta):
    if pd.isna(meta) or meta == 0:
        return 'Meta não definida'
    percentual = (vendas / meta) * 100
    if percentual >= 100:
        return 'Meta atingida!'
    elif percentual >= 70:
        return 'Meta alcançável'
    elif percentual >= 50:
        return 'Atenção necessária'
    else:
        return 'Risco alto'

def gerar_relatorio_mensal(mes_ano):
    conn = conectar_banco()
    
    # Busca os dados
    df_vendas = buscar_dados_vendas(conn, mes_ano)
    df_metas = buscar_metas(conn, mes_ano)
    
    # Ordena df_vendas por lucro_total de forma decrescente
    df_vendas = df_vendas.sort_values('lucro_total', ascending=False)
    
    # Merge dos dados
    df_completo = pd.merge(df_vendas, df_metas, on='sku', how='outer')
    
    # Calcula o progresso para ordenação
    df_completo['progresso'] = df_completo.apply(
        lambda row: (row['valor_total_vendido'] / row['meta_vendas'] * 100) 
        if not pd.isna(row['meta_vendas']) and not pd.isna(row['valor_total_vendido']) and row['meta_vendas'] > 0 
        else 0, 
        axis=1
    )
    
    # Ordena df_completo por progresso de forma decrescente
    df_completo = df_completo.sort_values('progresso', ascending=False)
    
    # Cria o documento PDF
    data_ref = datetime.strptime(mes_ano, '%Y-%m-%d')
    nome_arquivo = f'relatorio_mensal_{data_ref.strftime("%Y-%m")}.pdf'
    doc = SimpleDocTemplate(nome_arquivo, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    
    # Estilos
    styles = getSampleStyleSheet()
    titulo_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1
    )
    
    # Lista de elementos para o PDF
    elements = []
    
    # Título do relatório
    titulo = Paragraph(f'Relatório Mensal de Vendas - {data_ref.strftime("%B/%Y")}', titulo_style)
    elements.append(titulo)
    
    # Parte 1: Resumo de vendas por SKU
    elements.append(Paragraph('Resumo de Vendas por SKU', styles['Heading2']))
    elements.append(Spacer(1, 12))
    
    # Dados para a tabela de resumo
    dados_resumo = [['SKU', 'Total de Vendas', 'Unidades', 'Lucro Total', 'Margem Média']]
    for _, row in df_vendas.iterrows():
        dados_resumo.append([
            row['sku'],
            formatar_moeda(row['valor_total_vendido']),
            int(row['unidades_vendidas']),
            formatar_moeda(row['lucro_total']),
            f"{row['margem_media']:.1f}%"
        ])
    
    # Cria e estiliza a tabela de resumo
    tabela_resumo = Table(dados_resumo, colWidths=[1.5*inch, 1.5*inch, 1*inch, 1.5*inch, 1.2*inch])
    tabela_resumo.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3799')),  # Azul escuro para o cabeçalho
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),  # Centraliza todos os dados
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Alinhamento vertical central
    ]))
    
    elements.append(tabela_resumo)
    elements.append(Spacer(1, 20))
    
    # Parte 2: Acompanhamento de Metas
    elements.append(Paragraph('Acompanhamento de Metas', styles['Heading2']))
    elements.append(Spacer(1, 12))
    
    # Prepara dados para a tabela de metas
    dados_metas = [['SKU', 'Meta Mensal', 'Vendas Atual', 'Unidades', 'Progresso', 'Status']]
    
    # Definindo as cores para cada status
    cores_status = {
        'Meta atingida!': colors.HexColor('#E8F5E9'),  # Verde claro
        'Meta alcançável': colors.HexColor('#E3F2FD'),  # Azul claro
        'Atenção necessária': colors.HexColor('#FFF3E0'),  # Laranja claro
        'Risco alto': colors.HexColor('#FFEBEE'),  # Vermelho claro
        'Meta não definida': colors.HexColor('#F5F5F5')  # Cinza claro
    }

    def get_status_e_cor(progresso, meta_vendas, vendas_realizadas):
        if pd.isna(meta_vendas) or meta_vendas == 0:
            return 'Meta não definida', cores_status['Meta não definida']
        percentual = (vendas_realizadas / meta_vendas) * 100
        if percentual >= 100:
            return 'Meta atingida!', cores_status['Meta atingida!']
        elif percentual >= 60:
            return 'Meta alcançável', cores_status['Meta alcançável']
        elif percentual >= 40:
            return 'Atenção necessária', cores_status['Atenção necessária']
        else:
            return 'Risco alto', cores_status['Risco alto']

    for _, row in df_completo.iterrows():
        meta_vendas = row['meta_vendas'] if not pd.isna(row['meta_vendas']) else 0
        vendas_realizadas = row['valor_total_vendido'] if not pd.isna(row['valor_total_vendido']) else 0
        unidades = int(row['unidades_vendidas']) if not pd.isna(row['unidades_vendidas']) else 0
        
        status, cor_fundo = get_status_e_cor(row['progresso'], meta_vendas, vendas_realizadas)
        
        dados_metas.append([
            row['sku'],
            formatar_moeda(meta_vendas),
            formatar_moeda(vendas_realizadas),
            unidades,
            f"{row['progresso']:.1f}%",
            status
        ])
    
    # Cria e estiliza a tabela de metas
    tabela_metas = Table(dados_metas, colWidths=[1.2*inch, 1.4*inch, 1.4*inch, 0.8*inch, 1*inch, 1.3*inch])
    
    # Estilo base da tabela
    estilo_tabela = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3799')),  # Azul escuro para o cabeçalho
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),  # Centraliza todos os dados
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Alinhamento vertical central
    ]
    
    # Adiciona cores de fundo baseadas no status
    for i in range(1, len(dados_metas)):
        status = dados_metas[i][-1]
        cor_fundo = cores_status[status]
        estilo_tabela.append(('BACKGROUND', (0, i), (-1, i), cor_fundo))
    
    tabela_metas.setStyle(TableStyle(estilo_tabela))
    
    elements.append(tabela_metas)
    
    # Gera o PDF
    doc.build(elements)
    print(f"Relatório mensal gerado com sucesso: {nome_arquivo}")
    
    conn.close()
    return nome_arquivo

if __name__ == "__main__":
    # Se não for fornecida uma data, usa o mês atual
    if len(sys.argv) > 1:
        mes_ano = sys.argv[1]
    else:
        mes_ano = datetime.now().strftime('%Y-%m-01')
    
    gerar_relatorio_mensal(mes_ano)
