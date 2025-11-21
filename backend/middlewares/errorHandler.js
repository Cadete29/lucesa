/**
 * Middleware para manejo global de errores
 * Captura y formatea todos los errores de la aplicación
 */
const logger = require('../utils/logger');

const errorHandler = {
  // Manejo de errores generales
  general: (err, req, res, next) => {
    logger.error('Error global:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';

    res.status(statusCode).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  },

  // Manejo de 404
  notFound: (req, res) => {
    res.status(404).json({
      success: false,
      error: `Ruta no encontrada: ${req.method} ${req.path}`,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = errorHandler;