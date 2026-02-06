/**
 * API Client para productos procesados desde FTP
 * Frontend - Compatible con Vite
 */
class ProductosAPI {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 
      (import.meta.env.PROD 
        ? 'https://lucesademexico-shop.com.mx/api'
        : 'http://localhost:4004/api');
    
    console.log('🔄 ProductosAPI configurado con baseURL:', this.baseURL);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log('📡 ProductosAPI Request:', {
      method: options.method || 'GET',
      url,
      endpoint,
      timestamp: new Date().toISOString()
    });

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);
      
      // Log de la respuesta
      console.log('📡 ProductosAPI Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        endpoint
      });

      if (!response.ok) {
        // Si es 404, intentar determinar si es un ID interno
        if (response.status === 404) {
          const urlParts = endpoint.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          
          // Verificar si es un ID interno (json_, xml_)
          if (lastPart && (lastPart.startsWith('json_') || lastPart.startsWith('xml_') || lastPart.startsWith('prod_'))) {
            console.warn('⚠️ ProductosAPI - Se intentó buscar con ID interno:', lastPart);
            throw new Error(`ID interno detectado: ${lastPart}. Se necesita el código del producto.`);
          }
        }
        
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ ProductosAPI Response OK:', {
        endpoint,
        success: data.success,
        dataExists: !!data.data
      });
      
      return data;
    } catch (error) {
      console.error('❌ ProductosAPI Request failed:', {
        endpoint,
        error: error.message,
        url,
        timestamp: new Date().toISOString()
      });
      
      // Si es un error de ID interno, proporcionar un mensaje más claro
      if (error.message.includes('ID interno detectado')) {
        throw new Error(error.message);
      }
      
      throw new Error(this.getErrorMessage(error));
    }
  }

  getErrorMessage(error) {
    if (error.message.includes('Failed to fetch')) {
      return 'Error de conexión con el servidor. Verifica que el backend esté funcionando.';
    }
    if (error.message.includes('404')) {
      return 'Recurso no encontrado. Verifica que el código del producto sea correcto.';
    }
    if (error.message.includes('500')) {
      return 'Error interno del servidor. Intenta más tarde.';
    }
    if (error.message.includes('ID interno detectado')) {
      return error.message;
    }
    return error.message || 'Error desconocido en la petición.';
  }

  // ✅ MÉTODO MEJORADO: Producto por código (con manejo de IDs internos)
  async getProductoPorCodigo(codigo, options = {}) {
    // Verificar si es un ID interno
    if (codigo && (codigo.startsWith('json_') || codigo.startsWith('xml_') || codigo.startsWith('prod_'))) {
      console.warn('⚠️ getProductoPorCodigo - ID interno recibido:', codigo);
      
      // Intentar encontrar el código real
      try {
        console.log('🔍 Buscando código real para ID interno:', codigo);
        
        // Primero buscar en productos existentes
        const productos = await this.getProductosUnificados({ limit: 10000 });
        if (productos.success && productos.data) {
          const producto = productos.data.find(p => p.id === codigo);
          if (producto && producto.codigo && producto.codigo !== 'N/A') {
            console.log('✅ Encontrado código real:', producto.codigo);
            return this.getProductoPorCodigo(producto.codigo, options);
          }
        }
        
        throw new Error(`No se encontró el código real para el ID interno: ${codigo}`);
      } catch (error) {
        console.error('❌ Error buscando código real:', error);
        throw new Error(`ID interno no válido: ${codigo}. Se necesita el código del producto.`);
      }
    }
    
    const { incluirSinExistencia = false, fusionar = true } = options;
    const params = new URLSearchParams({
      incluirSinExistencia: incluirSinExistencia.toString(),
      fusionar: fusionar.toString()
    });
    
    return this.request(`/productos/producto/${codigo}?${params}`);
  }

  // ✅ MÉTODO MEJORADO: Producto combinado (con manejo de IDs internos)
  async getProductoCombinado(codigo) {
    // Verificar si es un ID interno
    if (codigo && (codigo.startsWith('json_') || codigo.startsWith('xml_') || codigo.startsWith('prod_'))) {
      console.warn('⚠️ getProductoCombinado - ID interno recibido:', codigo);
      
      try {
        // Buscar el código real
        console.log('🔍 Buscando código real para ID interno:', codigo);
        
        // Opción 1: Buscar en productos existentes
        const productos = await this.getProductosUnificados({ limit: 10000 });
        if (productos.success && productos.data) {
          const producto = productos.data.find(p => p.id === codigo);
          if (producto && producto.codigo && producto.codigo !== 'N/A') {
            console.log('✅ Encontrado código real:', producto.codigo);
            return this.request(`/productos/combinado/${producto.codigo}`);
          }
        }
        
        // Opción 2: Buscar en ambos endpoints
        try {
          const todosProductos = await this.getTodosProductos({ limit: 10000 });
          if (todosProductos.success && todosProductos.data) {
            const producto = todosProductos.data.find(p => p.id === codigo);
            if (producto && producto.codigo && producto.codigo !== 'N/A') {
              console.log('✅ Encontrado código real en todos los productos:', producto.codigo);
              return this.request(`/productos/combinado/${producto.codigo}`);
            }
          }
        } catch (error) {
          console.log('ℹ️ No se pudo buscar en todos los productos:', error.message);
        }
        
        throw new Error(`No se encontró el código real para el ID interno: ${codigo}`);
      } catch (error) {
        console.error('❌ Error buscando código real:', error);
        throw new Error(`ID interno no válido: ${codigo}. Se necesita el código del producto.`);
      }
    }
    
    // Si es un código válido, proceder normalmente
    return this.request(`/productos/combinado/${codigo}`);
  }

  // ✅ Alias para getProductoCombinado (recomendado)
  async getProductoUnificado(codigo) {
    return this.getProductoCombinado(codigo);
  }

  // ✅ MÉTODO AUXILIAR: Buscar producto por ID interno
  async findProductByInternalId(internalId) {
    console.log('🔍 Buscando producto por ID interno:', internalId);
    
    try {
      // Buscar en productos unificados
      const productos = await this.getProductosUnificados({ limit: 10000 });
      if (productos.success && productos.data) {
        const producto = productos.data.find(p => p.id === internalId);
        if (producto) {
          console.log('✅ Producto encontrado por ID interno:', {
            id: producto.id,
            codigo: producto.codigo,
            nombre: producto.nombre
          });
          return producto;
        }
      }
      
      // Buscar en todos los productos
      const todosProductos = await this.getTodosProductos({ limit: 10000 });
      if (todosProductos.success && todosProductos.data) {
        const producto = todosProductos.data.find(p => p.id === internalId);
        if (producto) {
          console.log('✅ Producto encontrado en todos los productos:', {
            id: producto.id,
            codigo: producto.codigo,
            nombre: producto.nombre
          });
          return producto;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error buscando por ID interno:', error);
      return null;
    }
  }

  // ✅ MÉTODO AUXILIAR: Convertir ID interno a código
  async convertInternalIdToCode(internalId) {
    const producto = await this.findProductByInternalId(internalId);
    if (producto && producto.codigo && producto.codigo !== 'N/A') {
      return producto.codigo;
    }
    return null;
  }

  // Resto de los métodos permanecen igual...
  // ... (todos los demás métodos sin cambios)

  // ====================
  // CATEGORÍAS DINÁMICAS
  // ====================

  // Obtener categorías dinámicas del backend
  async getCategoriasDinamicas(options = {}) {
    const { ordenar = 'alfabetico', minProductos = 1 } = options;
    const params = new URLSearchParams({
      ordenar,
      minProductos: minProductos.toString()
    });
    
    return this.request(`/productos/categorias-completas?${params}`);
  }

  // Obtener categorías actualizadas automáticamente (recomendado)
  async getCategoriasActualizadas() {
    try {
      const result = await this.getCategoriasDinamicas({ 
        ordenar: 'alfabetico',
        minProductos: 1 
      });
      
      // Normalizar respuesta
      if (result.success && result.data) {
        return {
          ...result,
          data: result.data.map(categoria => ({
            ...categoria,
            descripcion: this.getDescripcionCategoria(categoria.nombre),
            color: this.getColorCategoria(categoria.nombre),
            ruta: `/products?category=${categoria.id}&categoryName=${encodeURIComponent(categoria.nombre)}`
          }))
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error obteniendo categorías actualizadas:', error);
      throw error;
    }
  }

  // Helper para descripciones de categoría
  getDescripcionCategoria(nombre) {
    const descripciones = {
      'Consumibles': 'Materiales de oficina, tecnología y uso diario esencial',
      'Ensamble': 'Componentes para armar computadoras y equipos tecnológicos',
      'Cables': 'Cables USB, HDMI, red, alimentación y todo tipo de conectores',
      'Accesorios Gaming': 'Equipos especializados para gaming: mouse, teclados, headsets',
      'Video Vigilancia': 'Sistemas completos de CCTV y seguridad visual',
      'Accesorios para Componentes': 'Complementos para componentes de computadora',
      'Red Activa': 'Routers, switches, firewalls y equipos de networking',
      'Accesorios para Electronica': 'Componentes y herramientas para proyectos electrónicos',
      'Accesorios para Cómputo': 'Accesorios esenciales para computación y oficina',
      'Electrónica': 'Componentes electrónicos y equipos especializados',
      'Respaldo y Regulación': 'Sistemas UPS, reguladores y protección de energía',
      'Perifericos para POS': 'Equipos especializados para sistemas Point of Sale',
      'Computadoras': 'Computadoras de escritorio, todo-en-uno y equipos completos',
      'Almacenamiento Portatil': 'Discos duros externos y unidades portátiles',
      'Tóners': 'Tóners y cartuchos de impresión para todas las marcas',
      'No Breaks y UPS': 'Sistemas de energía ininterrumpida y respaldo',
      'Impresión': 'Impresoras, plotters y equipos de impresión profesional',
      'Red Pasiva': 'Cables, conectores, racks e infraestructura de red',
      'Audio': 'Bocinas, audífonos, micrófonos y sistemas de sonido',
      'Telefonía y Video Vigilancia': 'Sistemas integrados de comunicación y seguridad',
      'Almacenamiento': 'Discos duros, SSDs y unidades de almacenamiento',
      'Periféricos': 'Mouse, teclados, monitores y accesorios para computadora',
      'Software': 'Programas y aplicaciones para diversos usos',
      'Networking': 'Equipos y accesorios para redes informáticas',
      'Componentes': 'Partes individuales para ensamblar equipos',
      'Monitores': 'Pantallas y displays para computación',
      'Laptops': 'Computadoras portátiles y notebooks',
      'Tablets': 'Dispositivos tablet y accesorios',
      'Impresoras': 'Equipos de impresión de todas las marcas',
      'Servidores': 'Equipos de servidor y racks'
    };
    
    return descripciones[nombre] || `Productos de ${nombre} - Calidad y variedad para tus necesidades`;
  }

  // Helper para colores de categoría
  getColorCategoria(nombre) {
    const colors = [
      '#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f56565',
      '#38b2ac', '#ecc94b', '#667eea', '#ed64a6', '#4fd1c7',
      '#fc8181', '#68d391', '#f6ad55', '#d69e2e', '#63b3ed',
      '#b794f4', '#f687b3', '#4c51bf', '#3182ce', '#38a169',
      '#805ad5', '#e53e3e', '#dd6b20', '#0bc5ea', '#00b5d8'
    ];
    
    if (!nombre) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  // ====================
  // HEALTH & DIAGNÓSTICO
  // ====================

  // Health check del servicio de productos
  async getHealth() {
    return this.request('/productos/health');
  }

  // Diagnóstico de producto específico
  async getDiagnosticoProducto(codigo) {
    return this.request(`/productos/diagnostico/${codigo}`);
  }

  // ====================
  // CATEGORÍAS Y MARCAS (COMPATIBILIDAD)
  // ====================

  // Obtener categorías disponibles (método legacy)
  async getCategorias() {
    return this.request('/productos/categorias');
  }

  // Obtener marcas disponibles
  async getMarcas() {
    return this.request('/productos/marcas');
  }

  // ====================
  // LISTADOS PAGINADOS
  // ====================

  // Obtener todos los productos (desde XML - puede no tener existencia)
  async getTodosProductos(options = {}) {
    const { page = 1, limit = 50, categoria, marca, search } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(categoria && { categoria }),
      ...(marca && { marca }),
      ...(search && { search })
    });
    
    return this.request(`/productos/todos?${params}`);
  }

  // Obtener productos con existencia (desde JSON - siempre tiene stock)
  async getProductosConExistencia(options = {}) {
    const { page = 1, limit = 50, almacen, minExistencia = 1 } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      minExistencia: minExistencia.toString(),
      ...(almacen && { almacen })
    });
    
    return this.request(`/productos/existencias?${params}`);
  }

  // Productos con existencia normalizados (alias)
  async getProductosUnificados(options = {}) {
    const result = await this.getProductosConExistencia(options);
    
    // Normalizar existencia en la respuesta
    if (result.success && result.data) {
      result.data = result.data.map(producto => this.normalizarProducto(producto));
    }
    
    return result;
  }

  // ====================
  // BÚSQUEDA Y FILTROS
  // ====================

  // Buscar productos en ambos conjuntos
  async buscarProductos(termino, options = {}) {
    const { tipo = 'ambos', conExistencia = true } = options;
    const params = new URLSearchParams({
      q: termino,
      tipo,
      conExistencia: conExistencia.toString()
    });
    
    return this.request(`/productos/buscar?${params}`);
  }

  // ====================
  // ESTADÍSTICAS
  // ====================

  // Obtener estadísticas del catálogo
  async getEstadisticas() {
    return this.request('/productos/estadisticas');
  }

  // ====================
  // ADMINISTRACIÓN
  // ====================

  // Forzar actualización de datos
  async actualizarDatos() {
    return this.request('/productos/actualizar', { method: 'POST' });
  }

  // ====================
  // MÉTODOS DE CONVENIENCIA
  // ====================

  // Helper para normalizar producto
  normalizarProducto(producto) {
    if (!producto) return producto;
    
    const existencia = producto.existencia || producto.existenciaTotal || 0;
    const existenciaTotal = producto.existenciaTotal || producto.existencia || 0;
    
    return {
      ...producto,
      existencia,
      existenciaTotal,
      disponible: existencia > 0,
      tieneExistencia: existencia > 0,
      stock: existencia,
      // Información adicional
      sinStock: existencia === 0,
      stockBajo: existencia > 0 && existencia <= 5,
      stockSuficiente: existencia > 5,
      // Información de precios
      precioOriginal: producto.precio,
      precioFinal: producto.precioPromocion > 0 ? producto.precioPromocion : producto.precio,
      tienePromocion: producto.precioPromocion > 0,
      porcentajeDescuento: producto.precioPromocion > 0 && producto.precio > 0 
        ? Math.round((1 - producto.precioPromocion / producto.precio) * 100) 
        : 0
    };
  }

  // Normalizar array de productos
  normalizarProductos(productos = []) {
    if (!Array.isArray(productos)) return [];
    return productos.map(producto => this.normalizarProducto(producto));
  }

  // ====================
  // MÉTODOS PARA UI
  // ====================

  // Productos destacados
  async getProductosDestacados(limit = 12) {
    return this.getProductosUnificados({
      page: 1,
      limit,
      minExistencia: 1
    });
  }

  // Productos en promoción
  async getProductosEnPromocion(limit = 20) {
    const result = await this.getProductosUnificados({
      page: 1,
      limit: 100 // Obtener más para filtrar
    });
    
    if (result.success && result.data) {
      const productosPromocion = result.data.filter(
        producto => producto.precioPromocion && producto.precioPromocion > 0
      ).slice(0, limit);
      
      return {
        ...result,
        data: productosPromocion,
        pagination: {
          ...result.pagination,
          total: productosPromocion.length,
          pages: 1
        }
      };
    }
    
    return result;
  }

  // Productos por categoría
  async getProductosPorCategoria(categoria, options = {}) {
    return this.getProductosUnificados({
      categoria,
      ...options
    });
  }

  // Productos por marca
  async getProductosPorMarca(marca, options = {}) {
    return this.getProductosUnificados({
      marca,
      ...options
    });
  }

  // Búsqueda rápida
  async buscarRapido(termino, limit = 10) {
    return this.buscarProductos(termino, {
      tipo: 'existencias',
      conExistencia: true
    }).then(result => {
      if (result.success && result.data) {
        return {
          ...result,
          data: result.data.slice(0, limit)
        };
      }
      return result;
    });
  }

  // ====================
  // MÉTODOS AUXILIARES
  // ====================

  // Obtener categorías con productos (método mejorado)
  async getCategoriasConProductos() {
    try {
      const [categoriasResult, productosResult] = await Promise.all([
        this.getCategoriasDinamicas(),
        this.getProductosUnificados({ page: 1, limit: 10000 })
      ]);

      if (categoriasResult.success && productosResult.success) {
        const categoriasConConteo = categoriasResult.data.map(categoria => {
          const productosEnCategoria = productosResult.data.filter(
            producto => producto.categoria === categoria.nombre
          );
          
          return {
            ...categoria,
            productosCount: productosEnCategoria.length,
            productosConStock: productosEnCategoria.filter(p => p.tieneExistencia).length
          };
        }).filter(cat => cat.productosCount > 0);

        return {
          success: true,
          data: categoriasConConteo,
          metadata: {
            totalCategorias: categoriasConConteo.length,
            totalProductos: productosResult.data.length
          }
        };
      }

      return categoriasResult;
    } catch (error) {
      console.error('Error obteniendo categorías con productos:', error);
      throw error;
    }
  }

  // Obtener marcas con productos
  async getMarcasConProductos() {
    try {
      const [marcasResult, productosResult] = await Promise.all([
        this.getMarcas(),
        this.getProductosUnificados({ page: 1, limit: 10000 })
      ]);

      if (marcasResult.success && productosResult.success) {
        const marcasConConteo = marcasResult.data.map(marca => {
          const productosEnMarca = productosResult.data.filter(
            producto => producto.marca && producto.marca.toLowerCase() === marca.toLowerCase()
          );
          
          return {
            nombre: marca,
            productosCount: productosEnMarca.length,
            productosConStock: productosEnMarca.filter(p => p.tieneExistencia).length
          };
        }).filter(marca => marca.productosCount > 0);

        return {
          success: true,
          data: marcasConConteo,
          metadata: {
            totalMarcas: marcasConConteo.length,
            totalProductos: productosResult.data.length
          }
        };
      }

      return marcasResult;
    } catch (error) {
      console.error('Error obteniendo marcas con productos:', error);
      throw error;
    }
  }

  // Verificar estado del servicio
  async checkServiceStatus() {
    try {
      const health = await this.getHealth();
      return {
        online: health.success,
        message: health.success ? 'Servicio funcionando correctamente' : 'Problemas con el servicio',
        lastUpdate: health.data?.cache?.ultimaActualizacion,
        data: {
          productos: health.data?.cache?.productos,
          existencias: health.data?.cache?.existencias
        }
      };
    } catch (error) {
      return {
        online: false,
        message: 'Error de conexión con el servidor',
        error: error.message
      };
    }
  }
}

// Exportar la instancia por defecto
const productosAPI = new ProductosAPI();
export default productosAPI;