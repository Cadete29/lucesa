import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/AuthService';
import ordersService from '../api/ordersService';

/**
 * AUTH CONTEXT
 * 
 * Contexto de autenticación para manejar estado de usuario, tokens y operaciones de auth.
 * Proporciona funciones para login, registro, logout, recuperación de contraseña,
 * verificación de tokens y gestión de sesiones persistente.
 * 
 * Características principales:
 * - Gestión completa del ciclo de autenticación
 * - Persistencia de sesión en localStorage
 * - Validación automática de tokens JWT
 * - Funciones para recuperación de contraseña
 * - Integración con servicio de órdenes
 * - Soporte para roles de usuario (admin/user)
 * - Intervalo de verificación de sesión
 * 
 * @context
 * @example
 * // Uso en el componente principal de la aplicación
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */

/**
 * Crea el contexto de autenticación
 * @type {React.Context}
 */
const AuthContext = createContext();

/**
 * Hook personalizado para acceder al contexto de autenticación
 * 
 * @function useAuth
 * @returns {Object} Todas las funciones y estados del contexto
 * @throws {Error} Si se usa fuera de un AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

/**
 * Verifica la validez de un token JWT o token de demostración
 * 
 * @function checkTokenValidity
 * @param {string} token - Token a verificar
 * @returns {boolean} True si el token es válido
 */
const checkTokenValidity = (token) => {
  if (!token) {
    console.log('❌ No hay token para verificar');
    return false;
  }
  
  try {
    // Tokens de demostración o sociales son siempre válidos
    if (token.startsWith('demo-token-') || token.startsWith('social-token-') || token.startsWith('demo-jwt-token-')) {
      console.log('🔐 Token demo/social - considerado válido');
      return true;
    }
    
    // Verificación de formato JWT estándar
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ Token no tiene formato JWT válido');
      return false;
    }
    
    // Decodificar payload del JWT
    const payload = JSON.parse(atob(parts[1]));
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    
    // Log para debugging
    console.log('🔐 Token JWT Info:', {
      userId: payload.id,
      email: payload.email,
      expira: new Date(expirationTime).toLocaleString(),
      tiempoRestante: Math.round(timeUntilExpiration / 1000 / 60) + ' minutos',
      estaExpirado: timeUntilExpiration <= 0
    });
    
    // Considerar válido si expira en más de 5 minutos
    return timeUntilExpiration > 300000;
  } catch (error) {
    console.error('❌ Error verificando token:', error);
    return false;
  }
};

/**
 * Proveedor del contexto de autenticación
 * 
 * @component AuthProvider
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export const AuthProvider = ({ children }) => {
  // ==========================================================================
  // ESTADOS DEL CONTEXTO
  // ==========================================================================
  
  /**
   * @state {Object|null} user - Datos del usuario autenticado
   */
  const [user, setUser] = useState(null);
  
  /**
   * @state {string|null} token - Token de autenticación JWT
   */
  const [token, setToken] = useState(null);
  
  /**
   * @state {boolean} loading - Estado de carga para operaciones asíncronas
   */
  const [loading, setLoading] = useState(true);
  
  /**
   * @state {boolean} initialized - Indica si el contexto se inicializó
   */
  const [initialized, setInitialized] = useState(false);

  // ==========================================================================
  // EFECTO: INICIALIZACIÓN DE AUTENTICACIÓN
  // ==========================================================================
  
  /**
   * Efecto para inicializar el estado de autenticación desde localStorage
   * 
   * @effect
   * @dependencies [initialized] - Se ejecuta solo una vez al montar
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 Inicializando autenticación...');
        const savedUser = localStorage.getItem('lucesa-user');
        const savedToken = localStorage.getItem('lucesa-token');
        
        console.log('📁 Datos encontrados en localStorage:', {
          savedUser: !!savedUser,
          savedToken: !!savedToken,
          savedUserContent: savedUser ? JSON.parse(savedUser) : 'No user data'
        });
        
        if (savedUser && savedToken) {
          console.log('🔍 Verificando token...');
          const isTokenValid = checkTokenValidity(savedToken);
          
          if (isTokenValid) {
            console.log('✅ Token válido encontrado, restaurando sesión');
            const userData = JSON.parse(savedUser);
            
            const userWithToken = {
              ...userData,
              token: savedToken
            };
            
            setUser(userWithToken);
            setToken(savedToken);
            
            console.log('👤 Usuario restaurado:', {
              id: userWithToken.id,
              email: userWithToken.email,
              nombre: userWithToken.nombre,
              rol: userWithToken.rol,
              tokenInUser: !!userWithToken.token
            });
          } else {
            console.log('❌ Token inválido o expirado, limpiando sesión');
            localStorage.removeItem('lucesa-user');
            localStorage.removeItem('lucesa-token');
            setUser(null);
            setToken(null);
          }
        } else {
          console.log('ℹ️ No hay datos de sesión guardados');
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('❌ Error inicializando autenticación:', error);
        localStorage.removeItem('lucesa-user');
        localStorage.removeItem('lucesa-token');
        setUser(null);
        setToken(null);
      } finally {
        console.log('🏁 AuthContext inicialización completada');
        setLoading(false);
        setInitialized(true);
      }
    };

    if (!initialized) {
      initializeAuth();
    }
  }, [initialized]);

  // ==========================================================================
  // FUNCIONES DE AUTENTICACIÓN
  // ==========================================================================
  
  /**
   * Inicia sesión con email y contraseña
   * 
   * @async
   * @function login
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('🔐 Iniciando sesión para:', email);
      
      const response = await authService.login(email, password);
      
      if (response.success) {
        const userData = response.data.user;
        const userToken = response.data.token;
        
        const userWithToken = {
          ...userData,
          token: userToken
        };
        
        console.log('✅ Login exitoso:', {
          usuario: userData.email,
          id: userData.id,
          rol: userData.rol,
          token: userToken ? `${userToken.substring(0, 20)}...` : 'No token'
        });
        
        setUser(userWithToken);
        setToken(userToken);
        
        localStorage.setItem('lucesa-user', JSON.stringify(userWithToken));
        localStorage.setItem('lucesa-token', userToken);
        
        return { success: true, user: userWithToken };
      } else {
        console.log('❌ Error en login:', response.message);
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Registra un nuevo usuario
   * 
   * @async
   * @function register
   * @param {Object} userData - Datos del nuevo usuario
   * @param {string} userData.email - Email del usuario
   * @param {string} userData.password - Contraseña del usuario
   * @param {string} userData.nombre - Nombre completo del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      console.log('📝 Registrando nuevo usuario:', userData.email);
      
      const response = await authService.register(userData);
      
      if (response.success) {
        const userDataFromResponse = response.data.user;
        const userToken = response.data.token;
        
        const userWithToken = {
          ...userDataFromResponse,
          token: userToken
        };
        
        console.log('✅ Registro exitoso:', {
          usuario: userDataFromResponse.email,
          id: userDataFromResponse.id,
          token: userToken ? `${userToken.substring(0, 20)}...` : 'No token'
        });
        
        setUser(userWithToken);
        setToken(userToken);
        localStorage.setItem('lucesa-user', JSON.stringify(userWithToken));
        localStorage.setItem('lucesa-token', userToken);
        
        return { success: true, user: userWithToken };
      } else {
        console.log('❌ Error en registro:', response.message);
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('❌ Error en registro:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cierra la sesión del usuario actual
   * 
   * @function logout
   */
  const logout = () => {
    console.log('🚪 Cerrando sesión para:', user?.email);
    setUser(null);
    setToken(null);
    localStorage.removeItem('lucesa-user');
    localStorage.removeItem('lucesa-token');
    localStorage.removeItem('guest_favorites');
    console.log('🧹 Sesión limpiada completamente');
  };

  /**
   * Verifica el estado de autenticación actual
   * 
   * @function checkAuth
   * @returns {boolean} True si el usuario está autenticado
   */
  const checkAuth = () => {
    try {
      const savedUser = localStorage.getItem('lucesa-user');
      const savedToken = localStorage.getItem('lucesa-token');
      
      console.log('🔍 Verificando autenticación...', {
        savedUser: !!savedUser,
        savedToken: !!savedToken
      });
      
      if (savedUser && savedToken && checkTokenValidity(savedToken)) {
        if (!user || !token) {
          console.log('🔄 Restaurando sesión desde checkAuth');
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setToken(savedToken);
        }
        return true;
      } else {
        if (user || token) {
          console.log('🔄 Limpiando sesión inválida desde checkAuth');
          logout();
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Error en checkAuth:', error);
      return false;
    }
  };

  /**
   * Actualiza el perfil del usuario actual
   * 
   * @async
   * @function updateProfile
   * @param {Object} profileData - Datos del perfil a actualizar
   * @returns {Promise<Object>} Resultado de la operación
   */
  const updateProfile = async (profileData) => {
    try {
      console.log('📝 Actualizando perfil para:', user?.email);
      const response = await authService.updateProfile(token, profileData);
      
      if (response.success) {
        const updatedUser = { 
          ...user, 
          ...response.data.user,
          token: user.token
        };
        
        setUser(updatedUser);
        localStorage.setItem('lucesa-user', JSON.stringify(updatedUser));
        console.log('✅ Perfil actualizado correctamente');
        return { success: true, user: updatedUser };
      } else {
        console.log('❌ Error actualizando perfil:', response.message);
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('❌ Error en updateProfile:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Solicita recuperación de contraseña
   * 
   * @async
   * @function forgotPassword
   * @param {string} email - Email del usuario que olvidó la contraseña
   * @returns {Promise<Object>} Resultado de la operación
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
   * Restablece la contraseña usando un token de recuperación
   * 
   * @async
   * @function resetPassword
   * @param {string} token - Token de recuperación de contraseña
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<Object>} Resultado de la operación
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
   * Verifica la validez de un token de recuperación de contraseña
   * 
   * @async
   * @function verifyResetToken
   * @param {string} token - Token de recuperación a verificar
   * @returns {Promise<Object>} Resultado de la verificación
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

  // ==========================================================================
  // FUNCIONES DE GESTIÓN DE ÓRDENES
  // ==========================================================================
  
  /**
   * Obtiene el historial de órdenes del usuario actual
   * 
   * @async
   * @function getOrderHistory
   * @returns {Promise<Array>} Lista de órdenes del usuario
   */
  const getOrderHistory = async () => {
    try {
      console.log('📦 Obteniendo historial de órdenes...');
      
      if (!token) {
        console.log('❌ No hay token disponible');
        return user?.orders || [];
      }
      
      const response = await ordersService.getOrderHistory(token);
      
      if (response.success) {
        console.log(`✅ ${response.orders?.length || 0} órdenes obtenidas`);
        
        // Formatear las órdenes para compatibilidad con el frontend
        const formattedOrders = response.orders.map(order => ({
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          total: order.total_amount || order.total,
          total_amount: order.total_amount,
          subtotal: order.subtotal,
          tax_amount: order.tax_amount,
          shipping_amount: order.shipping_amount,
          created_at: order.created_at,
          order_date: order.order_date || order.created_at,
          items: order.items || order.items_details || [],
          items_details: order.items || order.items_details || [],
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          shipping_address: order.shipping_address || {}
        }));
        
        return formattedOrders;
      } else {
        console.log('❌ Error obteniendo historial:', response.message);
        return user?.orders || [];
      }
    } catch (error) {
      console.error('❌ Error en getOrderHistory:', error);
      return user?.orders || [];
    }
  };

  /**
   * Obtiene los detalles de una orden específica
   * 
   * @async
   * @function getOrderDetails
   * @param {string} orderId - ID de la orden a consultar
   * @returns {Promise<Object>} Detalles completos de la orden
   */
  const getOrderDetails = async (orderId) => {
    try {
      console.log('🔍 Obteniendo detalles de orden:', orderId);
      
      if (!token) {
        throw new Error('No autenticado');
      }
      
      const response = await ordersService.getOrderDetails(token, orderId);
      
      if (response.success) {
        console.log('✅ Detalles de orden obtenidos:', response.order.order_number);
        
        // Formatear para compatibilidad
        const order = response.order;
        return {
          ...order,
          items: order.items || order.items_details || [],
          items_details: order.items || order.items_details || [],
          total: order.total_amount || order.total
        };
      } else {
        throw new Error(response.message || 'Error obteniendo detalles');
      }
    } catch (error) {
      console.error('❌ Error en getOrderDetails:', error);
      throw error;
    }
  };

  // ==========================================================================
  // EFECTO: VERIFICACIÓN PERIÓDICA DE AUTENTICACIÓN
  // ==========================================================================
  
  /**
   * Efecto para verificar periódicamente la autenticación
   * Se ejecuta cada 30 segundos cuando el contexto está inicializado
   * 
   * @effect
   * @dependencies [initialized, user, token] - Dependencias del efecto
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (initialized) {
        checkAuth();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [initialized, user, token]);

  // ==========================================================================
  // VALOR DEL CONTEXTO
  // ==========================================================================
  
  /**
   * Objeto que contiene todos los valores y funciones del contexto
   * @type {Object}
   */
  const value = {
    // Estado
    user,
    token,
    loading,
    
    // Acciones de autenticación
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyResetToken,
    updateProfile,
    checkAuth,
    
    // Métodos de órdenes
    getOrderHistory,
    getOrderDetails,
    
    // Computados (getters)
    isAuthenticated: !!user && !!token && checkTokenValidity(token),
    isAdmin: user?.rol === 'admin',
    isUser: user?.rol === 'user' || !user?.rol,
  };

  // Log del estado actual para debugging
  console.log('🔐 AuthContext State:', {
    user: user ? {
      email: user.email,
      id: user.id,
      hasToken: !!user.token
    } : null,
    token: token ? `${token.substring(0, 20)}...` : 'No token',
    isAuthenticated: value.isAuthenticated,
    loading,
    initialized
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;