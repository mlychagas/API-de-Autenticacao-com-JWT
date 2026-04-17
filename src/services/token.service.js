/**
 * token.service.js
 * 
 * Serviço de Geração, Validação e Gerenciamento de Tokens JWT
 * Implementa a lógica de criação de access tokens e refresh tokens,
 * além do armazenamento mock e validação de tokens.
 */

const jwt = require('jsonwebtoken');
const config = require('../config/env.config');

/**
 * Array em memória para armazenar refresh tokens ativos
 * Em produção, usar Redis ou banco de dados
 */
let validRefreshTokens = [];

const generateAccessToken = (user) => {
  const payload = {
    sub: user.id,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiration,
    algorithm: 'HS256',
  });
};

const generateRefreshToken = (userId) => {
  const payload = {
    sub: userId,
    type: 'refresh',
  };

  const token = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiration,
    algorithm: 'HS256',
  });

  validRefreshTokens.push({
    token,
    userId,
    createdAt: new Date(),
  });

  return token;
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.accessSecret, {
      algorithms: ['HS256'],
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access Token expirado');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Access Token inválido');
    }
    throw error;
  }
};

const verifyRefreshToken = (token) => {
  try {
    const tokenExists = validRefreshTokens.some((rt) => rt.token === token);
    if (!tokenExists) {
      throw new Error('Refresh Token não encontrado ou revogado');
    }

    return jwt.verify(token, config.jwt.refreshSecret, {
      algorithms: ['HS256'],
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Remover token expirado do array
      validRefreshTokens = validRefreshTokens.filter((rt) => rt.token !== token);
      throw new Error('Refresh Token expirado');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Refresh Token inválido');
    }
    throw error;
  }
};

/**
 * Revoga um Refresh Token (remoção do registro)
 * 
 * Remove o token do array de tokens válidos, impedindo sua reutilização.
 * Implementa o logout funcional no paradigma stateless.
 * 
 * @param {string} token - Refresh Token a revogar
 * @returns {boolean} true se revogado com sucesso, false se não encontrado
 * 
 * @example
 * revokeRefreshToken(token);
 * // Logout realizado
 */
const revokeRefreshToken = (token) => {
  const initialLength = validRefreshTokens.length;
  validRefreshTokens = validRefreshTokens.filter((rt) => rt.token !== token);
  return validRefreshTokens.length < initialLength;
};

/**
 * Revoga todos os Refresh Tokens de um usuário
 * 
 * Útil para logout de todas as sessões ou mudança de senha.
 * 
 * @param {string} userId - ID do usuário
 * @returns {number} Quantidade de tokens revogados
 * 
 * @example
 * const count = revokeUserRefreshTokens('123');
 * console.log(`${count} sessões encerradas`);
 */
const revokeUserRefreshTokens = (userId) => {
  const initialLength = validRefreshTokens.length;
  validRefreshTokens = validRefreshTokens.filter((rt) => rt.userId !== userId);
  return initialLength - validRefreshTokens.length;
};

/**
 * Obtém o status de refresh tokens de um usuário (apenas para debug)
 * 
 * @param {string} userId - ID do usuário
 * @returns {Array} Lista de refresh tokens ativos do usuário
 */
const getUserRefreshTokens = (userId) => {
  return validRefreshTokens.filter((rt) => rt.userId === userId);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeUserRefreshTokens,
  getUserRefreshTokens,
};
