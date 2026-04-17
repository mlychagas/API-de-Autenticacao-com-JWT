/**
 * server.js
 * 
 * Arquivo de Inicialização do Servidor
 * Carrega configurações e inicia a aplicação Express na porta configurada.
 */

const config = require('./config/env.config');
const app = require('./app');

const server = app.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║         🔐 API de Autenticação com JWT - Iniciada             ║
║                                                                ║
║  Ambiente: ${config.nodeEnv.padEnd(55)} ║
║  Porta:    ${config.port.toString().padEnd(55)} ║
║  URL:      http://localhost:${config.port}${' '.repeat(50 - config.port.toString().length)} ║
║                                                                ║
║  Health Check:  GET  http://localhost:${config.port}/health        ║
║  Login:         POST http://localhost:${config.port}/auth/login     ║
║  Refresh:       POST http://localhost:${config.port}/auth/refresh   ║
║  Logout:        POST http://localhost:${config.port}/auth/logout    ║
║  Listar Usuários: GET  http://localhost:${config.port}/usuarios     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📵 Encerramento do servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n📵 SIGTERM recebido. Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('❌ Erro não capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  process.exit(1);
});
