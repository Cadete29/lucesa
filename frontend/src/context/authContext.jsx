// src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/authService';
import ordersService from '../api/ordersService';

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
   * Guarda una orden en el historial del usuario y en la base de datos
   */
  const saveOrderToHistory = async (orderData) => {
    try {
      if (!user || !token) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener la dirección de envío del usuario
      const shippingAddress = {
        nombre: user.nombre,
        email: user.email,
        username: user.username,
        // Puedes agregar más campos de dirección aquí según tu estructura
      };

      // Preparar datos para enviar al backend
      const orderToSave = {
        orderId: orderData.orderId,
        total: orderData.total,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        cartItems: orderData.cartItems,
        shippingAddress: shippingAddress
      };

      // Intentar guardar en la base de datos primero
      try {
        const response = await ordersService.saveOrder(token, orderToSave);
        
        if (response.success) {
          console.log('Orden guardada en base de datos:', response.order);
          
          // También mantener en localStorage para acceso inmediato
          const currentUser = JSON.parse(localStorage.getItem('lucesa-user') || '{}');
          const currentOrders = currentUser.orders || [];

          const newOrder = {
            id: response.order.id,
            order_number: response.order.order_number,
            date: new Date().toISOString(),
            items: orderData.cartItems || [],
            subtotal: orderData.subtotal || 0,
            tax: orderData.tax || 0,
            shipping: orderData.shipping || 0,
            total: orderData.total || 0,
            status: 'confirmed',
            items_details: response.order.items // Incluir detalles de la base de datos
          };

          const updatedOrders = [newOrder, ...currentOrders];
          const updatedUser = {
            ...currentUser,
            orders: updatedOrders
          };

          setUser(updatedUser);
          localStorage.setItem('lucesa-user', JSON.stringify(updatedUser));

          return { 
            success: true, 
            order: response.order,
            savedInDatabase: true 
          };
        } else {
          throw new Error(response.message);
        }
      } catch (dbError) {
        console.error('Error al guardar orden en base de datos:', dbError);
        // Continuar con el fallback a localStorage
        throw new Error('Error de conexión con la base de datos');
      }

    } catch (error) {
      console.error('Error al guardar orden:', error);
      
      // Fallback: guardar solo en localStorage si falla la base de datos
      const currentUser = JSON.parse(localStorage.getItem('lucesa-user') || '{}');
      const currentOrders = currentUser.orders || [];

      const newOrder = {
        id: orderData.orderId || Date.now(),
        order_number: orderData.orderId || `local-${Date.now()}`,
        date: new Date().toISOString(),
        items: orderData.cartItems || [],
        subtotal: orderData.subtotal || 0,
        tax: orderData.tax || 0,
        shipping: orderData.shipping || 0,
        total: orderData.total || 0,
        status: 'confirmed',
        shipping_address: {
          nombre: user?.nombre,
          email: user?.email,
          username: user?.username
        }
      };

      const updatedOrders = [newOrder, ...currentOrders];
      const updatedUser = {
        ...currentUser,
        orders: updatedOrders
      };

      setUser(updatedUser);
      localStorage.setItem('lucesa-user', JSON.stringify(updatedUser));

      return { 
        success: true, 
        order: newOrder,
        savedInDatabase: false,
        warning: 'Orden guardada localmente debido a error de conexión'
      };
    }
  };

  /**
   * Obtiene el historial de órdenes del usuario desde la base de datos
   */
  const getOrderHistory = async () => {
    try {
      if (!user || !token) {
        return [];
      }

      // Intentar obtener desde la base de datos
      try {
        const response = await ordersService.getOrderHistory(token);
        
        if (response.success) {
          // Actualizar localStorage con los datos más recientes
          const updatedUser = {
            ...user,
            orders: response.orders
          };
          
          setUser(updatedUser);
          localStorage.setItem('lucesa-user', JSON.stringify(updatedUser));
          
          return response.orders;
        }
      } catch (dbError) {
        console.error('Error al obtener historial desde BD:', dbError);
        // Continuar con el fallback a localStorage
      }

      // Fallback a localStorage
      return user.orders || [];

    } catch (error) {
      console.error('Error al obtener historial de órdenes:', error);
      return user?.orders || [];
    }
  };

  /**
   * Obtiene los detalles de una orden específica
   */
  const getOrderDetails = async (orderId) => {
    try {
      if (!user || !token) {
        throw new Error('Usuario no autenticado');
      }

      // Intentar obtener desde la base de datos
      try {
        const response = await ordersService.getOrderDetails(token, orderId);
        
        if (response.success) {
          return response.order;
        } else {
          throw new Error(response.message);
        }
      } catch (dbError) {
        console.error('Error al obtener orden desde BD:', dbError);
        // Buscar en localStorage como fallback
        const order = user.orders?.find(order => 
          order.id === orderId || order.order_number === orderId
        );
        
        if (order) {
          return order;
        } else {
          throw new Error('Orden no encontrada');
        }
      }

    } catch (error) {
      console.error('Error al obtener detalles de orden:', error);
      throw error;
    }
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

  /**
   * Sincroniza órdenes locales con la base de datos
   */
  const syncLocalOrders = async () => {
    try {
      if (!user || !token) return;

      const localOrders = user.orders || [];
      
      // Buscar órdenes que no estén en la base de datos
      const unsyncedOrders = localOrders.filter(order => 
        order.savedInDatabase === false || 
        order.id.toString().startsWith('local-')
      );

      if (unsyncedOrders.length === 0) return;

      console.log(`Sincronizando ${unsyncedOrders.length} órdenes locales...`);

      for (const order of unsyncedOrders) {
        try {
          const orderToSave = {
            orderId: order.order_number,
            total: order.total,
            subtotal: order.subtotal,
            tax: order.tax,
            shipping: order.shipping,
            cartItems: order.items,
            shippingAddress: order.shipping_address
          };

          const response = await ordersService.saveOrder(token, orderToSave);
          
          if (response.success) {
            console.log(`Orden ${order.order_number} sincronizada correctamente`);
            
            // Actualizar la orden local con el ID de la base de datos
            const updatedOrders = user.orders.map(localOrder => 
              localOrder.order_number === order.order_number 
                ? { ...localOrder, id: response.order.id, savedInDatabase: true }
                : localOrder
            );

            const updatedUser = { ...user, orders: updatedOrders };
            setUser(updatedUser);
            localStorage.setItem('lucesa-user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error(`Error sincronizando orden ${order.order_number}:`, error);
        }
      }
    } catch (error) {
      console.error('Error en sincronización de órdenes:', error);
    }
  };

  // Sincronizar órdenes locales cuando el usuario se autentica
  useEffect(() => {
    if (user && token) {
      syncLocalOrders();
    }
  }, [user, token]);

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
    getOrderDetails,
    syncLocalOrders,
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