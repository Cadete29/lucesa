/**
 * Punto de entrada principal del servidor
 * Inicia el servidor Express y maneja el ciclo de vida
 */
const app = require('./app');
const logger = require('./utils/logger');
const { CTONLINE_CONFIG } = require('./config/ctonline');

const PORT = process.env.PORT || 4004;

// Iniciar servidor
const server = app.listen(PORT, () => {
  logger.info(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  logger.info(`📍 http://localhost:${PORT}`);
  logger.info(`🔌 Conectado a CTOnline: ${CTONLINE_CONFIG.BASE_URL}`);
});

// Manejo graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Recibido SIGTERM, cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('Recibido SIGINT, cerrando servidor...');
  server.close(() => {
    logger.info('Servidor cerrado');
    process.exit(0);
  });
});

module.exports = server;