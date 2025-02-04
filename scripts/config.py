import os
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Configurações do banco de dados
DATABASE_CONFIG = {
    'dbname': os.getenv('DB_DATABASE'),  # Removido o .strip() pois pode ser None
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST'),
    'port': os.getenv('DB_PORT')
}

# Configurações do Google Sheets
GOOGLE_SHEETS_CREDENTIALS = os.getenv('GOOGLE_SHEETS_CREDENTIALS')
PLANILHA_NOME = os.getenv('PLANILHA_NOME')
ABA_NOME = os.getenv('ABA_NOME') 
PLANILHA_NOME_MAGALU = os.getenv('PLANILHA_NOME_MAGALU')
ABA_NOME_MAGALU = os.getenv('ABA_NOME_MAGALU')