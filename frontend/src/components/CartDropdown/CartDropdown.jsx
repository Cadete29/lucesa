import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './CartDropdown.css';

const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

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

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  // Si el carrito no está abierto, no renderizar nada
  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop para móviles */}
      <div className="cd-backdrop" onClick={closeCart} />
      
      <div className="cd-dropdown">
        <div className="cd-header">
          <h3 className="cd-title">
            {cartItems.length === 0 ? 'Carrito de Compras' : `Carrito (${getCartItemsCount()})`}
          </h3>
          <button onClick={closeCart} className="cd-close-btn">×</button>
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
              <div className="cd-total">
                <span className="cd-total-label">Total:</span>
                <span className="cd-total-amount">${getCartTotal().toFixed(2)} MXN</span>
              </div>
              <div className="cd-actions">
                <Link to="/cart" className="cd-btn cd-btn-secondary" onClick={closeCart}>
                  Ver Carrito
                </Link>
                {/* <Link to="/checkout" className="cd-btn cd-btn-primary" onClick={closeCart}>
                  Finalizar Compra
                </Link> */}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

const CartItem = ({ item, onQuantityChange, onRemove }) => {
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
            onClick={() => onQuantityChange(item.id || item.idProducto, item.quantity - 1)}
            className="cd-quantity-btn"
          >
            -
          </button>
          <span className="cd-quantity">{item.quantity}</span>
          <button 
            onClick={() => onQuantityChange(item.id || item.idProducto, item.quantity + 1)}
            className="cd-quantity-btn"
          >
            +
          </button>
        </div>
        <button 
          onClick={() => onRemove(item.id || item.idProducto)}
          className="cd-remove-btn"
          title="Eliminar"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default CartDropdown;