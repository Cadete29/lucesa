// src/services/ordersService.js

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api'
  : 'http://localhost:4004/api';

const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`Error en ordersService (${endpoint}):`, error);
    throw error;
  }
};

export const ordersService = {
  /**
   * Guarda una orden completa en la base de datos
   */
  async saveOrder(token, orderData) {
    return await makeRequest('/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: orderData
    });
  },

  /**
   * Obtiene el historial de órdenes del usuario
   */
  async getOrderHistory(token) {
    return await makeRequest('/orders/history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  /**
   * Obtiene los detalles de una orden específica
   */
  async getOrderDetails(token, orderId) {
    return await makeRequest(`/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

export default ordersService;