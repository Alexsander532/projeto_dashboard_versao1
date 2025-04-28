import gspread
import psycopg2
from oauth2client.service_account import ServiceAccountCredentials
import time
import logging
import requests
from config import DATABASE_CONFIG, GOOGLE_SHEETS_CREDENTIALS, PLANILHA_NOME

# Nome da aba de estoque na planilha
ABA_ESTOQUE = "estoque"

# Configurar logging
logging.basicConfig(
    filename='atualizacao_estoque.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def conectar_banco():
    """Estabelece conexão com o banco de dados PostgreSQL"""
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        print("Conexão com o banco de dados estabelecida com sucesso!")
        logging.info("Conexão com o banco de dados estabelecida")
        return conn
    except Exception as e:
        erro = f"Erro ao conectar ao banco de dados: {e}"
        print(erro)
        logging.error(erro)
        exit()

def conectar_planilha():
    """Estabelece conexão com a planilha do Google Sheets"""
    try:
        scope = ['https://spreadsheets.google.com/feeds',
                 'https://www.googleapis.com/auth/drive']
        
        creds = ServiceAccountCredentials.from_json_keyfile_name(
            GOOGLE_SHEETS_CREDENTIALS, scope)
        client = gspread.authorize(creds)
        
        planilha = client.open(PLANILHA_NOME)
        aba = planilha.worksheet(ABA_ESTOQUE)
        
        print("Conexão com a planilha estabelecida com sucesso!")
        logging.info("Conexão com a planilha estabelecida")
        return aba
    except Exception as e:
        erro = f"Erro ao conectar à planilha: {e}"
        print(erro)
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
        print(f"Erro ao tratar valor '{valor}' do tipo {tipo}: {e}")
        logging.error(f"Erro ao tratar valor '{valor}' do tipo {tipo}: {e}")
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
        
        # Pular o cabeçalho
        for linha in dados_planilha[1:]:
            # Usamos uma nova transação para cada SKU para evitar que um erro afete todos
            conn_item = conectar_banco()
            cursor_item = conn_item.cursor()
            try:
                if len(linha) < 2 or not linha[0]:  # Verifica se a linha tem pelo menos SKU e quantidade
                    continue
                
                sku = tratar_valor(linha[0], tipo=str)  # Coluna A - SKU
                estoque_atual = tratar_valor(linha[1], tipo=int)  # Coluna B - Estoque Atual
                
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
                    skus_atualizados += 1
                
                # Confirma a transação para este SKU
                conn_item.commit()
            
            except Exception as e:
                # Se houver erro, faz rollback apenas desta transação
                conn_item.rollback()
                print(f"Erro ao processar SKU {sku}: {e}")
                logging.error(f"Erro ao processar SKU {sku}: {e}")
                skus_nao_encontrados += 1
            finally:
                # Fecha a conexão para este SKU
                cursor_item.close()
                conn_item.close()

        # Atualiza o status de todos os produtos com base no estoque e mínimo
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

        conn.commit()
        
        # Atualiza as métricas de vendas para cada SKU
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
        
        conn.commit()
        
        print(f"Atualização de estoque concluída! {skus_atualizados} SKUs atualizados. {skus_nao_encontrados} SKUs não encontrados.")
        logging.info(f"Atualização de estoque concluída! {skus_atualizados} SKUs atualizados. {skus_nao_encontrados} SKUs não encontrados.")
        
        return True

    except Exception as e:
        # Se houver erro na transação principal, faz rollback
        if conn:
            conn.rollback()
        erro = f"Erro ao atualizar dados de estoque no banco: {e}"
        print(erro)
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
        requests.post('http://localhost:3005/api/estoque/notificar-atualizacao')
        logging.info("Dashboard notificado sobre a atualização de estoque")
    except Exception as e:
        logging.error(f"Erro ao notificar dashboard: {e}")

def main():
    """Função principal que executa o processo de atualização"""
    try:
        print("Iniciando atualização dos dados de estoque...")
        logging.info("Iniciando atualização dos dados de estoque")
        
        # Conecta à planilha
        aba = conectar_planilha()
        dados = aba.get_all_values()
        
        # Atualiza os dados no banco
        if atualizar_estoque(dados):
            print("Dados de estoque atualizados com sucesso!")
            logging.info("Dados de estoque atualizados com sucesso")
            notificar_atualizacao()
        else:
            print("Erro ao atualizar os dados de estoque!")
            logging.error("Erro ao atualizar os dados de estoque")
            
    except Exception as e:
        erro = f"Erro na execução principal: {e}"
        print(erro)
        logging.error(erro)

def executar_com_intervalo(intervalo_minutos=10):
    """Executa a atualização em intervalos regulares"""
    logging.info(f"Iniciando processo de atualização automática de estoque a cada {intervalo_minutos} minutos")
    
    while True:
        try:
            main()
            # Aguarda o intervalo especificado (em segundos)
            time.sleep(intervalo_minutos * 60)
        except KeyboardInterrupt:
            logging.info("Processo de atualização de estoque interrompido pelo usuário")
            break
        except Exception as e:
            logging.error(f"Erro no processo de atualização automática: {e}")
            # Mesmo com erro, continua tentando no próximo intervalo
            time.sleep(intervalo_minutos * 60)

if __name__ == "__main__":
    # Para executar uma única vez:
    # main()
    
    # Para executar continuamente a cada 10 minutos:
    executar_com_intervalo(10)
