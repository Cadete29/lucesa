// context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

/**
 * CART CONTEXT
 * 
 * Contexto para la gestión del carrito de compras.
 * Maneja estado global del carrito con persistencia en localStorage.
 * Proporciona funciones para agregar, eliminar, actualizar y calcular el carrito.
 * 
 * Características principales:
 * - Estado global del carrito accesible en toda la aplicación
 * - Persistencia automática en localStorage
 * - Funciones optimizadas con useCallback
 * - Control de scroll del body al abrir/cerrar carrito
 * - Cálculos de totales memoizados
 * - Soporte para múltiples formatos de ID de productos
 * 
 * @context
 * @example
 * // Uso en el componente principal de la aplicación
 * <CartProvider>
 *   <App />
 * </CartProvider>
 */

/**
 * Crea el contexto del carrito
 * @type {React.Context}
 */
const CartContext = createContext();

/**
 * Hook personalizado para acceder al contexto del carrito
 * 
 * @function useCart
 * @returns {Object} Todas las funciones y estados del carrito
 * @throws {Error} Si se usa fuera de un CartProvider
 */
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

/**
 * Proveedor del contexto del carrito
 * 
 * @component CartProvider
 * @param {Object} props - Props del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export const CartProvider = ({ children }) => {
  // ==========================================================================
  // ESTADOS DEL CONTEXTO
  // ==========================================================================
  
  /**
   * @state {Array} cartItems - Array de productos en el carrito
   * Cada producto incluye:
   * - id: Identificador único del producto
   * - idProducto: ID alternativo del producto
   * - nombre: Nombre del producto
   * - precio: Precio base del producto
   * - precioFinal: Precio con descuentos aplicados
   * - quantity: Cantidad seleccionada
   * - tienePromocion: Si tiene promoción activa
   * - discountPercentage: Porcentaje de descuento
   * - porcentajeAdicional: Porcentaje adicional aplicado (10%)
   * - addedAt: Fecha de agregado al carrito
   */
  const [cartItems, setCartItems] = useState([]);
  
  /**
   * @state {boolean} isCartOpen - Estado de visibilidad del carrito lateral
   */
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  /**
   * @state {boolean} isInitialized - Indica si el contexto se inicializó desde localStorage
   */
  const [isInitialized, setIsInitialized] = useState(false);

  // ==========================================================================
  // EFECTOS: PERSISTENCIA EN LOCALSTORAGE
  // ==========================================================================
  
  /**
   * Efecto para cargar el carrito desde localStorage al inicializar
   * 
   * @effect
   * @dependencies [] - Se ejecuta solo al montar el componente
   */
  useEffect(() => {
    const savedCart = localStorage.getItem('ctonline_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        setCartItems([]);
      }
    }
    setIsInitialized(true);
  }, []);

  /**
   * Efecto para guardar el carrito en localStorage cuando cambia
   * 
   * @effect
   * @dependencies [cartItems, isInitialized] - Se ejecuta al cambiar items o inicialización
   */
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('ctonline_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isInitialized]);

  // ==========================================================================
  // FUNCIONES DE MANEJO DEL CARRITO
  // ==========================================================================
  
  /**
   * Agrega un producto al carrito o incrementa su cantidad si ya existe
   * 
   * @function addToCart
   * @callback useCallback
   * @param {Object} product - Producto a agregar
   * @param {string|number} product.id - ID principal del producto
   * @param {string|number} [product.idProducto] - ID alternativo del producto
   * @param {number} [product.precioFinal] - Precio con descuentos aplicados
   * @param {number} [product.precio] - Precio base del producto
   * @param {boolean} [product.tienePromocion] - Si tiene promoción activa
   * @param {number} [product.discountPercentage] - Porcentaje de descuento
   * @param {number} [product.porcentajeAdicional] - Porcentaje adicional (10%)
   * @param {number} [quantity=1] - Cantidad a agregar (default: 1)
   */
  const addToCart = useCallback((product, quantity = 1) => {
    setCartItems(prev => {
      // Buscar si el producto ya existe en el carrito
      const existingItem = prev.find(item => 
        item.id === product.id || item.idProducto === product.idProducto
      );
      
      if (existingItem) {
        // Si existe, incrementar la cantidad
        return prev.map(item =>
          item.id === product.id || item.idProducto === product.idProducto
            ? { 
                ...item, 
                quantity: item.quantity + quantity,
                // ✅ Asegurar que el precio final se mantiene
                precioFinal: product.precioFinal || item.precioFinal || product.precio || 0
              }
            : item
        );
      } else {
        // Si no existe, agregar nuevo producto
        return [...prev, {
          ...product,
          quantity,
          // ✅ Usar precioFinal si está disponible, si no usar precio
          precioFinal: product.precioFinal || product.precio || 0,
          // ✅ Asegurar que tenemos todos los campos de precio
          precio: product.precio || product.precioFinal || 0,
          // ✅ Información de promoción
          tienePromocion: product.tienePromocion || false,
          discountPercentage: product.discountPercentage || 0,
          porcentajeAdicional: product.porcentajeAdicional || 0,
          addedAt: new Date().toISOString()
        }];
      }
    });
  }, []);

  /**
   * Elimina un producto del carrito
   * 
   * @function removeFromCart
   * @callback useCallback
   * @param {string|number} productId - ID del producto a eliminar
   */
  const removeFromCart = useCallback((productId) => {
    setCartItems(prev => prev.filter(item => 
      item.id !== productId && item.idProducto !== productId
    ));
  }, []);

  /**
   * Actualiza la cantidad de un producto en el carrito
   * 
   * @function updateQuantity
   * @callback useCallback
   * @param {string|number} productId - ID del producto
   * @param {number} newQuantity - Nueva cantidad (mínimo 1)
   */
  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(prev => prev.map(item =>
      (item.id === productId || item.idProducto === productId)
        ? { ...item, quantity: newQuantity }
        : item
    ));
  }, []);

  /**
   * Vacía completamente el carrito
   * 
   * @function clearCart
   * @callback useCallback
   */
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  /**
   * Calcula el total monetario del carrito
   * 
   * @function getCartTotal
   * @callback useCallback
   * @returns {number} Total del carrito
   */
  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.precioFinal || item.precio) || 0;
      return total + (price * item.quantity);
    }, 0);
  }, [cartItems]);

  /**
   * Calcula la cantidad total de items en el carrito
   * 
   * @function getCartItemsCount
   * @callback useCallback
   * @returns {number} Cantidad total de items
   */
  const getCartItemsCount = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  // ==========================================================================
  // FUNCIONES DE VISIBILIDAD DEL CARRITO
  // ==========================================================================
  
  /**
   * Abre el carrito lateral
   * Bloquea el scroll del body y añade clase CSS
   * 
   * @function openCart
   * @callback useCallback
   */
  const openCart = useCallback(() => {
    setIsCartOpen(true);
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
    // Añadir clase para CSS
    document.body.classList.add('cart-open');
  }, []);

  /**
   * Cierra el carrito lateral
   * Restaura el scroll del body y remueve clase CSS
   * 
   * @function closeCart
   * @callback useCallback
   */
  const closeCart = useCallback(() => {
    setIsCartOpen(false);
    // Restaurar scroll del body
    document.body.style.overflow = '';
    // Remover clase para CSS
    document.body.classList.remove('cart-open');
  }, []);

  /**
   * Alterna la visibilidad del carrito lateral
   * 
   * @function toggleCart
   * @callback useCallback
   */
  const toggleCart = useCallback(() => {
    setIsCartOpen(prev => {
      const newState = !prev;
      if (newState) {
        document.body.style.overflow = 'hidden';
        document.body.classList.add('cart-open');
      } else {
        document.body.style.overflow = '';
        document.body.classList.remove('cart-open');
      }
      return newState;
    });
  }, []);

  // ==========================================================================
  // MEMOIZACIÓN DEL VALOR DEL CONTEXTO
  // ==========================================================================
  
  /**
   * Valor memoizado del contexto para optimizar re-renders
   * @type {Object}
   */
  const contextValue = useMemo(() => ({
    // Estado
    cartItems,
    isCartOpen,
    
    // Acciones del carrito
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    
    // Control de visibilidad
    openCart,
    closeCart,
    toggleCart
  }), [
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    isCartOpen
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};