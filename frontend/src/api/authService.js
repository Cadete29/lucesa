// src/services/authService.js

// ✅ Configuración de URLs por entorno
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api'
  : 'http://localhost:4004/api';

// Helper para hacer requests
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
      throw new Error(data.message || 'Error en la petición');
    }

    return data;
  } catch (error) {
    console.error('Error en authService:', error);
    throw error;
  }
};

// Servicio de Autenticación
export const authService = {
  // Login con credenciales
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

  // Registro de usuario
  async register(userData) {
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
                foto_perfil: null,
                created_at: new Date().toISOString()
              }
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

  // Recuperación de contraseña
  async forgotPassword(email) {
    // Demo para desarrollo
    if (email === 'demo@lucesa.com') {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            success: true,
            message: 'Se ha enviado un email con las instrucciones para resetear tu contraseña'
          });
        }, 1000);
      });
    }

    return await makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: { email }
    });
  },

  // Reset de contraseña con token
  async resetPassword(token, newPassword) {
    return await makeRequest('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword }
    });
  },

  // Verificar token de reset
  async verifyResetToken(token) {
    return await makeRequest(`/auth/verify-reset-token/${token}`, {
      method: 'GET'
    });
  },

  // Obtener perfil del usuario (protegido)
  async getProfile(token) {
    return await makeRequest('/user/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Actualizar perfil (protegido)
  async updateProfile(token, profileData) {
    return await makeRequest('/user/me', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: profileData
    });
  },

  // Eliminar cuenta (protegido)
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