// src/services/authService.js

/**
 * Servicio para manejar todas las operaciones de autenticación
 */

// Configuración de URLs por entorno
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://lucesademexico-shop.com.mx/api'
  : 'http://localhost:4004/api';

// Helper para hacer requests a la API
const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Convertir body a JSON si es un objeto
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Mejor manejo de errores con mensajes específicos
      const errorMessage = data.message || `Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`Error en authService (${endpoint}):`, error);
    
    // Mejorar mensajes de error para el usuario
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión. Verifica tu internet o intenta más tarde.');
    }
    
    throw error;
  }
};

// Servicio de Autenticación
export const authService = {
  /**
   * Inicia sesión con email y contraseña
   */
  async login(email, password) {
    // Credenciales de demo para desarrollo
    if (email === 'demo@lucesa.com' && password === 'password') {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Login exitoso',
            data: {
              token: 'demo-jwt-token-' + Date.now(),
              user: {
                id: 1,
                username: 'demouser',
                email: 'demo@lucesa.com',
                nombre: 'Usuario Demo',
                rol: 'admin',
                foto_perfil: null,
                created_at: new Date().toISOString()
              }
            }
          });
        }, 1000);
      });
    }

    return await makeRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  },

  /**
   * Registra un nuevo usuario
   */
  async register(userData) {
    console.log('Enviando datos de registro al backend:', userData);
    
    // Demo automático para testing
    if (userData.email === 'demo@lucesa.com') {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Usuario creado correctamente',
            data: {
              user: {
                id: Date.now(),
                username: userData.username,
                email: userData.email,
                nombre: userData.nombre,
                rol: 'user',
                foto_perfil: null,
                created_at: new Date().toISOString()
              },
              token: `demo-token-${Date.now()}`
            }
          });
        }, 1000);
      });
    }

    return await makeRequest('/auth/register', {
      method: 'POST',
      body: userData
    });
  },

  /**
   * Solicita recuperación de contraseña
   */
  async forgotPassword(email) {
    // Demo para desarrollo
    if (email === 'demo@lucesa.com') {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Si el email existe, se ha enviado un enlace de recuperación',
            resetToken: 'demo-reset-token',
            resetLink: `${window.location.origin}/reset-password/demo-reset-token`
          });
        }, 1000);
      });
    }

    return await makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: { email }
    });
  },

  /**
   * Restablece la contraseña con token
   */
  async resetPassword(token, password) {
    return await makeRequest(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: { password }
    });
  },

  /**
   * Verifica si un token de reset es válido
   */
  async verifyResetToken(token) {
    return await makeRequest(`/auth/verify-reset-token/${token}`, {
      method: 'GET'
    });
  },

  /**
   * Obtiene el perfil del usuario autenticado
   */
  async getProfile(token) {
    return await makeRequest('/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  /**
   * Actualiza el perfil del usuario
   */
  async updateProfile(token, profileData) {
    return await makeRequest('/user/me', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: profileData
    });
  },

  /**
   * Elimina la cuenta del usuario
   */
  async deleteAccount(token) {
    return await makeRequest('/user/me', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

// Exportación por defecto
export default authService;