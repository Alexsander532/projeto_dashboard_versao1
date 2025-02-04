import gspread
import psycopg2
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
import logging
from config import DATABASE_CONFIG, GOOGLE_SHEETS_CREDENTIALS, PLANILHA_NOME, ABA_NOME

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
        logging.error(f"Erro ao conectar ao banco de dados: {e}")
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
        logging.error(f"Erro ao conectar à planilha: {e}")
        exit()

def tratar_valor(valor, tipo=float, default=0):
    try:
        if not valor:
            return default
        
        if tipo == float:
            valor_limpo = str(valor).replace('R$', '').replace(' ', '')
            if '%' in valor_limpo:  # Se for percentual
                valor_limpo = valor_limpo.replace('%', '')
                return float(valor_limpo.replace(',', '.')) / 100
            return float(valor_limpo.replace('.', '').replace(',', '.'))
        
        elif tipo == int:
            return int(str(valor).replace('.', ''))
        
        elif tipo == datetime:
            return datetime.strptime(valor, '%d/%m/%Y')
        
        return tipo(valor)
    except Exception as e:
        logging.error(f"Erro ao tratar valor '{valor}' do tipo {tipo}: {e}")
        return default

def limpar_tabela():
    try:
        conn = conectar_banco()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM vendas_ml")
        conn.commit()
        cursor.close()
        conn.close()
        print("Tabela vendas_ml limpa com sucesso!")
        logging.info("Tabela vendas_ml limpa com sucesso")
    except Exception as e:
        print(f"Erro ao limpar a tabela: {e}")
        logging.error(f"Erro ao limpar a tabela: {e}")

def inserir_dados_no_banco(dados_planilha):
    try:
        conn = conectar_banco()
        cursor = conn.cursor()

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
                valor_comprado = tratar_valor(linha[6], tipo=float)  # G - VALOR COMPRADO
                valor_vendido = tratar_valor(linha[7], tipo=float)  # H - VALOR VENDIDO
                taxas = tratar_valor(linha[8], tipo=float)  # I - TAXAS
                frete = tratar_valor(linha[9], tipo=float)  # J - FRETE
                descontos = tratar_valor(linha[10], tipo=float)  # K - DESCONTOS
                ctl = tratar_valor(linha[11], tipo=float)  # L - CTL
                receita_envio = tratar_valor(linha[12], tipo=float)  # M - RECEITA P/ ENVIO
                valor_liquido = tratar_valor(linha[13], tipo=float)  # N - VALOR LÍQUIDO
                lucro = tratar_valor(linha[14], tipo=float)  # O - LUCRO
                markup = tratar_valor(linha[15], tipo=float)  # P - MARKUP
                margem_lucro = tratar_valor(linha[16], tipo=float)  # Q - MARGEM DE LUCRO
                envio = tratar_valor(linha[17], tipo=str)  # R - ENVIO
                numero_envio = tratar_valor(linha[18], tipo=int)  # S - Nº
                imposto = tratar_valor(linha[19], tipo=float)  # T - IMPOSTO

                # Verifica se o pedido já existe
                cursor.execute("SELECT pedido FROM vendas_ml WHERE pedido = %s", (pedido,))
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO vendas_ml (
                            marketplace, pedido, data, sku, unidades, status,
                            valor_comprado, valor_vendido, taxas, frete,
                            descontos, ctl, receita_envio, valor_liquido, lucro,
                            markup, margem_lucro, envio, numero_envio, imposto
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        marketplace, pedido, data, sku, unidades, status,
                        valor_comprado, valor_vendido, taxas, frete,
                        descontos, ctl, receita_envio, valor_liquido, lucro,
                        markup, margem_lucro, envio, numero_envio, imposto
                    ))
                    print(f"Inserido pedido ML: {pedido} - SKU: {sku}")
                    logging.info(f"Inserido pedido ML: {pedido} - SKU: {sku}")

            except Exception as e:
                print(f"Erro ao processar linha: {e}")
                logging.error(f"Erro ao processar linha: {e}")
                continue

        conn.commit()
        cursor.close()
        conn.close()
        print(f"Total de dados inseridos: {len(dados_planilha)-1}")
        logging.info(f"Total de dados inseridos: {len(dados_planilha)-1}")

    except Exception as e:
        print(f"Erro ao inserir dados no banco: {e}")
        logging.error(f"Erro ao inserir dados no banco: {e}")

def main():
    try:
        aba = conectar_planilha()
        dados_planilha = aba.get_all_values()
        
        limpar_tabela()
        inserir_dados_no_banco(dados_planilha)
        print("Dados do Mercado Livre atualizados com sucesso!")
        logging.info("Dados do Mercado Livre atualizados com sucesso")
        
    except Exception as e:
        print(f"Erro na execução principal: {e}")
        logging.error(f"Erro na execução principal: {e}")

if __name__ == "__main__":
    main()