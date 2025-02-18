import os
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Configurações do banco de dados
DATABASE_CONFIG = {
    'dbname': 'railway',  # Removido o .strip() pois pode ser None
    'user':'postgres',
    'password':'DmyaUqXoBAMACqXUWQbUCEpFVnBPadqD',
    'host': 'centerbeam.proxy.rlwy.net',
    'port': 34984
}

# Configurações do Google Sheets
GOOGLE_SHEETS_CREDENTIALS = os.getenv('GOOGLE_SHEETS_CREDENTIALS')
PLANILHA_NOME = os.getenv('PLANILHA_NOME')
ABA_NOME = os.getenv('ABA_NOME') 
PLANILHA_NOME_MAGALU = os.getenv('PLANILHA_NOME_MAGALU')
ABA_NOME_MAGALU = os.getenv('ABA_NOME_MAGALU')