/**
 * Controlador para gestión y monitoreo de archivos
 */
const ftpService = require('../services/ftpService');
const fs = require('fs');
const path = require('path');

const filesController = {
  /**
   * Obtener información de archivos locales
   */
  getFilesInfo: (req, res) => {
    try {
      const filesInfo = ftpService.getFileInfo();
      
      res.json({
        success: true,
        data: filesInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Forzar descarga de archivos
   */
  downloadFiles: async (req, res) => {
    try {
      const downloadedFiles = await ftpService.downloadFiles();
      
      res.json({
        success: true,
        message: 'Descarga completada',
        files: downloadedFiles,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Limpiar archivos antiguos
   */
  cleanupFiles: (req, res) => {
    try {
      const days = parseInt(req.query.days) || 7;
      const deletedCount = ftpService.cleanupOldFiles(days);
      
      res.json({
        success: true,
        message: `Limpieza completada`,
        deletedCount,
        daysKept: days,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * Obtener archivo específico (solo para admin)
   */
  getFile: (req, res) => {
    try {
      const { filename } = req.params;
      const safePath = path.normalize(filename).replace(/^(\.\.(\/|\\|$))+/, '');
      
      // Buscar en todos los directorios
      const directories = ['raw', 'processed', 'cache'];
      let filePath = null;

      for (const dir of directories) {
        const possiblePath = path.join('./data/ftp', dir, safePath);
        if (fs.existsSync(possiblePath)) {
          filePath = possiblePath;
          break;
        }
      }

      if (!filePath) {
        return res.status(404).json({
          success: false,
          error: 'Archivo no encontrado',
          timestamp: new Date().toISOString()
        });
      }

      // Verificar que es un archivo JSON o XML
      if (!filePath.endsWith('.json') && !filePath.endsWith('.xml')) {
        return res.status(403).json({
          success: false,
          error: 'Tipo de archivo no permitido',
          timestamp: new Date().toISOString()
        });
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      res.json({
        success: true,
        data: filePath.endsWith('.json') ? JSON.parse(fileContent) : fileContent,
        fileInfo: {
          path: filePath,
          size: fs.statSync(filePath).size,
          modified: fs.statSync(filePath).mtime
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
};

module.exports = filesController;