import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/AuthService';
import ordersService from '../api/ordersService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

const checkTokenValidity = (token) => {
  if (!token) {
    console.log('❌ No hay token para verificar');
    return false;
  }
  
  try {
    if (token.startsWith('demo-token-') || token.startsWith('social-token-') || token.startsWith('demo-jwt-token-')) {
      console.log('🔐 Token demo/social - considerado válido');
      return true;
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ Token no tiene formato JWT válido');
      return false;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    
    console.log('🔐 Token JWT Info:', {
      userId: payload.id,
      email: payload.email,
      expira: new Date(expirationTime).toLocaleString(),
      tiempoRestante: Math.round(timeUntilExpiration / 1000 / 60) + ' minutos',
      estaExpirado: timeUntilExpiration <= 0
    });
    
    return timeUntilExpiration > 300000;
  } catch (error) {
    console.error('❌ Error verificando token:', error);
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

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

  const logout = () => {
    console.log('🚪 Cerrando sesión para:', user?.email);
    setUser(null);
    setToken(null);
    localStorage.removeItem('lucesa-user');
    localStorage.removeItem('lucesa-token');
    localStorage.removeItem('guest_favorites');
    console.log('🧹 Sesión limpiada completamente');
  };

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

  // NUEVA FUNCIÓN: Obtener historial de órdenes
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

  // NUEVA FUNCIÓN: Obtener detalles de una orden específica
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (initialized) {
        checkAuth();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [initialized, user, token]);

  const value = {
    // Estado
    user,
    token,
    loading,
    
    // Acciones
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
    
    // Computados
    isAuthenticated: !!user && !!token && checkTokenValidity(token),
    isAdmin: user?.rol === 'admin',
    isUser: user?.rol === 'user' || !user?.rol,
  };

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