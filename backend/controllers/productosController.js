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
      productos: [],
      existencias: [],
      lastUpdate: null
    };
    this.initialized = false;
    
    this.ensureInitialized = this.ensureInitialized.bind(this);
    this.getTodosProductos = this.getTodosProductos.bind(this);
    this.getProductosConExistencia = this.getProductosConExistencia.bind(this);
    this.buscarProductos = this.buscarProductos.bind(this);
    this.getProductoPorCodigo = this.getProductoPorCodigo.bind(this);
    this.getEstadisticas = this.getEstadisticas.bind(this);
    this.getCategorias = this.getCategorias.bind(this);
    this.getMarcas = this.getMarcas.bind(this);
    this.actualizarDatos = this.actualizarDatos.bind(this);
    this.getHealth = this.getHealth.bind(this);
    
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

      if (this.cache.existencias.length === 0) {
        logger.warn('⚠️  No hay datos en cache, intentando carga de emergencia...');
        await this.emergencyLoadJSON();
      }

      logger.info(`📦 Cache final cargado: ${this.cache.productos.length} productos, ${this.cache.existencias.length} existencias`);
    } catch (error) {
      logger.error('❌ Error cargando cache en controller:', error);
      this.cache.productos = this.cache.productos || [];
      this.cache.existencias = this.cache.existencias || [];
      this.cache.lastUpdate = this.cache.lastUpdate || new Date().toISOString();
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

  // Obtener todos los productos (desde XML procesado) CON PAGINACIÓN
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
          (p.descripcion && p.descripcion.toLowerCase().includes(searchLower))
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

  // Obtener productos con existencia (desde JSON procesado) CON PAGINACIÓN
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
        productos = productos.filter(p => 
          p.almacen === almacen || (p.almacenes && p.almacenes.some(a => a.codigo === almacen))
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
        data: resultados.slice(0, 100), // Limitar resultados de búsqueda
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
      const { incluirSinExistencia = false } = req.query;

      if (!codigo) {
        return res.status(400).json({
          success: false,
          error: 'Código de producto requerido',
          timestamp: new Date().toISOString()
        });
      }

      // Buscar primero en productos con existencia
      let producto = this.cache.existencias.find(p => 
        p.codigo === codigo || p.id === codigo
      );

      // Si no se encuentra y se permite incluir sin existencia, buscar en todos los productos
      if (!producto && incluirSinExistencia) {
        producto = this.cache.productos.find(p => 
          p.codigo === codigo || p.id === codigo
        );
      }

      if (!producto) {
        return res.status(404).json({
          success: false,
          error: 'Producto no encontrado',
          timestamp: new Date().toISOString()
        });
      }

      // Enriquecer con datos del otro conjunto si está disponible
      if ((producto.fuente === 'JSON' || !producto.fuente) && producto.codigo) {
        const productoCompleto = this.cache.productos.find(p => p.codigo === producto.codigo);
        if (productoCompleto) {
          producto = { ...productoCompleto, ...producto };
        }
      }

      res.json({
        success: true,
        data: producto,
        metadata: {
          encontradoEn: producto.fuente || 'cache',
          tieneExistencia: !!(producto.existencia || producto.existenciaTotal)
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

      res.json({
        success: true,
        data: {
          totals: {
            todos: totalProductos,
            conExistencia: totalConExistencia,
            sinExistencia: totalProductos - totalConExistencia,
            conPromocion,
            conImagen
          },
          categorias: {
            total: categorias.length,
            list: categorias.slice(0, 50)
          },
          marcas: {
            total: marcas.length,
            list: marcas.slice(0, 50)
          },
          actualizacion: this.cache.lastUpdate
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

  // Obtener categorías disponibles
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
            initialized: this.initialized
          },
          archivos: fileInfo.summary,
          salud: health
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