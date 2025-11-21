/**
 * Servicio para manejar todas las operaciones con CTOnline API
 * Incluye autenticación, rate limiting y manejo de errores
 */
const { CTONLINE_CONFIG, apiClient } = require('../config/ctonline');
const logger = require('../utils/logger');

class CTOnlineService {
  constructor() {
    this.authToken = null;
    this.lastTokenTime = null;
    this.lastRequestTime = {};
    this.initRateLimiting();
  }

  initRateLimiting() {
    Object.keys(CTONLINE_CONFIG.RATE_LIMITS).forEach(endpoint => {
      this.lastRequestTime[endpoint] = 0;
    });
  }

  async checkRateLimit(endpointType) {
    const limit = CTONLINE_CONFIG.RATE_LIMITS[endpointType];
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime[endpointType];

    if (timeSinceLastRequest < limit) {
      const waitTime = limit - timeSinceLastRequest;
      logger.info(`Rate limiting: esperando ${waitTime}ms para ${endpointType}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime[endpointType] = Date.now();
  }

  async authenticate() {
    try {
      logger.info('Autenticando con CTOnline...');
      const response = await apiClient.post('/auth/login', CTONLINE_CONFIG.AUTH);

      if (response.data?.token) {
        this.authToken = response.data.token;
        this.lastTokenTime = Date.now();
        logger.info('Autenticación exitosa');
        return this.authToken;
      }
      throw new Error('No se recibió token');
    } catch (error) {
      logger.error('Error en autenticación:', error.response?.data || error.message);
      throw error;
    }
  }

  async ensureAuthenticated() {
    const isExpired = !this.lastTokenTime || 
                     (Date.now() - this.lastTokenTime) > CTONLINE_CONFIG.TOKEN_EXPIRY;
    
    if (isExpired || !this.authToken) {
      await this.authenticate();
    }
    return this.authToken;
  }

  async makeRequest(method, endpoint, data = null, endpointType = 'existencias') {
    await this.checkRateLimit(endpointType);
    const token = await this.ensureAuthenticated();

    const config = {
      method,
      url: endpoint,
      headers: { 'Authorization': `Bearer ${token}` }
    };

    if (data) config.data = data;

    try {
      const response = await apiClient(config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        logger.info('Token expirado, reautenticando...');
        await this.authenticate();
        return this.makeRequest(method, endpoint, data, endpointType);
      }
      throw error;
    }
  }

  // Métodos específicos de la API
  async getPromociones() {
    return this.makeRequest('get', '/promociones', null, 'promociones');
  }

  async getDetalleProducto(codigo, almacen) {
    return this.makeRequest('get', `/detalle/${codigo}/${almacen}`, null, 'detalle');
  }

  async getPromocionesPorCodigo(codigo) {
    return this.makeRequest('get', `/promociones/${codigo}`, null, 'promocionesCodigo');
  }

  async getExistencias() {
    return this.makeRequest('get', '/existencias', null, 'existencias');
  }

  async getAlmacenes() {
    return this.makeRequest('get', '/almacenes', null, 'existencias');
  }
}

module.exports = new CTOnlineService();