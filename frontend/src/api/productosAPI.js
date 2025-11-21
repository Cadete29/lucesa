/**
 * API Client para productos procesados desde FTP
 * Frontend - Compatible con Vite
 */
class ProductosAPI {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 
      (import.meta.env.PROD 
        ? 'https://tu-dominio.com/api'
        : 'http://localhost:4004/api');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/productos${endpoint}`;
    
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
    return this.request('/health');
  }

  // Obtener todos los productos
  async getTodosProductos(options = {}) {
    const { page = 1, limit = 50, categoria, marca, search } = options;
    const params = new URLSearchParams({
      page,
      limit,
      ...(categoria && { categoria }),
      ...(marca && { marca }),
      ...(search && { search })
    });
    
    return this.request(`/todos?${params}`);
  }

  // Obtener productos con existencia
  async getProductosConExistencia(options = {}) {
    const { page = 1, limit = 50, almacen, minExistencia = 1 } = options;
    const params = new URLSearchParams({
      page,
      limit,
      minExistencia,
      ...(almacen && { almacen })
    });
    
    return this.request(`/existencias?${params}`);
  }

  // Buscar productos
  async buscarProductos(termino, options = {}) {
    const { tipo = 'ambos', conExistencia = true } = options;
    const params = new URLSearchParams({
      q: termino,
      tipo,
      conExistencia
    });
    
    return this.request(`/buscar?${params}`);
  }

  // Obtener producto por código
  async getProductoPorCodigo(codigo, incluirSinExistencia = false) {
    const params = new URLSearchParams({
      incluirSinExistencia: incluirSinExistencia.toString()
    });
    
    return this.request(`/producto/${codigo}?${params}`);
  }

  // Obtener estadísticas
  async getEstadisticas() {
    return this.request('/estadisticas');
  }

  // Obtener categorías
  async getCategorias() {
    return this.request('/categorias');
  }

  // Obtener marcas
  async getMarcas() {
    return this.request('/marcas');
  }

  // Forzar actualización
  async actualizarDatos() {
    return this.request('/actualizar', { method: 'POST' });
  }
}

// Exportar la instancia por defecto
const productosAPI = new ProductosAPI();
export default productosAPI;