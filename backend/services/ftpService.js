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
    this.client = new ftp.Client();
    this.client.ftp.verbose = false;
    await this.client.access(this.config);
  }

  async downloadFiles() {
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

      await this.client.close();

      if (downloadedFiles.length > 0) {
        await this.processDownloadedFiles();
      }

      return downloadedFiles;

    } catch (error) {
      logger.error('❌ Error en descarga FTP:', error);
      throw error;
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
        explicitRoot: true,
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
      
      if (xmlData.articulo && xmlData.articulo.producto) {
        const productosData = xmlData.articulo.producto;
        productos = Array.isArray(productosData) ? productosData : [productosData];
      }

      return productos.map((producto, index) => ({
        id: `xml_${index + 1}`,
        codigo: this.extraerValor(producto, ['clave', 'codigo', 'sku']),
        nombre: this.extraerValor(producto, ['nombre', 'descripcion']),
        descripcion: this.extraerValor(producto, ['descripcion_corta', 'descripcion']),
        precio: this.parsePrecio(this.extraerValor(producto, ['precio'])),
        precioPromocion: this.parsePrecio(this.extraerValor(producto, ['promo'])),
        marca: this.extraerValor(producto, ['marca']),
        categoria: this.extraerValor(producto, ['categoria']),
        subcategoria: this.extraerValor(producto, ['subcategoria']),
        imagen: this.extraerValor(producto, ['imagen']),
        existenciaTotal: this.calcularExistenciaTotal(producto.existencia),
        ultimaActualizacion: new Date().toISOString(),
        fuente: 'XML'
      }));

    } catch (error) {
      logger.error('❌ Error transformando XML:', error);
      return [];
    }
  }

  extraerValor(producto, camposPosibles) {
    for (const campo of camposPosibles) {
      if (producto[campo] !== undefined && producto[campo] !== null && producto[campo] !== '') {
        if (typeof producto[campo] === 'object' && producto[campo]._text !== undefined) {
          return producto[campo]._text;
        }
        return producto[campo];
      }
    }
    return '';
  }

  parsePrecio(precioStr) {
    if (!precioStr) return 0;
    const precio = parseFloat(precioStr);
    return isNaN(precio) ? 0 : precio;
  }

  calcularExistenciaTotal(existenciaData) {
    if (!existenciaData) return 0;
    
    try {
      let total = 0;
      
      if (typeof existenciaData === 'object') {
        const almacenes = Object.keys(existenciaData);
        for (const almacen of almacenes) {
          if (almacen !== '_attributes' && almacen !== '_text') {
            const cantidad = this.parsePrecio(existenciaData[almacen]);
            total += cantidad;
          }
        }
      } else {
        total = this.parsePrecio(existenciaData);
      }
      
      return total;
    } catch (error) {
      return 0;
    }
  }

  async processJSONFile(filePath) {
    try {
      // Usar el nuevo JSONProcessor
      const productosProcesados = await jsonProcessor.processJSONFile(filePath);
      return productosProcesados;
    } catch (error) {
      logger.error('❌ Error procesando JSON:', error);
      return [];
    }
  }

  updateCache() {
    try {
      const processedPath = path.join(this.dirs.processed, 'productos_processed.json');
      const existenciasPath = path.join(this.dirs.processed, 'existencias_processed.json');

      if (fs.existsSync(processedPath)) {
        const data = JSON.parse(fs.readFileSync(processedPath, 'utf8'));
        const cacheData = {
          data: data.productos || [],
          metadata: data.metadata,
          lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(path.join(this.dirs.cache, 'productos_cache.json'), JSON.stringify(cacheData, null, 2));
      }

      if (fs.existsSync(existenciasPath)) {
        const data = JSON.parse(fs.readFileSync(existenciasPath, 'utf8'));
        const cacheData = {
          data: data.productos || [],
          metadata: data.metadata,
          lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(path.join(this.dirs.cache, 'existencias_cache.json'), JSON.stringify(cacheData, null, 2));
      }

      logger.info('💾 Cache actualizado');

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
    const cacheData = this.getCachedData('existencias');
    
    return {
      status: 'healthy',
      lastUpdate: cacheData?.lastUpdated || null,
      totalProducts: cacheData?.metadata?.total || 0,
      files: fileInfo.summary,
      timestamp: new Date().toISOString()
    };
  }

  scheduleDownloads() {
    setInterval(async () => {
      try {
        logger.info('🔄 Descarga automática iniciada...');
        await this.downloadFiles();
      } catch (error) {
        logger.error('❌ Error en descarga automática:', error);
      }
    }, 15 * 60 * 1000);

    logger.info('✅ Descargas automáticas programadas');
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

  /**
   * Obtener datos cacheados para el controlador de productos
   */
  getCacheForController() {
    try {
      const productosCache = this.getCachedData('productos');
      const existenciasCache = this.getCachedData('existencias');

      const cacheData = {
        productos: productosCache?.data || [],
        existencias: existenciasCache?.data || [],
        lastUpdate: productosCache?.lastUpdated || existenciasCache?.lastUpdated || new Date().toISOString()
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

  /**
   * Verificar si el cache está disponible
   */
  isCacheAvailable() {
    try {
      const productosCache = this.getCachedData('productos');
      const existenciasCache = this.getCachedData('existencias');
      
      return !!(productosCache && existenciasCache);
    } catch (error) {
      return false;
    }
  }

  /**
   * Esperar a que el cache esté disponible (útil durante startup)
   */
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

  /**
   * Forzar reprocesamiento de archivos existentes
   */
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
}

module.exports = new FTPService();