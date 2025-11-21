/**
 * Rutas para el manejo de usuarios
 * Endpoints básicos CRUD para usuarios
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rutas de usuarios
router.get('/', userController.getUsers);
router.post('/', userController.createUser);

module.exports = router;