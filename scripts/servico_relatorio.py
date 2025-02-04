import schedule
import time
import os
from datetime import datetime
import sys
import logging

# Configurar logging
logging.basicConfig(
    filename='servico_relatorio.log',
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)

def enviar_relatorio():
    try:
        script_path = os.path.join(os.path.dirname(__file__), 'gerar_enviar_relatorio.py')
        logging.info(f"Iniciando envio do relatório às {datetime.now()}")
        os.system(f'python "{script_path}"')
        logging.info("Relatório enviado com sucesso")
    except Exception as e:
        logging.error(f"Erro ao enviar relatório: {str(e)}")

def main():
    logging.info("Serviço iniciado")
    
    # Agendar para rodar todos os dias às 08:00
    schedule.every().day.at("08:00").do(enviar_relatorio)
    
    while True:
        schedule.run_pending()
        time.sleep(60)  # Verifica a cada minuto

if __name__ == "__main__":
    main()
