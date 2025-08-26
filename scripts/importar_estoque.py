import gspread
import psycopg2
from oauth2client.service_account import ServiceAccountCredentials
import time
import logging
import requests
from config import DATABASE_CONFIG, GOOGLE_SHEETS_CREDENTIALS, PLANILHA_NOME

# Nome da aba de estoque na planilha
ABA_ESTOQUE = "estoque"

# Configurar logging para arquivo e console
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('atualizacao_estoque.log', encoding='utf-8'),
        logging.StreamHandler()  # Para exibir no terminal também
    ]
)

def conectar_banco():
    """Estabelece conexão com o banco de dados PostgreSQL"""
    try:
        logging.info("🔗 Tentando conectar ao banco de dados PostgreSQL...")
        conn = psycopg2.connect(**DATABASE_CONFIG)
        logging.info("✅ Conexão com o banco de dados estabelecida com sucesso!")
        return conn
    except Exception as e:
        erro = f"❌ Erro ao conectar ao banco de dados: {e}"
        logging.error(erro)
        exit()

def conectar_planilha():
    """Estabelece conexão com a planilha do Google Sheets"""
    try:
        logging.info("📊 Tentando conectar ao Google Sheets...")
        scope = ['https://spreadsheets.google.com/feeds',
                 'https://www.googleapis.com/auth/drive']
        
        logging.info("🔐 Autenticando com as credenciais do Google...")
        creds = ServiceAccountCredentials.from_json_keyfile_name(
            GOOGLE_SHEETS_CREDENTIALS, scope)
        client = gspread.authorize(creds)
        
        logging.info(f"📋 Abrindo planilha: {PLANILHA_NOME}")
        planilha = client.open(PLANILHA_NOME)
        aba = planilha.worksheet(ABA_ESTOQUE)
        
        logging.info(f"✅ Conexão com a aba '{ABA_ESTOQUE}' estabelecida com sucesso!")
        return aba
    except Exception as e:
        erro = f"❌ Erro ao conectar à planilha: {e}"
        logging.error(erro)
        exit()

def tratar_valor(valor, tipo=float, default=0):
    """Trata os valores obtidos da planilha para o formato correto"""
    try:
        if not valor:
            return default
        
        if tipo == float:
            valor_limpo = str(valor).replace('R$', '').replace(' ', '')
            if '%' in valor_limpo:  # Se for percentual
                valor_limpo = valor_limpo.replace('%', '').replace(',', '.')
                return float(valor_limpo)
            else:  # Se for valor monetário
                valor_limpo = valor_limpo.replace('.', '').replace(',', '.')
                valor_float = float(valor_limpo)
                return valor_float
        elif tipo == int:
            return int(str(valor).strip()) if valor.strip() else default
        else:
            return valor.strip()
    except Exception as e:
        logging.warning(f"⚠️  Erro ao tratar valor '{valor}' do tipo {tipo}: {e} - Usando valor padrão: {default}")
        return default

def atualizar_estoque(dados_planilha):
    """Atualiza os dados de estoque no banco de dados"""
    conn = None
    cursor = None
    try:
        conn = conectar_banco()
        cursor = conn.cursor()

        # Contadores para o relatório
        skus_atualizados = 0
        skus_nao_encontrados = 0
        skus_inseridos = 0
        total_linhas = len(dados_planilha) - 1  # Excluindo cabeçalho
        
        logging.info(f"📦 Iniciando processamento de {total_linhas} linhas de estoque...")
        
        # Pular o cabeçalho
        for i, linha in enumerate(dados_planilha[1:], 1):
            # Usamos uma nova transação para cada SKU para evitar que um erro afete todos
            conn_item = conectar_banco()
            cursor_item = conn_item.cursor()
            try:
                if len(linha) < 5 or not linha[0] or not linha[4]:  # Verifica se a linha tem pelo menos SKU e estoque total
                    logging.warning(f"⚠️  Linha {i} ignorada: dados insuficientes ou vazios")
                    continue
                
                sku = tratar_valor(linha[0], tipo=str)  # Coluna A - SKU
                estoque_atual = tratar_valor(linha[4], tipo=int)  # Coluna E - Estoque Total
                
                if i % 10 == 0:  # Log de progresso a cada 10 itens
                    logging.info(f"📊 Processando linha {i}/{total_linhas} - SKU: {sku}")
                
                # Verifica se o SKU existe no banco de dados
                cursor_item.execute("SELECT * FROM estoque WHERE sku = %s", (sku,))
                produto = cursor_item.fetchone()
                
                if produto:
                    # Atualiza apenas a quantidade em estoque, mantendo os outros dados
                    cursor_item.execute("""
                        UPDATE estoque 
                        SET estoque = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE sku = %s
                    """, (estoque_atual, sku))
                    skus_atualizados += 1
                    logging.debug(f"🔄 SKU {sku} atualizado: estoque = {estoque_atual}")
                else:
                    # Se o SKU não existe, insere um novo registro com valores padrão
                    # Usamos o nome do SKU como descrição padrão
                    descricao = f"Produto {sku}"
                    
                    cursor_item.execute("""
                        INSERT INTO estoque (
                            sku, descricao, estoque, minimo, cmv, valor_liquido, status
                        ) VALUES (%s, %s, %s, 30, 0, 0, %s)
                    """, (
                        sku, 
                        descricao, 
                        estoque_atual,
                        'Em estoque' if estoque_atual > 0 else 'Sem Estoque'
                    ))
                    skus_inseridos += 1
                    logging.info(f"➕ Novo SKU {sku} inserido: estoque = {estoque_atual}")
                
                # Confirma a transação para este SKU
                conn_item.commit()
            
            except Exception as e:
                # Se houver erro, faz rollback apenas desta transação
                conn_item.rollback()
                logging.error(f"❌ Erro ao processar SKU {sku} (linha {i}): {e}")
                skus_nao_encontrados += 1
            finally:
                # Fecha a conexão para este SKU
                cursor_item.close()
                conn_item.close()

        # Atualiza o status de todos os produtos com base no estoque e mínimo
        logging.info("🔄 Atualizando status dos produtos baseado no estoque...")
        cursor.execute("""
            UPDATE estoque
            SET status = CASE 
                WHEN estoque = 0 THEN 'Sem Estoque'
                WHEN estoque < minimo THEN 'Em reposição'
                WHEN estoque < minimo * 1.2 THEN 'Em negociação'
                WHEN estoque <= minimo * 1.5 THEN 'Em estoque'
                ELSE 'Estoque alto'
            END
        """)
        produtos_atualizados = cursor.rowcount
        logging.info(f"✅ Status atualizado para {produtos_atualizados} produtos")

        conn.commit()
        
        # Atualiza as métricas de vendas para cada SKU
        logging.info("📈 Calculando métricas de vendas dos últimos 30 dias...")
        cursor.execute("""
            WITH vendas_ultimos_30_dias AS (
                SELECT 
                    sku,
                    COUNT(*) as total_vendas,
                    COUNT(*)::float / 30 as media_diaria
                FROM vendas_ml
                WHERE data >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY sku
            ),
            ultima_venda AS (
                SELECT 
                    sku,
                    MAX(data) as ultima_data_venda
                FROM vendas_ml
                GROUP BY sku
            )
            UPDATE estoque e
            SET 
                media_vendas = COALESCE(v.media_diaria, 0),
                total_vendas = COALESCE(v.total_vendas, 0),
                ultima_venda = COALESCE(uv.ultima_data_venda, NULL)
            FROM vendas_ultimos_30_dias v
            LEFT JOIN ultima_venda uv ON v.sku = uv.sku
            WHERE e.sku = v.sku
        """)
        metricas_atualizadas = cursor.rowcount
        logging.info(f"📊 Métricas de vendas atualizadas para {metricas_atualizadas} produtos")
        
        conn.commit()
        
        # Relatório final detalhado
        total_processados = skus_atualizados + skus_inseridos
        logging.info("\n" + "="*60)
        logging.info("📋 RELATÓRIO DE ATUALIZAÇÃO DE ESTOQUE")
        logging.info("="*60)
        logging.info(f"📦 Total de linhas processadas: {total_linhas}")
        logging.info(f"🔄 SKUs atualizados: {skus_atualizados}")
        logging.info(f"➕ Novos SKUs inseridos: {skus_inseridos}")
        logging.info(f"✅ Total processados com sucesso: {total_processados}")
        logging.info(f"❌ SKUs com erro: {skus_nao_encontrados}")
        logging.info(f"📊 Taxa de sucesso: {(total_processados/total_linhas*100):.1f}%")
        logging.info("="*60)
        
        return True

    except Exception as e:
        # Se houver erro na transação principal, faz rollback
        if conn:
            conn.rollback()
        erro = f"❌ Erro crítico ao atualizar dados de estoque no banco: {e}"
        logging.error(erro)
        return False
    finally:
        # Garante que as conexões sejam fechadas mesmo em caso de erro
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def notificar_atualizacao():
    """Notifica o dashboard sobre a atualização de estoque"""
    try:
        logging.info("🔔 Enviando notificação para o dashboard...")
        response = requests.post('http://localhost:3005/api/estoque/notificar-atualizacao', timeout=5)
        if response.status_code == 200:
            logging.info("✅ Dashboard notificado com sucesso sobre a atualização de estoque")
        else:
            logging.warning(f"⚠️  Dashboard respondeu com status {response.status_code}")
    except requests.exceptions.ConnectionError:
        logging.warning("⚠️  Dashboard não está disponível (conexão recusada)")
    except requests.exceptions.Timeout:
        logging.warning("⚠️  Timeout ao tentar notificar o dashboard")
    except Exception as e:
        logging.error(f"❌ Erro ao notificar dashboard: {e}")

def main():
    """Função principal que executa o processo de atualização"""
    try:
        logging.info("\n" + "="*60)
        logging.info("🚀 INICIANDO ATUALIZAÇÃO DOS DADOS DE ESTOQUE")
        logging.info("="*60)
        
        # Conecta à planilha
        aba = conectar_planilha()
        logging.info("📥 Obtendo dados da planilha...")
        dados = aba.get_all_values()
        logging.info(f"📊 {len(dados)} linhas obtidas da planilha (incluindo cabeçalho)")
        
        # Atualiza os dados no banco
        if atualizar_estoque(dados):
            logging.info("🎉 Dados de estoque atualizados com sucesso!")
            notificar_atualizacao()
        else:
            logging.error("💥 Falha ao atualizar os dados de estoque!")
            
    except Exception as e:
        erro = f"❌ Erro crítico na execução principal: {e}"
        logging.error(erro)

def executar_com_intervalo(intervalo_minutos=10):
    """Executa a atualização em intervalos regulares"""
    logging.info("\n" + "="*60)
    logging.info("⏰ MODO AUTOMÁTICO ATIVADO")
    logging.info(f"🔄 Executando atualização a cada {intervalo_minutos} minutos")
    logging.info("💡 Pressione Ctrl+C para interromper")
    logging.info("="*60)
    
    ciclo = 1
    while True:
        try:
            logging.info(f"\n🔄 CICLO {ciclo} - {time.strftime('%H:%M:%S')}")
            main()
            logging.info(f"⏳ Aguardando {intervalo_minutos} minutos para o próximo ciclo...")
            time.sleep(intervalo_minutos * 60)
            ciclo += 1
        except KeyboardInterrupt:
            logging.info("\n🛑 Processo de atualização automática interrompido pelo usuário")
            logging.info(f"📊 Total de ciclos executados: {ciclo - 1}")
            break
        except Exception as e:
            logging.error(f"❌ Erro no ciclo {ciclo}: {e}")
            logging.info(f"⏳ Tentando novamente em {intervalo_minutos} minutos...")
            time.sleep(intervalo_minutos * 60)
            ciclo += 1

if __name__ == "__main__":
    # Para executar uma única vez:
    # main()
    
    # Para executar continuamente a cada 10 minutos:
    executar_com_intervalo(10)
