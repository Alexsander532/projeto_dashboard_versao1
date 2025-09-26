import requests
import psycopg2
import logging
from datetime import datetime
from config import DATABASE_CONFIG

# Adicione suas credenciais Magalu aqui ou use variáveis de ambiente
CLIENT_ID = "SEU_CLIENT_ID"
CLIENT_SECRET = "SEU_CLIENT_SECRET"
REFRESH_TOKEN = "SEU_REFRESH_TOKEN"
TOKEN_URL = "https://auto-seg-idp.luizalabs.com/oauth/token"
ORDERS_URL = "https://api.magalu.com/orders/v1/orders"

logging.basicConfig(
    filename='atualizacao_vendas_magalu_api.log',
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

def refresh_access_token():
    data = {
        "grant_type": "refresh_token",
        "refresh_token": REFRESH_TOKEN,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    resp = requests.post(TOKEN_URL, data=data)
    resp.raise_for_status()
    tokens = resp.json()
    return tokens["access_token"]

def fetch_orders(access_token, limit=50):
    headers = {"Authorization": f"Bearer {access_token}"}
    url = ORDERS_URL
    params = {"limit": limit, "_offset": 0}
    all_orders = []

    while True:
        r = requests.get(url, headers=headers, params=params)
        r.raise_for_status()
        data = r.json()
        all_orders.extend(data.get("results", []))

        next_link = data.get("links", {}).get("next")
        if not next_link:
            break
        if next_link.startswith("?"):
            url = ORDERS_URL + next_link
            params = None
        else:
            url = next_link
            params = None

    return all_orders

def extract_order_data(orders):
    rows = []
    for order in orders:
        order_id = order.get("id")
        purchased_at = order.get("purchased_at")
        amounts = order.get("amounts", {})
        discount_total = (amounts.get("discount") or {}).get("total")
        freight_total = (amounts.get("freight") or {}).get("total")
        commission_total = (amounts.get("commission") or {}).get("total")

        for delivery in order.get("deliveries", []):
            for item in delivery.get("items", []):
                info = item.get("info", {})
                sku = info.get("sku")
                produto = info.get("name")
                unidades = item.get("quantity", 0)
                unit_price = (item.get("unit_price") or {}).get("value", 0.0)
                valor_venda = unidades * unit_price

                rows.append({
                    "pedido": order_id,
                    "marketplace": "magalu",
                    "data": purchased_at,
                    "sku": sku,
                    "unidades": unidades,
                    "valor_vendido": valor_venda,
                    "comissao_magalu": commission_total,
                    "frete_total": freight_total,
                    "desconto_total": discount_total
                })
    return rows

def inserir_dados_no_banco(dados):
    try:
        conn = conectar_banco()
        cursor = conn.cursor()
        for linha in dados:
            try:
                cursor.execute("""
                    INSERT INTO vendas_magalu (
                        pedido, marketplace, data, sku, unidades,
                        valor_vendido, comissao_magalu, frete, descontos
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (pedido)
                    DO UPDATE SET
                        marketplace = EXCLUDED.marketplace,
                        data = EXCLUDED.data,
                        sku = EXCLUDED.sku,
                        unidades = EXCLUDED.unidades,
                        valor_vendido = EXCLUDED.valor_vendido,
                        comissao_magalu = EXCLUDED.comissao_magalu,
                        frete = EXCLUDED.frete,
                        descontos = EXCLUDED.descontos
                """, (
                    linha["pedido"], linha["marketplace"], linha["data"], linha["sku"], linha["unidades"],
                    linha["valor_vendido"], linha["comissao_magalu"], linha["frete_total"], linha["desconto_total"]
                ))
                print(f"Inserido ou atualizado pedido Magalu: {linha['pedido']} - SKU: {linha['sku']}")
            except Exception as e:
                print(f"Erro ao processar linha: {e}")
                continue
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Total de dados processados: {len(dados)}")
    except Exception as e:
        print(f"Erro ao inserir dados no banco: {e}")

def notificar_atualizacao():
    print("Dados da Magazine Luiza atualizados com sucesso!")
    logging.info("Atualização dos dados da Magazine Luiza concluída")

def main():
    try:
        token = refresh_access_token()
        orders = fetch_orders(token)
        dados = extract_order_data(orders)
        inserir_dados_no_banco(dados)
        notificar_atualizacao()
    except Exception as e:
        print(f"Erro na execução principal: {e}")
        logging.error(f"Erro na execução principal: {e}")

if __name__ == "__main__":
    main()