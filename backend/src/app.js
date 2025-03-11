const express = require('express');
const cors = require('cors');
const vendasRoutes = require('./routes/vendas');
const estoqueRoutes = require('./routes/estoque');
const metasRoutes = require('./routes/metas');

const app = express();

// Configuração do CORS
app.use(cors({
  origin: 'http://localhost:5173', // URL do frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Rotas
app.use('/api', vendasRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/metas', metasRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API ML Sales - Backend funcionando!' });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    details: err.message
  });
});

module.exports = app; 