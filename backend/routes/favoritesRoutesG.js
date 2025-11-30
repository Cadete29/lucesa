// backend/routes/favoritesRoutesG.js
const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesControllerG'); // ✅ Cambiado a G
const authenticateToken = require('../middlewares/authenticateTokenG');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas básicas de favoritos
router.get('/', favoritesController.getUserFavorites);
router.post('/:productId', favoritesController.addToFavorites);
router.delete('/:productId', favoritesController.removeFromFavorites);
router.get('/check/:productId', favoritesController.checkIsFavorite);
router.delete('/', favoritesController.clearAllFavorites);

// Rutas de administración
router.get('/admin/stats', favoritesController.getFavoritesStats);
router.get('/admin/user/:userId', favoritesController.getUserFavoritesAdmin);

module.exports = router;