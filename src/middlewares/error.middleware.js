/**
 * error.middleware.js
 * 
 * Middleware Global de Tratamento de Erros
 * Intercepta exceções não capturadas e as transforma em respostas HTTP apropriadas.
 * Garante que erros sensíveis não sejam expostos ao cliente.
 */

/**
 * Middleware: Tratamento centralizado de erros
 * 
 * Deve ser registrado POR ÚLTIMO no Express (após todas as rotas e middlewares).
 * Captura tanto erros síncronos quanto assíncronos (via next(err)).
 * 
 * Tratamento específico para:
 * - TokenExpiredError: 401 Unauthorized
 * - JsonWebTokenError: 401 Unauthorized
 * - Erros genéricos: 500 Internal Server Error
 * 
 * @param {Error} err - Objeto de erro
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Função para chamar o próximo middleware (não usada aqui)
 * 
 * @example
 * // Registrar no app.js (SEMPRE por último)
 * app.use(errorHandler);
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err);

  let status = 500;
  let message = 'Erro interno do servidor';
  let errorType = 'InternalServerError';

  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expirado';
    errorType = 'TokenExpiredError';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Token inválido';
    errorType = 'JsonWebTokenError';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = err.message || 'Erro de validação';
    errorType = 'ValidationError';
  } else if (err.status) {
    status = err.status;
    message = err.message || 'Erro na requisição';
  }

  const response = {
    error: errorType,
    message: message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};

module.exports = errorHandler;
