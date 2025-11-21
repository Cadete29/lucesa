/**
 * Rutas de diagnóstico para troubleshooting
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const ftpService = require('../services/ftpService');
const jsonProcessor = require('../services/jsonProcessor');
const logger = require('../utils/logger');

// Información completa del JSON
router.get('/json-analysis', (req, res) => {
  try {
    const jsonPath = './data/ftp/raw/productos.json';
    const info = jsonProcessor.getJSONInfo(jsonPath);
    
    res.json({ success: true, analysis: info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Procesar JSON manualmente con el nuevo procesador
router.post('/process-json-manual', async (req, res) => {
  try {
    const jsonPath = './data/ftp/raw/productos.json';
    
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({
        success: false,
        error: 'Archivo productos.json no encontrado',
        path: jsonPath
      });
    }

    logger.info('🔄 Procesamiento manual de JSON iniciado...');
    const productos = await jsonProcessor.processJSONFile(jsonPath);
    
    // Actualizar cache
    ftpService.updateCache();
    
    res.json({
      success: true,
      message: 'JSON procesado manualmente',
      productosProcesados: productos.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('❌ Error en procesamiento manual:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ver contenido del archivo JSON raw (limitado)
router.get('/json-raw-sample', (req, res) => {
  try {
    const jsonPath = './data/ftp/raw/productos.json';
    
    if (!fs.existsSync(jsonPath)) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado',
        exists: false
      });
    }

    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(jsonData);
    
    // Limitar la muestra para no sobrecargar la respuesta
    let sample;
    if (Array.isArray(data)) {
      sample = data.slice(0, 5); // Primeros 5 elementos
    } else if (typeof data === 'object') {
      // Si es objeto, mostrar estructura completa pero limitar arrays internos
      sample = { ...data };
      Object.keys(sample).forEach(key => {
        if (Array.isArray(sample[key]) && sample[key].length > 5) {
          sample[key] = sample[key].slice(0, 5);
        }
      });
    } else {
      sample = data;
    }
    
    res.json({
      success: true,
      sample: sample,
      fullType: typeof data,
      isArray: Array.isArray(data),
      length: Array.isArray(data) ? data.length : 'N/A'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Información de archivos
router.get('/files', (req, res) => {
  const baseDir = './data/ftp';
  const dirs = ['raw', 'processed', 'cache'];
  
  const fileInfo = {};
  
  dirs.forEach(dir => {
    const dirPath = path.join(baseDir, dir);
    fileInfo[dir] = { exists: fs.existsSync(dirPath), files: [] };
    
    if (fileInfo[dir].exists) {
      try {
        const files = fs.readdirSync(dirPath);
        fileInfo[dir].files = files.map(file => {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            sizeMB: (stats.size / 1024 / 1024).toFixed(2),
            modified: stats.mtime,
            path: filePath
          };
        });
      } catch (error) {
        fileInfo[dir].error = error.message;
      }
    }
  });
  
  res.json({ success: true, fileInfo });
});

// Contenido del cache
router.get('/cache-content', (req, res) => {
  try {
    const productosCachePath = './data/ftp/cache/productos_cache.json';
    const existenciasCachePath = './data/ftp/cache/existencias_cache.json';
    
    const result = {
      productos: { exists: false },
      existencias: { exists: false }
    };
    
    if (fs.existsSync(productosCachePath)) {
      const content = JSON.parse(fs.readFileSync(productosCachePath, 'utf8'));
      result.productos = {
        exists: true,
        metadata: content.metadata,
        sample: content.data ? content.data.slice(0, 2) : 'No data array',
        total: content.data ? content.data.length : 0
      };
    }
    
    if (fs.existsSync(existenciasCachePath)) {
      const content = JSON.parse(fs.readFileSync(existenciasCachePath, 'utf8'));
      result.existencias = {
        exists: true,
        metadata: content.metadata,
        sample: content.data ? content.data.slice(0, 2) : 'No data array',
        total: content.data ? content.data.length : 0
      };
    }
    
    res.json({ success: true, ...result });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Estado del sistema
router.get('/system-status', (req, res) => {
  const status = {
    ftpService: {
      cacheAvailable: ftpService.isCacheAvailable(),
      cacheData: ftpService.getCacheForController()
    },
    directories: {
      raw: fs.existsSync('./data/ftp/raw'),
      processed: fs.existsSync('./data/ftp/processed'),
      cache: fs.existsSync('./data/ftp/cache')
    },
    files: {
      productosXml: fs.existsSync('./data/ftp/raw/productos.xml'),
      productosJson: fs.existsSync('./data/ftp/raw/productos.json'),
      productosProcessed: fs.existsSync('./data/ftp/processed/productos_processed.json'),
      existenciasProcessed: fs.existsSync('./data/ftp/processed/existencias_processed.json')
    },
    timestamp: new Date().toISOString()
  };
  
  res.json({ success: true, status });
});

module.exports = router;