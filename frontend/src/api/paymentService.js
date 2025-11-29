// src/services/paymentService.js

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api'
  : 'http://localhost:4004/api';

const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  // AQUÍ ESTABA EL ERROR → el token no se enviaba
  const token = localStorage.getItem('lucesa-token');


// LOGS PARA VER QUÉ ESTÁ PASANDO
  console.log('TOKEN GUARDADO EN localStorage:', token);
  console.log('¿El token existe?', !!token);
  if (token) {
    console.log('Primeros 20 caracteres del token:', token.substring(0, 20) + '...');
    console.log('Longitud del token:', token.length);
  }





  const config = {
    headers: {
      'Content-Type': 'application/json',
      // ESTO ES LO QUE FALTABA:
      ...(token && { 'Authorization': `Bearer ${token}` }),
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
      const errorMessage = data.message || `Error ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`Error en paymentService (${endpoint}):`, error);
    throw error; // Lo lanzamos para que el componente lo agarre con try/catch
  }
};

export const paymentService = {
  /**
   * Crea la orden + preferencia de Mercado Pago y devuelve el link de pago
   * @param {string} token - JWT del usuario
   * @param {Array} cartItems - items del carrito (con codigo, nombre, precioFinal/precio, quantity, marca...)
   * @param {Object} shippingAddress - { address, city, state, zipCode }
   * @param {Object} customerInfo - { firstName, lastName, email, phone }
   * @returns {Object { payment_url, order_number }
   */
  async createCheckout(token, cartItems, shippingAddress, customerInfo) {
    return await makeRequest('/payments/create-checkout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: {
        cartItems,
        shippingAddress,
        customerInfo
      }
    });
  }
};

export default paymentService;