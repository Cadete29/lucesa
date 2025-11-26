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
   * Transforma un producto individual - VERSIÓN CORREGIDA PARA ALMACENES
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
          if ((field === 'existencia' || field === 'stock') && typeof producto[field] === 'object') {
            logger.info(`   ${field}: ${JSON.stringify(producto[field])}`);
          } else {
            logger.info(`   ${field}: ${producto[field]}`);
          }
        }
      });
    }

    // Determinar código
    const codigo = producto.codigo || producto.clave || producto.sku || producto.upc || producto.code || producto.id || `PROD${index + 1}`;
    
    // Determinar nombre
    const nombre = producto.nombre || producto.descripcion || producto.name || producto.description || 'Producto sin nombre';
    
    // DETERMINAR EXISTENCIA - CORREGIDO PARA ALMACENES
    let existencia = 0;
    let existenciaTotal = 0;
    let almacenes = {};

    if (producto.existencia !== undefined && producto.existencia !== null) {
      if (typeof producto.existencia === 'object') {
        // El campo existencia es un objeto con almacenes: {"QRO": 1, "MTY": 5, etc}
        almacenes = producto.existencia;
        
        // Calcular existencia total sumando todos los almacenes
        existenciaTotal = Object.values(almacenes).reduce((total, cantidad) => {
          return total + (parseInt(cantidad) || 0);
        }, 0);
        
        // Para compatibilidad, usar la existencia total
        existencia = existenciaTotal;
        
        // Debug del primer producto
        if (index === 0) {
          logger.info(`   🔍 Existencia por almacenes: ${JSON.stringify(almacenes)}`);
          logger.info(`   📊 Existencia total calculada: ${existenciaTotal}`);
        }
      } else if (typeof producto.existencia === 'string') {
        existencia = parseInt(producto.existencia) || 0;
        existenciaTotal = existencia;
      } else if (typeof producto.existencia === 'number') {
        existencia = producto.existencia;
        existenciaTotal = existencia;
      }
    } else if (producto.stock !== undefined && producto.stock !== null) {
      if (typeof producto.stock === 'object') {
        // También manejar stock como objeto de almacenes
        almacenes = producto.stock;
        existenciaTotal = Object.values(almacenes).reduce((total, cantidad) => {
          return total + (parseInt(cantidad) || 0);
        }, 0);
        existencia = existenciaTotal;
      } else {
        existencia = parseInt(producto.stock) || 0;
        existenciaTotal = existencia;
      }
    } else if (producto.cantidad !== undefined && producto.cantidad !== null) {
      existencia = parseInt(producto.cantidad) || 0;
      existenciaTotal = existencia;
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

    // Determinar categoría y subcategoría
    const categoria = producto.categoria || producto.category || producto.idCategoria || 'Sin categoría';
    const subcategoria = producto.subcategoria || producto.subcategory || producto.idSubCategoria || '';

    // Producto transformado
    const productoTransformado = {
      id: `json_${index + 1}`,
      codigo: codigo,
      nombre: nombre,
      descripcion: producto.descripcion || producto.descripcion_corta || producto.description || '',
      precio: precio,
      existencia: existencia,
      existenciaTotal: existenciaTotal,
      almacenes: almacenes, // Guardar el desglose por almacenes
      categoria: categoria,
      subcategoria: subcategoria,
      marca: producto.marca || producto.brand || producto.idMarca || 'Sin marca',
      modelo: producto.modelo || producto.model || '',
      imagen: producto.imagen || producto.image || producto.imagen_url || producto.image_url || '',
      almacen: producto.almacen || 'QRO', // Usar QRO como almacen principal por defecto
      precioPromocion: parseFloat(producto.promo || producto.precio_promocion || producto.special_price || producto.promotion_price || 0),
      ultimaActualizacion: new Date().toISOString(),
      fuente: 'JSON',
      disponible: existencia > 0,
      tieneExistencia: existencia > 0,
      stock: existencia, // Alias para compatibilidad
      // Campos adicionales para compatibilidad
      ean: producto.ean || producto.upc || '',
      activo: producto.activo !== undefined ? producto.activo : true,
      especificaciones: producto.especificaciones || producto.specifications || {}
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
        procesadoCon: 'JSONProcessor',
        totalConExistencia: productos.filter(p => p.existencia > 0).length
      }
    };

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    
    logger.info(`✅ Procesamiento completado: ${productos.length} productos`);
    logger.info(`📊 Estrategia utilizada: ${estrategia}`);
    logger.info(`📦 Productos con existencia: ${outputData.metadata.totalConExistencia}`);
    
    // Mostrar ejemplos
    if (productos.length > 0) {
      logger.info('📋 Ejemplos de productos procesados:');
      productos.slice(0, 3).forEach((prod, i) => {
        const almacenesInfo = prod.almacenes ? ` (${Object.keys(prod.almacenes).join(', ')})` : '';
        logger.info(`   ${i + 1}. ${prod.codigo} - ${prod.nombre} - Existencia: ${prod.existencia}${almacenesInfo} - Precio: $${prod.precio}`);
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

  /**
   * Procesa el archivo JSON y devuelve estadísticas
   */
  async processAndGetStats(filePath) {
    try {
      const productos = await this.processJSONFile(filePath);
      
      const stats = {
        total: productos.length,
        conExistencia: productos.filter(p => p.existencia > 0).length,
        sinExistencia: productos.filter(p => p.existencia === 0).length,
        almacenes: {},
        categorias: {},
        marcas: {}
      };

      // Estadísticas de almacenes
      productos.forEach(producto => {
        if (producto.almacenes && typeof producto.almacenes === 'object') {
          Object.keys(producto.almacenes).forEach(almacen => {
            if (!stats.almacenes[almacen]) {
              stats.almacenes[almacen] = 0;
            }
            stats.almacenes[almacen] += parseInt(producto.almacenes[almacen]) || 0;
          });
        }

        // Estadísticas de categorías
        if (producto.categoria) {
          if (!stats.categorias[producto.categoria]) {
            stats.categorias[producto.categoria] = 0;
          }
          stats.categorias[producto.categoria]++;
        }

        // Estadísticas de marcas
        if (producto.marca) {
          if (!stats.marcas[producto.marca]) {
            stats.marcas[producto.marca] = 0;
          }
          stats.marcas[producto.marca]++;
        }
      });

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Error obteniendo estadísticas:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new JSONProcessor();