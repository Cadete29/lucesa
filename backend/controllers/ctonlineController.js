/**
 * Controladores para los endpoints de CTOnline
 * Manejan las request y response de las rutas API
 */
const ctonlineService = require('../services/ctonlineService');
const logger = require('../utils/logger');

const ctonlineController = {
  // Obtener todas las promociones
  getPromociones: async (req, res, next) => {
    try {
      logger.info('Obteniendo promociones');
      const data = await ctonlineService.getPromociones();
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener existencias
  getExistencias: async (req, res, next) => {
    try {
      logger.info('Obteniendo existencias');
      const data = await ctonlineService.getExistencias();
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener almacenes
  getAlmacenes: async (req, res, next) => {
    try {
      logger.info('Obteniendo almacenes');
      const data = await ctonlineService.getAlmacenes();
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener detalle de producto
  getDetalleProducto: async (req, res, next) => {
    try {
      const { codigo, almacen } = req.params;
      logger.info(`Obteniendo detalle para producto ${codigo} en almacén ${almacen}`);
      
      const data = await ctonlineService.getDetalleProducto(codigo, almacen);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener promoción por código
  getPromocionPorCodigo: async (req, res, next) => {
    try {
      const { codigo } = req.params;
      logger.info(`Obteniendo promoción para código ${codigo}`);
      
      const data = await ctonlineService.getPromocionesPorCodigo(codigo);
      res.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  },

  // Verificar estado de conexión
  getStatus: async (req, res, next) => {
    try {
      await ctonlineService.ensureAuthenticated();
      res.json({
        success: true,
        message: 'Conexión activa con CTOnline',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ctonlineController;