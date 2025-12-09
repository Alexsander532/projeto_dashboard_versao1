const express = require('express');
const cors = require('cors');
const vendasRoutes = require('./routes/vendas');
const vendasMagaluRoutes = require('./routes/vendasMagalu');
const vendasMLRoutes = require('./routes/vendasML');
const estoqueRoutes = require('./routes/estoque/estoque'); // Novo Supabase
const metasRoutes = require('./routes/metas');
const comprasRoutes = require('./routes/compras');

const app = express();

// Configuração do CORS
app.use(cors({
  origin: [
    'http://localhost:5173', // Desenvolvimento local
    'https://projeto-dashboard-versao1-frontend-wtay.vercel.app' // Produção Vercel
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Rotas
app.use('/api/vendas', vendasRoutes);
app.use('/api/vendas-magalu', vendasMagaluRoutes);
app.use('/api/vendas-ml', vendasMLRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/metas', metasRoutes);
app.use('/api/compras', comprasRoutes);

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