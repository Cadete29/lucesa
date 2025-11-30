// src/services/paymentService.js

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api'
  : 'http://localhost:4004/api';

const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // OBTENER EL TOKEN CORRECTAMENTE
  const token = localStorage.getItem('lucesa-token');

  console.log('TOKEN GUARDADO EN localStorage:', token);
  console.log('¿El token existe?', !!token);
  if (token) {
    console.log('Primeros 20 caracteres del token:', token.substring(0, 20) + '...');
    console.log('Longitud del token:', token.length);
  }

  const config = {
    headers: {
      'Content-Type': 'application/json',
      // ✅ AÑADIR EL HEADER DE AUTORIZACIÓN SI HAY TOKEN
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    console.log('📤 Enviando petición a:', url);
    console.log('🔑 Con headers:', config.headers);
    
    const response = await fetch(url, config);
    
    console.log('📥 Respuesta recibida - Status:', response.status);
    
    // ✅ MEJOR MANEJO DE ERRORES
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Token inválido o expirado');
      }
      if (response.status === 401) {
        throw new Error('No autorizado - token requerido');
      }
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error(`Error en paymentService (${endpoint}):`, error);
    throw error;
  }
};

export const paymentService = {
  async createCheckout(cartItems, shippingAddress, customerInfo) {
    return await makeRequest('/payments/create-checkout', {
      method: 'POST',
      body: {
        cartItems,
        shippingAddress,
        customerInfo
      }
    });
  }
};

export default paymentService;