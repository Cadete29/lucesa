import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

/**
 * CART COMPONENT
 * 
 * Componente principal del carrito de compras.
 * Muestra todos los productos agregados al carrito con funcionalidad completa:
 * - Visualización detallada de productos
 * - Modificación de cantidades
 * - Cálculo automático de totales e impuestos
 * - Validación de compra mínima ($1000 MXN)
 * - Envío gratis en compras mayores a $1000 MXN
 * - Integración con proceso de checkout
 * 
 * @component
 * @example
 * // Uso en rutas de React Router
 * <Route path="/cart" element={<Cart />} />
 */

// ============================================================================
// CONFIGURACIÓN DE CONSTANTES
// ============================================================================

/**
 * URL base para imágenes según entorno
 * @constant {string} IMAGE_BASE_URL
 */
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://lucesademexico-shop.com.mx/api/images/code'
  : 'http://localhost:4004/api/images/code';

/**
 * Formatea un número como precio en formato mexicano
 * 
 * @function formatPrice
 * @param {number|string} number - Número a formatear
 * @returns {string} Precio formateado con separadores de miles y 2 decimales
 * @example
 * formatPrice(1234.56) // "1,234.56"
 * formatPrice("1234.56") // "1,234.56"
 */
const formatPrice = (number) => {
  if (number === null || number === undefined || isNaN(number)) return '0,00';
  
  const num = typeof number === 'string' ? parseFloat(number) : number;
  
  // Usar Intl.NumberFormat para formato mexicano
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

// ============================================================================
// COMPONENTE PRINCIPAL DEL CARRITO
// ============================================================================

/**
 * Componente Cart - Vista principal del carrito de compras
 * 
 * Este componente maneja:
 * 1. Visualización de todos los productos en el carrito
 * 2. Cálculo de subtotal, impuestos y total
 * 3. Validación de compra mínima ($1000 MXN)
 * 4. Envío gratis para compras mayores a $1000 MXN
 * 5. Navegación al checkout
 * 6. Estado vacío del carrito
 * 
 * @returns {JSX.Element} Componente del carrito de compras
 */
const Cart = () => {
  // ==========================================================================
  // HOOKS Y CONTEXTOS
  // ==========================================================================
  
  /**
   * Contexto del carrito para operaciones CRUD
   * @const {Object} cartContext
   * @const {Array} cartItems - Productos en el carrito
   * @const {function} removeFromCart - Elimina producto del carrito
   * @const {function} updateQuantity - Actualiza cantidad de producto
   * @const {function} clearCart - Vacía completamente el carrito
   * @const {function} getCartTotal - Calcula subtotal del carrito
   * @const {function} getCartItemsCount - Cuenta total de productos
   */
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal,
    getCartItemsCount 
  } = useCart();
  
  /**
   * Hook de navegación para redirigir al checkout
   * @const {function} navigate - Función de navegación de React Router
   */
  const navigate = useNavigate();

  // ==========================================================================
  // FUNCIONES DE MANEJO
  // ==========================================================================
  
  /**
   * Maneja el cambio de cantidad de un producto
   * Si la cantidad es menor a 1, elimina el producto del carrito
   * 
   * @function handleQuantityChange
   * @param {string} productId - ID del producto a modificar
   * @param {number} newQuantity - Nueva cantidad del producto
   */
  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  /**
   * Maneja la navegación al checkout
   * Valida que la compra sea de al menos $1000 MXN
   * Muestra alerta si no se cumple el mínimo
   * 
   * @function handleCheckout
   */
  const handleCheckout = () => {
    // ✅ Validar compra mínima de $1000 antes de permitir checkout
    if (subtotal < 1000) {
      alert(`La compra mínima para checkout es de $1,000 MXN. Tu compra actual es de $${formatPrice(subtotal)} MXN. Faltan $${formatPrice(1000 - subtotal)} MXN.`);
      return;
    }
    navigate('/checkout');
  };

  // ==========================================================================
  // CÁLCULOS DE PRECIOS
  // ==========================================================================
  
  /**
   * Subtotal de la compra (suma de precios de productos × cantidad)
   * @const {number} subtotal
   */
  const subtotal = getCartTotal();
  
  /**
   * IVA del 16% calculado sobre el subtotal
   * @const {number} tax
   */
  const tax = subtotal * 0.16; // ✅ IVA del 16%
  
  /**
   * Costo de envío: 0 si subtotal >= 1000, null si no
   * @const {number|null} shipping
   */
  const shipping = subtotal >= 1000 ? 0 : null;
  
  /**
   * Total final de la compra (subtotal + tax + shipping)
   * @const {number} total
   */
  const total = subtotal + tax + (shipping === 0 ? 0 : 0);

  // ==========================================================================
  // RENDERIZADO DE CARRITO VACÍO
  // ==========================================================================
  
  /**
   * Estado vacío del carrito: muestra mensaje y botón para seguir comprando
   */
  if (cartItems.length === 0) {
    return (
      <div className="ct-page">
        <div className="ct-container">
          <div className="ct-header">
            <h1 className="ct-title">Carrito de Compras</h1>
          </div>
          <div className="ct-empty">
            <div className="ct-empty-icon">🛒</div>
            <h2 className="ct-empty-title">Tu carrito está vacío</h2>
            <p className="ct-empty-text">Agrega algunos productos increíbles a tu carrito</p>
            <Link to="/products" className="ct-btn ct-btn-primary">
              Explorar Productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDERIZADO PRINCIPAL DEL CARRITO
  // ==========================================================================
  
  return (
    <div className="ct-page">
      <div className="ct-container">
        {/* Encabezado del carrito con título y botón para limpiar */}
        <div className="ct-header">
          <h1 className="ct-title">Carrito de Compras ({getCartItemsCount()})</h1>
          <button onClick={clearCart} className="ct-clear-btn">
            Limpiar Carrito
          </button>
        </div>

        {/* Contenido principal en dos columnas */}
        <div className="ct-content">
          {/* Columna izquierda: Lista de productos */}
          <div className="ct-items-section">
            {cartItems.map(item => (
              <CartItemLarge 
                key={item.id || item.idProducto}
                item={item}
                onQuantityChange={handleQuantityChange}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          {/* Columna derecha: Resumen de compra */}
          <div className="ct-summary">
            {/* Tarjeta de resumen con cálculos */}
            <div className="ct-summary-card">
              <h3 className="ct-summary-title">Resumen del Pedido</h3>
              
              <div className="ct-summary-row">
                <span className="ct-summary-label">Subtotal ({getCartItemsCount()} productos):</span>
                <span className="ct-summary-value">${formatPrice(subtotal)} MXN</span>
              </div>
              
              <div className="ct-summary-row">
                <span className="ct-summary-label">IVA (16%):</span>
                <span className="ct-summary-value">${formatPrice(tax)} MXN</span>
              </div>
              
              <div className="ct-summary-row">
                <span className="ct-summary-label">Envío:</span>
                <span className="ct-summary-value">
                  {shipping === 0 ? (
                    <span className="ct-free-shipping">¡GRATIS!</span>
                  ) : (
                    <span className="ct-shipping-unavailable">No disponible</span>
                  )}
                </span>
              </div>

              {/* Notificación para alcanzar envío gratis */}
              {subtotal < 1000 && (
                <div className="ct-shipping-notice">
                  <span className="ct-notice-text">
                    ¡Faltan <strong>${formatPrice(1000 - subtotal)}</strong> para envío gratis!
                  </span>
                </div>
              )}

              {/* Notificación de compra mínima requerida */}
              {subtotal < 1000 && (
                <div className="ct-minimum-notice">
                  <div className="ct-minimum-content">
                    <span className="ct-minimum-icon">⚠️</span>
                    <div className="ct-minimum-text">
                      <strong>Compra mínima requerida: $1,000 MXN</strong>
                      <span> Para proceder al checkout</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="ct-summary-divider"></div>

              {/* Total final de la compra */}
              <div className="ct-summary-row ct-total">
                <span className="ct-total-label">Total:</span>
                <span className="ct-total-amount">${formatPrice(total)} MXN</span>
              </div>

              {/* Botón de checkout (deshabilitado si no se alcanza el mínimo) */}
              <button 
                onClick={handleCheckout} 
                className={`ct-checkout-btn ${subtotal < 1000 ? 'ct-checkout-disabled' : ''}`}
                disabled={subtotal < 1000}
              >
                {subtotal >= 1000 ? 'Proceder al Checkout' : 'Compra Mínima No Alcanzada'}
              </button>

              {/* Enlace para continuar comprando */}
              <Link to="/products" className="ct-continue-shopping">
                ← Continuar Comprando
              </Link>
            </div>

            {/* Sección de beneficios de la compra */}
            <div className="ct-benefits">
              <h4 className="ct-benefits-title">Beneficios de tu compra</h4>
              <div className="ct-benefit-item">
                <div className="ct-benefit-text">
                  <strong>Envío gratis</strong> en compras mayores a $1.000 MXN
                </div>
              </div>
              <div className="ct-benefit-item">
                <div className="ct-benefit-text">
                  <strong>Precios competitivos</strong> con la mejor calidad
                </div>
              </div>
              <div className="ct-benefit-item">
                <div className="ct-benefit-text">
                  <strong>30 días</strong> para devoluciones
                </div>
              </div>
              <div className="ct-benefit-item">
                <div className="ct-benefit-text">
                  <strong>Garantía</strong> incluida en todos los productos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE DE ITEM DEL CARRITO
// ============================================================================

/**
 * Componente CartItemLarge - Representa un producto individual en el carrito
 * 
 * Características:
 * - Imagen del producto con carga optimizada y reintentos
 * - Información detallada del producto
 * - Controles de cantidad (incrementar/decrementar)
 * - Precio unitario y total por producto
 * - Botón para eliminar del carrito
 * 
 * @component CartItemLarge
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.item - Producto a mostrar
 * @param {function} props.onQuantityChange - Maneja cambios en cantidad
 * @param {function} props.onRemove - Elimina producto del carrito
 * @returns {JSX.Element} Componente de item del carrito
 */
const CartItemLarge = ({ item, onQuantityChange, onRemove }) => {
  // ==========================================================================
  // ESTADOS Y REFERENCIAS
  // ==========================================================================
  
  /**
   * @state {string} imageStatus - Estado de carga de la imagen
   * Valores: 'loading', 'loaded', 'error'
   */
  const [imageStatus, setImageStatus] = useState('loading');
  
  /**
   * @state {string} currentImageUrl - URL actual de la imagen a cargar
   */
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  
  /**
   * @ref {Object} imgRef - Referencia al elemento img del DOM
   */
  const imgRef = useRef(null);
  
  /**
   * @ref {Object} retryCountRef - Contador de reintentos de carga de imagen
   */
  const retryCountRef = useRef(0);

  // ==========================================================================
  // EFECTOS PARA CARGA DE IMAGEN
  // ==========================================================================
  
  /**
   * Efecto para inicializar la carga de imagen cuando cambia el código del producto
   * 
   * @effect
   * @dependencies [item.codigo]
   */
  useEffect(() => {
    if (!item.codigo) {
      setImageStatus('error');
      return;
    }

    retryCountRef.current = 0;
    setImageStatus('loading');
    
    const url = `${IMAGE_BASE_URL}/${item.codigo}?size=full&t=${Date.now()}`;
    setCurrentImageUrl(url);
  }, [item.codigo]);

  /**
   * Efecto para manejar la carga de la imagen con sistema de reintentos
   * 
   * @effect
   * @dependencies [currentImageUrl, item.codigo]
   */
  useEffect(() => {
    if (!imgRef.current || !currentImageUrl) return;

    const img = imgRef.current;
    let isMounted = true;
    
    const handleLoad = () => {
      if (!isMounted) return;
      setImageStatus('loaded');
    };

    const handleError = () => {
      if (!isMounted) return;
      
      // Sistema de reintentos con diferentes tamaños
      if (retryCountRef.current < 2) {
        retryCountRef.current += 1;
        
        setTimeout(() => {
          if (!isMounted) return;
          const sizes = ['full', 'medium', 'small', ''];
          const retrySize = sizes[retryCountRef.current] || 'full';
          const retryUrl = `${IMAGE_BASE_URL}/${item.codigo}${retrySize ? `?size=${retrySize}` : ''}&t=${Date.now()}&retry=${retryCountRef.current}`;
          setCurrentImageUrl(retryUrl);
          setImageStatus('loading');
        }, 500);
      } else {
        setImageStatus('error');
      }
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    img.src = currentImageUrl;

    return () => {
      isMounted = false;
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [currentImageUrl, item.codigo]);

  // ==========================================================================
  // FUNCIONES DE RENDERIZADO
  // ==========================================================================
  
  /**
   * Renderiza la imagen del producto con manejo de estados de carga
   * 
   * @function renderImage
   * @returns {JSX.Element} Elemento de imagen o fallback
   */
  const renderImage = () => {
    if (imageStatus === 'error') {
      return (
        <div className="ct-item-image-error">
          <div className="ct-error-icon">📷</div>
          <div className="ct-error-text">Imagen no disponible</div>
          <small className="ct-error-code">{item.codigo}</small>
        </div>
      );
    }

    return (
      <>
        <img 
          ref={imgRef}
          src={currentImageUrl}
          alt={item.nombre || 'Producto'}
          className={`ct-item-image-img ${imageStatus === 'loaded' ? 'ct-loaded' : 'ct-loading'}`}
          crossOrigin="anonymous"
          loading="lazy"
        />
        
        {imageStatus === 'loading' && (
          <div className="ct-image-loading">
            <div className="ct-loading-spinner"></div>
            {retryCountRef.current > 0 && (
              <div className="ct-retry-text">Intento {retryCountRef.current}</div>
            )}
          </div>
        )}
      </>
    );
  };

  // ==========================================================================
  // RENDERIZADO DEL ITEM
  // ==========================================================================
  
  return (
    <div className="ct-item-large">
      {/* Columna 1: Imagen del producto */}
      <div className="ct-item-image">
        {renderImage()}
      </div>

      {/* Columna 2: Información del producto */}
      <div className="ct-item-details">
        <h3 className="ct-item-name">
          <Link to={`/product/${item.idProducto || item.id}`} className="ct-item-link">
            {item.nombre || 'Producto sin nombre'}
          </Link>
        </h3>
        <p className="ct-item-brand">{item.marca || 'Sin marca'}</p>
        <p className="ct-item-code">Código: {item.codigo || 'N/A'}</p>
        
        {item.promociones && item.promociones.length > 0 && (
          <div className="ct-item-promo">
            <span className="ct-promo-badge"> Oferta especial</span>
          </div>
        )}
      </div>

      {/* Columna 3: Precio unitario */}
      <div className="ct-item-price-section">
        <div className="ct-price">
          ${formatPrice(item.precioFinal || item.precio)} MXN
        </div>
      </div>

      {/* Columna 4: Controles de cantidad */}
      <div className="ct-item-quantity">
        <div className="ct-quantity-controls">
          <button 
            onClick={() => onQuantityChange(item.id || item.idProducto, item.quantity - 1)}
            className="ct-quantity-btn"
          >
            -
          </button>
          <input 
            type="number" 
            value={item.quantity}
            min="1"
            onChange={(e) => onQuantityChange(
              item.id || item.idProducto, 
              parseInt(e.target.value) || 1
            )}
            className="ct-quantity-input"
          />
          <button 
            onClick={() => onQuantityChange(item.id || item.idProducto, item.quantity + 1)}
            className="ct-quantity-btn"
          >
            +
          </button>
        </div>
      </div>

      {/* Columna 5: Total y botón eliminar */}
      <div className="ct-item-total">
        <div className="ct-total-price">
          ${formatPrice((item.precioFinal || item.precio) * item.quantity)} MXN
        </div>
        <button 
          onClick={() => onRemove(item.id || item.idProducto)}
          className="ct-remove-btn"
        >
        Eliminar
        </button>
      </div>
    </div>
  );
};

export default Cart;