import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './CartDropdown.css';

// ✅ Misma URL base que ProductCard
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://lucesademexico-shop.com.mx/api/images/code'
  : 'http://localhost:4004/api/images/code';

const DEBUG = process.env.NODE_ENV === 'development';

// ✅ Función para formatear precios
const formatPrice = (price) => {
  if (typeof price !== 'number' || isNaN(price) || price <= 0) return '0.00';
  return price.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

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

  // DEBUG: Verificar estado
  useEffect(() => {
    if (DEBUG && isCartOpen) {
      console.log('🛒 CartDropdown - Estado actual:', {
        isCartOpen,
        itemsCount: cartItems.length,
        cartItems: cartItems.map(item => ({
          id: item.id,
          idProducto: item.idProducto,
          codigo: item.codigo,
          nombre: item.nombre,
          precioFinal: item.precioFinal
        }))
      });
    }
  }, [isCartOpen, cartItems]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isCartOpen) return;
      
      const cartDropdown = dropdownRef.current;
      const isCartButton = event.target.closest('[data-cart-button]') ||
                           event.target.closest('.cart-btn-hdr') ||
                           event.target.closest('.cart-button') ||
                           event.target.closest('.nav-cart-btn') ||
                           event.target.closest('.cart-icon-hdr');
      
      if (event.target.classList.contains('cd-backdrop')) {
        console.log('👆 Clic en backdrop, cerrando carrito');
        closeCart();
        return;
      }
      
      if (cartDropdown && cartDropdown.contains(event.target)) {
        return;
      }
      
      if (isCartButton) {
        console.log('👆 Clic en botón del carrito, mantener abierto');
        return;
      }
      
      console.log('👆 Clic fuera, cerrando carrito');
      closeCart();
    };

    if (isCartOpen) {
      console.log('🔵 CartDropdown - Agregando event listeners');
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
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
    if (newQuantity < 0.01) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  }, [removeFromCart, updateQuantity]);

  // Si el carrito no está abierto, no renderizar nada
  if (!isCartOpen) {
    return null;
  }

  console.log('✅ CartDropdown - Renderizando dropdown con', cartItems.length, 'items');

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
              {cartItems.map((item, index) => {
                console.log(`📦 CartDropdown Item [${index}]:`, {
                  id: item.id,
                  idProducto: item.idProducto,
                  codigo: item.codigo,
                  nombre: item.nombre,
                  precioFinal: item.precioFinal,
                  quantity: item.quantity
                });
                
                return (
                  <CartItem 
                    key={`${item.id || item.idProducto}_${index}`} 
                    item={item} 
                    onQuantityChange={handleQuantityChange}
                    onRemove={removeFromCart}
                    formatPrice={formatPrice}
                  />
                );
              })}
            </div>

            <div className="cd-footer">
              <div className="cd-subtotal">
                <span className="cd-subtotal-label">Subtotal:</span>
                <span className="cd-subtotal-amount">${formatPrice(getCartTotal())} MXN</span>
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
                  <span className="cd-minimum-text">Compra mínima: $1.000 MXN</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

// ✅ Componente CartItem mejorado
const CartItem = React.memo(({ item, onQuantityChange, onRemove, formatPrice }) => {
  const [imageStatus, setImageStatus] = useState('loading');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const imgRef = useRef(null);
  const retryCountRef = useRef(0);

  // ✅ DEBUG: Verificar datos del item
  useEffect(() => {
    console.log('🔍 CartItem - Datos recibidos:', {
      id: item.id,
      idProducto: item.idProducto,
      codigo: item.codigo,
      nombre: item.nombre,
      precioFinal: item.precioFinal,
      precio: item.precio,
      marca: item.marca,
      quantity: item.quantity
    });
  }, [item]);

  // ✅ Cargar imagen - VERSIÓN MEJORADA
  useEffect(() => {
    console.log('🖼️ CartItem - Iniciando carga de imagen para:', item.codigo);
    
    if (!item.codigo || item.codigo === 'N/A') {
      console.log('❌ CartItem - Sin código o código N/A');
      setImageStatus('error');
      return;
    }

    retryCountRef.current = 0;
    setImageStatus('loading');
    
    // ✅ URL optimizada - igual que ProductCard
    const codigoLimpio = item.codigo.toString().trim().toUpperCase();
    const imageUrl = `${IMAGE_BASE_URL}/${codigoLimpio}?t=${Date.now()}`;
    
    console.log('🔗 CartItem - URL de imagen:', imageUrl);
    setCurrentImageUrl(imageUrl);
    
  }, [item.codigo]);

  // ✅ Manejar carga/error de imagen
  useEffect(() => {
    if (!imgRef.current || !currentImageUrl) return;

    const img = imgRef.current;
    let isMounted = true;
    
    const handleLoad = () => {
      if (!isMounted) return;
      console.log('✅ CartItem - Imagen cargada exitosamente');
      setImageStatus('loaded');
    };

    const handleError = (error) => {
      if (!isMounted) return;
      
      console.error('❌ CartItem - Error cargando imagen:', error);
      
      if (retryCountRef.current < 2) {
        retryCountRef.current += 1;
        
        console.log(`🔄 CartItem - Reintento ${retryCountRef.current}...`);
        
        setTimeout(() => {
          if (!isMounted) return;
          
          // Intentar diferentes formatos
          const formats = ['', '?size=small', '?size=medium', '?size=full'];
          const retryFormat = formats[retryCountRef.current] || '';
          const codigoLimpio = item.codigo.toString().trim().toUpperCase();
          const retryUrl = `${IMAGE_BASE_URL}/${codigoLimpio}${retryFormat}&t=${Date.now()}&retry=${retryCountRef.current}`;
          
          console.log(`🔄 CartItem - URL de reintento: ${retryUrl}`);
          setCurrentImageUrl(retryUrl);
          setImageStatus('loading');
        }, 300);
      } else {
        console.log('❌ CartItem - Agotados reintentos, mostrando placeholder');
        setImageStatus('error');
      }
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    console.log('🖼️ CartItem - Estableciendo src:', currentImageUrl);
    img.src = currentImageUrl;
    img.crossOrigin = "anonymous";
    img.loading = "lazy";

    return () => {
      isMounted = false;
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [currentImageUrl, item.codigo]);

  const handleDecrease = () => {
    const newQuantity = (item.quantity || 1) - 1;
    if (newQuantity < 0.01) {
      onRemove(item.id || item.idProducto);
    } else {
      onQuantityChange(item.id || item.idProducto, newQuantity);
    }
  };

  const handleIncrease = () => {
    onQuantityChange(item.id || item.idProducto, (item.quantity || 1) + 1);
  };

  const handleRemove = () => {
    onRemove(item.id || item.idProducto);
  };

  // ✅ Renderizar imagen
  const renderImage = () => {
    console.log(`🖼️ CartItem - Estado de imagen: ${imageStatus}`);
    
    if (imageStatus === 'error') {
      return (
        <div className="cd-item-image-error">
          <div className="cd-error-icon">📷</div>
          <small className="cd-error-text">Sin imagen</small>
          <small className="cd-error-code">{item.codigo}</small>
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

  // ✅ Obtener precio correcto
  const precioFinal = item.precioFinal || item.precio || 0;
  const precioFormateado = formatPrice(precioFinal);
  const totalItem = precioFinal * (item.quantity || 1);

  console.log(`💰 CartItem - Precio calculado: ${precioFinal} -> ${precioFormateado}`);

  return (
    <div className="cd-item" data-product-id={item.id || item.idProducto}>
      <div className="cd-item-image">
        {renderImage()}
      </div>
      
      <div className="cd-item-details">
        <h4 className="cd-item-name">{item.nombre || 'Producto sin nombre'}</h4>
        <p className="cd-item-brand">{item.marca || 'Sin marca'}</p>
        <p className="cd-item-code">Código: {item.codigo || 'N/A'}</p>
        <div className="cd-item-price">
          ${precioFormateado} MXN
        </div>
        <div className="cd-item-total">
          Total: ${formatPrice(totalItem)} MXN
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
          
          <div className="cd-quantity-display">
            <span className="cd-quantity">{item.quantity || 1}</span>
          </div>
          
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