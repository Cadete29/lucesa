// Configuración base de la API - Desarrollo y Producción
const API_BASE_URL = (process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api'
  : 'http://localhost:4004/api');

// Headers comunes para las requests
const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

// Headers comunes sin auth
const getHeaders = () => ({
  'Content-Type': 'application/json',
});

// Manejo de errores común
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Error ${response.status}: ${response.statusText}`
    }));
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// Favorites API
export const favoritesApi = {
  // Obtener todos los favoritos del usuario
  getUserFavorites: async (userId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      throw error;
    }
  },

  // Agregar producto a favoritos
  addToFavorites: async (userId, product, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          productId: product.id,
          productData: {
            id: product.id,
            idProducto: product.idProducto,
            codigo: product.codigo,
            nombre: product.nombre,
            descripcion: product.descripcion,
            descripcion_corta: product.descripcion_corta,
            precio: product.precio,
            precioPromocion: product.precioPromocion,
            existencia: product.existencia,
            marca: product.marca,
            categoria: product.categoria,
            subcategoria: product.subcategoria,
            imagen: product.imagen,
            promociones: product.promociones,
            fecha_creacion: product.fecha_creacion
          }
        }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  },

  // Eliminar producto de favoritos
  removeFromFavorites: async (userId, productId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  },

  // Limpiar todos los favoritos
  clearAllFavorites: async (userId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error clearing favorites:', error);
      throw error;
    }
  },

  // Sincronizar favoritos locales con el servidor
  syncLocalFavorites: async (userId, localFavorites, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites/sync`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ favorites: localFavorites }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error syncing favorites:', error);
      throw error;
    }
  }
};

// Users API
export const usersApi = {
  getUserProfile: async (userId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  updateUserProfile: async (userId, userData, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(userData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
};

// Products API
export const productsApi = {
  getProducts: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams 
        ? `${API_BASE_URL}/products?${queryParams}`
        : `${API_BASE_URL}/products`;
      
      const response = await fetch(url);
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  getProductById: async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`);
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  searchProducts: async (searchTerm, filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        q: searchTerm,
        ...filters
      }).toString();
      const response = await fetch(`${API_BASE_URL}/products/search?${queryParams}`);
      return await handleResponse(response);
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  getProductsByCategory: async (categoryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products`);
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching category products:', error);
      throw error;
    }
  }
};

// Auth API
export const authApi = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  },

  verifyToken: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error verifying token:', error);
      throw error;
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ refreshToken }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },

  logout: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }
};

// Cart API
export const cartApi = {
  getUserCart: async (userId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/cart`, {
        method: 'GET',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching user cart:', error);
      throw error;
    }
  },

  addToCart: async (userId, product, quantity = 1, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/cart`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({
          productId: product.id,
          productData: product,
          quantity: quantity
        }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  updateCartItem: async (userId, productId, quantity, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/cart/${productId}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ quantity }),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },

  removeFromCart: async (userId, productId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/cart/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  clearCart: async (userId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/cart`, {
        method: 'DELETE',
        headers: getAuthHeaders(token),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
};

// Categories API
export const categoriesApi = {
  getCategories: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  getCategoryById: async (categoryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`);
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }
};

// Utilidades para localStorage (modo invitado)
export const localStorageUtils = {
  // Favoritos locales
  getGuestFavorites: () => {
    try {
      const favorites = localStorage.getItem('guestFavorites');
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error getting guest favorites:', error);
      return [];
    }
  },

  setGuestFavorites: (favorites) => {
    try {
      localStorage.setItem('guestFavorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('Error setting guest favorites:', error);
    }
  },

  removeGuestFavorites: () => {
    try {
      localStorage.removeItem('guestFavorites');
    } catch (error) {
      console.error('Error removing guest favorites:', error);
    }
  },

  // Carrito local
  getGuestCart: () => {
    try {
      const cart = localStorage.getItem('guestCart');
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error('Error getting guest cart:', error);
      return [];
    }
  },

  setGuestCart: (cart) => {
    try {
      localStorage.setItem('guestCart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error setting guest cart:', error);
    }
  },

  removeGuestCart: () => {
    try {
      localStorage.removeItem('guestCart');
    } catch (error) {
      console.error('Error removing guest cart:', error);
    }
  },

  // Datos de usuario temporal
  getGuestUser: () => {
    try {
      const user = localStorage.getItem('guestUser');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting guest user:', error);
      return null;
    }
  },

  setGuestUser: (user) => {
    try {
      localStorage.setItem('guestUser', JSON.stringify(user));
    } catch (error) {
      console.error('Error setting guest user:', error);
    }
  },

  removeGuestUser: () => {
    try {
      localStorage.removeItem('guestUser');
    } catch (error) {
      console.error('Error removing guest user:', error);
    }
  }
};

// Función de utilidad para debug
export const debugApi = {
  logEnvironment: () => {
    console.log('🔄 Environment:', process.env.NODE_ENV);
    console.log('🌐 API Base URL:', API_BASE_URL);
    console.log('📱 User Agent:', navigator.userAgent);
  }
};

// Exportar todo como un objeto único
const api = {
  favorites: favoritesApi,
  users: usersApi,
  products: productsApi,
  auth: authApi,
  cart: cartApi,
  categories: categoriesApi,
  storage: localStorageUtils,
  debug: debugApi
};

export default api;