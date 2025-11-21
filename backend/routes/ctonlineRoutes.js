/**
 * Rutas para la integración con CTOnline API
 * Define todos los endpoints disponibles para productos, promociones, etc.
 */
const express = require('express');
const router = express.Router();
const ctonlineController = require('../controllers/ctonlineController');
const rateLimit = require('../middlewares/rateLimit');

// Aplicar rate limiting general a todas las rutas
router.use(rateLimit());

// Rutas de CTOnline
router.get('/promociones', ctonlineController.getPromociones);
router.get('/existencias', ctonlineController.getExistencias);
router.get('/almacenes', ctonlineController.getAlmacenes);
router.get('/producto/:codigo/:almacen', ctonlineController.getDetalleProducto);
router.get('/promocion/:codigo', ctonlineController.getPromocionPorCodigo);
router.get('/status', ctonlineController.getStatus);

module.exports = router;