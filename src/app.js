/**
 * app.js
 * 
 * Arquivo Principal de Configuração do Express
 * Configura middlewares, injeta rotas e define tratamento de erros.
 */

const express = require('express');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// MIDDLEWARES GLOBAIS
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ROTAS PÚBLICAS
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'API de Autenticação com JWT',
    version: '1.0.0',
    endpoints: {
      public: {
        login: 'POST /auth/login',
        refresh: 'POST /auth/refresh',
        logout: 'POST /auth/logout',
        health: 'GET /health',
      },
      protected: {
        listUsers: 'GET /usuarios',
        getProfile: 'GET /usuarios/me',
        updateProfile: 'PUT /usuarios/me',
        deleteUser: 'DELETE /usuarios/:id (admin only)',
      },
    },
    documentation: 'Veja README.md para detalhes',
  });
});
app.get('/health', (req, res) => {
  res.status(200).json({
    message: 'API de Autenticação com JWT - Online',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRoutes);

// ROTAS PROTEGIDAS
app.use('/usuarios', userRoutes);

// TRATAMENTO 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} não existe`,
  });
});

// MIDDLEWARE GLOBAL DE ERRO (deve ser registrado por último)
app.use(errorHandler);

module.exports = app;
 /* Captura erros de toda a aplicação e converte em respostas HTTP apropriadas.*/
app.use(errorHandler);

module.exports = app;
