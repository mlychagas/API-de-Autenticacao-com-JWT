/**
 * user.routes.js
 * 
 * Rotas Protegidas de Usuários
 * Todos os endpoints requerem autenticação via JWT (Access Token)
 * Aplicam-se filtros de autorização baseados em roles/perfis
 */

const express = require('express');
const userController = require('../controllers/user.controller');
const { checkAuth, checkRole } = require('../middlewares/auth.middleware');

const router = express.Router();

// Global: todas as rotas requerem autenticação
router.use(checkAuth);

router.get('/', userController.listar);
router.get('/me', userController.obterPerfil);
router.put('/me', userController.atualizarPerfil);
router.delete('/:id', checkRole('admin'), userController.excluir);

module.exports = router;
