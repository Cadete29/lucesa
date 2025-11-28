import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/favoritesApi';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites debe ser usado dentro de un FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Debug: mostrar entorno actual
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      api.debug.logEnvironment();
    }
  }, []);

  // Cargar favoritos al cambiar el estado de autenticación
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserFavorites();
    } else {
      // Cargar favoritos locales para usuarios no autenticados
      const guestFavorites = api.storage.getGuestFavorites();
      setFavorites(guestFavorites);
    }
  }, [user, isAuthenticated]);

  // Cargar favoritos del usuario desde el servidor
  const loadUserFavorites = async () => {
    if (!user?.id || !user?.token) return;
    
    setLoading(true);
    try {
      const userFavorites = await api.favorites.getUserFavorites(user.id, user.token);
      setFavorites(userFavorites);
    } catch (error) {
      console.error('Error cargando favoritos:', error);
      // Fallback a favoritos locales en caso de error
      const guestFavorites = api.storage.getGuestFavorites();
      setFavorites(guestFavorites);
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar favoritos locales con el servidor al iniciar sesión
  const syncLocalFavorites = async () => {
    if (!user?.id || !user?.token) return;
    
    const guestFavorites = api.storage.getGuestFavorites();
    if (guestFavorites.length > 0) {
      try {
        // Agregar cada favorito local al servidor
        for (const product of guestFavorites) {
          await api.favorites.addToFavorites(user.id, product, user.token);
        }
        
        // Limpiar favoritos locales después de sincronizar
        api.storage.removeGuestFavorites();
        
        // Recargar favoritos del servidor
        await loadUserFavorites();
      } catch (error) {
        console.error('Error sincronizando favoritos:', error);
      }
    }
  };

  // Sincronizar al iniciar sesión
  useEffect(() => {
    if (isAuthenticated && user) {
      syncLocalFavorites();
    }
  }, [isAuthenticated, user]);

  // Agregar a favoritos
  const addToFavorites = async (product) => {
    if (!product || !product.id) return;

    if (isAuthenticated && user) {
      // Usuario autenticado - guardar en servidor
      try {
        await api.favorites.addToFavorites(user.id, product, user.token);
        setFavorites(prev => [...prev, product]);
      } catch (error) {
        console.error('Error agregando favorito:', error);
        throw error;
      }
    } else {
      // Usuario no autenticado - guardar localmente
      const updatedFavorites = [...favorites, product];
      setFavorites(updatedFavorites);
      api.storage.setGuestFavorites(updatedFavorites);
    }
  };

  // Eliminar de favoritos
  const removeFromFavorites = async (productId) => {
    if (isAuthenticated && user) {
      // Usuario autenticado - eliminar del servidor
      try {
        await api.favorites.removeFromFavorites(user.id, productId, user.token);
        setFavorites(prev => prev.filter(item => item.id !== productId));
      } catch (error) {
        console.error('Error eliminando favorito:', error);
        throw error;
      }
    } else {
      // Usuario no autenticado - eliminar localmente
      const updatedFavorites = favorites.filter(item => item.id !== productId);
      setFavorites(updatedFavorites);
      api.storage.setGuestFavorites(updatedFavorites);
    }
  };

  // Toggle favorito
  const toggleFavorite = async (product) => {
    if (!product || !product.id) return;

    const isCurrentlyFavorite = favorites.some(fav => fav.id === product.id);
    
    if (isCurrentlyFavorite) {
      await removeFromFavorites(product.id);
    } else {
      await addToFavorites(product);
    }
  };

  // Limpiar todos los favoritos
  const clearFavorites = async () => {
    if (isAuthenticated && user) {
      // Usuario autenticado - limpiar en servidor
      try {
        await api.favorites.clearAllFavorites(user.id, user.token);
        setFavorites([]);
      } catch (error) {
        console.error('Error limpiando favoritos:', error);
        throw error;
      }
    } else {
      // Usuario no autenticado - limpiar localmente
      setFavorites([]);
      api.storage.removeGuestFavorites();
    }
  };

  // Verificar si un producto está en favoritos
  const isFavorite = (productId) => {
    return favorites.some(item => item.id === productId);
  };

  // Obtener cantidad de favoritos
  const favoritesCount = favorites.length;

  const value = {
    favorites,
    favoritesCount,
    isFavorite,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    clearFavorites,
    loading,
    refreshFavorites: loadUserFavorites
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};