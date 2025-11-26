/**
 * API Client para productos procesados desde FTP
 * Frontend - Compatible con Vite
 */
class ProductosAPI {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 
      (import.meta.env.PROD 
        ? 'https://testpaginaweb.shop/api'
        : 'http://localhost:4004/api');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      };

      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ProductosAPI Request failed:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  getErrorMessage(error) {
    if (error.message.includes('Failed to fetch')) {
      return 'Error de conexión con el servidor. Verifica que el backend esté funcionando.';
    }
    if (error.message.includes('404')) {
      return 'Recurso no encontrado.';
    }
    if (error.message.includes('500')) {
      return 'Error interno del servidor. Intenta más tarde.';
    }
    return error.message || 'Error desconocido en la petición.';
  }

  // Health check
  async getHealth() {
    return this.request('/productos/health');
  }

  // Obtener todos los productos CON PAGINACIÓN (desde XML - puede no tener existencia)
  async getTodosProductos(options = {}) {
    const { page = 1, limit = 50, categoria, marca, search } = options;
    const params = new URLSearchParams({
      page,
      limit,
      ...(categoria && { categoria }),
      ...(marca && { marca }),
      ...(search && { search })
    });
    
    return this.request(`/productos/todos?${params}`);
  }

  // Obtener productos con existencia CON PAGINACIÓN (desde JSON - siempre tiene existencia)
  async getProductosConExistencia(options = {}) {
    const { page = 1, limit = 50, almacen, minExistencia = 0 } = options;
    const params = new URLSearchParams({
      page,
      limit,
      minExistencia: minExistencia.toString(),
      ...(almacen && { almacen })
    });
    
    return this.request(`/productos/existencias?${params}`);
  }

  // NUEVO: Obtener productos unificados (con existencia normalizada)
  async getProductosUnificados(options = {}) {
    const { page = 1, limit = 50, categoria, marca, search, minExistencia = 0 } = options;
    const params = new URLSearchParams({
      page,
      limit,
      minExistencia: minExistencia.toString(),
      ...(categoria && { categoria }),
      ...(marca && { marca }),
      ...(search && { search })
    });
    
    const result = await this.request(`/productos/existencias?${params}`);
    
    // Normalizar la existencia en la respuesta
    if (result.success && result.data) {
      result.data = result.data.map(producto => this.normalizarProducto(producto));
    }
    
    return result;
  }

  // Buscar productos
  async buscarProductos(termino, options = {}) {
    const { tipo = 'ambos', conExistencia = true } = options;
    const params = new URLSearchParams({
      q: termino,
      tipo,
      conExistencia
    });
    
    const result = await this.request(`/productos/buscar?${params}`);
    
    // Normalizar existencia en búsquedas
    if (result.success && result.data) {
      result.data = result.data.map(producto => this.normalizarProducto(producto));
    }
    
    return result;
  }

  // Obtener producto por código
  async getProductoPorCodigo(codigo, incluirSinExistencia = false) {
    const params = new URLSearchParams({
      incluirSinExistencia: incluirSinExistencia.toString()
    });
    
    const result = await this.request(`/productos/producto/${codigo}?${params}`);
    
    // Normalizar existencia
    if (result.success && result.data) {
      result.data = this.normalizarProducto(result.data);
    }
    
    return result;
  }

  // Obtener producto unificado (siempre con existencia normalizada)
  async getProductoUnificado(codigo) {
    const result = await this.getProductoPorCodigo(codigo, true);
    
    if (result.success && result.data) {
      result.data = this.normalizarProducto(result.data);
    }
    
    return result;
  }

  // Obtener estadísticas
  async getEstadisticas() {
    return this.request('/productos/estadisticas');
  }

  // Obtener categorías (original)
  async getCategorias() {
    return this.request('/categorias');
  }

  // Obtener categorías REALES
  async getCategoriasReales() {
    return this.request('/categorias/reales');
  }

  // Obtener categorías con estadísticas
  async getCategoriasConEstadisticas() {
    return this.request('/categorias/estadisticas');
  }

  // Obtener marcas
  async getMarcas() {
    return this.request('/productos/marcas');
  }

  // Forzar actualización
  async actualizarDatos() {
    return this.request('/productos/actualizar', { method: 'POST' });
  }

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
      stock: existencia
    };
  }
}

// Exportar la instancia por defecto
const productosAPI = new ProductosAPI();
export default productosAPI;