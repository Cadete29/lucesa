import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay usuario logueado al cargar la app
    const savedUser = localStorage.getItem('lucesa-user');
    const token = localStorage.getItem('lucesa-token');
    
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Simulación de API call - reemplaza con tu backend real
      const response = await mockLoginAPI(email, password);
      
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('lucesa-user', JSON.stringify(response.user));
        localStorage.setItem('lucesa-token', response.token);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await mockRegisterAPI(userData);
      
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('lucesa-user', JSON.stringify(response.user));
        localStorage.setItem('lucesa-token', response.token);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lucesa-user');
    localStorage.removeItem('lucesa-token');
  };

  const resetPassword = async (email) => {
    try {
      // Simulación de reset password
      await mockResetPasswordAPI(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al enviar email' };
    }
  };

  const socialLogin = async (provider) => {
    try {
      // Aquí integrarías con Firebase Auth o tu backend
      const response = await mockSocialLoginAPI(provider);
      
      if (response.success) {
        setUser(response.user);
        localStorage.setItem('lucesa-user', JSON.stringify(response.user));
        localStorage.setItem('lucesa-token', response.token);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      return { success: false, error: 'Error en login social' };
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    resetPassword,
    socialLogin,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Funciones mock - reemplaza con tus API calls reales
const mockLoginAPI = (email, password) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (email === 'usuario@ejemplo.com' && password === 'password') {
        resolve({
          success: true,
          user: {
            id: 1,
            name: 'Usuario Ejemplo',
            email: email
          },
          token: 'mock-jwt-token'
        });
      } else {
        resolve({
          success: false,
          error: 'Credenciales incorrectas'
        });
      }
    }, 1000);
  });
};

const mockRegisterAPI = (userData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        user: {
          id: Date.now(),
          name: userData.name,
          email: userData.email
        },
        token: 'mock-jwt-token'
      });
    }, 1000);
  });
};

const mockResetPasswordAPI = (email) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 1000);
  });
};

const mockSocialLoginAPI = (provider) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        user: {
          id: Date.now(),
          name: `Usuario ${provider}`,
          email: `usuario@${provider}.com`
        },
        token: 'mock-jwt-token'
      });
    }, 1000);
  });
};