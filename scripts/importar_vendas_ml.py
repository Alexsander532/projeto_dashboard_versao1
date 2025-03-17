import gspread
import psycopg2
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime, timedelta
import time
import logging
from config import DATABASE_CONFIG, GOOGLE_SHEETS_CREDENTIALS, PLANILHA_NOME, ABA_NOME
import requests

# Configurar logging
logging.basicConfig(
    filename='atualizacao_vendas.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def conectar_banco():
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        print("Conexão com o banco de dados estabelecida com sucesso!")
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        exit()

def conectar_planilha():
    try:
        scope = ['https://spreadsheets.google.com/feeds',
                 'https://www.googleapis.com/auth/drive']
        
        creds = ServiceAccountCredentials.from_json_keyfile_name(
            GOOGLE_SHEETS_CREDENTIALS, scope)
        client = gspread.authorize(creds)
        
        planilha = client.open(PLANILHA_NOME)
        aba = planilha.worksheet(ABA_NOME)
        
        print("Conexão com a planilha estabelecida com sucesso!")
        return aba
    except Exception as e:
        print(f"Erro ao conectar à planilha: {e}")
        exit()

def tratar_valor(valor, tipo=float, default=0):
    try:
        if not valor:
            return default
        
        if tipo == float:
            valor_limpo = str(valor).replace('R$', '').replace(' ', '')
            if '%' in valor_limpo:  # Se for percentual
                # Remove o % e converte vírgula para ponto
                valor_limpo = valor_limpo.replace('%', '').replace(',', '.')
                # Retorna o valor exatamente como está, sem dividir por 100
                return float(valor_limpo)
            else:  # Se for valor monetário
                # Remove pontos de milhar e converte vírgula para ponto
                valor_limpo = valor_limpo.replace('.', '').replace(',', '.')
                # Converte para float e multiplica por 100 para remover decimais extras
                valor_float = float(valor_limpo)
                # Retorna o valor dividido por 100 para manter apenas 2 casas decimais
                return valor_float / 100
        elif tipo == int:
            return int(str(valor).strip()) if valor.strip() else default
        elif tipo == datetime:
            if not valor.strip():
                return default
            # Converte a string para datetime
            data = datetime.strptime(valor.strip(), '%d/%m/%y %H:%M:%S')
            
            # Adiciona 1 dia à data para corrigir o problema de fuso horário
            data_corrigida = data + timedelta(days=1)
            
            return data_corrigida
        else:
            return valor.strip()
    except Exception as e:
        print(f"Erro ao tratar valor '{valor}' do tipo {tipo}: {e}")
        return default

def limpar_tabela():
    try:
        conn = conectar_banco()
        cursor = conn.cursor()
        cursor.execute("TRUNCATE TABLE vendas_ml RESTART IDENTITY;")
        conn.commit()
        cursor.close()
        conn.close()
        print("Tabela limpa e IDs reiniciados com sucesso!")
    except Exception as e:
        print(f"Erro ao limpar a tabela: {e}")

def inserir_dados_no_banco(dados_planilha):
    try:
        conn = conectar_banco()
        cursor = conn.cursor()

        # Contadores para o relatório
        novos_pedidos = 0
        pedidos_existentes = 0

        for linha in dados_planilha[1:]:
            try:
                if not linha[1]:
                    continue
                    
                marketplace = linha[0]  # A - MARKETPLACE
                pedido = tratar_valor(linha[1], tipo=str)  # B - PEDIDOS
                data = tratar_valor(linha[2], tipo=datetime)  # C - DATA
                sku = tratar_valor(linha[3], tipo=str)  # D - SKU
                unidades = tratar_valor(linha[4], tipo=int)  # E - UNIDADES
                status = tratar_valor(linha[5], tipo=str)  # F - STATUS
                valor_comprado = tratar_valor(linha[6])  # G - VALOR COMPRADO
                valor_vendido = tratar_valor(linha[7])  # H - VALOR VENDIDO
                taxas = tratar_valor(linha[8])  # I - TAXAS
                frete = tratar_valor(linha[9])  # J - FRETE
                descontos = tratar_valor(linha[10])  # K - DESCONTOS
                ctl = tratar_valor(linha[11])  # L - CTL
                receita_envio = tratar_valor(linha[12])  # M - RECEITA P/ ENVIO
                valor_liquido = tratar_valor(linha[13])  # N - VALOR LÍQUIDO
                lucro = tratar_valor(linha[14])  # O - LUCRO
                markup = tratar_valor(linha[15])  # P - MARKUP
                margem_lucro = tratar_valor(linha[16])  # Q - MARGEM DE LUCRO
                envio = tratar_valor(linha[17], tipo=str)  # R - ENVIO
                numero_envio = tratar_valor(linha[18], tipo=int)  # S - NÚMERO ENVIO
                imposto = tratar_valor(linha[19])  # T - IMPOSTO

                # Verifica se o pedido já existe
                cursor.execute("SELECT id FROM vendas_ml WHERE pedido = %s", (pedido,))
                pedido_existe = cursor.fetchone()

                if not pedido_existe:
                    # Se o pedido não existe, insere novo registro
                    cursor.execute("""
                        INSERT INTO vendas_ml (
                            marketplace, pedido, data, sku, unidades, status,
                            valor_comprado, valor_vendido, taxas, frete,
                            descontos, ctl, receita_envio, valor_liquido,
                            lucro, markup, margem_lucro, envio, numero_envio, imposto
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        marketplace, pedido, data, sku, unidades, status,
                        valor_comprado, valor_vendido, taxas, frete,
                        descontos, ctl, receita_envio, valor_liquido,
                        lucro, markup, margem_lucro, envio, numero_envio, imposto
                    ))
                    novos_pedidos += 1
                else:
                    pedidos_existentes += 1

            except Exception as e:
                print(f"Erro ao processar linha: {e}")
                print(f"Erro ao inserir pedido {pedido}: {e}")
                continue

        conn.commit()
        print(f"Importação concluída! {novos_pedidos} novos pedidos inseridos. {pedidos_existentes} pedidos já existiam.")
        
        cursor.close()
        conn.close()
        return True

    except Exception as e:
        print(f"Erro ao inserir dados no banco: {e}")
        return False

def notificar_atualizacao():
    try:
        requests.post('http://localhost:3005/api/vendas/notificar-atualizacao')
        logging.info("Dashboard notificado sobre a atualização")
    except Exception as e:
        logging.error(f"Erro ao notificar dashboard: {e}")

def main():
    try:
        print("Iniciando atualização dos dados...")
        
        # Conecta à planilha
        aba = conectar_planilha()
        dados = aba.get_all_values()
        
        # Insere os dados no banco
        if inserir_dados_no_banco(dados):
            print("Dados atualizados com sucesso!")
            notificar_atualizacao()
        else:
            print("Erro ao atualizar os dados!")
            
    except Exception as e:
        print(f"Erro na execução principal: {e}")

def executar_com_intervalo(intervalo_minutos=5):
    logging.info(f"Iniciando processo de atualização automática a cada {intervalo_minutos} minutos")
    
    while True:
        try:
            main()
            # Aguarda o intervalo especificado (em segundos)
            time.sleep(intervalo_minutos * 60)
        except KeyboardInterrupt:
            logging.info("Processo interrompido pelo usuário")
            break
        except Exception as e:
            logging.error(f"Erro no processo de atualização: {e}")
            # Aguarda 5 minutos antes de tentar novamente em caso de erro
            time.sleep(300)

if __name__ == "__main__":
    # Para executar uma única vez:
    # main()
    
    # Para executar continuamente a cada hora:
    executar_com_intervalo(10)  # 10 * 6 minutos