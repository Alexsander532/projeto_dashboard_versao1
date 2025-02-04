import logging
from datetime import datetime
from gerar_enviar_relatorio import main as gerar_relatorio

# Configurar logging para console (necessário no Render)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def main():
    try:
        logger.info(f"Iniciando geração e envio do relatório às {datetime.now()}")
        gerar_relatorio()
        logger.info("Relatório enviado com sucesso")
    except Exception as e:
        logger.error(f"Erro ao gerar/enviar relatório: {str(e)}")
        raise  # Propaga o erro para o Render registrar

if __name__ == "__main__":
    main()
