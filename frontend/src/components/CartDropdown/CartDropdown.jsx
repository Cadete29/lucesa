import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './CartDropdown.css';

const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

// Constante para debug
const DEBUG = process.env.NODE_ENV === 'development';

const CartDropdown = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal, 
    getCartItemsCount,
    closeCart,
    isCartOpen
  } = useCart();

  const dropdownRef = useRef(null);

  // DEBUG: Verificar estado - solo cuando está abierto
  useEffect(() => {
    if (DEBUG && isCartOpen) {
      console.log('🛒 CartDropdown - Estado actual:', {
        isCartOpen,
        itemsCount: cartItems.length,
        cartItems: cartItems.length > 0 ? cartItems.map(item => ({
          id: item.id,
          nombre: item.nombre
        })) : 'Vacío'
      });
    }
  }, [isCartOpen, cartItems]);

  // Cerrar dropdown al hacer clic fuera - OPTIMIZADO
  // src/components/Cart/CartDropdown.jsx

useEffect(() => {
  const handleClickOutside = (event) => {
    // Si el dropdown no está abierto, no hacer nada
    if (!isCartOpen) return;
    
    // Identificar elementos del carrito
    const cartDropdown = dropdownRef.current;
    const isCartButton = event.target.closest('[data-cart-button]') ||
                         event.target.closest('.cart-btn-hdr') ||
                         event.target.closest('.cart-button') ||
                         event.target.closest('.nav-cart-btn') ||
                         event.target.closest('.cart-icon-hdr');
    
    // Si el clic fue en el backdrop, cerrar
    if (event.target.classList.contains('cd-backdrop')) {
      console.log('👆 Clic en backdrop, cerrando carrito');
      closeCart();
      return;
    }
    
    // Si el clic fue dentro del dropdown, no hacer nada
    if (cartDropdown && cartDropdown.contains(event.target)) {
      return;
    }
    
    // Si el clic fue en un botón del carrito, NO cerrar
    if (isCartButton) {
      console.log('👆 Clic en botón del carrito, mantener abierto');
      return;
    }
    
    // Si el clic fue fuera de todo, cerrar el carrito
    console.log('👆 Clic fuera, cerrando carrito');
    closeCart();
  };

  if (isCartOpen) {
    console.log('🔵 CartDropdown - Agregando event listeners');
    document.addEventListener('mousedown', handleClickOutside);
    document.body.style.overflow = 'hidden';
    // Añadir clase al body para facilitar la detección
    document.body.classList.add('cart-open');
  }

  return () => {
    console.log('🔴 CartDropdown - Removiendo event listeners');
    document.removeEventListener('mousedown', handleClickOutside);
    document.body.style.overflow = '';
    document.body.classList.remove('cart-open');
  };
}, [isCartOpen, closeCart]);

  // Cerrar con Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isCartOpen) {
        if (DEBUG) console.log('⎋ Tecla Escape presionada, cerrando carrito');
        closeCart();
      }
    };

    if (isCartOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isCartOpen, closeCart]);

  const handleQuantityChange = useCallback((productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  }, [removeFromCart, updateQuantity]);

  // Si el carrito no está abierto, no renderizar nada
  if (!isCartOpen) {
    return null;
  }

  if (DEBUG) console.log('✅ CartDropdown - Renderizando dropdown');

  return (
    <>
      {/* Backdrop para móviles */}
      <div className="cd-backdrop" onClick={closeCart} />
      
      <div className="cd-dropdown" ref={dropdownRef}>
        <div className="cd-header">
          <h3 className="cd-title">
            {cartItems.length === 0 ? 'Carrito de Compras' : `Carrito (${getCartItemsCount()})`}
          </h3>
          <button 
            onClick={closeCart} 
            className="cd-close-btn"
            aria-label="Cerrar carrito"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cd-empty">
            <div className="cd-empty-icon">🛒</div>
            <p className="cd-empty-text">Tu carrito está vacío</p>
            <Link to="/products" className="cd-btn cd-btn-primary" onClick={closeCart}>
              Explorar Productos
            </Link>
          </div>
        ) : (
          <>
            <div className="cd-items">
              {cartItems.map(item => (
                <CartItem 
                  key={item.id || item.idProducto} 
                  item={item} 
                  onQuantityChange={handleQuantityChange}
                  onRemove={removeFromCart}
                />
              ))}
            </div>

            <div className="cd-footer">
              <div className="cd-subtotal">
                <span className="cd-subtotal-label">Subtotal:</span>
                <span className="cd-subtotal-amount">${getCartTotal().toFixed(2)} MXN</span>
              </div>
              <div className="cd-actions">
                <Link to="/cart" className="cd-btn cd-btn-secondary" onClick={closeCart}>
                  Ver Carrito
                </Link>
                <Link 
                  to="/checkout" 
                  className="cd-btn cd-btn-primary" 
                  onClick={closeCart}
                  style={{
                    pointerEvents: getCartTotal() < 1000 ? 'none' : 'auto', 
                    opacity: getCartTotal() < 1000 ? 0.5 : 1
                  }}
                >
                  {getCartTotal() >= 1000 ? 'Finalizar Compra' : 'Mínimo $1,000'}
                </Link>
              </div>
              {getCartTotal() < 1000 && (
                <div className="cd-minimum-notice">
                  <span className="cd-minimum-icon">⚠️</span>
                  <span className="cd-minimum-text">Compra mínima: $1,000 MXN</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

// Componente CartItem separado para mejor rendimiento
const CartItem = React.memo(({ item, onQuantityChange, onRemove }) => {
  const [imageStatus, setImageStatus] = useState('loading');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const imgRef = useRef(null);
  const retryCountRef = useRef(0);

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

  const renderImage = () => {
    if (imageStatus === 'error') {
      return (
        <div className="cd-item-image-error">
          <div className="cd-error-icon">📷</div>
          <small className="cd-error-text">Sin imagen</small>
        </div>
      );
    }

    return (
      <>
        <img 
          ref={imgRef}
          src={currentImageUrl}
          alt={item.nombre || 'Producto'}
          className={`cd-item-image-img ${imageStatus === 'loaded' ? 'cd-loaded' : 'cd-loading'}`}
          crossOrigin="anonymous"
          loading="lazy"
        />
        
        {imageStatus === 'loading' && (
          <div className="cd-image-loading">
            <div className="cd-loading-spinner"></div>
            {retryCountRef.current > 0 && (
              <div className="cd-retry-text">Intento {retryCountRef.current}</div>
            )}
          </div>
        )}
      </>
    );
  };

  const handleDecrease = () => {
    onQuantityChange(item.id || item.idProducto, item.quantity - 1);
  };

  const handleIncrease = () => {
    onQuantityChange(item.id || item.idProducto, item.quantity + 1);
  };

  const handleRemove = () => {
    onRemove(item.id || item.idProducto);
  };

  return (
    <div className="cd-item">
      <div className="cd-item-image">
        {renderImage()}
      </div>
      
      <div className="cd-item-details">
        <h4 className="cd-item-name">{item.nombre || 'Producto sin nombre'}</h4>
        <p className="cd-item-brand">{item.marca || 'Sin marca'}</p>
        <p className="cd-item-code">Código: {item.codigo || 'N/A'}</p>
        <div className="cd-item-price">
          ${typeof item.precioFinal === 'number' ? item.precioFinal.toFixed(2) : parseFloat(item.precioFinal || 0).toFixed(2)} MXN
        </div>
      </div>

      <div className="cd-item-controls">
        <div className="cd-quantity-controls">
          <button 
            onClick={handleDecrease}
            className="cd-quantity-btn"
            aria-label="Disminuir cantidad"
          >
            -
          </button>
          <span className="cd-quantity">{item.quantity}</span>
          <button 
            onClick={handleIncrease}
            className="cd-quantity-btn"
            aria-label="Aumentar cantidad"
          >
            +
          </button>
        </div>
        <button 
          onClick={handleRemove}
          className="cd-remove-btn"
          title="Eliminar"
          aria-label="Eliminar producto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeWidth="2"/>
          </svg>
        </button>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

export default CartDropdown;