// src/context/FavoritesContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Crear el contexto
const FavoritesContext = createContext();

// Hook personalizado para usar el contexto
export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites debe ser usado dentro de un FavoritesProvider');
  }
  return context;
};

// Configuración de API
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api'
  : 'http://localhost:4004/api';

// Función para verificar validez del token
const checkTokenValidity = (token) => {
  if (!token) {
    console.log('❌ No hay token disponible');
    return false;
  }
  
  try {
    // Verificar si es un token demo (no JWT)
    if (token.startsWith('demo-token-') || token.startsWith('social-token-')) {
      console.log('🔐 Token demo/social - considerado válido');
      return true;
    }
    
    // Decodificar el token JWT sin verificar (solo para ver la expiración)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convertir a milisegundos
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    
    console.log('🔐 Token JWT Info:', {
      userId: payload.id,
      email: payload.email,
      expira: new Date(expirationTime).toLocaleString(),
      tiempoRestante: Math.round(timeUntilExpiration / 1000 / 60) + ' minutos',
      estaExpirado: timeUntilExpiration <= 0
    });
    
    return timeUntilExpiration > 0;
  } catch (error) {
    console.error('❌ Error decodificando token:', error);
    return false;
  }
};

// Servicio de API para favoritos
const favoritesApi = {
  // Obtener favoritos del usuario
  async getUserFavorites(userId, token) {
    console.log('📡 GET Favorites - Usuario:', userId);
    
    // Verificar token antes de hacer la petición
    if (!checkTokenValidity(token)) {
      throw new Error('Token inválido o expirado');
    }

    const response = await fetch(`${API_BASE_URL}/favorites`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status} al obtener favoritos`);
    }

    const result = await response.json();
    console.log('📡 GET Favorites Response:', result);
    
    if (result.success) {
      return result.data.favorites || [];
    } else {
      throw new Error(result.message || 'Error al obtener favoritos');
    }
  },

  // Agregar a favoritos
  async addToFavorites(userId, product, token) {
    console.log('📡 POST Favorite - Producto:', product.id, product.nombre);
    
    // Verificar token antes de hacer la petición
    if (!checkTokenValidity(token)) {
      throw new Error('Token inválido o expirado');
    }

    const response = await fetch(`${API_BASE_URL}/favorites/${product.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(product)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Error ${response.status} al agregar a favoritos`);
    }

    const result = await response.json();
    console.log('📡 POST Favorite Response:', result);
    
    if (!result.success) {
      throw new Error(result.message || 'Error al agregar a favoritos');
    }

    return result.data;
  },

  // Eliminar de favoritos
  async removeFromFavorites(userId, productId, token) {
    console.log('📡 DELETE Favorite - Product ID:', productId);
    
    // Verificar token antes de hacer la petición
    if (!checkTokenValidity(token)) {
      throw new Error('Token inválido o expirado');
    }

    const response = await fetch(`${API_BASE_URL}/favorites/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status} al eliminar de favoritos`);
    }

    const result = await response.json();
    console.log('📡 DELETE Favorite Response:', result);
    
    if (!result.success) {
      throw new Error(result.message || 'Error al eliminar de favoritos');
    }

    return result.data;
  },

  // Verificar si un producto está en favoritos
  async checkIsFavorite(userId, productId, token) {
    console.log('📡 CHECK Favorite - Product ID:', productId);
    
    // Verificar token antes de hacer la petición
    if (!checkTokenValidity(token)) {
      throw new Error('Token inválido o expirado');
    }

    const response = await fetch(`${API_BASE_URL}/favorites/check/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status} al verificar favorito`);
    }

    const result = await response.json();
    console.log('📡 CHECK Favorite Response:', result);
    
    if (result.success) {
      return result.data.is_favorite;
    } else {
      throw new Error(result.message || 'Error al verificar favorito');
    }
  },

  // Limpiar todos los favoritos
  async clearAllFavorites(userId, token) {
    console.log('📡 CLEAR ALL Favorites');
    
    // Verificar token antes de hacer la petición
    if (!checkTokenValidity(token)) {
      throw new Error('Token inválido o expirado');
    }

    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status} al limpiar favoritos`);
    }

    const result = await response.json();
    console.log('📡 CLEAR ALL Favorites Response:', result);
    
    if (!result.success) {
      throw new Error(result.message || 'Error al limpiar favoritos');
    }

    return result.data;
  },

  // Almacenamiento local para usuarios no autenticados
  storage: {
    getGuestFavorites() {
      try {
        const stored = localStorage.getItem('guest_favorites');
        const favorites = stored ? JSON.parse(stored) : [];
        console.log('💾 GET Guest Favorites:', favorites.length);
        return favorites;
      } catch (error) {
        console.error('Error al obtener favoritos locales:', error);
        return [];
      }
    },

    setGuestFavorites(favorites) {
      try {
        console.log('💾 SET Guest Favorites:', favorites.length);
        localStorage.setItem('guest_favorites', JSON.stringify(favorites));
      } catch (error) {
        console.error('Error al guardar favoritos locales:', error);
      }
    },

    removeGuestFavorites() {
      try {
        console.log('💾 REMOVE Guest Favorites');
        localStorage.removeItem('guest_favorites');
      } catch (error) {
        console.error('Error al eliminar favoritos locales:', error);
      }
    }
  },

  // Debug helper
  debug: {
    logEnvironment() {
      console.log('🎯 FavoritesContext - Entorno:', {
        NODE_ENV: process.env.NODE_ENV,
        API_BASE_URL,
        isProduction: process.env.NODE_ENV === 'production'
      });
    }
  }
};

// Proveedor del contexto
export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { user, isAuthenticated, logout, checkAuth, loading: authLoading, token: authToken } = useAuth();

  // Función temporal para debug
  const debugUserState = () => {
    console.log('🐛 DEBUG User State:', {
      user: user ? {
        id: user.id,
        email: user.email,
        hasToken: !!user.token,
        token: user.token ? `${user.token.substring(0, 20)}...` : 'No token in user'
      } : 'No user',
      authToken: authToken ? `${authToken.substring(0, 20)}...` : 'No authToken',
      isAuthenticated,
      loading: authLoading
    });
  };

  console.log('🔄 FavoritesProvider Render - Estado:', {
    favoritesCount: favorites.length,
    isAuthenticated,
    user: user ? `Usuario: ${user.email}` : 'No user',
    userId: user?.id,
    userToken: user?.token ? `${user.token.substring(0, 20)}...` : 'No token in user',
    authToken: authToken ? `${authToken.substring(0, 20)}...` : 'No authToken',
    loading,
    syncing,
    authLoading
  });

  // Debug: mostrar entorno actual
  useEffect(() => {
    console.log('🚀 FavoritesProvider Montado');
    favoritesApi.debug.logEnvironment();
    debugUserState();
  }, []);

  // Cargar favoritos al cambiar el estado de autenticación - CORREGIDO
  useEffect(() => {
    console.log('🔄 FavoritesContext - Cambio en autenticación:', { 
      isAuthenticated, 
      user: user?.email,
      userId: user?.id,
      userToken: user?.token ? 'Presente' : 'Faltante',
      authToken: authToken ? 'Presente' : 'Faltante',
      authLoading
    });
    
    debugUserState();
    
    // Esperar a que AuthContext termine de cargar
    if (authLoading) {
      console.log('⏳ AuthContext aún cargando...');
      return;
    }
    
    // Usar authToken directamente (más confiable)
    const effectiveToken = authToken || user?.token;
    
    if (isAuthenticated && user && user.id && effectiveToken) {
      console.log('✅ Usuario autenticado, cargando favoritos del servidor...', {
        userId: user.id,
        tokenSource: authToken ? 'authToken' : 'user.token',
        tokenPreview: effectiveToken.substring(0, 20) + '...'
      });
      loadUserFavorites();
    } else {
      // Cargar favoritos locales para usuarios no autenticados
      const guestFavorites = favoritesApi.storage.getGuestFavorites();
      console.log('👤 Usuario no autenticado, cargando favoritos guest:', guestFavorites.length, {
        razon: !isAuthenticated ? 'No autenticado' : 
               !user ? 'No user' : 
               !user.id ? 'No user.id' : 
               !effectiveToken ? 'No token' : 'Otra razón'
      });
      setFavorites(guestFavorites);
    }
  }, [user, isAuthenticated, authLoading, authToken]);

  // Cargar favoritos del usuario desde el servidor - MEJORADO
  const loadUserFavorites = async () => {
    // Usar authToken directamente (más confiable)
    const effectiveToken = authToken || user?.token;
    
    // Verificaciones más robustas
    if (!user?.id || !effectiveToken) {
      console.log('❌ No hay usuario o token para cargar favoritos:', {
        userId: user?.id,
        hasUserToken: !!user?.token,
        hasAuthToken: !!authToken,
        effectiveToken: !!effectiveToken,
        userEmail: user?.email
      });
      return;
    }
    
    // Verificar autenticación antes de cargar
    if (!isAuthenticated) {
      console.log('❌ Usuario no autenticado, no se pueden cargar favoritos');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔄 Cargando favoritos del usuario...', { 
        userId: user.id, 
        email: user.email,
        tokenSource: authToken ? 'authToken' : 'user.token',
        tokenPreview: effectiveToken.substring(0, 20) + '...'
      });
      
      const userFavorites = await favoritesApi.getUserFavorites(user.id, effectiveToken);
      console.log('✅ Favoritos cargados del servidor:', userFavorites.length);
      setFavorites(userFavorites);
    } catch (error) {
      console.error('❌ Error cargando favoritos:', error);
      
      // Manejo mejorado de errores
      if (error.message.includes('403') || error.message.includes('Token') || error.message.includes('autenticación')) {
        console.log('🔐 Error de autenticación detectado al cargar favoritos');
        
        // Forzar verificación de autenticación
        if (checkAuth && !checkAuth()) {
          console.log('🔄 Autenticación inválida confirmada, limpiando estado');
          setFavorites([]);
          return;
        }
      }
      
      // Fallback a favoritos locales en caso de error
      const guestFavorites = favoritesApi.storage.getGuestFavorites();
      console.log('🔄 Fallback a favoritos locales:', guestFavorites.length);
      setFavorites(guestFavorites);
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar favoritos locales con el servidor al iniciar sesión - MEJORADO
  const syncLocalFavorites = async () => {
    // Usar authToken directamente (más confiable)
    const effectiveToken = authToken || user?.token;
    
    // Verificaciones más estrictas
    if (!user?.id || !effectiveToken || !isAuthenticated || authLoading) {
      console.log('❌ No se puede sincronizar - condiciones no cumplidas:', {
        hasUserId: !!user?.id,
        hasUserToken: !!user?.token,
        hasAuthToken: !!authToken,
        effectiveToken: !!effectiveToken,
        isAuthenticated,
        authLoading
      });
      return;
    }
    
    const guestFavorites = favoritesApi.storage.getGuestFavorites();
    console.log('🔄 Sincronizando favoritos locales...', {
      guestCount: guestFavorites.length,
      userId: user.id,
      tokenSource: authToken ? 'authToken' : 'user.token'
    });

    if (guestFavorites.length > 0) {
      try {
        setSyncing(true);
        
        // Agregar cada favorito local al servidor
        let syncedCount = 0;
        let errors = [];
        
        for (const product of guestFavorites) {
          try {
            await favoritesApi.addToFavorites(user.id, product, effectiveToken);
            console.log('✅ Sincronizado:', product.nombre);
            syncedCount++;
          } catch (error) {
            console.warn('⚠️ No se pudo sincronizar:', product.nombre, error.message);
            errors.push({ product: product.nombre, error: error.message });
          }
        }
        
        // Limpiar favoritos locales después de sincronizar (solo los exitosos)
        if (syncedCount > 0) {
          favoritesApi.storage.removeGuestFavorites();
        }
        
        // Recargar favoritos del servidor
        await loadUserFavorites();
        
        console.log(`✅ Sincronización completada: ${syncedCount}/${guestFavorites.length} productos sincronizados`);
        if (errors.length > 0) {
          console.warn('⚠️ Errores durante sincronización:', errors);
        }
      } catch (error) {
        console.error('❌ Error en sincronización:', error);
      } finally {
        setSyncing(false);
      }
    } else {
      console.log('ℹ️ No hay favoritos locales para sincronizar');
    }
  };

  // Sincronizar al iniciar sesión - MEJORADO
  useEffect(() => {
    // Usar authToken directamente (más confiable)
    const effectiveToken = authToken || user?.token;
    
    if (isAuthenticated && user && user.id && effectiveToken && !authLoading) {
      console.log('🔄 Iniciando sincronización al login...', {
        userId: user.id,
        guestFavoritesCount: favoritesApi.storage.getGuestFavorites().length,
        tokenSource: authToken ? 'authToken' : 'user.token'
      });
      
      // Pequeño delay para asegurar que todo esté cargado
      const syncTimer = setTimeout(() => {
        syncLocalFavorites();
      }, 1000);
      
      return () => clearTimeout(syncTimer);
    }
  }, [isAuthenticated, user, authLoading, authToken]);

  // Manejar error de autenticación
  const handleAuthError = (error) => {
    console.log('🔐 Error de autenticación detectado en FavoritesContext:', error.message);
    
    // Verificar autenticación actual
    if (checkAuth && !checkAuth()) {
      console.log('🔄 Autenticación inválida confirmada, procediendo con logout...');
      
      // Limpiar datos de sesión
      localStorage.removeItem('lucesa-token');
      localStorage.removeItem('lucesa-user');
      
      // Si hay función logout, usarla
      if (logout) {
        logout();
      }
      
      // Limpiar favoritos del estado
      setFavorites([]);
      
      // Redirigir a login
      const currentPath = window.location.pathname;
      setTimeout(() => {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }, 1000);
      
      throw new Error('Tu sesión ha expirado. Serás redirigido para iniciar sesión nuevamente.');
    } else {
      console.log('ℹ️ La autenticación parece válida, puede ser un error temporal');
      throw new Error('Error temporal de autenticación. Por favor, intenta nuevamente.');
    }
  };

  // Agregar a favoritos
  const addToFavorites = async (product) => {
    if (!product || !product.id) {
      console.error('❌ Producto inválido:', product);
      throw new Error('Producto inválido');
    }

    // Usar authToken directamente (más confiable)
    const effectiveToken = authToken || user?.token;

    console.log('❤️ AGREGAR FAVORITO - Iniciando:', {
      producto: product.nombre,
      id: product.id,
      usuario: user?.email || 'guest',
      isAuthenticated,
      userToken: user?.token ? 'Presente' : 'Faltante',
      authToken: authToken ? 'Presente' : 'Faltante',
      effectiveToken: effectiveToken ? 'Presente' : 'Faltante',
      userId: user?.id
    });

    try {
      // Verificar autenticación antes de proceder - VERIFICACIÓN MEJORADA
      if (isAuthenticated && user && user.id && effectiveToken) {
        // Verificar token válido
        if (!checkTokenValidity(effectiveToken)) {
          console.log('❌ Token inválido, forzando re-autenticación');
          return handleAuthError(new Error('Token inválido o expirado'));
        }

        // Usuario autenticado - guardar en servidor
        console.log('🔐 Usuario autenticado - guardando en servidor', {
          userId: user.id,
          productId: product.id,
          tokenSource: authToken ? 'authToken' : 'user.token',
          tokenPreview: effectiveToken.substring(0, 20) + '...'
        });
        
        const result = await favoritesApi.addToFavorites(user.id, product, effectiveToken);
        console.log('✅ Agregado a favoritos en servidor:', result);
        
        // Actualizar estado local
        setFavorites(prev => {
          const alreadyExists = prev.some(item => item.id === product.id);
          if (alreadyExists) {
            console.log('ℹ️ Producto ya estaba en favoritos locales');
            return prev;
          }
          const newFavorites = [...prev, product];
          console.log('🔄 Estado local actualizado:', newFavorites.length);
          return newFavorites;
        });
      } else {
        // Usuario no autenticado - guardar localmente
        console.log('👤 Usuario guest - guardando localmente. Razón:', {
          isAuthenticated,
          hasUser: !!user,
          hasUserId: !!user?.id,
          hasUserToken: !!user?.token,
          hasAuthToken: !!authToken,
          hasEffectiveToken: !!effectiveToken
        });
        const updatedFavorites = [...favorites, product];
        setFavorites(updatedFavorites);
        favoritesApi.storage.setGuestFavorites(updatedFavorites);
        console.log('✅ Agregado a favoritos locales');
      }
    } catch (error) {
      console.error('❌ Error agregando favorito:', error);
      
      // Si es error de autenticación, manejar específicamente
      if (error.message.includes('403') || error.message.includes('Token') || error.message.includes('autenticación') || error.message.includes('sesión')) {
        return handleAuthError(error);
      }
      
      throw error;
    }
  };

  // Eliminar de favoritos
  const removeFromFavorites = async (productId) => {
    console.log('🗑️ ELIMINAR FAVORITO - Iniciando:', {
      productId,
      usuario: user?.email || 'guest',
      isAuthenticated
    });

    // Usar authToken directamente (más confiable)
    const effectiveToken = authToken || user?.token;

    try {
      if (isAuthenticated && user && user.id && effectiveToken) {
        // Verificar token válido
        if (!checkTokenValidity(effectiveToken)) {
          console.log('❌ Token inválido, forzando re-autenticación');
          return handleAuthError(new Error('Token inválido o expirado'));
        }

        // Usuario autenticado - eliminar del servidor
        console.log('🔐 Usuario autenticado - eliminando del servidor', {
          tokenSource: authToken ? 'authToken' : 'user.token'
        });
        await favoritesApi.removeFromFavorites(user.id, productId, effectiveToken);
        console.log('✅ Eliminado de favoritos en servidor');
      } else {
        // Usuario no autenticado - eliminar localmente
        console.log('👤 Usuario guest - eliminando localmente');
        favoritesApi.storage.setGuestFavorites(
          favorites.filter(item => item.id !== productId)
        );
        console.log('✅ Eliminado de favoritos locales');
      }

      // Actualizar estado local
      setFavorites(prev => {
        const newFavorites = prev.filter(item => item.id !== productId);
        console.log('🔄 Estado local actualizado:', newFavorites.length);
        return newFavorites;
      });
    } catch (error) {
      console.error('❌ Error eliminando favorito:', error);
      
      // Si es error de autenticación, manejar específicamente
      if (error.message.includes('403') || error.message.includes('Token') || error.message.includes('autenticación') || error.message.includes('sesión')) {
        return handleAuthError(error);
      }
      
      throw error;
    }
  };

  // Toggle favorito
  const toggleFavorite = async (product) => {
    if (!product || !product.id) {
      console.error('❌ Producto inválido para toggle:', product);
      return;
    }

    const isCurrentlyFavorite = favorites.some(fav => fav.id === product.id);
    console.log(`🔄 TOGGLE FAVORITO - Iniciando:`, {
      producto: product.nombre,
      id: product.id,
      actualmenteFavorito: isCurrentlyFavorite,
      totalFavoritos: favorites.length,
      usuario: user?.email || 'guest',
      isAuthenticated
    });
    
    try {
      if (isCurrentlyFavorite) {
        console.log('➖ Removiendo de favoritos...');
        await removeFromFavorites(product.id);
      } else {
        console.log('➕ Agregando a favoritos...');
        await addToFavorites(product);
      }
      
      console.log('✅ Toggle completado exitosamente');
    } catch (error) {
      console.error('❌ Error en toggleFavorite:', error);
      throw error;
    }
  };

  // Limpiar todos los favoritos
  const clearFavorites = async () => {
    console.log('🧹 LIMPIAR FAVORITOS - Iniciando');

    // Usar authToken directamente (más confiable)
    const effectiveToken = authToken || user?.token;

    try {
      if (isAuthenticated && user && user.id && effectiveToken) {
        // Verificar token válido
        if (!checkTokenValidity(effectiveToken)) {
          console.log('❌ Token inválido, forzando re-autenticación');
          return handleAuthError(new Error('Token inválido o expirado'));
        }

        // Usuario autenticado - limpiar en servidor
        console.log('🔐 Usuario autenticado - limpiando en servidor', {
          tokenSource: authToken ? 'authToken' : 'user.token'
        });
        const result = await favoritesApi.clearAllFavorites(user.id, effectiveToken);
        console.log('✅ Favoritos limpiados en servidor:', result);
      } else {
        // Usuario no autenticado - limpiar localmente
        console.log('👤 Usuario guest - limpiando localmente');
        favoritesApi.storage.removeGuestFavorites();
        console.log('✅ Favoritos locales limpiados');
      }

      setFavorites([]);
      console.log('🔄 Estado local limpiado');
    } catch (error) {
      console.error('❌ Error limpiando favoritos:', error);
      throw error;
    }
  };

  // Verificar si un producto está en favoritos
  const isFavorite = (productId) => {
    const result = favorites.some(item => item.id === productId);
    console.log(`🔍 isFavorite Check: ${productId} -> ${result} (Total: ${favorites.length})`);
    return result;
  };

  // Obtener cantidad de favoritos
  const favoritesCount = favorites.length;

  // Obtener favoritos por categoría
  const getFavoritesByCategory = (category) => {
    return favorites.filter(item => 
      item.categoria === category || item.subcategoria === category
    );
  };

  // Buscar en favoritos
  const searchFavorites = (searchTerm) => {
    if (!searchTerm) return favorites;
    
    const term = searchTerm.toLowerCase();
    return favorites.filter(item =>
      item.nombre?.toLowerCase().includes(term) ||
      item.marca?.toLowerCase().includes(term) ||
      item.descripcion?.toLowerCase().includes(term) ||
      item.codigo?.toLowerCase().includes(term)
    );
  };

  // Estado del contexto
  const value = {
    // Estado
    favorites,
    favoritesCount,
    loading,
    syncing,
    
    // Acciones principales
    isFavorite,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    clearFavorites,
    
    // Utilidades
    getFavoritesByCategory,
    searchFavorites,
    refreshFavorites: loadUserFavorites,
    
    // Información del estado
    isAuthenticated: isAuthenticated && !!user,
    hasFavorites: favorites.length > 0
  };

  console.log('🎯 FavoritesContext Value:', {
    favoritesCount: value.favoritesCount,
    loading: value.loading,
    syncing: value.syncing,
    isAuthenticated: value.isAuthenticated
  });

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;