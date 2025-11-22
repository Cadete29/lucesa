const express = require('express');
const router = express.Router();
const categoriasController = require('../controllers/categoriasController');

// Todas las categorías reales desde productos
router.get('/reales', (req, res) => categoriasController.getCategoriasReales(req, res));

// Categorías con estadísticas detalladas
router.get('/estadisticas', (req, res) => categoriasController.getCategoriasConEstadisticas(req, res));

// Categorías (endpoint original para compatibilidad)
router.get('/', (req, res) => categoriasController.getCategorias(req, res));

// Health check
router.get('/health/status', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        message: 'API de Categorías funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;