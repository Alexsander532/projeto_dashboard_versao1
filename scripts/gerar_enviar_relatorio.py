import os
from datetime import datetime, timedelta, date
import psycopg2
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import requests
import json
from twilio.rest import Client
import mimetypes

# Carrega as variáveis de ambiente
load_dotenv()

# Configurações do banco de dados
DB_CONFIG = {
    'dbname': os.getenv('DB_DATABASE', 'ml sales').replace('"', ''),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'Cefet2020.'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432')
}

def conectar_banco():
    """Estabelece conexão com o banco de dados"""
    try:
        print("Tentando conectar ao banco de dados com as configurações:")
        print(f"dbname: {DB_CONFIG['dbname']}")
        print(f"user: {DB_CONFIG['user']}")
        print(f"host: {DB_CONFIG['host']}")
        print(f"port: {DB_CONFIG['port']}")
        
        return psycopg2.connect(
            dbname=DB_CONFIG['dbname'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port']
        )
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {str(e)}")
        return None

def buscar_dados_dia(conn, data):
    """Busca dados de vendas de um dia específico"""
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT 
                sku,
                SUM(valor_vendido) as valor_vendido,
                SUM(unidades) as unidades,
                SUM(lucro) as lucro
            FROM vendas_ml
            WHERE DATE(data) = %s
            GROUP BY sku
        """, (data,))
        
        resultados = cur.fetchall()
        print(f"Dados encontrados para {data}: {len(resultados)} registros")
        return resultados
    except Exception as e:
        print(f"Erro ao buscar dados do dia {data}: {str(e)}")
        return []

def buscar_dados_mes_atual(conn):
    """Busca dados de vendas do mês atual"""
    try:
        cur = conn.cursor()
        primeiro_dia_mes = date.today().replace(day=1)
        
        cur.execute("""
            SELECT 
                sku,
                SUM(valor_vendido) as valor_vendido,
                SUM(unidades) as unidades,
                SUM(lucro) as lucro
            FROM vendas_ml
            WHERE DATE(data) >= %s
            GROUP BY sku
        """, (primeiro_dia_mes,))
        
        return cur.fetchall()
    except Exception as e:
        print(f"Erro ao buscar dados do mês: {str(e)}")
        return []

def buscar_metas(conn):
    """Busca as metas de vendas do banco de dados"""
    try:
        cur = conn.cursor()
        cur.execute("SELECT sku, meta_vendas FROM metas_ml")
        metas = {}
        for sku, meta in cur.fetchall():
            metas[sku] = float(meta) if meta else 0
        return metas
    except Exception as e:
        print(f"Erro ao buscar metas: {str(e)}")
        return {}

def buscar_margens(conn):
    """Busca as margens por SKU do banco de dados"""
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT 
                sku,
                AVG(CASE 
                    WHEN valor_vendido > 0 
                    THEN (lucro / valor_vendido) * 100
                    ELSE 0 
                END) as margem_media
            FROM vendas_ml 
            WHERE valor_vendido > 0
            GROUP BY sku
        """)
        
        margens = {}
        for sku, margem in cur.fetchall():
            margens[sku] = float(margem) if margem else 0
        return margens
    except Exception as e:
        print(f"Erro ao buscar margens: {str(e)}")
        return {}

def buscar_margem_media_mes(conn):
    """Busca a média das margens de lucro de todos os pedidos do mês atual"""
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT AVG(margem_lucro)
            FROM vendas_ml
            WHERE EXTRACT(MONTH FROM data) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM data) = EXTRACT(YEAR FROM CURRENT_DATE)
        """)
        
        result = cur.fetchone()
        return float(result[0]) if result[0] else 0
    except Exception as e:
        print(f"Erro ao buscar margem média do mês: {str(e)}")
        return 0

def calcular_totais(vendas):
    """Calcula totais por SKU"""
    totais = {}
    for sku, valor_vendido, unidades, lucro in vendas:
        if sku not in totais:
            totais[sku] = {
                'total': 0,
                'quantidade': 0,
                'lucro': 0
            }
        
        valor = float(valor_vendido) if valor_vendido else 0
        unids = int(unidades) if unidades else 0
        luc = float(lucro) if lucro else 0
        
        totais[sku]['total'] += valor
        totais[sku]['quantidade'] += unids
        totais[sku]['lucro'] += luc
    
    return totais

def calcular_status_mensal(total_vendas, meta_vendas):
    """Calcula o status do SKU baseado no progresso mensal"""
    if not meta_vendas:
        return 'undefined', 'Meta não definida'
    
    progresso = (total_vendas / meta_vendas * 100) if meta_vendas > 0 else 0
    
    if progresso >= 100:
        return 'success', 'Meta atingida!'
    elif progresso >= 60:
        return 'reachable', 'Meta alcançável'
    elif progresso >= 40:
        return 'warning', 'Atenção necessária'
    else:
        return 'danger', 'Risco alto'

def gerar_relatorio_pdf(dados_ontem, dados_anteontem, dados_mes, metas, margens, margem_media_mes):
    """Gera o relatório PDF"""
    hoje = datetime.now()
    ontem = hoje - timedelta(days=1)
    nome_arquivo = f'relatorio_vendas_{ontem.strftime("%Y-%m-%d")}.pdf'
    
    # Configuração da página
    doc = SimpleDocTemplate(
        nome_arquivo,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        spaceAfter=30,
        alignment=1,
        textColor=colors.HexColor('#1A237E'),
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'CustomSubTitle',
        parent=styles['Heading2'],
        fontSize=22,
        spaceAfter=25,
        alignment=1,
        textColor=colors.HexColor('#303F9F'),
        fontName='Helvetica-Bold'
    )
    
    # Cores
    header_color = colors.HexColor('#303F9F')  # Azul médio elegante
    subheader_color = colors.HexColor('#3949AB')  # Azul um pouco mais claro
    background_color = colors.HexColor('#FAFAFA')  # Cinza muito claro
    border_color = colors.HexColor('#E0E0E0')  # Cinza claro para bordas
    status_colors = {
        'success': colors.HexColor('#E8F5E9'),
        'reachable': colors.HexColor('#E3F2FD'),
        'warning': colors.HexColor('#FFF3E0'),
        'danger': colors.HexColor('#FFEBEE'),
        'undefined': colors.HexColor('#F5F5F5')
    }
    
    elements = []
    
    # Título do relatório
    title = Paragraph(f"Relatório de Vendas<br/>{ontem.strftime('%d/%m/%Y')}", title_style)
    elements.append(title)
    elements.append(Spacer(1, 30))
    
    # Parte 1: Resumo e Detalhes por SKU
    subtitle = Paragraph("Parte 1: Comparação de Vendas", subtitle_style)
    elements.append(subtitle)
    elements.append(Spacer(1, 20))
    
    # Calcular totais
    totais_ontem = calcular_totais(dados_ontem)
    status_mensais = {}
    totais_mes = calcular_totais(dados_mes)
    for sku in totais_mes.keys():
        vendas = totais_mes[sku]
        meta = metas.get(sku, 0)
        status_code, status_text = calcular_status_mensal(vendas['total'], meta)
        status_mensais[sku] = {'code': status_code, 'text': status_text}
    
    # Resumo Geral
    total_vendas = sum(dados['total'] for dados in totais_ontem.values())
    total_unidades = sum(dados['quantidade'] for dados in totais_ontem.values())
    total_lucro = sum(dados['lucro'] for dados in totais_ontem.values())
    
    resumo_data = [
        ['Resumo Geral'],
        ['Total de Vendas', f'R$ {total_vendas:,.2f}'],
        ['Total de Unidades', str(total_unidades)],
        ['Total de Lucro', f'R$ {total_lucro:,.2f}'],
        ['Margem Média Mensal', f'{margem_media_mes:.1f}%'],
    ]
    
    t_resumo = Table(resumo_data, colWidths=[3*inch, 3*inch])
    t_resumo.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), header_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('SPAN', (0, 0), (-1, 0)),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 16),
        ('BACKGROUND', (0, 1), (-1, -1), background_color),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, border_color),
        ('BOX', (0, 0), (-1, -1), 2, header_color),
    ]))
    
    elements.append(Table([[t_resumo]], colWidths=[8.2*inch], style=[
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(Spacer(1, 30))
    
    # Detalhes por SKU
    for sku in sorted(totais_ontem.keys()):
        dados = totais_ontem[sku]
        dados_ant = calcular_totais(dados_anteontem).get(sku, {'total': 0, 'quantidade': 0, 'lucro': 0})
        status_mensal = status_mensais.get(sku, {'code': 'undefined', 'text': 'Meta não definida'})
        
        # Calcular variações
        var_vendas = ((dados['total'] - dados_ant['total']) / dados_ant['total'] * 100) if dados_ant['total'] > 0 else 0
        var_lucro = ((dados['lucro'] - dados_ant['lucro']) / dados_ant['lucro'] * 100) if dados_ant['lucro'] > 0 else 0
        margem_sku = margens.get(sku, 0)
        
        # Nova estrutura mais compacta e intuitiva
        sku_data = [
            [f'SKU: {sku}', status_mensal['text']],
            ['Indicador', 'Ontem', 'Hoje', 'Variação'],
            ['Vendas', f'R$ {dados_ant["total"]:,.2f}', f'R$ {dados["total"]:,.2f}', f'{var_vendas:+.1f}%'],
            ['Lucro', f'R$ {dados_ant["lucro"]:,.2f}', f'R$ {dados["lucro"]:,.2f}', f'{var_lucro:+.1f}%'],
            ['Unidades', str(dados_ant['quantidade']), str(dados['quantidade']), '-'],
            ['Margem', f'{margem_sku:.1f}%', '', ''],
        ]
        
        t_sku = Table(sku_data, colWidths=[1.5*inch, 2*inch, 2*inch, 1.5*inch])
        
        t_sku.setStyle(TableStyle([
            # Cabeçalho SKU
            ('BACKGROUND', (0, 0), (0, 0), header_color),
            ('BACKGROUND', (1, 0), (1, 0), status_colors[status_mensal['code']]),
            ('TEXTCOLOR', (0, 0), (0, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            # Subcabeçalho
            ('BACKGROUND', (0, 1), (-1, 1), subheader_color),
            ('TEXTCOLOR', (0, 1), (-1, 1), colors.white),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            # Corpo
            ('BACKGROUND', (0, 2), (-1, -1), background_color),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 2), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 2), (-1, -1), 12),
            # Espaçamento
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            # Bordas
            ('GRID', (0, 0), (-1, -1), 1, border_color),
            ('BOX', (0, 0), (-1, -1), 2, header_color),
            # Variações
            ('TEXTCOLOR', (3, 2), (3, -2), colors.HexColor('#1B5E20') if var_vendas > 0 else colors.HexColor('#B71C1C')),
        ]))
        
        elements.append(Table([[t_sku]], colWidths=[8.2*inch], style=[
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        elements.append(Spacer(1, 20))
    
    elements.append(PageBreak())
    
    # Parte 2: Progresso Mensal
    subtitle = Paragraph("Parte 2: Progresso Mensal de Vendas", subtitle_style)
    elements.append(subtitle)
    elements.append(Spacer(1, 20))
    
    # Preparar e ordenar dados
    progress_data = []
    for sku in totais_mes.keys():
        vendas = totais_mes[sku]
        meta = metas.get(sku, 0)
        progresso = (vendas['total'] / meta * 100) if meta > 0 else 0
        status_code, status_text = calcular_status_mensal(vendas['total'], meta)
        
        progress_data.append({
            'sku': sku,
            'meta': meta,
            'vendas': vendas['total'],
            'unidades': vendas['quantidade'],
            'progresso': progresso,
            'status_code': status_code,
            'status_text': status_text
        })
    
    progress_data.sort(key=lambda x: x['progresso'], reverse=True)
    
    # Tabela de progresso
    table_data = [
        ['SKU', 'Meta Mensal', 'Vendas Atual', 'Unidades', 'Progresso', 'Status']
    ]
    
    row_colors = []
    for item in progress_data:
        table_data.append([
            item['sku'],
            f'R$ {item["meta"]:,.2f}',
            f'R$ {item["vendas"]:,.2f}',
            str(item['unidades']),
            f'{item["progresso"]:.1f}%',
            item['status_text']
        ])
        row_colors.append(status_colors.get(item['status_code'], colors.white))
    
    progress_table = Table(
        table_data,
        colWidths=[1.2*inch, 1.5*inch, 1.5*inch, 1*inch, 1*inch, 2*inch],
        repeatRows=1
    )
    
    # Estilo para tabela de progresso
    table_style = [
        # Cabeçalho
        ('BACKGROUND', (0, 0), (-1, 0), header_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        # Espaçamento
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        # Alinhamento
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        # Bordas
        ('GRID', (0, 0), (-1, -1), 1, border_color),
        ('BOX', (0, 0), (-1, -1), 2, header_color),
    ]
    
    # Adicionar cores de fundo para cada linha
    for i, color in enumerate(row_colors, start=1):
        table_style.append(('BACKGROUND', (0, i), (-1, i), color))
    
    progress_table.setStyle(TableStyle(table_style))
    
    # Centralizar tabela de progresso
    elements.append(Table([[progress_table]], colWidths=[8.2*inch], style=[
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    
    # Gerar PDF
    doc.build(elements)
    return nome_arquivo

def enviar_email(arquivo_pdf):
    """Envia o relatório por e-mail"""
    try:
        # Configurações do e-mail
        remetente = os.getenv('EMAIL_REMETENTE')
        senha = os.getenv('EMAIL_SENHA')
        destinatario = os.getenv('EMAIL_DESTINATARIO')
        
        # Criar mensagem
        msg = MIMEMultipart()
        msg['From'] = remetente
        msg['To'] = destinatario
        msg['Subject'] = f"Relatório de Vendas - {datetime.now().strftime('%d/%m/%Y')}"
        
        # Corpo do e-mail
        corpo = "Segue em anexo o relatório de vendas."
        msg.attach(MIMEText(corpo, 'plain'))
        
        # Anexar PDF
        with open(arquivo_pdf, "rb") as f:
            part = MIMEApplication(f.read(), _subtype="pdf")
            part.add_header('Content-Disposition', 'attachment', filename=arquivo_pdf)
            msg.attach(part)
        
        # Enviar e-mail
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(remetente, senha)
        server.send_message(msg)
        server.quit()
        
        print("Relatório enviado com sucesso!")
    except Exception as e:
        print(f"Erro ao enviar e-mail: {str(e)}")

def enviar_whatsapp(arquivo_pdf):
    """Envia o relatório por WhatsApp usando Twilio"""
    try:
        # Configurações do Twilio
        account_sid = 'AC59c08fd41f93aa7c44ce1fa6c0dc6ec1'
        auth_token = '06c1ea753ec043afeee3ed15f9de572f'
        client = Client(account_sid, auth_token)

        # Enviamos a mensagem com o PDF
        data_hoje = datetime.now().strftime('%d/%m/%Y')
        message = client.messages.create(
            from_='whatsapp:+14155238886',
            body=f'*Relatório de Vendas - {data_hoje}*\n\nSegue o relatório diário de vendas com os resultados atualizados.',
            media_url=['https://www.africau.edu/images/default/sample.pdf'],  # Por enquanto usando um PDF de exemplo
            to='whatsapp:+553182568421'
        )

        print(f"Mensagem enviada com sucesso! ID: {message.sid}")
        return True

    except Exception as e:
        print(f"Erro ao enviar relatório pelo WhatsApp: {str(e)}")
        return False

def main():
    try:
        conn = conectar_banco()
        if not conn:
            return
        
        hoje = date.today()
        ontem = hoje - timedelta(days=1)
        anteontem = hoje - timedelta(days=2)
        
        dados_ontem = buscar_dados_dia(conn, ontem)
        dados_anteontem = buscar_dados_dia(conn, anteontem)
        dados_mes = buscar_dados_mes_atual(conn)
        metas = buscar_metas(conn)
        margens = buscar_margens(conn)
        margem_media_mes = buscar_margem_media_mes(conn)
        
        arquivo_pdf = gerar_relatorio_pdf(dados_ontem, dados_anteontem, dados_mes, metas, margens, margem_media_mes)
        
        if arquivo_pdf:
            enviar_email(arquivo_pdf)
            enviar_whatsapp(arquivo_pdf)  # Adiciona o envio por WhatsApp
        
        conn.close()
    except Exception as e:
        print(f"Erro na execução principal: {str(e)}")

if __name__ == "__main__":
    main()
