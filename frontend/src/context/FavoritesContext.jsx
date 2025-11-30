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
    // Decodificar el token sin verificar (solo para ver la expiración)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convertir a milisegundos
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    
    console.log('🔐 Token Info:', {
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
  const { user, isAuthenticated, logout } = useAuth();

  console.log('🔄 FavoritesProvider Render - Estado:', {
    favoritesCount: favorites.length,
    isAuthenticated,
    user: user ? `Usuario: ${user.email}` : 'No user',
    loading,
    syncing
  });

  // Debug: mostrar entorno actual
  useEffect(() => {
    console.log('🚀 FavoritesProvider Montado');
    favoritesApi.debug.logEnvironment();
  }, []);

  // Cargar favoritos al cambiar el estado de autenticación
  useEffect(() => {
    console.log('🔄 Effect - Cambio en autenticación:', { isAuthenticated, user: user?.id });
    
    if (isAuthenticated && user) {
      loadUserFavorites();
    } else {
      // Cargar favoritos locales para usuarios no autenticados
      const guestFavorites = favoritesApi.storage.getGuestFavorites();
      console.log('👤 Cargando favoritos guest:', guestFavorites.length);
      setFavorites(guestFavorites);
    }
  }, [user, isAuthenticated]);

  // Cargar favoritos del usuario desde el servidor
  const loadUserFavorites = async () => {
    if (!user?.id || !user?.token) {
      console.log('❌ No hay usuario o token para cargar favoritos');
      return;
    }
    
    setLoading(true);
    try {
      console.log('🔄 Cargando favoritos del usuario...', user.id);
      const userFavorites = await favoritesApi.getUserFavorites(user.id, user.token);
      console.log('✅ Favoritos cargados del servidor:', userFavorites.length);
      setFavorites(userFavorites);
    } catch (error) {
      console.error('❌ Error cargando favoritos:', error);
      // Fallback a favoritos locales en caso de error
      const guestFavorites = favoritesApi.storage.getGuestFavorites();
      console.log('🔄 Fallback a favoritos locales:', guestFavorites.length);
      setFavorites(guestFavorites);
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar favoritos locales con el servidor al iniciar sesión
  const syncLocalFavorites = async () => {
    if (!user?.id || !user?.token) return;
    
    const guestFavorites = favoritesApi.storage.getGuestFavorites();
    if (guestFavorites.length > 0) {
      try {
        setSyncing(true);
        console.log('🔄 Sincronizando favoritos locales...', guestFavorites.length);
        
        // Agregar cada favorito local al servidor
        for (const product of guestFavorites) {
          try {
            await favoritesApi.addToFavorites(user.id, product, user.token);
            console.log('✅ Sincronizado:', product.nombre);
          } catch (error) {
            console.warn('⚠️ No se pudo sincronizar:', product.nombre, error.message);
            // Continuar con los demás productos
          }
        }
        
        // Limpiar favoritos locales después de sincronizar
        favoritesApi.storage.removeGuestFavorites();
        
        // Recargar favoritos del servidor
        await loadUserFavorites();
        
        console.log('✅ Sincronización completada');
      } catch (error) {
        console.error('❌ Error en sincronización:', error);
      } finally {
        setSyncing(false);
      }
    }
  };

  // Sincronizar al iniciar sesión
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 Iniciando sincronización al login...');
      syncLocalFavorites();
    }
  }, [isAuthenticated, user]);

  // Manejar error de autenticación
  const handleAuthError = (error) => {
    console.log('🔐 Error de autenticación detectado:', error.message);
    
    // Limpiar datos de sesión
    localStorage.removeItem('lucesa-token');
    localStorage.removeItem('lucesa-user');
    
    // Si hay función logout, usarla
    if (logout) {
      logout();
    }
    
    // Redirigir a login
    const currentPath = window.location.pathname;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    
    throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
  };

  // Agregar a favoritos
  const addToFavorites = async (product) => {
    if (!product || !product.id) {
      console.error('❌ Producto inválido:', product);
      throw new Error('Producto inválido');
    }

    console.log('❤️ AGREGAR FAVORITO - Iniciando:', {
      producto: product.nombre,
      id: product.id,
      usuario: user?.email || 'guest'
    });

    try {
      if (isAuthenticated && user) {
        // Usuario autenticado - guardar en servidor
        console.log('🔐 Usuario autenticado - guardando en servidor');
        const result = await favoritesApi.addToFavorites(user.id, product, user.token);
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
        console.log('👤 Usuario guest - guardando localmente');
        const updatedFavorites = [...favorites, product];
        setFavorites(updatedFavorites);
        favoritesApi.storage.setGuestFavorites(updatedFavorites);
        console.log('✅ Agregado a favoritos locales');
      }
    } catch (error) {
      console.error('❌ Error agregando favorito:', error);
      
      // Si es error de autenticación, manejar específicamente
      if (error.message.includes('403') || error.message.includes('Token') || error.message.includes('autenticación')) {
        return handleAuthError(error);
      }
      
      throw error;
    }
  };

  // Eliminar de favoritos
  const removeFromFavorites = async (productId) => {
    console.log('🗑️ ELIMINAR FAVORITO - Iniciando:', {
      productId,
      usuario: user?.email || 'guest'
    });

    try {
      if (isAuthenticated && user) {
        // Usuario autenticado - eliminar del servidor
        console.log('🔐 Usuario autenticado - eliminando del servidor');
        await favoritesApi.removeFromFavorites(user.id, productId, user.token);
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
      if (error.message.includes('403') || error.message.includes('Token') || error.message.includes('autenticación')) {
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
      totalFavoritos: favorites.length
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

    try {
      if (isAuthenticated && user) {
        // Usuario autenticado - limpiar en servidor
        console.log('🔐 Usuario autenticado - limpiando en servidor');
        const result = await favoritesApi.clearAllFavorites(user.id, user.token);
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
    console.log(`🔍 isFavorite Check: ${productId} -> ${result}`);
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
    syncing: value.syncing
  });

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;