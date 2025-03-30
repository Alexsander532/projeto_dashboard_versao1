const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const pool = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração CORS mais permissiva
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Responder imediatamente às solicitações OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware de logging geral
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Importar rotas
const vendasRoutes = require('./routes/vendas');
const estoqueRoutes = require('./routes/estoque');
const metasRoutes = require('./routes/metas');
const produtosRoutes = require('./routes/produtos');
const relatoriosRoutes = require('./routes/relatorios');

// Registrar rotas
app.use('/api/vendas', vendasRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/metas', metasRoutes);
app.use('/', produtosRoutes);
app.use('/api/relatorios', relatoriosRoutes);

// Rota de teste para verificar se o servidor está rodando
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    message: 'Servidor está funcionando'
  });
});

// Tratamento de erros para rotas não encontradas
app.use((req, res) => {
  console.log(`Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Rota não encontrada' });
});

const startServer = async () => {
  try {
    // Testar conexão com o banco
    await pool.query('SELECT NOW()');
    console.log('Conexão com o banco de dados estabelecida');

    // Iniciar o servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log('Rotas disponíveis:');
      console.log('- GET    /api/produtos');
      console.log('- GET    /api/produtos/:sku');
      console.log('- POST   /api/produtos');
      console.log('- PUT    /api/produtos/:sku');
      console.log('- DELETE /api/produtos/:sku');
      console.log('- GET    /api/status');
      console.log('- POST   /api/relatorios/mensal');
      console.log('- GET    /api/relatorios/download/:nomeArquivo');
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();