import gspread
import psycopg2
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import time
import logging
from config import DATABASE_CONFIG, GOOGLE_SHEETS_CREDENTIALS, PLANILHA_NOME_MAGALU, ABA_NOME_MAGALU

# Configurar logging
logging.basicConfig(
    filename='atualizacao_vendas_magalu.log',
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

        planilha = client.open(PLANILHA_NOME_MAGALU)
        aba = planilha.worksheet(ABA_NOME_MAGALU)

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
            if '%' in valor_limpo:  # Trata valores percentuais
                valor_limpo = valor_limpo.replace('%', '').replace(',', '.')
                return float(valor_limpo) / 100*100  # Converte de percentual para decimal
            return float(valor_limpo.replace('.', '').replace(',', '.'))

        elif tipo == int:
            return int(str(valor).replace('.', ''))

        elif tipo == datetime:
            return datetime.strptime(valor, '%d/%m/%Y %H:%M:%S')  # Formato específico da Magalu

        return str(valor).strip()
    except Exception as e:
        print(f"Erro ao tratar valor: '{valor}' - {e}")
        return default

def inserir_dados_no_banco(dados_planilha):
    try:
        conn = conectar_banco()
        cursor = conn.cursor()

        for linha in dados_planilha[1:]:
            try:
                if not linha[1]:  # Verifica se o número do pedido está vazio
                    continue

                marketplace = linha[0]  # A - MARKETPLACE
                pedido = tratar_valor(linha[1], tipo=str)  # B - Número do Pedido
                data_hora = tratar_valor(linha[2], tipo=datetime)  # C - Data/Hora do Pedido
                sku = tratar_valor(linha[3], tipo=str)  # D - SKU
                quantidade = tratar_valor(linha[4], tipo=int)  # E - QUANTIDADE
                valor_comprado = tratar_valor(linha[5], tipo=float)  # F - Valor Comprado
                valor_pedidos = tratar_valor(linha[6], tipo=float)  # G - Valor dos pedidos
                imposto = tratar_valor(linha[7], tipo=float)  # H - Imposto
                frete = tratar_valor(linha[8], tipo=float)  # I - FRETE
                descontos = tratar_valor(linha[9], tipo=float)  # J - Descontos
                valor_liquido = tratar_valor(linha[10], tipo=float)  # K - Valor Líquido Geral
                lucro = tratar_valor(linha[11], tipo=float)  # L - LUCRO
                markup = tratar_valor(linha[12], tipo=float)  # M - MARKUP
                margem_lucro = tratar_valor(linha[13], tipo=float)  # N - MARGEM DE LUCRO
                tipo_envio = tratar_valor(linha[14], tipo=str)  # O - TIPO DE ENVIO

                # Realiza UPSERT para evitar duplicatas
                cursor.execute("""
                    INSERT INTO vendas_magalu (
                        pedido, marketplace, data, sku, unidades,
                        valor_comprado, valor_vendido, imposto, frete, descontos,
                        valor_liquido, lucro, markup, margem_lucro, tipo_envio
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (pedido)
                    DO UPDATE SET
                        marketplace = EXCLUDED.marketplace,
                        data = EXCLUDED.data,
                        sku = EXCLUDED.sku,
                        unidades = EXCLUDED.unidades,
                        valor_comprado = EXCLUDED.valor_comprado,
                        valor_vendido = EXCLUDED.valor_vendido,
                        imposto = EXCLUDED.imposto,
                        frete = EXCLUDED.frete,
                        descontos = EXCLUDED.descontos,
                        valor_liquido = EXCLUDED.valor_liquido,
                        lucro = EXCLUDED.lucro,
                        markup = EXCLUDED.markup,
                        margem_lucro = EXCLUDED.margem_lucro,
                        tipo_envio = EXCLUDED.tipo_envio
                """, (
                    pedido, marketplace, data_hora, sku, quantidade,
                    valor_comprado, valor_pedidos, imposto, frete, descontos,
                    valor_liquido, lucro, markup, margem_lucro, tipo_envio
                ))

                print(f"Inserido ou atualizado pedido Magalu: {pedido} - SKU: {sku}")

            except Exception as e:
                print(f"Erro ao processar linha: {e}")
                continue

        conn.commit()
        cursor.close()
        conn.close()
        print(f"Total de dados processados: {len(dados_planilha)-1}")

    except Exception as e:
        print(f"Erro ao inserir dados no banco: {e}")

def notificar_atualizacao():
    print("Dados da Magazine Luiza atualizados com sucesso!")
    logging.info("Atualização dos dados da Magazine Luiza concluída")

def main():
    try:
        aba = conectar_planilha()
        dados_planilha = aba.get_all_values()

        inserir_dados_no_banco(dados_planilha)
        notificar_atualizacao()

    except Exception as e:
        print(f"Erro na execução principal: {e}")
        logging.error(f"Erro na execução principal: {e}")

def executar_com_intervalo(intervalo_minutos=10):
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
    executar_com_intervalo(10)  # 10 minutos