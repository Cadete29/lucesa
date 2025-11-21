/**
 * Procesador especializado para JSON de productos
 */
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class JSONProcessor {
  constructor() {
    this.processedDir = './data/ftp/processed';
    
    // Crear directorio si no existe
    if (!fs.existsSync(this.processedDir)) {
      fs.mkdirSync(this.processedDir, { recursive: true });
    }
  }

  /**
   * Procesa el archivo JSON con múltiples estrategias
   */
  async processJSONFile(filePath) {
    try {
      logger.info('🔨 Iniciando procesamiento de JSON...');
      
      if (!fs.existsSync(filePath)) {
        throw new Error(`Archivo no encontrado: ${filePath}`);
      }

      const fileStats = fs.statSync(filePath);
      logger.info(`📊 Tamaño del archivo: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

      const jsonData = fs.readFileSync(filePath, 'utf8');
      const rawData = JSON.parse(jsonData);

      logger.info('🔍 Analizando estructura del JSON...');
      this.logJSONStructure(rawData);

      // Intentar diferentes estrategias de procesamiento
      let productos = [];
      
      // Estrategia 1: Array directo
      productos = this.processAsArray(rawData);
      if (productos.length > 0) {
        logger.info(`✅ Estrategia 1 exitosa: ${productos.length} productos`);
        return this.finalizeProcessing(productos, 'array_directo');
      }

      // Estrategia 2: Objeto con propiedad 'productos'
      productos = this.processWithProductosProperty(rawData);
      if (productos.length > 0) {
        logger.info(`✅ Estrategia 2 exitosa: ${productos.length} productos`);
        return this.finalizeProcessing(productos, 'property_productos');
      }

      // Estrategia 3: Objeto con propiedad 'data'
      productos = this.processWithDataProperty(rawData);
      if (productos.length > 0) {
        logger.info(`✅ Estrategia 3 exitosa: ${productos.length} productos`);
        return this.finalizeProcessing(productos, 'property_data');
      }

      // Estrategia 4: Buscar cualquier array en el objeto
      productos = this.processAnyArray(rawData);
      if (productos.length > 0) {
        logger.info(`✅ Estrategia 4 exitosa: ${productos.length} productos`);
        return this.finalizeProcessing(productos, 'any_array');
      }

      // Estrategia 5: Objeto único
      productos = this.processAsSingleObject(rawData);
      if (productos.length > 0) {
        logger.info(`✅ Estrategia 5 exitosa: ${productos.length} productos`);
        return this.finalizeProcessing(productos, 'single_object');
      }

      throw new Error('No se pudo procesar el JSON con ninguna estrategia');

    } catch (error) {
      logger.error('❌ Error procesando JSON:', error);
      throw error;
    }
  }

  /**
   * Estrategia 1: Array directo
   */
  processAsArray(rawData) {
    if (Array.isArray(rawData)) {
      logger.info('📦 JSON es un array directo');
      return rawData.map((item, index) => this.transformProduct(item, index));
    }
    return [];
  }

  /**
   * Estrategia 2: Objeto con propiedad 'productos'
   */
  processWithProductosProperty(rawData) {
    if (rawData && typeof rawData === 'object' && rawData.productos && Array.isArray(rawData.productos)) {
      logger.info('📦 JSON tiene propiedad "productos" con array');
      return rawData.productos.map((item, index) => this.transformProduct(item, index));
    }
    return [];
  }

  /**
   * Estrategia 3: Objeto con propiedad 'data'
   */
  processWithDataProperty(rawData) {
    if (rawData && typeof rawData === 'object' && rawData.data && Array.isArray(rawData.data)) {
      logger.info('📦 JSON tiene propiedad "data" con array');
      return rawData.data.map((item, index) => this.transformProduct(item, index));
    }
    return [];
  }

  /**
   * Estrategia 4: Buscar cualquier array en el objeto
   */
  processAnyArray(rawData) {
    if (rawData && typeof rawData === 'object') {
      const keys = Object.keys(rawData);
      for (const key of keys) {
        if (Array.isArray(rawData[key])) {
          logger.info(`📦 Encontrado array en propiedad "${key}"`);
          return rawData[key].map((item, index) => this.transformProduct(item, index));
        }
      }
    }
    return [];
  }

  /**
   * Estrategia 5: Objeto único
   */
  processAsSingleObject(rawData) {
    if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
      logger.info('📦 JSON es un objeto único, tratando como producto individual');
      return [this.transformProduct(rawData, 0)];
    }
    return [];
  }

  /**
   * Transforma un producto individual
   */
  transformProduct(producto, index) {
    // Log del primer producto para debugging
    if (index === 0) {
      logger.info('🔍 Estructura del primer producto:');
      const keys = Object.keys(producto);
      logger.info(`   Campos disponibles: ${keys.join(', ')}`);
      
      // Mostrar valores importantes
      const importantFields = ['codigo', 'clave', 'sku', 'nombre', 'existencia', 'stock', 'precio', 'cantidad'];
      importantFields.forEach(field => {
        if (producto[field] !== undefined) {
          logger.info(`   ${field}: ${producto[field]}`);
        }
      });
    }

    // Determinar código
    const codigo = producto.codigo || producto.clave || producto.sku || producto.upc || producto.code || producto.id || `PROD${index + 1}`;
    
    // Determinar nombre
    const nombre = producto.nombre || producto.descripcion || producto.name || producto.description || 'Producto sin nombre';
    
    // Determinar existencia
    let existencia = 0;
    if (producto.existencia !== undefined && producto.existencia !== null) {
      existencia = parseInt(producto.existencia);
    } else if (producto.stock !== undefined && producto.stock !== null) {
      existencia = parseInt(producto.stock);
    } else if (producto.cantidad !== undefined && producto.cantidad !== null) {
      existencia = parseInt(producto.cantidad);
    } else if (producto.inventory !== undefined && producto.inventory !== null) {
      existencia = parseInt(producto.inventory);
    }

    // Determinar precio
    let precio = 0;
    if (producto.precio !== undefined && producto.precio !== null) {
      precio = parseFloat(producto.precio);
    } else if (producto.price !== undefined && producto.price !== null) {
      precio = parseFloat(producto.price);
    } else if (producto.precio_venta !== undefined && producto.precio_venta !== null) {
      precio = parseFloat(producto.precio_venta);
    }

    // Producto transformado
    const productoTransformado = {
      id: `json_${index + 1}`,
      codigo: codigo,
      nombre: nombre,
      descripcion: producto.descripcion || producto.descripcion_corta || producto.description || '',
      precio: precio,
      existencia: existencia,
      categoria: producto.categoria || producto.category || 'Sin categoría',
      marca: producto.marca || producto.brand || 'Sin marca',
      imagen: producto.imagen || producto.image || producto.imagen_url || producto.image_url || '',
      almacen: producto.almacen || producto.warehouse || producto.sucursal || producto.store || '001',
      precioPromocion: parseFloat(producto.promo || producto.precio_promocion || producto.special_price || producto.promotion_price || 0),
      ultimaActualizacion: new Date().toISOString(),
      fuente: 'JSON'
    };

    return productoTransformado;
  }

  /**
   * Finaliza el procesamiento guardando el archivo
   */
  finalizeProcessing(productos, estrategia) {
    const outputPath = path.join(this.processedDir, 'existencias_processed.json');
    const outputData = {
      productos: productos,
      metadata: {
        total: productos.length,
        timestamp: new Date().toISOString(),
        source: 'JSON',
        estrategia: estrategia,
        procesadoCon: 'JSONProcessor'
      }
    };

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    
    logger.info(`✅ Procesamiento completado: ${productos.length} productos`);
    logger.info(`📊 Estrategia utilizada: ${estrategia}`);
    
    // Mostrar ejemplos
    if (productos.length > 0) {
      logger.info('📋 Ejemplos de productos procesados:');
      productos.slice(0, 3).forEach((prod, i) => {
        logger.info(`   ${i + 1}. ${prod.codigo} - ${prod.nombre} - Existencia: ${prod.existencia} - Precio: $${prod.precio}`);
      });
    }

    return productos;
  }

  /**
   * Log de la estructura del JSON para debugging
   */
  logJSONStructure(data) {
    logger.info('📋 ESTRUCTURA DEL JSON:');
    
    if (Array.isArray(data)) {
      logger.info(`   Tipo: Array con ${data.length} elementos`);
      if (data.length > 0) {
        const firstItem = data[0];
        logger.info(`   Primer elemento tipo: ${typeof firstItem}`);
        if (typeof firstItem === 'object') {
          logger.info(`   Campos del primer elemento: ${Object.keys(firstItem).join(', ')}`);
        }
      }
    } else if (typeof data === 'object') {
      logger.info(`   Tipo: Objeto`);
      const keys = Object.keys(data);
      logger.info(`   Propiedades: ${keys.join(', ')}`);
      
      // Analizar cada propiedad
      keys.forEach(key => {
        const value = data[key];
        if (Array.isArray(value)) {
          logger.info(`   ↳ ${key}: Array[${value.length}]`);
          if (value.length > 0 && typeof value[0] === 'object') {
            logger.info(`     Campos del primer elemento: ${Object.keys(value[0]).join(', ')}`);
          }
        } else {
          logger.info(`   ↳ ${key}: ${typeof value}`);
        }
      });
    } else {
      logger.info(`   Tipo: ${typeof data}`);
    }
  }

  /**
   * Obtiene información detallada del archivo JSON
   */
  getJSONInfo(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return { exists: false, error: 'Archivo no encontrado' };
      }

      const jsonData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(jsonData);
      const stats = fs.statSync(filePath);

      return {
        exists: true,
        size: {
          bytes: stats.size,
          mb: (stats.size / 1024 / 1024).toFixed(2)
        },
        structure: this.analyzeStructure(data),
        sample: this.getSample(data),
        rawSample: data
      };
    } catch (error) {
      return { exists: true, error: error.message };
    }
  }

  analyzeStructure(data) {
    const analysis = {
      type: typeof data,
      isArray: Array.isArray(data),
      keys: Array.isArray(data) ? [] : Object.keys(data)
    };

    if (Array.isArray(data)) {
      analysis.length = data.length;
      if (data.length > 0) {
        analysis.firstItemType = typeof data[0];
        if (typeof data[0] === 'object') {
          analysis.firstItemKeys = Object.keys(data[0]);
        }
      }
    }

    return analysis;
  }

  getSample(data) {
    if (Array.isArray(data) && data.length > 0) {
      return data.slice(0, 2);
    } else if (typeof data === 'object') {
      return data;
    }
    return data;
  }
}

module.exports = new JSONProcessor();