/**
 * Configuración para la conexión con CTOnline API
 * Contiene URLs, credenciales y límites de rate limiting
 */
const axios = require('axios');

const CTONLINE_CONFIG = {
  BASE_URL: 'http://connect.ctonline.mx:3001',
  AUTH: {
    usuario: 'ACX1110',
    password: 'STI250402494',
    email: 'luis.lucio@lucesademexico.com'
  },
  RATE_LIMITS: {
    promociones: 900000,     // 15 minutos en ms
    detalle: 1000,           // 1 segundo (60/min)
    promocionesCodigo: 600,  // 0.6 segundos (100/min)
    existencias: 500         // 0.5 segundos (120/min)
  },
  TOKEN_EXPIRY: 3600000      // 1 hora en ms
};

// Cliente HTTP configurado
const apiClient = axios.create({
  baseURL: CTONLINE_CONFIG.BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

module.exports = { CTONLINE_CONFIG, apiClient };