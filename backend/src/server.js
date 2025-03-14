const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();
const pool = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware de logging geral
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// Importar rotas
const vendasRoutes = require('./routes/vendas');
const estoqueRoutes = require('./routes/estoque');
const metasRoutes = require('./routes/metas');
const produtosRoutes = require('./routes/produtos');

// Registrar rotas
app.use('/api/metas', metasRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/produtos', produtosRoutes);

// Rota de teste para verificar o servidor
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    message: 'API funcionando corretamente'
  });
});

const startServer = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('Conexão com o banco de dados estabelecida');

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log('Rotas disponíveis:');
      console.log('- GET /api/produtos');
      console.log('- GET /api/produtos/check');
      console.log('- POST /api/metas/:sku');
      console.log('- GET /api/metas?mes_ano=YYYY-MM-DD');
      console.log('- GET /api/vendas/metricas-metas?mes_ano=YYYY-MM-DD');
      console.log('- GET /api/vendas/por-sku?mes_ano=YYYY-MM-DD');
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer(); 