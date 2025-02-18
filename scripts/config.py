import os
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Configurações do banco de dados
DATABASE_CONFIG = {
    'dbname': 'postgres',  # Removido o .strip() pois pode ser None
    'user':'postgres',
    'password':'Cefet2020.',
    'host': 'db.nqnlafkiiszhpnzhaugb.supabase.co',
    'port': 5432
}

# Configurações do Google Sheets
GOOGLE_SHEETS_CREDENTIALS = os.getenv('GOOGLE_SHEETS_CREDENTIALS')
PLANILHA_NOME = os.getenv('PLANILHA_NOME')
ABA_NOME = os.getenv('ABA_NOME') 
PLANILHA_NOME_MAGALU = os.getenv('PLANILHA_NOME_MAGALU')
ABA_NOME_MAGALU = os.getenv('ABA_NOME_MAGALU')