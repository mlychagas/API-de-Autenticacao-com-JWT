/**
 * env.config.js
 * 
 * Módulo de Configuração de Variáveis de Ambiente
 * Carrega e valida as variáveis de ambiente necessárias para a aplicação,
 * garantindo a segurança das chaves criptográficas.
 */

require('dotenv').config();

/**
 * Valida se uma variável de ambiente está definida
 * @param {string} varName - Nome da variável
 * @throws {Error} Se a variável não estiver definida
 */
const validateEnv = (varName) => {
  if (!process.env[varName]) {
    throw new Error(`Variável de ambiente ${varName} não está definida. Verifique o arquivo .env`);
  }
};

validateEnv('JWT_ACCESS_SECRET');
validateEnv('JWT_REFRESH_SECRET');

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

module.exports = config;
