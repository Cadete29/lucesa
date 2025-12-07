/**
 * Controlador para productos procesados desde FTP
 * Utiliza los archivos cache generados por FTPService
 */
const logger = require('../utils/logger');
const ftpService = require('../services/ftpService');
const jsonProcessor = require('../services/jsonProcessor');
const fs = require('fs');
const path = require('path');

class ProductosController {
  constructor() {
    this.cache = {
      productos: [],    // Datos del XML
      existencias: [],  // Datos del JSON
      lastUpdate: null
    };
    this.initialized = false;
    
    // Bind de métodos
    this.ensureInitialized = this.ensureInitialized.bind(this);
    this.getTodosProductos = this.getTodosProductos.bind(this);
    this.getProductosConExistencia = this.getProductosConExistencia.bind(this);
    this.buscarProductos = this.buscarProductos.bind(this);
    this.getProductoPorCodigo = this.getProductoPorCodigo.bind(this);
    this.getProductoCombinadoPorCodigo = this.getProductoCombinadoPorCodigo.bind(this);
    this.getEstadisticas = this.getEstadisticas.bind(this);
    this.getCategorias = this.getCategorias.bind(this);
    this.getCategoriasCompletas = this.getCategoriasCompletas.bind(this);
    this.getMarcas = this.getMarcas.bind(this);
    this.actualizarDatos = this.actualizarDatos.bind(this);
    this.getHealth = this.getHealth.bind(this);
    this.diagnosticarProducto = this.diagnosticarProducto.bind(this);
    this.fusionarProductos = this.fusionarProductos.bind(this);
    this.calcularPrecioMXN = this.calcularPrecioMXN.bind(this);
    
    this.init();
  }

  async init() {
    try {
      logger.info('🔄 Inicializando ProductosController...');
      
      setTimeout(async () => {
        await this.loadCache();
        this.initialized = true;
        logger.info('✅ ProductosController inicializado correctamente');
      }, 3000);
    } catch (error) {
      logger.error('❌ Error inicializando ProductosController:', error);
      this.initialized = true;
    }
  }

  async loadCache() {
    try {
      logger.info('📥 Cargando cache desde FTP service...');
      const cacheData = ftpService.getCacheForController();
      
      this.cache.productos = cacheData.productos || [];
      this.cache.existencias = cacheData.existencias || [];
      this.cache.lastUpdate = cacheData.lastUpdate || new Date().toISOString();

      // SI LA CACHE ESTÁ VACÍA, CARGAR DIRECTAMENTE DEL ARCHIVO PROCESADO
      if (this.cache.existencias.length === 0) {
        logger.warn('⚠️  Cache de existencias vacía, cargando desde archivo procesado...');
        await this.loadFromProcessedFile();
      }

      logger.info(`📦 Cache final cargado: ${this.cache.productos.length} productos XML, ${this.cache.existencias.length} productos JSON`);
      
      // Crear índice para búsqueda rápida
      this.crearIndices();
      
    } catch (error) {
      logger.error('❌ Error cargando cache en controller:', error);
      await this.loadFromProcessedFile();
    }
  }

  crearIndices() {
    // Crear índices por código para búsqueda rápida
    this.indiceProductos = {};
    this.indiceExistencias = {};
    
    this.cache.productos.forEach(producto => {
      if (producto.codigo) {
        this.indiceProductos[producto.codigo.toUpperCase()] = producto;
      }
    });
    
    this.cache.existencias.forEach(producto => {
      if (producto.codigo) {
        this.indiceExistencias[producto.codigo.toUpperCase()] = producto;
      }
    });
    
    logger.info(`📊 Índices creados: ${Object.keys(this.indiceProductos).length} productos XML, ${Object.keys(this.indiceExistencias).length} productos JSON`);
  }

  /**
   * Calcula el precio en MXN según la moneda original
   * @param {number} precio - Precio original
   * @param {string} moneda - Moneda original ('USD' o 'MXN')
   * @param {number} tipoCambio - Tipo de cambio USD a MXN
   * @returns {number} Precio en MXN
   */
  calcularPrecioMXN(precio, moneda, tipoCambio) {
    if (!precio || precio <= 0) return 0;
    
    if (moneda === 'USD' && tipoCambio > 0) {
      return precio * tipoCambio;
    }
    
    // Si ya está en MXN o no hay conversión necesaria
    return precio;
  }

  /**
   * Fusión inteligente de productos XML y JSON
   */
  fusionarProductos(productoXML, productoJSON) {
    if (!productoXML && !productoJSON) return null;
    
    // Determinar producto base
    const productoBase = productoJSON || productoXML;
    const esCombinado = !!productoXML && !!productoJSON;
    
    // Obtener moneda original del producto base
    const monedaOriginal = productoJSON?.moneda || productoXML?.moneda || 'USD';
    const tipoCambio = productoXML?.tipo_cambio || productoJSON?.tipoCambio || 0;
    const precioOriginal = productoJSON?.precio || productoXML?.precio || 0;
    const precioPromocionOriginal = productoJSON?.precioPromocion || productoXML?.precioPromocion || 0;
    
    // Calcular precios en MXN
    const precioMXN = this.calcularPrecioMXN(precioOriginal, monedaOriginal, tipoCambio);
    const precioPromocionMXN = this.calcularPrecioMXN(precioPromocionOriginal, monedaOriginal, tipoCambio);
    
    // Crear producto fusionado
    const productoFusionado = {
      // ID y código
      id: productoBase.id,
      codigo: productoBase.codigo,
      
      // Información básica
      no_parte: productoXML?.no_parte || productoJSON?.numParte || '',
      nombre: productoJSON?.nombre || productoXML?.nombre || '',
      modelo: productoJSON?.modelo || productoXML?.modelo || '',
      marca: productoJSON?.marca || productoXML?.marca || '',
      categoria: productoJSON?.categoria || productoXML?.categoria || '',
      subcategoria: productoJSON?.subcategoria || productoXML?.subcategoria || '',
      
      // Descripción
      descripcion_corta: productoXML?.descripcion_corta || productoJSON?.descripcion_corta || '',
      descripcion: productoJSON?.descripcion || productoXML?.descripcion_corta || '',
      
      // Imágenes
      imagen: productoJSON?.imagen || productoXML?.imagen || '',
      imagenFecha: productoXML?.imagenFecha || '',
      
      // Precios y moneda (CORREGIDO)
      precio: precioOriginal,
      precioPromocion: precioPromocionOriginal,
      moneda: monedaOriginal, // Mantener la moneda original
      tipo_cambio: tipoCambio,
      precioMXN: precioMXN,
      precioPromocionMXN: precioPromocionMXN,
      
      // Especificaciones
      especificaciones: productoXML?.especificaciones || productoJSON?.especificaciones || [],
      
      // Códigos de barras
      upc: productoXML?.upc || productoJSON?.upc || '',
      ean: productoJSON?.ean || productoXML?.ean || '',
      
      // Sustituto y estado
      sustituto: productoXML?.sustituto || productoJSON?.sustituto || '',
      status: productoXML?.status || (productoJSON?.activo === 1 ? 'Activo' : 'Inactivo'),
      
      // Existencia
      existenciaTotal: productoJSON?.existenciaTotal || productoJSON?.existencia || productoXML?.existenciaTotal || 0,
      existencia: productoJSON?.existencia || productoJSON?.existenciaTotal || productoXML?.existenciaTotal || 0,
      almacenes: productoJSON?.almacenes || productoXML?.almacenes || {},
      
      // Disponibilidad
      disponible: productoJSON?.disponible || (productoXML?.existenciaTotal > 0) || false,
      tieneExistencia: productoJSON?.tieneExistencia || (productoXML?.existenciaTotal > 0) || false,
      stock: productoJSON?.stock || productoJSON?.existenciaTotal || productoXML?.existenciaTotal || 0,
      
      // Estado
      activo: productoJSON?.activo || 1,
      protegido: productoJSON?.protegido || 0,
      
      // Metadatos
      ultimaActualizacion: productoJSON?.ultimaActualizacion || productoXML?.ultimaActualizacion || new Date().toISOString(),
      fuente: esCombinado ? 'XML+JSON' : (productoJSON ? 'JSON' : 'XML'),
      
      // Campos adicionales
      almacen: productoJSON?.almacen || '',
      promociones: productoJSON?.promociones || []
    };

    return productoFusionado;
  }

  /**
   * Carga datos directamente desde el archivo procesado
   */
  async loadFromProcessedFile() {
    try {
      const processedPath = './data/ftp/processed/existencias_processed.json';
      
      if (fs.existsSync(processedPath)) {
        logger.info('📂 Cargando desde archivo procesado...');
        const processedData = JSON.parse(fs.readFileSync(processedPath, 'utf8'));
        
        this.cache.existencias = processedData.productos || [];
        this.cache.lastUpdate = processedData.metadata?.timestamp || new Date().toISOString();
        
        logger.info(`✅ Cargados ${this.cache.existencias.length} productos desde archivo procesado`);
        return true;
      } else {
        logger.error('❌ Archivo procesado no encontrado');
        return false;
      }
    } catch (error) {
      logger.error('❌ Error cargando desde archivo procesado:', error);
      return false;
    }
  }

  async emergencyLoadJSON() {
    try {
      logger.info('🚨 Carga de emergencia de JSON iniciada...');
      
      const jsonPath = './data/ftp/raw/productos.json';
      
      if (!fs.existsSync(jsonPath)) {
        logger.error('❌ Archivo JSON no encontrado para carga de emergencia');
        return false;
      }

      const productos = await jsonProcessor.processJSONFile(jsonPath);
      
      this.cache.existencias = productos;
      this.cache.lastUpdate = new Date().toISOString();
      this.crearIndices();
      
      logger.info(`✅ Carga de emergencia exitosa: ${productos.length} productos`);
      return true;
      
    } catch (error) {
      logger.error('❌ Error en carga de emergencia:', error);
      return false;
    }
  }

  // Middleware para verificar inicialización
  ensureInitialized(req, res, next) {
    if (!this.initialized) {
      return res.status(503).json({
        success: false,
        error: 'Servicio de productos no inicializado. Por favor, espere unos segundos.',
        timestamp: new Date().toISOString()
      });
    }
    next();
  }

  // Obtener todos los productos
  async getTodosProductos(req, res) {
    try {
      const { page = 1, limit = 50, categoria, marca, search } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      let productos = [...this.cache.productos];

      // Aplicar filtros
      if (categoria) {
        productos = productos.filter(p => 
          p.categoria && p.categoria.toLowerCase().includes(categoria.toLowerCase())
        );
      }

      if (marca) {
        productos = productos.filter(p => 
          p.marca && p.marca.toLowerCase().includes(marca.toLowerCase())
        );
      }

      if (search) {
        const searchLower = search.toLowerCase();
        productos = productos.filter(p =>
          (p.nombre && p.nombre.toLowerCase().includes(searchLower)) ||
          (p.codigo && p.codigo.toLowerCase().includes(searchLower)) ||
          (p.descripcion && p.descripcion.toLowerCase().includes(searchLower)) ||
          (p.descripcion_corta && p.descripcion_corta.toLowerCase().includes(searchLower))
        );
      }

      // Paginación
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const productosPaginated = productos.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: productosPaginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: productos.length,
          pages: Math.ceil(productos.length / limitNum),
          hasNext: endIndex < productos.length,
          hasPrev: pageNum > 1
        },
        metadata: {
          fuente: 'XML procesado',
          ultimaActualizacion: this.cache.lastUpdate,
          totalProductos: this.cache.productos.length,
          filtrosAplicados: { categoria, marca, search }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Error en getTodosProductos:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Obtener productos con existencia
  async getProductosConExistencia(req, res) {
    try {
      const { page = 1, limit = 50, almacen, minExistencia = 1 } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      let productos = [...this.cache.existencias];

      // Filtrar por existencia mínima
      productos = productos.filter(p => 
        (p.existencia || p.existenciaTotal || 0) >= parseInt(minExistencia)
      );

      // Filtrar por almacén si se especifica
      if (almacen) {
        const almacenUpper = almacen.toUpperCase();
        productos = productos.filter(p => 
          p.almacen === almacenUpper || (p.almacenes && p.almacenes[almacenUpper])
        );
      }

      // Paginación
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const productosPaginated = productos.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: productosPaginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: productos.length,
          pages: Math.ceil(productos.length / limitNum),
          hasNext: endIndex < productos.length,
          hasPrev: pageNum > 1
        },
        metadata: {
          fuente: 'JSON procesado',
          ultimaActualizacion: this.cache.lastUpdate,
          totalConExistencia: productos.length,
          filtrosAplicados: { almacen, minExistencia }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Error en getProductosConExistencia:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Buscar productos en ambos conjuntos de datos
  async buscarProductos(req, res) {
    try {
      const { q, tipo = 'ambos', conExistencia = true } = req.query;
      
      if (!q || q.length < 2) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          timestamp: new Date().toISOString()
        });
      }

      const searchTerm = q.toLowerCase();
      let resultados = [];

      // Buscar en productos con existencia (JSON)
      if (tipo === 'existencias' || tipo === 'ambos') {
        const existenciasResults = this.cache.existencias.filter(producto =>
          (producto.nombre && producto.nombre.toLowerCase().includes(searchTerm)) ||
          (producto.codigo && producto.codigo.toLowerCase().includes(searchTerm)) ||
          (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm)) ||
          (producto.marca && producto.marca.toLowerCase().includes(searchTerm)) ||
          (producto.categoria && producto.categoria.toLowerCase().includes(searchTerm))
        );
        resultados.push(...existenciasResults.map(p => ({ ...p, fuente: 'JSON' })));
      }

      // Buscar en todos los productos (XML) si es necesario
      if (tipo === 'todos' || tipo === 'ambos') {
        const todosResults = this.cache.productos.filter(producto =>
          ((producto.nombre && producto.nombre.toLowerCase().includes(searchTerm)) ||
          (producto.codigo && producto.codigo.toLowerCase().includes(searchTerm)) ||
          (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm)) ||
          (producto.marca && producto.marca.toLowerCase().includes(searchTerm)) ||
          (producto.categoria && producto.categoria.toLowerCase().includes(searchTerm))) &&
          !resultados.some(r => r.codigo === producto.codigo)
        );
        resultados.push(...todosResults.map(p => ({ ...p, fuente: 'XML' })));
      }

      // Ordenar por relevancia
      resultados.sort((a, b) => {
        const existA = a.existencia || a.existenciaTotal || 0;
        const existB = b.existencia || b.existenciaTotal || 0;
        return existB - existA;
      });

      res.json({
        success: true,
        data: resultados.slice(0, 100),
        total: resultados.length,
        search: {
          term: q,
          tipo,
          conExistencia
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Error en buscarProductos:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Obtener producto específico por código
  async getProductoPorCodigo(req, res) {
    try {
      const { codigo } = req.params;
      const { incluirSinExistencia = false, fusionar = true } = req.query;

      if (!codigo) {
        return res.status(400).json({
          success: false,
          error: 'Código de producto requerido',
          timestamp: new Date().toISOString()
        });
      }

      const codigoNormalizado = codigo.trim().toUpperCase();
      
      // Buscar en índices
      const productoJSON = this.indiceExistencias[codigoNormalizado];
      const productoXML = this.indiceProductos[codigoNormalizado];

      // Verificar si debemos mostrar el producto
      if (!productoJSON && !productoXML) {
        return res.status(404).json({
          success: false,
          error: `Producto con código ${codigo} no encontrado`,
          timestamp: new Date().toISOString()
        });
      }

      // Si solo existe en XML y no queremos incluir sin existencia
      if (!productoJSON && !incluirSinExistencia && productoXML) {
        return res.status(404).json({
          success: false,
          error: `Producto encontrado pero sin existencia. Use ?incluirSinExistencia=true para verlo.`,
          timestamp: new Date().toISOString()
        });
      }

      let productoFinal;
      
      if (fusionar) {
        // Usar fusión inteligente
        productoFinal = this.fusionarProductos(productoXML, productoJSON);
      } else {
        // Mostrar solo la fuente principal
        productoFinal = productoJSON || productoXML;
        productoFinal.fuente = productoJSON ? 'JSON' : 'XML';
      }

      // Si no tiene existencia pero se permite ver
      if (!productoJSON && productoXML && incluirSinExistencia) {
        productoFinal.existenciaTotal = 0;
        productoFinal.existencia = 0;
        productoFinal.tieneExistencia = false;
        productoFinal.disponible = false;
        productoFinal.stock = 0;
      }

      // Agregar información de conversión de moneda
      const tieneConversion = productoFinal.moneda === 'USD' && productoFinal.tipo_cambio > 0;

      res.json({
        success: true,
        data: productoFinal,
        metadata: {
          encontradoEn: productoFinal.fuente,
          tieneExistencia: !!(productoFinal.existencia || productoFinal.existenciaTotal),
          fuentesCombinadas: productoFinal.fuente.includes('+'),
          tieneDatosXML: !!productoXML,
          tieneDatosJSON: !!productoJSON,
          conversionMoneda: {
            monedaOriginal: productoFinal.moneda,
            tipoCambioAplicado: productoFinal.tipo_cambio,
            precioConvertido: tieneConversion,
            nota: tieneConversion ? 'Precio convertido de USD a MXN' : 'Precio ya en MXN'
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Error en getProductoPorCodigo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Obtener producto combinado por código
  async getProductoCombinadoPorCodigo(req, res) {
    try {
      const { codigo } = req.params;
      
      if (!codigo) {
        return res.status(400).json({
          success: false,
          error: 'Código de producto requerido',
          timestamp: new Date().toISOString()
        });
      }

      const codigoNormalizado = codigo.trim().toUpperCase();
      const productoJSON = this.indiceExistencias[codigoNormalizado];
      const productoXML = this.indiceProductos[codigoNormalizado];

      if (!productoJSON && !productoXML) {
        return res.status(404).json({
          success: false,
          error: `Producto con código ${codigo} no encontrado`,
          timestamp: new Date().toISOString()
        });
      }

      const productoFusionado = this.fusionarProductos(productoXML, productoJSON);

      // Información de conversión de moneda
      const tieneConversion = productoFusionado.moneda === 'USD' && productoFusionado.tipo_cambio > 0;

      res.json({
        success: true,
        data: productoFusionado,
        metadata: {
          fuentes: {
            xml: !!productoXML,
            json: !!productoJSON
          },
          ultimaActualizacion: this.cache.lastUpdate,
          conversionMoneda: {
            monedaOriginal: productoFusionado.moneda,
            tipoCambioAplicado: productoFusionado.tipo_cambio,
            precioConvertido: tieneConversion,
            precioOriginal: productoFusionado.precio,
            precioEnMXN: productoFusionado.precioMXN,
            nota: tieneConversion ? 
                  `Precio convertido de ${productoFusionado.moneda} a MXN usando tipo de cambio ${productoFusionado.tipo_cambio}` :
                  `Precio ya en ${productoFusionado.moneda}`
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Error en getProductoCombinadoPorCodigo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Método para diagnóstico
  async diagnosticarProducto(req, res) {
    try {
      const { codigo } = req.params;
      const codigoNormalizado = codigo.trim().toUpperCase();
      
      const enJSON = this.indiceExistencias[codigoNormalizado];
      const enXML = this.indiceProductos[codigoNormalizado];
      
      // Obtener información de moneda si existe
      const infoMonedaJSON = enJSON ? {
        moneda: enJSON.moneda,
        precio: enJSON.precio,
        precioMXN: enJSON.precioMXN,
        tipoCambio: enJSON.tipo_cambio
      } : null;
      
      const infoMonedaXML = enXML ? {
        moneda: enXML.moneda,
        precio: enXML.precio,
        precioMXN: enXML.precioMXN,
        tipoCambio: enXML.tipo_cambio
      } : null;
      
      res.json({
        success: true,
        diagnostico: {
          codigoBuscado: codigoNormalizado,
          enCacheJSON: !!enJSON,
          enCacheXML: !!enXML,
          totalJSON: this.cache.existencias.length,
          totalXML: this.cache.productos.length,
          muestraJSON: enJSON ? {
            id: enJSON.id,
            codigo: enJSON.codigo,
            nombre: enJSON.nombre,
            precio: enJSON.precio,
            existencia: enJSON.existencia,
            moneda: infoMonedaJSON
          } : null,
          muestraXML: enXML ? {
            id: enXML.id,
            codigo: enXML.codigo,
            nombre: enXML.nombre,
            precio: enXML.precio,
            existenciaTotal: enXML.existenciaTotal,
            moneda: infoMonedaXML
          } : null
        }
      });
    } catch (error) {
      logger.error('❌ Error en diagnóstico:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Obtener estadísticas de productos
  async getEstadisticas(req, res) {
    try {
      const totalProductos = this.cache.productos.length;
      const totalConExistencia = this.cache.existencias.length;
      
      // Categorías únicas
      const categorias = [...new Set(this.cache.productos.map(p => p.categoria).filter(Boolean))];
      
      // Marcas únicas
      const marcas = [...new Set(this.cache.productos.map(p => p.marca).filter(Boolean))];
      
      // Productos con promoción
      const conPromocion = this.cache.productos.filter(p => p.precioPromocion && p.precioPromocion > 0).length;

      // Productos con imágenes
      const conImagen = this.cache.productos.filter(p => p.imagen).length;

      // Productos en ambos conjuntos
      const codigosXML = new Set(this.cache.productos.map(p => p.codigo).filter(Boolean));
      const codigosJSON = new Set(this.cache.existencias.map(p => p.codigo).filter(Boolean));
      const enAmbosConjuntos = [...codigosXML].filter(codigo => codigosJSON.has(codigo)).length;
      
      // Estadísticas de moneda
      const productosPorMoneda = {};
      this.cache.productos.forEach(p => {
        const moneda = p.moneda || 'USD';
        productosPorMoneda[moneda] = (productosPorMoneda[moneda] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          totals: {
            todos: totalProductos,
            conExistencia: totalConExistencia,
            sinExistencia: totalProductos - totalConExistencia,
            conPromocion,
            conImagen,
            enAmbosConjuntos
          },
          monedas: productosPorMoneda,
          categorias: {
            total: categorias.length,
            list: categorias.slice(0, 50)
          },
          marcas: {
            total: marcas.length,
            list: marcas.slice(0, 50)
          },
          actualizacion: this.cache.lastUpdate,
          cache: {
            productosXML: this.cache.productos.length,
            productosJSON: this.cache.existencias.length
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Error en getEstadisticas:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Obtener categorías disponibles (método simple)
  async getCategorias(req, res) {
    try {
      const categorias = [...new Set(this.cache.productos.map(p => p.categoria).filter(Boolean))];
      
      res.json({
        success: true,
        data: categorias.sort(),
        total: categorias.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Error en getCategorias:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  // ✅ NUEVO MÉTODO CORREGIDO: Obtener categorías completas con estadísticas dinámicas
  async getCategoriasCompletas(req, res) {
    try {
      const { ordenar = 'alfabetico', minProductos = 1 } = req.query;
      
      console.log('🔍 getCategoriasCompletas llamado con:', { ordenar, minProductos });
      console.log('📦 Total productos en cache XML:', this.cache.productos.length);
      console.log('📦 Total productos en cache JSON:', this.cache.existencias.length);
      
      // Crear un mapa de categorías desde productos XML
      const categoriasMap = new Map();
      
      // Procesar productos XML
      this.cache.productos.forEach(producto => {
        if (producto.categoria && typeof producto.categoria === 'string') {
          const categoriaNombre = producto.categoria.trim();
          
          if (categoriaNombre && categoriaNombre !== 'N/A' && categoriaNombre !== 'null') {
            if (!categoriasMap.has(categoriaNombre)) {
              categoriasMap.set(categoriaNombre, {
                nombre: categoriaNombre,
                id: this.generarIdCategoria(categoriaNombre),
                conteoXML: 0,
                conteoJSON: 0,
                productos: new Set(),
                tieneExistencia: false
              });
            }
            
            const categoria = categoriasMap.get(categoriaNombre);
            categoria.conteoXML++;
            if (producto.codigo) categoria.productos.add(producto.codigo);
          }
        }
      });
      
      // Procesar productos JSON (con existencia)
      this.cache.existencias.forEach(producto => {
        if (producto.categoria && typeof producto.categoria === 'string') {
          const categoriaNombre = producto.categoria.trim();
          
          if (categoriaNombre && categoriaNombre !== 'N/A' && categoriaNombre !== 'null') {
            if (!categoriasMap.has(categoriaNombre)) {
              categoriasMap.set(categoriaNombre, {
                nombre: categoriaNombre,
                id: this.generarIdCategoria(categoriaNombre),
                conteoXML: 0,
                conteoJSON: 0,
                productos: new Set(),
                tieneExistencia: false
              });
            }
            
            const categoria = categoriasMap.get(categoriaNombre);
            categoria.conteoJSON++;
            categoria.tieneExistencia = true;
            if (producto.codigo) categoria.productos.add(producto.codigo);
          }
        }
      });
      
      // Convertir Map a array
      let categoriasArray = Array.from(categoriasMap.values()).map(categoria => ({
        ...categoria,
        totalProductos: categoria.productos.size,
        productos: Array.from(categoria.productos).slice(0, 10) // Solo guardar algunos códigos para referencia
      }));
      
      // Filtrar por mínimo de productos
      if (minProductos > 0) {
        categoriasArray = categoriasArray.filter(cat => 
          cat.totalProductos >= parseInt(minProductos)
        );
      }
      
      console.log(`📊 Categorías encontradas después de filtrar: ${categoriasArray.length}`);
      
      // Ordenar
      switch (ordenar) {
        case 'alfabetico':
          categoriasArray.sort((a, b) => 
            a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
          );
          break;
        case 'productos-desc':
          categoriasArray.sort((a, b) => b.totalProductos - a.totalProductos);
          break;
        case 'productos-asc':
          categoriasArray.sort((a, b) => a.totalProductos - b.totalProductos);
          break;
        case 'existencia-desc':
          categoriasArray.sort((a, b) => b.conteoJSON - a.conteoJSON);
          break;
        default:
          categoriasArray.sort((a, b) => 
            a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
          );
      }
      
      // Calcular estadísticas
      const totalCategorias = categoriasArray.length;
      const totalProductosCategorizados = categoriasArray.reduce((sum, cat) => sum + cat.totalProductos, 0);
      const categoriasConExistencia = categoriasArray.filter(cat => cat.tieneExistencia).length;
      
      res.json({
        success: true,
        data: categoriasArray,
        metadata: {
          total: totalCategorias,
          totalProductosCategorizados,
          categoriasConExistencia,
          filtrosAplicados: {
            ordenar,
            minProductos: parseInt(minProductos)
          },
          procesamiento: {
            productosXML: this.cache.productos.length,
            productosJSON: this.cache.existencias.length,
            fechaProcesamiento: new Date().toISOString()
          }
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error en getCategoriasCompletas:', error);
      console.error('Stack trace:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor: ' + error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Método auxiliar para generar ID de categoría
  generarIdCategoria(nombre) {
    if (!nombre) return `categoria-${Math.random().toString(36).substr(2, 9)}`;
    
    return nombre.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Obtener marcas disponibles
  async getMarcas(req, res) {
    try {
      const marcas = [...new Set(this.cache.productos.map(p => p.marca).filter(Boolean))];
      
      res.json({
        success: true,
        data: marcas.sort(),
        total: marcas.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Error en getMarcas:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Forzar actualización de datos
  async actualizarDatos(req, res) {
    try {
      logger.info('🔄 Actualización manual solicitada');
      await ftpService.downloadFiles();
      await this.loadCache();
      
      res.json({
        success: true,
        message: 'Datos actualizados correctamente',
        productos: this.cache.productos.length,
        existencias: this.cache.existencias.length,
        ultimaActualizacion: this.cache.lastUpdate,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Error en actualizarDatos:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Health check del servicio
  async getHealth(req, res) {
    try {
      const fileInfo = ftpService.getFileInfo();
      const health = ftpService.getHealth();

      res.json({
        success: true,
        status: 'healthy',
        data: {
          cache: {
            productos: this.cache.productos.length,
            existencias: this.cache.existencias.length,
            ultimaActualizacion: this.cache.lastUpdate,
            initialized: this.initialized,
            indices: {
              xml: Object.keys(this.indiceProductos || {}).length,
              json: Object.keys(this.indiceExistencias || {}).length
            }
          },
          archivos: fileInfo.summary,
          salud: health,
          rutas: {
            productoPorCodigo: '/api/productos/producto/:codigo',
            productoCombinado: '/api/productos/combinado/:codigo',
            diagnostico: '/api/productos/diagnostico/:codigo',
            todos: '/api/productos/todos',
            existencias: '/api/productos/existencias',
            buscar: '/api/productos/buscar',
            estadisticas: '/api/productos/estadisticas',
            categorias: '/api/productos/categorias',
            categoriasCompletas: '/api/productos/categorias-completas',
            marcas: '/api/productos/marcas'
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('❌ Error en getHealth:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new ProductosController();