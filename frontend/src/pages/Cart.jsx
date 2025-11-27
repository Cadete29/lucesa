import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

// ✅ Configuración de URLs por entorno
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

const Cart = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal,
    getCartItemsCount 
  } = useCart();
  
  const navigate = useNavigate();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    // ✅ Validar compra mínima de $1000 antes de permitir checkout
    if (subtotal < 1000) {
      alert(`La compra mínima para checkout es de $1,000 MXN. Tu compra actual es de $${subtotal.toFixed(2)} MXN. Faltan $${(1000 - subtotal).toFixed(2)} MXN.`);
      return;
    }
    navigate('/checkout');
  };

  const subtotal = getCartTotal();
  const tax = subtotal * 0.16; // ✅ IVA del 16%
  // ✅ CORRECCIÓN: Envío gratis en compras mayores a $1000 MXN
  const shipping = subtotal >= 1000 ? 0 : null; // null indica que no hay envío disponible
  const total = subtotal + tax + (shipping === 0 ? 0 : 0);

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

  return (
    <div className="ct-page">
      <div className="ct-container">
        <div className="ct-header">
          <h1 className="ct-title">Carrito de Compras ({getCartItemsCount()})</h1>
          <button onClick={clearCart} className="ct-clear-btn">
            Limpiar Carrito
          </button>
        </div>

        <div className="ct-content">
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

          <div className="ct-summary">
            <div className="ct-summary-card">
              <h3 className="ct-summary-title">Resumen del Pedido</h3>
              
              <div className="ct-summary-row">
                <span className="ct-summary-label">Subtotal ({getCartItemsCount()} productos):</span>
                <span className="ct-summary-value">${subtotal.toFixed(2)} MXN</span>
              </div>
              
              {/* ✅ NUEVO: Fila para IVA del 16% */}
              <div className="ct-summary-row">
                <span className="ct-summary-label">IVA (16%):</span>
                <span className="ct-summary-value">${tax.toFixed(2)} MXN</span>
              </div>
              
              <div className="ct-summary-row">
                <span className="ct-summary-label">Envío:</span>
                <span className="ct-summary-value">
                  {shipping === 0 ? (
                    <span className="ct-free-shipping">¡GRATIS! 🎉</span>
                  ) : (
                    <span className="ct-shipping-unavailable">No disponible</span>
                  )}
                </span>
              </div>

              {/* ✅ CORRECCIÓN: Mensaje actualizado para $1000 */}
              {subtotal < 1000 && (
                <div className="ct-shipping-notice">
                  <span className="ct-notice-icon">🚚</span>
                  <span className="ct-notice-text">
                    ¡Faltan <strong>${(1000 - subtotal).toFixed(2)}</strong> para envío gratis!
                  </span>
                </div>
              )}

              {/* ✅ NUEVO: Información de compra mínima */}
              {subtotal < 1000 && (
                <div className="ct-minimum-notice">
                  <div className="ct-minimum-content">
                    <span className="ct-minimum-icon">⚠️</span>
                    <div className="ct-minimum-text">
                      <strong>Compra mínima requerida: $1,000 MXN</strong>
                      <span>Para proceder al checkout</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="ct-summary-divider"></div>

              <div className="ct-summary-row ct-total">
                <span className="ct-total-label">Total:</span>
                <span className="ct-total-amount">${total.toFixed(2)} MXN</span>
              </div>

              <button 
                onClick={handleCheckout} 
                className={`ct-checkout-btn ${subtotal < 1000 ? 'ct-checkout-disabled' : ''}`}
                disabled={subtotal < 1000}
              >
                {subtotal >= 1000 ? 'Proceder al Checkout' : 'Compra Mínima No Alcanzada'}
              </button>

              <Link to="/products" className="ct-continue-shopping">
                ← Continuar Comprando
              </Link>
            </div>

            <div className="ct-benefits">
              <h4 className="ct-benefits-title">Beneficios de tu compra</h4>
              {/* ✅ CORRECCIÓN: Actualizado a $1000 */}
              <div className="ct-benefit-item">
                <span className="ct-benefit-icon">🚚</span>
                <div className="ct-benefit-text">
                  <strong>Envío gratis</strong> en compras mayores a $1,000 MXN
                </div>
              </div>
              <div className="ct-benefit-item">
                <span className="ct-benefit-icon">💰</span>
                <div className="ct-benefit-text">
                  <strong>Precios competitivos</strong> con la mejor calidad
                </div>
              </div>
              <div className="ct-benefit-item">
                <span className="ct-benefit-icon">↩️</span>
                <div className="ct-benefit-text">
                  <strong>30 días</strong> para devoluciones
                </div>
              </div>
              <div className="ct-benefit-item">
                <span className="ct-benefit-icon">🛡️</span>
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

// ✅ COMPONENTE SEPARADO PARA CADA ITEM DEL CARRITO CON MANEJO DE IMAGEN MEJORADO
const CartItemLarge = ({ item, onQuantityChange, onRemove }) => {
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

  return (
    <div className="ct-item-large">
      <div className="ct-item-image">
        {renderImage()}
      </div>

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
            <span className="ct-promo-badge">🔥 Oferta especial</span>
          </div>
        )}
      </div>

      <div className="ct-item-price-section">
        <div className="ct-price">
          ${typeof item.precioFinal === 'number' ? item.precioFinal.toFixed(2) : parseFloat(item.precioFinal || 0).toFixed(2)} MXN
        </div>
      </div>

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

      <div className="ct-item-total">
        <div className="ct-total-price">
          ${((item.precioFinal || item.precio) * item.quantity).toFixed(2)} MXN
        </div>
        <button 
          onClick={() => onRemove(item.id || item.idProducto)}
          className="ct-remove-btn"
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );
};

export default Cart;