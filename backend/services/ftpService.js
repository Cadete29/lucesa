const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const logger = require('../utils/logger');
const jsonProcessor = require('./jsonProcessor');

class FTPService {
  constructor() {
    this.config = {
      host: '216.70.82.104',
      user: 'ACX1110',
      password: 'k91859tW081N9I39Hn1W',
      secure: false
    };
    
    this.dirs = {
      base: './data/ftp',
      raw: './data/ftp/raw',
      processed: './data/ftp/processed',
      cache: './data/ftp/cache',
      historial: './data/ftp/raw/historial',
      logs: './data/logs'
    };
    
    this.downloadInterval = null;
    this.isShuttingDown = false;
    this.connectionState = 'disconnected'; // 'disconnected', 'connecting', 'connected', 'error'
    this.activeDownload = false;
    this.client = null;
    
    this.createDirectories();
  }

  createDirectories() {
    Object.values(this.dirs).forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async connect() {
    try {
      if (this.connectionState === 'connected' && this.client) {
        logger.info('🔌 Usando conexión FTP existente');
        return this.client;
      }
      
      if (this.connectionState === 'connecting') {
        logger.info('⏳ Conexión FTP ya en progreso, esperando...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (this.connectionState === 'connected') {
          return this.client;
        }
      }
      
      this.connectionState = 'connecting';
      logger.info('🔌 Conectando a servidor FTP...');
      
      // Cerrar cualquier conexión previa
      await this.safeClose();
      
      this.client = new ftp.Client();
      this.client.ftp.verbose = false;
      this.client.timeout = 30000;
      
      await this.client.access(this.config);
      this.connectionState = 'connected';
      logger.info('✅ Conexión FTP establecida');
      
      return this.client;
    } catch (error) {
      this.connectionState = 'error';
      logger.error('❌ Error conectando a FTP:', error.message);
      this.client = null;
      throw error;
    }
  }

  async safeClose() {
    try {
      if (this.client && this.connectionState === 'connected') {
        logger.info('🔌 Cerrando conexión FTP...');
        this.client.close();
        logger.info('✅ Conexión FTP cerrada');
      }
    } catch (error) {
      logger.warn('⚠️  Error al cerrar conexión FTP:', error.message);
    } finally {
      this.client = null;
      this.connectionState = 'disconnected';
    }
  }

  async downloadFiles() {
    if (this.activeDownload) {
      logger.info('⏳ Descarga ya en progreso, omitiendo...');
      return [];
    }
    
    if (this.isShuttingDown) {
      logger.info('⚠️  Servicio en proceso de cierre, omitiendo descarga');
      return [];
    }
    
    this.activeDownload = true;
    
    try {
      await this.connect();
      
      const remoteFiles = await this.client.list();
      const downloadedFiles = [];

      if (remoteFiles.some(f => f.name === 'catalogo_xml' && f.isDirectory)) {
        await this.client.cd('catalogo_xml');
        const catalogFiles = await this.client.list();

        if (catalogFiles.some(f => f.name === 'productos.xml')) {
          const xmlLocalPath = path.join(this.dirs.raw, 'productos.xml');
          await this.client.downloadTo(xmlLocalPath, 'productos.xml');
          downloadedFiles.push('productos.xml');
          await this.createHistoricalCopy('productos.xml');
        }

        if (catalogFiles.some(f => f.name === 'productos.json')) {
          const jsonLocalPath = path.join(this.dirs.raw, 'productos.json');
          await this.client.downloadTo(jsonLocalPath, 'productos.json');
          downloadedFiles.push('productos.json');
          await this.createHistoricalCopy('productos.json');
        }

        await this.client.cd('..');
      }

      await this.safeClose();

      if (downloadedFiles.length > 0) {
        await this.processDownloadedFiles();
      }

      return downloadedFiles;

    } catch (error) {
      logger.error('❌ Error en descarga FTP:', error);
      await this.safeClose(); // Asegurar cierre en caso de error
      throw error;
    } finally {
      this.activeDownload = false;
    }
  }

  async createHistoricalCopy(filename) {
    try {
      const timestamp = new Date().toISOString()
        .replace(/:/g, '-').replace(/\..+/, '').replace('T', '_');
      
      const originalPath = path.join(this.dirs.raw, filename);
      const extension = path.extname(filename);
      const nameWithoutExt = path.basename(filename, extension);
      const historicalFilename = `${nameWithoutExt}_${timestamp}${extension}`;
      const historicalPath = path.join(this.dirs.historial, historicalFilename);

      fs.copyFileSync(originalPath, historicalPath);
    } catch (error) {
      logger.error('❌ Error creando copia histórica:', error);
    }
  }

  async processDownloadedFiles() {
    const xmlPath = path.join(this.dirs.raw, 'productos.xml');
    const jsonPath = path.join(this.dirs.raw, 'productos.json');

    if (fs.existsSync(xmlPath)) {
      await this.processXMLFile(xmlPath);
    }

    if (fs.existsSync(jsonPath)) {
      await this.processJSONFile(jsonPath);
    }

    this.updateCache();
  }

  async processXMLFile(filePath) {
    try {
      logger.info('🔨 Procesando archivo XML...');
      const xmlData = fs.readFileSync(filePath, 'utf8');
      
      logger.info(`📊 Archivo XML - Líneas: ${xmlData.split('\n').length}, Tamaño: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);

      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: false,
        explicitRoot: false,
        trim: true,
        normalize: true,
        ignoreAttrs: false,
        attrNameProcessors: [name => `_${name}`],
        tagNameProcessors: [name => name.toLowerCase()]
      });

      logger.info('🔍 Parseando estructura XML...');
      const result = await parser.parseStringPromise(xmlData);
      
      const productos = this.transformXMLData(result);
      
      const outputPath = path.join(this.dirs.processed, 'productos_processed.json');
      const outputData = {
        productos: productos,
        metadata: {
          total: productos.length,
          timestamp: new Date().toISOString(),
          source: 'XML'
        }
      };
      
      fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
      logger.info(`✅ XML procesado: ${productos.length} productos`);

    } catch (error) {
      logger.error('❌ Error procesando XML:', error);
    }
  }

  transformXMLData(xmlData) {
    try {
      let productos = [];
      
      if (xmlData.productos && xmlData.productos.producto) {
        productos = Array.isArray(xmlData.productos.producto) 
          ? xmlData.productos.producto 
          : [xmlData.productos.producto];
      } else if (xmlData.producto) {
        productos = Array.isArray(xmlData.producto) 
          ? xmlData.producto 
          : [xmlData.producto];
      }

      return productos.map((producto, index) => {
        const precio = this.parsePrecio(producto.precio);
        const tipoCambio = this.parsePrecio(producto.tipo_cambio);
        
        return {
          id: `xml_${index + 1}`,
          codigo: producto.clave || '',
          no_parte: producto.no_parte || '',
          nombre: producto.nombre || '',
          modelo: producto.modelo || '',
          marca: producto.marca || '',
          categoria: producto.categoria || '',
          subcategoria: producto.subcategoria || '',
          imagen: producto.imagen || '',
          imagenFecha: producto.imagenFecha || '',
          descripcion_corta: producto.descripcion_corta || '',
          upc: producto.upc || '',
          ean: producto.ean || '',
          status: producto.status || '',
          sustituto: producto.sustituto || '',
          precio: precio,
          moneda: producto.moneda || 'USD',
          tipo_cambio: tipoCambio,
          precioMXN: precio * tipoCambio,
          existenciaTotal: this.calcularExistenciaTotalXML(producto.existencia),
          almacenes: this.extraerAlmacenesXML(producto.existencia),
          especificaciones: this.extraerEspecificacionesXML(producto.especificacion),
          ultimaActualizacion: new Date().toISOString(),
          fuente: 'XML'
        };
      });

    } catch (error) {
      logger.error('❌ Error transformando XML:', error);
      return [];
    }
  }

  parsePrecio(precioStr) {
    if (!precioStr) return 0;
    const precio = parseFloat(precioStr);
    return isNaN(precio) ? 0 : precio;
  }

  calcularExistenciaTotalXML(existenciaData) {
    if (!existenciaData) return 0;
    
    try {
      let total = 0;
      
      if (typeof existenciaData === 'object') {
        const almacenes = Object.keys(existenciaData);
        for (const almacen of almacenes) {
          if (almacen !== '_attributes' && almacen !== '_text') {
            let cantidad = existenciaData[almacen];
            
            if (cantidad && typeof cantidad === 'object' && cantidad._text !== undefined) {
              cantidad = cantidad._text;
            }
            
            total += this.parsePrecio(cantidad);
          }
        }
      } else {
        total = this.parsePrecio(existenciaData);
      }
      
      return total;
    } catch (error) {
      logger.error('Error calculando existencia XML:', error);
      return 0;
    }
  }

  extraerAlmacenesXML(existenciaData) {
    if (!existenciaData || typeof existenciaData !== 'object') return {};
    
    const almacenes = {};
    
    try {
      Object.keys(existenciaData).forEach(almacen => {
        if (almacen !== '_attributes' && almacen !== '_text') {
          let cantidad = existenciaData[almacen];
          
          if (cantidad && typeof cantidad === 'object' && cantidad._text !== undefined) {
            cantidad = cantidad._text;
          }
          
          almacenes[almacen] = this.parsePrecio(cantidad);
        }
      });
    } catch (error) {
      logger.error('Error extrayendo almacenes XML:', error);
    }
    
    return almacenes;
  }

  extraerEspecificacionesXML(especificacionData) {
    if (!especificacionData) return [];
    
    try {
      const especificaciones = [];
      
      if (typeof especificacionData === 'object') {
        Object.keys(especificacionData).forEach(key => {
          if (key.startsWith('caracteristica')) {
            const caracteristica = especificacionData[key];
            if (caracteristica && caracteristica.tipo && caracteristica.valor) {
              especificaciones.push({
                tipo: caracteristica.tipo._text || caracteristica.tipo,
                valor: caracteristica.valor._text || caracteristica.valor
              });
            }
          }
        });
      }
      
      return especificaciones;
    } catch (error) {
      logger.error('Error extrayendo especificaciones XML:', error);
      return [];
    }
  }

  async processJSONFile(filePath) {
    try {
      logger.info('🔨 Procesando archivo JSON...');
      const jsonData = fs.readFileSync(filePath, 'utf8');
      
      logger.info(`📊 Archivo JSON - Tamaño: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);

      let productosData;
      try {
        productosData = JSON.parse(jsonData);
      } catch (parseError) {
        const lines = jsonData.split('\n').filter(line => line.trim());
        productosData = lines.map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return null;
          }
        }).filter(item => item !== null);
      }

      const productos = this.transformJSONData(productosData);
      
      const outputPath = path.join(this.dirs.processed, 'existencias_processed.json');
      const outputData = {
        productos: productos,
        metadata: {
          total: productos.length,
          timestamp: new Date().toISOString(),
          source: 'JSON'
        }
      };
      
      fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
      logger.info(`✅ JSON procesado: ${productos.length} productos`);
      
      return productos;

    } catch (error) {
      logger.error('❌ Error procesando JSON:', error);
      return [];
    }
  }

  transformJSONData(jsonData) {
    try {
      let productosArray = [];
      
      if (Array.isArray(jsonData)) {
        productosArray = jsonData;
      } else if (typeof jsonData === 'object') {
        if (jsonData.productos) {
          productosArray = Array.isArray(jsonData.productos) 
            ? jsonData.productos 
            : [jsonData.productos];
        } else {
          productosArray = [jsonData];
        }
      }

      return productosArray.map((producto, index) => {
        const precio = this.parsePrecio(producto.precio);
        const tipoCambio = this.parsePrecio(producto.tipoCambio);
        
        return {
          id: `json_${index + 1}`,
          codigo: producto.clave || '',
          numParte: producto.numParte || '',
          nombre: producto.nombre || '',
          modelo: producto.modelo || '',
          marca: producto.marca || '',
          categoria: producto.categoria || '',
          subcategoria: producto.subcategoria || '',
          descripcion_corta: producto.descripcion_corta || '',
          ean: producto.ean || '',
          upc: producto.upc || '',
          sustituto: producto.sustituto || '',
          activo: producto.activo || 0,
          protegido: producto.protegido || 0,
          precio: precio,
          moneda: producto.moneda || 'USD',
          tipoCambio: tipoCambio,
          precioMXN: precio * tipoCambio,
          existenciaTotal: this.calcularExistenciaTotalJSON(producto.existencia),
          existencia: this.calcularExistenciaTotalJSON(producto.existencia),
          almacenes: producto.existencia || {},
          imagen: producto.imagen || '',
          especificaciones: producto.especificaciones || [],
          promociones: producto.promociones || [],
          disponible: (producto.activo === 1 && this.calcularExistenciaTotalJSON(producto.existencia) > 0),
          tieneExistencia: this.calcularExistenciaTotalJSON(producto.existencia) > 0,
          stock: this.calcularExistenciaTotalJSON(producto.existencia),
          ultimaActualizacion: new Date().toISOString(),
          fuente: 'JSON'
        };
      });

    } catch (error) {
      logger.error('❌ Error transformando JSON:', error);
      return [];
    }
  }

  calcularExistenciaTotalJSON(existenciaData) {
    if (!existenciaData || typeof existenciaData !== 'object') return 0;
    
    try {
      let total = 0;
      Object.values(existenciaData).forEach(cantidad => {
        total += this.parsePrecio(cantidad);
      });
      return total;
    } catch (error) {
      return 0;
    }
  }

  updateCache() {
    try {
      const xmlProcessedPath = path.join(this.dirs.processed, 'productos_processed.json');
      const jsonProcessedPath = path.join(this.dirs.processed, 'existencias_processed.json');

      if (fs.existsSync(xmlProcessedPath)) {
        const data = JSON.parse(fs.readFileSync(xmlProcessedPath, 'utf8'));
        const cacheData = {
          data: data.productos || [],
          metadata: data.metadata,
          lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(path.join(this.dirs.cache, 'productos_cache.json'), JSON.stringify(cacheData, null, 2));
        logger.info(`💾 Cache XML actualizado: ${cacheData.data.length} productos`);
      }

      if (fs.existsSync(jsonProcessedPath)) {
        const data = JSON.parse(fs.readFileSync(jsonProcessedPath, 'utf8'));
        const cacheData = {
          data: data.productos || [],
          metadata: data.metadata,
          lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(path.join(this.dirs.cache, 'existencias_cache.json'), JSON.stringify(cacheData, null, 2));
        logger.info(`💾 Cache JSON actualizado: ${cacheData.data.length} productos`);
      }

    } catch (error) {
      logger.error('❌ Error actualizando cache:', error);
    }
  }

  cleanupOldFiles(daysToKeep = 7) {
    try {
      if (!fs.existsSync(this.dirs.historial)) {
        return 0;
      }

      const files = fs.readdirSync(this.dirs.historial);
      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      let deletedCount = 0;

      files.forEach(file => {
        const filePath = path.join(this.dirs.historial, file);
        const stats = fs.statSync(filePath);

        if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });

      if (deletedCount > 0) {
        logger.info(`🧹 Limpieza completada: ${deletedCount} archivos eliminados`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('❌ Error en limpieza de archivos:', error);
      return 0;
    }
  }

  getFileInfo() {
    const filesInfo = {
      raw: {},
      processed: {},
      cache: {},
      historial: {},
      summary: {
        totalRaw: 0,
        totalProcessed: 0,
        totalCache: 0,
        totalHistorical: 0
      }
    };

    try {
      if (fs.existsSync(this.dirs.raw)) {
        const rawFiles = fs.readdirSync(this.dirs.raw)
          .filter(f => f.endsWith('.xml') || f.endsWith('.json'));
        
        rawFiles.forEach(file => {
          const filePath = path.join(this.dirs.raw, file);
          const stats = fs.statSync(filePath);
          filesInfo.raw[file] = {
            size: this.formatFileSize(stats.size),
            sizeBytes: stats.size,
            modified: stats.mtime,
            path: filePath
          };
        });
        filesInfo.summary.totalRaw = rawFiles.length;
      }

      if (fs.existsSync(this.dirs.processed)) {
        const processedFiles = fs.readdirSync(this.dirs.processed);
        processedFiles.forEach(file => {
          const filePath = path.join(this.dirs.processed, file);
          const stats = fs.statSync(filePath);
          filesInfo.processed[file] = {
            size: this.formatFileSize(stats.size),
            sizeBytes: stats.size,
            modified: stats.mtime,
            path: filePath
          };
        });
        filesInfo.summary.totalProcessed = processedFiles.length;
      }

      if (fs.existsSync(this.dirs.cache)) {
        const cacheFiles = fs.readdirSync(this.dirs.cache);
        cacheFiles.forEach(file => {
          const filePath = path.join(this.dirs.cache, file);
          const stats = fs.statSync(filePath);
          filesInfo.cache[file] = {
            size: this.formatFileSize(stats.size),
            sizeBytes: stats.size,
            modified: stats.mtime,
            path: filePath
          };
        });
        filesInfo.summary.totalCache = cacheFiles.length;
      }

      if (fs.existsSync(this.dirs.historial)) {
        const historicalFiles = fs.readdirSync(this.dirs.historial);
        filesInfo.historial = {
          total: historicalFiles.length,
          files: historicalFiles.slice(-10).reverse()
        };
        filesInfo.summary.totalHistorical = historicalFiles.length;
      }

      return filesInfo;
    } catch (error) {
      logger.error('❌ Error obteniendo información de archivos:', error);
      return filesInfo;
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getHealth() {
    const fileInfo = this.getFileInfo();
    const productosCache = this.getCachedData('productos');
    const existenciasCache = this.getCachedData('existencias');
    
    return {
      status: 'healthy',
      lastUpdate: existenciasCache?.lastUpdated || productosCache?.lastUpdated || null,
      totalProducts: productosCache?.data?.length || 0,
      totalWithStock: existenciasCache?.data?.length || 0,
      files: fileInfo.summary,
      timestamp: new Date().toISOString(),
      connectionState: this.connectionState,
      activeDownload: this.activeDownload,
      isShuttingDown: this.isShuttingDown
    };
  }

  scheduleDownloads() {
    this.downloadInterval = setInterval(async () => {
      try {
        if (this.isShuttingDown) {
          logger.info('⚠️  Servicio en proceso de cierre, omitiendo descarga programada');
          return;
        }
        
        logger.info('🔄 Descarga automática iniciada...');
        await this.downloadFiles();
      } catch (error) {
        logger.error('❌ Error en descarga automática:', error);
      }
    }, 15 * 60 * 1000);

    logger.info('✅ Descargas automáticas programadas cada 15 minutos');
  }

  stopScheduledDownloads() {
    if (this.isShuttingDown) {
      logger.info('⚠️ Shutdown ya en progreso...');
      return;
    }
    
    this.isShuttingDown = true;
    
    if (this.downloadInterval) {
      clearInterval(this.downloadInterval);
      this.downloadInterval = null;
      logger.info('🛑 Descargas programadas detenidas correctamente');
    } else {
      logger.info('ℹ️ No hay descargas programadas activas para detener');
    }
    
    // Cerrar conexión FTP de manera segura
    this.safeClose();
  }

  restartScheduledDownloads() {
    this.stopScheduledDownloads();
    this.isShuttingDown = false;
    this.scheduleDownloads();
    logger.info('🔄 Descargas programadas reiniciadas');
  }

  getCachedData(type = 'existencias') {
    try {
      const cacheFile = type === 'existencias' ? 'existencias_cache.json' : 'productos_cache.json';
      const cachePath = path.join(this.dirs.cache, cacheFile);
      
      if (fs.existsSync(cachePath)) {
        const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        logger.info(`📦 Cache ${type}: ${data.data ? data.data.length : 0} productos`);
        return data;
      }
      
      logger.warn(`⚠️  Cache ${type} no encontrado en: ${cachePath}`);
      return null;
    } catch (error) {
      logger.error(`❌ Error obteniendo cache ${type}:`, error);
      return null;
    }
  }

  getCacheForController() {
    try {
      const productosCache = this.getCachedData('productos');
      const existenciasCache = this.getCachedData('existencias');

      const cacheData = {
        productos: productosCache?.data || [],
        existencias: existenciasCache?.data || [],
        lastUpdate: existenciasCache?.lastUpdated || productosCache?.lastUpdated || new Date().toISOString()
      };

      logger.info(`📊 Cache para controlador: ${cacheData.productos.length} productos, ${cacheData.existencias.length} existencias`);
      
      return cacheData;
    } catch (error) {
      logger.error('❌ Error obteniendo cache para controlador:', error);
      return {
        productos: [],
        existencias: [],
        lastUpdate: new Date().toISOString()
      };
    }
  }

  isCacheAvailable() {
    try {
      const productosCache = this.getCachedData('productos');
      const existenciasCache = this.getCachedData('existencias');
      
      return !!(productosCache && existenciasCache);
    } catch (error) {
      return false;
    }
  }

  async waitForCache(timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.isCacheAvailable()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Timeout esperando por cache');
  }

  async reprocessExistingFiles() {
    try {
      logger.info('🔄 Reprocesando archivos existentes...');
      
      const xmlPath = path.join(this.dirs.raw, 'productos.xml');
      const jsonPath = path.join(this.dirs.raw, 'productos.json');

      if (fs.existsSync(xmlPath)) {
        await this.processXMLFile(xmlPath);
      }

      if (fs.existsSync(jsonPath)) {
        await this.processJSONFile(jsonPath);
      }

      this.updateCache();
      
      logger.info('✅ Reprocesamiento completado');
      return true;
    } catch (error) {
      logger.error('❌ Error en reprocesamiento:', error);
      return false;
    }
  }

  getStats() {
    const fileInfo = this.getFileInfo();
    const cacheProductos = this.getCachedData('productos');
    const cacheExistencias = this.getCachedData('existencias');
    
    return {
      downloads: {
        scheduled: !!this.downloadInterval,
        status: this.isShuttingDown ? 'stopped' : 'running'
      },
      cache: {
        productos: cacheProductos ? cacheProductos.data.length : 0,
        existencias: cacheExistencias ? cacheExistencias.data.length : 0,
        lastUpdate: cacheProductos?.lastUpdated || cacheExistencias?.lastUpdated
      },
      files: fileInfo.summary,
      directories: this.dirs,
      connectionState: this.connectionState,
      activeDownload: this.activeDownload
    };
  }
}

module.exports = new FTPService();