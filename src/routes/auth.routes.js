/**
 * auth.routes.js
 * 
 * Rotas Públicas de Autenticação
 * Endpoints: /auth/login, /auth/refresh, /auth/logout
 * Não requer autenticação (JWT não é validado)
 */

const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// POST /auth/login - Autentica usuário e retorna tokens
router.post('/login', authController.login);

// POST /auth/refresh - Renova Access Token (implementa Token Rotation)
router.post('/refresh', authController.refreshTokens);

// POST /auth/logout - Revoga Refresh Token
router.post('/logout', authController.logout);

module.exports = router;
