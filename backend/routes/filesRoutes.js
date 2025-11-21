/**
 * Rutas para gestión y monitoreo de archivos
 */
const express = require('express');
const router = express.Router();
const filesController = require('../controllers/filesController');

// Rutas de gestión de archivos
router.get('/info', filesController.getFilesInfo);
router.post('/download', filesController.downloadFiles);
router.post('/cleanup', filesController.cleanupFiles);
router.get('/file/:filename', filesController.getFile);

module.exports = router;