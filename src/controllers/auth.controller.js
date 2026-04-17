/**
 * auth.controller.js
 * 
 * Controlador de Autenticação
 * Implementa a lógica de login e renovação de tokens (refresh).
 * Valida credenciais contra um mock de usuários.
 */

const tokenService = require('../services/token.service');

/**
 * Mock de usuários para demonstração
 * Em produção, seria consultado um banco de dados com hashs de senha.
 * NUNCA armazenar senhas em texto plano!
 */
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'senha123', // Em produção: bcrypt.hash()
    name: 'Administrador',
    role: 'admin',
  },
  {
    id: '2',
    email: 'user@example.com',
    password: 'senha456',
    name: 'João Silva',
    role: 'usuario',
  },
  {
    id: '3',
    email: 'moderador@example.com',
    password: 'senha789',
    name: 'Maria Santos',
    role: 'moderador',
  },
];

/**
 * Controlador: Login do usuário
 * 
 * Fluxo:
 * 1. Recebe email e password no corpo da requisição
 * 2. Valida contra o mock de usuários
 * 3. Se sucesso, gera Access Token e Refresh Token
 * 4. Retorna os tokens ao cliente
 * 
 * Requisição esperada:
 * POST /auth/login
 * Content-Type: application/json
 * {
 *   "email": "admin@example.com",
 *   "password": "senha123"
 * }
 * 
 * Resposta (200 OK):
 * {
 *   "message": "Login realizado com sucesso",
 *   "accessToken": "eyJhbGc...",
 *   "refreshToken": "eyJhbGc...",
 *   "user": {
 *     "id": "1",
 *     "name": "Administrador",
 *     "role": "admin"
 *   }
 * }
 * 
 * @param {Object} req - Objeto de requisição Express
 * @param {string} req.body.email - Email do usuário
 * @param {string} req.body.password - Senha do usuário
 * @param {Object} res - Objeto de resposta Express
 * @param {Function} next - Middleware de erro
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email e senha são obrigatórios',
      });
    }

    const user = mockUsers.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Email ou senha incorretos',
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Email ou senha incorretos',
      });
    }

    const accessToken = tokenService.generateAccessToken({
      id: user.id,
      name: user.name,
      role: user.role,
    });

    const refreshToken = tokenService.generateRefreshToken(user.id);

    res.status(200).json({
      message: 'Login realizado com sucesso',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controlador: Renovação de Tokens (Token Rotation)
 * Implementa revogação do token antigo na geração do novo par
 */
const refreshTokens = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh Token é obrigatório',
      });
    }

    const decoded = tokenService.verifyRefreshToken(refreshToken);
    tokenService.revokeRefreshToken(refreshToken);

    const user = mockUsers.find((u) => u.id === decoded.sub);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Usuário não encontrado',
      });
    }

    const newAccessToken = tokenService.generateAccessToken({
      id: user.id,
      name: user.name,
      role: user.role,
    });

    const newRefreshToken = tokenService.generateRefreshToken(user.id);

    res.status(200).json({
      message: 'Tokens renovados com sucesso',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh Token é obrigatório',
      });
    }

    const revoked = tokenService.revokeRefreshToken(refreshToken);

    if (!revoked) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh Token não encontrado',
      });
    }

    res.status(200).json({
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refreshTokens,
  logout,
};
