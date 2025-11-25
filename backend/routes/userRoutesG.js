// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllerG');
const authenticateToken = require('../middlewares/authenticateTokenG');

// Todas estas rutas están protegidas → necesitan token
router.get('/me', authenticateToken, userController.getMyProfile);
router.put('/me', authenticateToken, userController.updateMyProfile);
router.delete('/me', authenticateToken, userController.deleteMyAccount);

module.exports = router;