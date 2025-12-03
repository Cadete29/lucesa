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

  console.log(`🌐 API Request: ${url}`, {
    method: config.method,
    hasBody: !!config.body,
    hasAuth: !!config.headers?.Authorization
  });

  try {
    const response = await fetch(url, config);
    
    console.log(`📥 API Response Status: ${response.status}`);
    
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('❌ Error parseando JSON:', jsonError);
      throw new Error(`Invalid JSON response: ${response.status}`);
    }

    if (!response.ok) {
      console.error(`❌ API Error ${response.status}:`, data);
      const errorMessage = data.message || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    console.log(`✅ API Success:`, {
      success: data.success,
      count: data.count || data.orders?.length
    });

    return data;
  } catch (error) {
    console.error(`❌ Error en ordersService (${endpoint}):`, error);
    throw error;
  }
};

export const ordersService = {
  /**
   * Guarda una orden completa en la base de datos
   */
  async saveOrder(token, orderData) {
    console.log('🔄 Enviando orden al backend para que genere número LUCESA');
    console.log('📦 Datos enviados:', { 
      subtotal: orderData.subtotal,
      total: orderData.total,
      itemsCount: orderData.cartItems?.length || 0
    });
    
    const { orderId, ...dataForBackend } = orderData;
    
    if (orderId) {
      console.log('⚠️ Removiendo orderId del frontend:', orderId);
    }
    
    return await makeRequest('/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: dataForBackend
    });
  },

  /**
   * Obtiene el historial de órdenes del usuario
   */
  async getOrderHistory(token) {
    console.log('📋 Obteniendo historial de órdenes para el usuario');
    
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
    console.log(`🔍 Obteniendo detalles de orden ID: ${orderId}`);
    
    return await makeRequest(`/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

export default ordersService;