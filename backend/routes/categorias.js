const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');

// Todas las categorías
router.get('/', (req, res) => categoriasController.getCategorias(req, res));

// Categoría específica por ID
router.get('/:id', (req, res) => categoriasController.getCategoriaById(req, res));

// Productos de una categoría específica
router.get('/:id/productos', (req, res) => categoriasController.getProductosPorCategoria(req, res));

// Health check
router.get('/health/status', (req, res) => categoriasController.getHealth(req, res));

// Estadísticas
router.get('/estadisticas/resumen', (req, res) => categoriasController.getEstadisticas(req, res));

module.exports = router;