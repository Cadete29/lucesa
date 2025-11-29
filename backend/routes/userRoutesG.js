// backend/routes/userRoutesG.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllerG');
const authenticateToken = require('../middlewares/authenticateTokenG');
const { uploadProfileImage } = require('../middlewares/uploadMiddlewareG');

// Todas estas rutas están protegidas → necesitan token

// Obtener perfil del usuario
router.get('/me', authenticateToken, userController.getMyProfile);

// Actualizar perfil (nombre)
router.put('/me', authenticateToken, userController.updateMyProfile);

// Subir imagen de perfil
router.post('/me/upload-photo', authenticateToken, uploadProfileImage, userController.uploadProfileImage);

// Eliminar imagen de perfil
router.delete('/me/remove-photo', authenticateToken, userController.removeProfileImage);

// Eliminar cuenta
router.delete('/me', authenticateToken, userController.deleteMyAccount);

module.exports = router;