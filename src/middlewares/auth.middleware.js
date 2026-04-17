/**
 * auth.middleware.js
 * 
 * Middleware de Autenticação (The Guard Function)
 * Intercepta e valida requisições, verificando a presença e validade do Access Token.
 * Injeta o payload decodificado na requisição para acesso posterior.
 */

const tokenService = require('../services/token.service');

/**
 * Middleware: Verifica a autenticação via JWT (Bearer Token)
 * 
 * Validações realizadas:
 * 1. Presença do header Authorization
 * 2. Formato correto (Bearer <token>)
 * 3. Validade da assinatura do token
 * 4. Expiração do token
 * 
 * Se válido: injeta req.user com o payload decodificado e chama next()
 * Se inválido: retorna 401 Unauthorized imediatamente
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função para chamar o próximo middleware
 * 
 * @example
 * // Uso em rotas protegidas
 * router.get('/usuarios', checkAuth, usuarioController.listar);
 */
const checkAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Não autorizado',
        message: 'Header Authorization não fornecido',
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Não autorizado',
        message: 'Formato de Authorization inválido. Use: Bearer <token>',
      });
    }

    const token = parts[1];
    const decoded = tokenService.verifyAccessToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Não autorizado',
      message: error.message,
    });
  }
};

/**
 * Middleware: Verifica se o usuário tem um perfil específico
 * 
 * Útil para implementar autorização baseada em roles/perfis.
 * Deve ser usado APÓS o middleware checkAuth.
 * 
 * @param {...string} allowedRoles - Roles permitidos (ex: 'admin', 'moderador')
 * @returns {Function} Middleware Express
 * 
 * @example
 * // Apenas admin pode acessar
 * router.delete('/usuarios/:id', checkAuth, checkRole('admin'), deleteController);
 * 
 * // Múltiplos roles
 * router.get('/relatorio', checkAuth, checkRole('admin', 'moderador'), relatorioController);
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Não autorizado',
        message: 'Usuário não autenticado',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Proibido',
        message: `Acesso restrito a: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = {
  checkAuth,
  checkRole,
};
