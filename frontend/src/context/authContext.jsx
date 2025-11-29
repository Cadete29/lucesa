// src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/authService';

// Crear contexto de autenticación
const AuthContext = createContext();

/**
 * Hook personalizado para usar el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

/**
 * Proveedor de autenticación que envuelve la aplicación
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Cargar datos de autenticación desde localStorage al inicializar
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedUser = localStorage.getItem('lucesa-user');
        const savedToken = localStorage.getItem('lucesa-token');
        
        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        // Limpiar datos corruptos
        localStorage.removeItem('lucesa-user');
        localStorage.removeItem('lucesa-token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Inicia sesión con email y contraseña
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Credenciales demo con rol admin
      if (email === 'demo@lucesa.com' && password === 'password') {
        const demoUser = {
          id: 1,
          username: 'demo_admin',
          email: 'demo@lucesa.com',
          nombre: 'Administrador Demo',
          rol: 'admin',
          foto_perfil: null,
          created_at: new Date().toISOString(),
          orders: []
        };
        
        const demoToken = `demo-token-admin-${Date.now()}`;
        
        setUser(demoUser);
        setToken(demoToken);
        localStorage.setItem('lucesa-user', JSON.stringify(demoUser));
        localStorage.setItem('lucesa-token', demoToken);
        
        return { success: true };
      }
      
      // Login real con el backend
      const response = await authService.login(email, password);
      
      if (response.success) {
        const userData = response.data.user;
        const userToken = response.data.token;
        
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('lucesa-user', JSON.stringify(userData));
        localStorage.setItem('lucesa-token', userToken);
        
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registra un nuevo usuario
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      if (response.success) {
        const userData = response.data.user;
        const userToken = response.data.token;
        
        setUser(userData);
        setToken(userToken);
        localStorage.setItem('lucesa-user', JSON.stringify(userData));
        localStorage.setItem('lucesa-token', userToken);
        
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cierra la sesión del usuario
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('lucesa-user');
    localStorage.removeItem('lucesa-token');
  };

  /**
   * Solicita recuperación de contraseña
   */
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        return { 
          success: true, 
          message: response.message,
          ...(response.resetToken && { resetToken: response.resetToken }),
          ...(response.resetLink && { resetLink: response.resetLink })
        };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Restablece la contraseña con token
   */
  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      const response = await authService.resetPassword(token, newPassword);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifica si un token de reset es válido
   */
  const verifyResetToken = async (token) => {
    try {
      const response = await authService.verifyResetToken(token);
      return { 
        success: response.success, 
        valid: response.valid,
        message: response.message 
      };
    } catch (error) {
      return { 
        success: false, 
        valid: false, 
        error: error.message 
      };
    }
  };

  /**
   * Actualiza el perfil del usuario
   */
  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(token, profileData);
      
      if (response.success) {
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);
        localStorage.setItem('lucesa-user', JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Guarda una orden en el historial del usuario
   */
  const saveOrderToHistory = async (orderData) => {
    try {
      if (!user || !token) {
        throw new Error('Usuario no autenticado');
      }

      const currentUser = JSON.parse(localStorage.getItem('lucesa-user') || '{}');
      const currentOrders = currentUser.orders || [];

      const newOrder = {
        id: orderData.orderId || Date.now(),
        date: new Date().toISOString(),
        items: orderData.cartItems || [],
        subtotal: orderData.subtotal || 0,
        tax: orderData.tax || 0,
        shipping: orderData.shipping || 0,
        total: orderData.total || 0,
        status: 'confirmed'
      };

      const updatedOrders = [newOrder, ...currentOrders];

      const updatedUser = {
        ...currentUser,
        orders: updatedOrders
      };

      setUser(updatedUser);
      localStorage.setItem('lucesa-user', JSON.stringify(updatedUser));

      return { success: true, order: newOrder };
    } catch (error) {
      console.error('Error al guardar orden:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Obtiene el historial de órdenes del usuario
   */
  const getOrderHistory = () => {
    if (!user) return [];
    return user.orders || [];
  };

  /**
   * Simula login con redes sociales
   */
  const socialLogin = async (provider) => {
    try {
      setLoading(true);
      return new Promise((resolve) => {
        setTimeout(() => {
          const socialUser = {
            id: Date.now(),
            username: `user_${provider}`,
            email: `user_${provider}@example.com`,
            nombre: `Usuario ${provider}`,
            rol: 'user',
            foto_perfil: null,
            created_at: new Date().toISOString(),
            orders: []
          };
          
          const socialToken = `social-token-${provider}-${Date.now()}`;
          
          setUser(socialUser);
          setToken(socialToken);
          localStorage.setItem('lucesa-user', JSON.stringify(socialUser));
          localStorage.setItem('lucesa-token', socialToken);
          
          resolve({ success: true });
        }, 1500);
      });
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Valor del contexto
  const value = {
    user,
    token,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyResetToken,
    updateProfile,
    socialLogin,
    saveOrderToHistory,
    getOrderHistory,
    loading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.rol === 'admin',
    isUser: user?.rol === 'user' || !user?.rol // Por compatibilidad con usuarios sin rol
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;