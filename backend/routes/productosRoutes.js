/**
 * Rutas para productos procesados desde FTP
 */
const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');

// Aplicar middleware de inicialización a todas las rutas
router.use(productosController.ensureInitialized);

// Ruta de health check
router.get('/health', productosController.getHealth);

// Obtener productos con paginación
router.get('/todos', productosController.getTodosProductos);
router.get('/existencias', productosController.getProductosConExistencia);

// Búsqueda y filtros
router.get('/buscar', productosController.buscarProductos);
router.get('/categorias', productosController.getCategorias);
router.get('/categorias-completas', productosController.getCategoriasCompletas); // ✅ IMPORTANTE
router.get('/marcas', productosController.getMarcas);
router.get('/estadisticas', productosController.getEstadisticas);

// Producto específico
router.get('/producto/:codigo', productosController.getProductoPorCodigo);
router.get('/combinado/:codigo', productosController.getProductoCombinadoPorCodigo);
router.get('/diagnostico/:codigo', productosController.diagnosticarProducto);

// Administración
router.post('/actualizar', productosController.actualizarDatos);

module.exports = router;