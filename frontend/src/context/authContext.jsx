import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../api/authService'; // Importación corregida

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
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Verificar si hay usuario logueado al cargar la app
    const savedUser = localStorage.getItem('lucesa-user');
    const savedToken = localStorage.getItem('lucesa-token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
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

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      if (response.success) {
        const userData = response.data.user;
        const userToken = response.data?.token || `demo-token-${Date.now()}`;
        
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

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('lucesa-user');
    localStorage.removeItem('lucesa-token');
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const response = await authService.forgotPassword(email);
      
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
      return { success: response.success, valid: response.valid };
    } catch (error) {
      return { success: false, valid: false, error: error.message };
    }
  };

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
    loading,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};