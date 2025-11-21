/**
 * API Client para CTOnline - Frontend
 * Maneja todas las peticiones al backend para CTOnline
 * Compatible con Vite en desarrollo y producción
 */

class CTOnlineAPI {
  constructor() {
    // URL base dinámica para desarrollo y producción
    this.baseURL = import.meta.env.PROD 
      ? 'https://tu-dominio.com/api'  // URL de producción
      : 'http://localhost:4004/api';   // URL de desarrollo
    
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Método genérico para hacer peticiones HTTP
   * @param {string} endpoint - Endpoint de la API
   * @param {object} options - Opciones de fetch
   * @returns {Promise} Respuesta de la API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Maneja mensajes de error amigables
   * @param {Error} error - Error original
   * @returns {string} Mensaje de error amigable
   */
  getErrorMessage(error) {
    if (error.message.includes('Failed to fetch')) {
      return 'Error de conexión. Verifica tu internet o que el servidor esté funcionando.';
    }
    if (error.message.includes('404')) {
      return 'Recurso no encontrado.';
    }
    if (error.message.includes('500')) {
      return 'Error interno del servidor. Intenta más tarde.';
    }
    return error.message || 'Error desconocido en la petición.';
  }

  /**
   * Obtiene el estado de conexión con CTOnline
   * @returns {Promise} Estado de la conexión
   */
  async getStatus() {
    return this.request('/status');
  }

  /**
   * Obtiene todas las promociones
   * @returns {Promise} Lista de promociones
   */
  async getPromociones() {
    return this.request('/promociones');
  }

  /**
   * Obtiene existencias de productos
   * @returns {Promise} Lista de existencias
   */
  async getExistencias() {
    return this.request('/existencias');
  }

  /**
   * Obtiene lista de almacenes disponibles
   * @returns {Promise} Lista de almacenes
   */
  async getAlmacenes() {
    return this.request('/almacenes');
  }

  /**
   * Obtiene detalle de un producto específico
   * @param {string} codigo - Código del producto
   * @param {string} almacen - Código del almacén
   * @returns {Promise} Detalle del producto
   */
  async getDetalleProducto(codigo, almacen) {
    return this.request(`/producto/${codigo}/${almacen}`);
  }

  /**
   * Obtiene promociones por código de producto
   * @param {string} codigo - Código del producto
   * @returns {Promise} Promociones del producto
   */
  async getPromocionPorCodigo(codigo) {
    return this.request(`/promocion/${codigo}`);
  }

  /**
   * Busca productos por término
   * @param {string} termino - Término de búsqueda
   * @returns {Promise} Resultados de búsqueda
   */
  async buscarProductos(termino) {
    return this.request(`/buscar?q=${encodeURIComponent(termino)}`);
  }

  /**
   * Obtiene productos por categoría
   * @param {string} categoria - Categoría de productos
   * @returns {Promise} Productos de la categoría
   */
  async getProductosPorCategoria(categoria) {
    return this.request(`/categoria/${encodeURIComponent(categoria)}`);
  }

  /**
   * Obtiene todos los productos
   * @returns {Promise} Lista de productos
   */
  async getProductos() {
    return this.request('/productos');
  }

  /**
   * Obtiene todas las categorías
   * @returns {Promise} Lista de categorías
   */
  async getCategorias() {
    return this.request('/categorias');
  }

  /**
   * Obtiene productos destacados
   * @returns {Promise} Lista de productos destacados
   */
  async getProductosDestacados() {
    return this.request('/productos/destacados');
  }

  /**
   * Obtiene producto por ID
   * @param {string|number} id - ID del producto
   * @returns {Promise} Detalle del producto
   */
  async getProductoPorId(id) {
    return this.request(`/producto/${id}`);
  }
}

// Instancia única (Singleton)
const ctonlineAPI = new CTOnlineAPI();

export default ctonlineAPI;