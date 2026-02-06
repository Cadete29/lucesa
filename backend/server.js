/**
 * Servidor principal de la aplicación
 * Punto de entrada y configuración del servidor
 */
const app = require('./app');
const ftpService = require('./services/ftpService');
const logger = require('./utils/logger');

// Importar y ejecutar la conexión a la base de datos
const db = require('./config/db');

// Configuración
const PORT = process.env.PORT || 4004;
const HOST = process.env.HOST || '0.0.0.0';

// Variables globales para manejo graceful shutdown
let server;
let isShuttingDown = false;
let shutdownTimeout = null;

/**
 * Inicializar todos los servicios necesarios
 */
async function initializeServices() {
  try {
    logger.info('🚀 Inicializando servicios...');
    
    // La conexión a la base de datos ya se ejecuta al importar db
    
    // Verificar y crear estructura de directorios
    logger.info('📁 Verificando estructura de directorios...');
    
    // Cargar datos existentes al iniciar
    logger.info('💾 Cargando datos existentes...');
    ftpService.updateCache();
    
    // Intentar descarga inicial
    try {
      logger.info('📥 Intentando descarga inicial...');
      await ftpService.downloadFiles();
      logger.success('✅ Descarga inicial completada');
    } catch (error) {
      logger.warn('⚠️ Descarga inicial fallida, usando datos existentes');
    }
    
    // Programar descargas automáticas
    logger.info('⏰ Configurando descargas automáticas...');
    ftpService.scheduleDownloads();
    
    // Limpiar archivos antiguos al iniciar
    logger.info('🧹 Realizando limpieza inicial...');
    const deletedCount = ftpService.cleanupOldFiles(7);
    if (deletedCount > 0) {
      logger.info(`🗑️ Eliminados ${deletedCount} archivos antiguos`);
    }
    
    logger.success('✅ Todos los servicios inicializados correctamente');
    
  } catch (error) {
    logger.error('❌ Error inicializando servicios:', error);
    process.exit(1);
  }
}

/**
 * Manejo graceful de shutdown
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    if (isShuttingDown) {
      logger.info('⚠️ Shutdown ya en progreso...');
      return;
    }
    isShuttingDown = true;
    
    // Configurar timeout para evitar bloqueo infinito
    shutdownTimeout = setTimeout(() => {
      logger.error('⏰ Timeout en shutdown, forzando salida');
      process.exit(1);
    }, 15000);
    
    try {
      logger.info(`\n${'='.repeat(50)}`);
      logger.info(`🛑 Recibido ${signal}, cerrando servidor...`);
      logger.info(`${'='.repeat(50)}`);
      
      // Detener descargas automáticas
      ftpService.stopScheduledDownloads();
      logger.info('✅ Descargas automáticas detenidas');
      
      // Cerrar servidor HTTP
      if (server) {
        await new Promise((resolve, reject) => {
          server.close((err) => {
            if (err) {
              logger.error('❌ Error cerrando servidor:', err);
              reject(err);
            } else {
              logger.info('✅ Servidor HTTP cerrado');
              resolve();
            }
          });
          
          // Timeout adicional para server.close
          setTimeout(() => {
            logger.warn('⚠️  Timeout cerrando servidor, forzando cierre');
            resolve();
          }, 5000);
        });
      }
      
      // Limpiar timeout
      if (shutdownTimeout) {
        clearTimeout(shutdownTimeout);
        shutdownTimeout = null;
      }
      
      logger.success('🎯 Servidor cerrado correctamente');
      process.exit(0);
      
    } catch (error) {
      logger.error('❌ Error durante el shutdown:', error);
      
      // Limpiar timeout en caso de error
      if (shutdownTimeout) {
        clearTimeout(shutdownTimeout);
        shutdownTimeout = null;
      }
      
      process.exit(1);
    }
  };

  // Manejar diferentes señales de terminación
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2'));
  
  // Manejar uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('💥 Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
}

/**
 * Mostrar información del sistema
 */
function displaySystemInfo() {
  const os = require('os');
  
  logger.info(`${'='.repeat(50)}`);
  logger.info('🖥️  INFORMACIÓN DEL SISTEMA');
  logger.info(`${'='.repeat(50)}`);
  logger.info(`Plataforma: ${os.platform()} ${os.arch()}`);
  logger.info(`Node.js: ${process.version}`);
  logger.info(`Memoria: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`);
  logger.info(`CPUs: ${os.cpus().length}`);
  logger.info(`Directorio: ${process.cwd()}`);
  logger.info(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Puerto: ${PORT}`);
  logger.info(`${'='.repeat(50)}`);
}

/**
 * Iniciar el servidor
 */
async function startServer() {
  try {
    // Mostrar información del sistema
    displaySystemInfo();
    
    // Configurar manejo graceful shutdown
    setupGracefulShutdown();
    
    // Inicializar servicios
    await initializeServices();
    
    // Iniciar servidor HTTP
    server = app.listen(PORT, HOST, () => {
      logger.success(`${'='.repeat(50)}`);
      logger.success(`🚀 Servidor ejecutándose en http://${HOST}:${PORT}`);
      logger.success(`📍 Health Check: http://${HOST}:${PORT}/`);
      logger.success(`📍 API Status: http://${HOST}:${PORT}/api/ctonline/status`);
      logger.success(`📍 Test Route: http://${HOST}:${PORT}/api/test`);
      logger.success(`${'='.repeat(50)}`);
      
      // Mostrar rutas disponibles
      logger.info('📋 ENDPOINTS DISPONIBLES:');
      logger.info(`   GET  /                              - Health check`);
      logger.info(`   GET  /api/test                      - Ruta de prueba`);
      logger.info(`   GET  /api/usuarios                  - Lista usuarios`);
      logger.info(`   POST /api/usuarios                  - Crear usuario`);
      logger.info(`   GET  /api/ctonline/status           - Estado CTOnline`);
      logger.info(`   GET  /api/ctonline/promociones      - Promociones`);
      logger.info(`   GET  /api/ctonline/existencias      - Existencias`);
      logger.info(`   GET  /api/ctonline/almacenes        - Almacenes`);
      logger.info(`   GET  /api/ctonline/producto/:codigo/:almacen - Detalle producto`);
      logger.info(`   GET  /api/ctonline/promocion/:codigo - Promoción por código`);
      logger.info(`   GET  /api/orders/history            - Historial de órdenes`);
      logger.info(`   POST /api/orders                    - Crear orden`);
      logger.info(`   POST /api/payments/create-preference - Crear preferencia MP`);
      logger.info(`${'='.repeat(50)}`);
    });

    // Manejar errores del servidor
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Puerto ${PORT} ya en uso`);
        process.exit(1);
      } else {
        logger.error('❌ Error del servidor:', error);
        process.exit(1);
      }
    });

    return server;

  } catch (error) {
    logger.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

/**
 * Verificar dependencias necesarias
 */
function checkDependencies() {
  const dependencies = [
    'express',
    'basic-ftp',
    'xml2js',
    'axios',
    'cors',
    'path',
    'dotenv'
  ];

  const missing = [];

  dependencies.forEach(dep => {
    try {
      require.resolve(dep);
    } catch (error) {
      missing.push(dep);
    }
  });

  if (missing.length > 0) {
    logger.error('❌ Dependencias faltantes:', missing);
    logger.error('💡 Ejecuta: npm install ' + missing.join(' '));
    process.exit(1);
  }

  logger.success('✅ Todas las dependencias están instaladas');
}

// Iniciar aplicación
if (require.main === module) {
  // Cargar variables de entorno
  require('dotenv').config();
  
  // Verificar dependencias primero
  checkDependencies();
  
  // Iniciar servidor
  startServer().catch(error => {
    logger.error('💥 Error fatal iniciando servidor:', error);
    process.exit(1);
  });
}

module.exports = server;