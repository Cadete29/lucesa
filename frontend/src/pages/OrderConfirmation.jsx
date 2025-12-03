import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './OrderConfirmation.css';

const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

const OrderConfirmation = () => {
  const location = useLocation();
  const { user, saveOrderToHistory } = useAuth();
  
  // ✅ Recibir order_number (LUCESA) desde el backend
  const { order_number, orderId, total, cartItems, subtotal, tax, shipping } = location.state || {};
  
  // ✅ Usar order_number del backend como prioridad
  const displayOrderNumber = order_number || orderId;
  
  const [orderSaved, setOrderSaved] = useState(false);

  useEffect(() => {
    const saveOrder = async () => {
      if (!displayOrderNumber || orderSaved || !user) {
        return;
      }

      try {
        const orderData = {
          order_number: displayOrderNumber, // ✅ Usar número LUCESA
          total,
          cartItems: cartItems || [],
          subtotal,
          tax,
          shipping
        };

        const result = await saveOrderToHistory(orderData);
        
        if (result.success) {
          console.log('Orden guardada en historial:', result.order);
          setOrderSaved(true);
        } else {
          console.error('Error al guardar orden:', result.error);
        }
      } catch (error) {
        console.error('Error al guardar orden:', error);
      }
    };

    saveOrder();
  }, [displayOrderNumber, user, saveOrderToHistory, orderSaved, total, cartItems, subtotal, tax, shipping]);

  const safeSubtotal = subtotal ? parseFloat(subtotal) : 0;
  const safeTax = tax ? parseFloat(tax) : 0;
  const safeShipping = shipping ? parseFloat(shipping) : 0;
  const safeTotal = total ? parseFloat(total) : (safeSubtotal + safeTax + safeShipping);

  if (!displayOrderNumber) {
    return (
      <div className="oc-page">
        <div className="oc-container">
          <div className="oc-error">
            <h2 className="oc-error-title">Información de orden no disponible</h2>
            <p className="oc-error-text">No se pudo encontrar la información de tu pedido.</p>
            <Link to="/" className="oc-btn oc-btn-primary">Volver al Inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="oc-page">
        <div className="oc-container">
          <div className="oc-error">
            <h2 className="oc-error-title">Usuario no autenticado</h2>
            <p className="oc-error-text">Debes iniciar sesión para completar tu pedido.</p>
            <Link to="/login" className="oc-btn oc-btn-primary">Iniciar Sesión</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="oc-page">
      <div className="oc-container">
        <div className="oc-card">
          {orderSaved && (
            <div className="oc-save-status oc-save-success">
              ✅ Orden guardada en tu historial de compras
            </div>
          )}
          
          <div className="oc-header">
            <div className="oc-success-icon">✅</div>
            <h1 className="oc-title">¡Pedido Confirmado!</h1>
            {/* ✅ Mostrar el número LUCESA del backend */}
            <p className="oc-order-number">Número de orden: {displayOrderNumber}</p>
            {displayOrderNumber.startsWith('LUCESA-') && (
              <div className="oc-lucesa-badge">
                <span className="oc-lucesa-icon">🏭</span>
                <span className="oc-lucesa-text">Orden LUCESA</span>
              </div>
            )}
          </div>

          <div className="oc-details">
            <div className="oc-products-section">
              <h3 className="oc-section-title">Productos Comprados</h3>
              
              {cartItems && cartItems.length > 0 ? (
                <div className="oc-products-list">
                  {cartItems.map((item, index) => {
                    const productName = item.nombre || 'Producto sin nombre';
                    const productBrand = item.marca || 'Sin marca';
                    const productCode = item.codigo || 'N/A';
                    const quantity = item.quantity || 1;
                    const unitPrice = item.precioFinal || item.precio || 0;
                    const totalPrice = unitPrice * quantity;

                    return (
                      <div key={index} className="oc-product-item">
                        <div className="oc-product-image">
                          <ProductImage item={item} />
                        </div>

                        <div className="oc-product-info">
                          <h4 className="oc-product-name">{productName}</h4>
                          <div className="oc-product-details">
                            <span className="oc-product-brand">{productBrand}</span>
                            <span className="oc-product-code">Código: {productCode}</span>
                            <span className="oc-product-quantity">Cantidad: {quantity}</span>
                          </div>
                        </div>
                        <div className="oc-product-pricing">
                          <span className="oc-product-unit-price">
                            ${parseFloat(unitPrice).toFixed(2)} c/u
                          </span>
                          <span className="oc-product-total-price">
                            ${parseFloat(totalPrice).toFixed(2)} MXN
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="oc-no-products">
                  <p>No se encontraron productos en este pedido.</p>
                </div>
              )}
            </div>

            <div className="oc-detail-section">
              <h3 className="oc-section-title">Resumen del Pago</h3>
              <div className="oc-pricing-breakdown">
                <div className="oc-pricing-row">
                  <span className="oc-pricing-label">Subtotal:</span>
                  <span className="oc-pricing-value">
                    ${safeSubtotal.toFixed(2)} MXN
                  </span>
                </div>
                
                <div className="oc-pricing-row">
                  <span className="oc-pricing-label">IVA (16%):</span>
                  <span className="oc-pricing-value">
                    ${safeTax.toFixed(2)} MXN
                  </span>
                </div>
                
                <div className="oc-pricing-row">
                  <span className="oc-pricing-label">Envío:</span>
                  <span className="oc-pricing-value">
                    {safeShipping === 0 ? (
                      <span className="oc-free-shipping">GRATIS</span>
                    ) : safeShipping > 0 ? (
                      `$${safeShipping.toFixed(2)} MXN`
                    ) : (
                      'No aplica'
                    )}
                  </span>
                </div>
                
                <div className="oc-pricing-divider"></div>
                
                <div className="oc-pricing-row oc-total-row">
                  <span className="oc-total-label">Total:</span>
                  <span className="oc-total-amount">${safeTotal.toFixed(2)} MXN</span>
                </div>
              </div>
            </div>

            <div className="oc-detail-section">
              <h3 className="oc-section-title">Información del Pedido</h3>
              <div className="oc-detail-grid">
                <div className="oc-detail-row">
                  <span className="oc-detail-label">Número de orden:</span>
                  <span className="oc-detail-value oc-order-number-highlight">{displayOrderNumber}</span>
                </div>
                <div className="oc-detail-row">
                  <span className="oc-detail-label">Fecha de pedido:</span>
                  <span className="oc-detail-value">{new Date().toLocaleDateString('es-MX')}</span>
                </div>
                <div className="oc-detail-row">
                  <span className="oc-detail-label">Hora:</span>
                  <span className="oc-detail-value">{new Date().toLocaleTimeString('es-MX')}</span>
                </div>
                <div className="oc-detail-row">
                  <span className="oc-detail-label">Estado:</span>
                  <span className="oc-status oc-confirmed">Confirmado</span>
                </div>
                <div className="oc-detail-row">
                  <span className="oc-detail-label">Método de pago:</span>
                  <span className="oc-detail-value">Mercado Pago</span>
                </div>
                {safeShipping === 0 && (
                  <div className="oc-detail-row">
                    <span className="oc-detail-label">Envío:</span>
                    <span className="oc-detail-value oc-free-shipping-badge">🎉 ¡Envío gratis aplicado!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="oc-next-steps">
              <h3 className="oc-section-title">¿Qué sigue?</h3>
              <div className="oc-steps-timeline">
                <div className="oc-step-item">
                  <span className="oc-step-number">1</span>
                  <div className="oc-step-content">
                    <strong className="oc-step-title">Preparación del pedido</strong>
                    <p className="oc-step-desc">Tu pedido está siendo preparado para el envío</p>
                    <span className="oc-step-time">1-2 días hábiles</span>
                  </div>
                </div>
                <div className="oc-step-item">
                  <span className="oc-step-number">2</span>
                  <div className="oc-step-content">
                    <strong className="oc-step-title">Envío</strong>
                    <p className="oc-step-desc">Recibirás un email con tu ticket, guárdalo para cualquier aclaración o duda</p>
                    <span className="oc-step-time">3-5 días hábiles</span>
                  </div>
                </div>
                <div className="oc-step-item">
                  <span className="oc-step-number">3</span>
                  <div className="oc-step-content">
                    <strong className="oc-step-title">Entrega</strong>
                    <p className="oc-step-desc">Tu pedido llegará a tu dirección registrada</p>
                    <span className="oc-step-time">Entrega final</span>
                  </div>
                </div>
                <div className="oc-step-item">
                  <span className="oc-step-number">4</span>
                  <div className="oc-step-content">
                    <strong className="oc-step-title">Recomiéndanos</strong>
                    <p className="oc-step-desc">¡Muchas gracias por tu compra!</p>
                    <span className="oc-step-time">Regresa pronto</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="oc-actions">
            <Link to="/products" className="oc-btn oc-btn-primary">
              Seguir Comprando
            </Link>
            <Link to="/user-profile?tab=orders" className="oc-btn oc-btn-secondary">
              Ver Mis Pedidos
            </Link>
            <button 
              onClick={() => window.print()} 
              className="oc-btn oc-btn-outline"
            >
              📄 Imprimir Confirmación
            </button>
          </div>

          <div className="oc-support">
            <p className="oc-support-text">¿Tienes preguntas sobre tu pedido?</p>
            <div className="oc-support-contacts">
              <a href="mailto:luis.lucio@lucesademexico.com" className="oc-support-link">
                📧 luis.lucio@lucesademexico.com
              </a>
              <a href="tel:+525555555555" className="oc-support-link">
                📞 +52 55 5555 5555
              </a>
              <span className="oc-support-hours">
                🕒 Horario: Lunes a Viernes 9:00 - 18:00
              </span>
            </div>
            <div className="oc-order-reference">
              <p className="oc-reference-text">
                <strong>Referencia:</strong> {displayOrderNumber}
              </p>
              <p className="oc-reference-note">
                Por favor, menciona tu número de orden LUCESA en cualquier comunicación
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductImage = ({ item }) => {
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
    
    const url = `${IMAGE_BASE_URL}/${item.codigo}?size=small&t=${Date.now()}`;
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
          const sizes = ['small', 'full', 'medium', ''];
          const retrySize = sizes[retryCountRef.current] || 'small';
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
        <div className="oc-product-image-error">
          <div className="oc-image-error-icon">📷</div>
          <div className="oc-image-error-text">Imagen no disponible</div>
        </div>
      );
    }

    return (
      <>
        <img 
          ref={imgRef}
          src={currentImageUrl}
          alt={item.nombre || 'Producto'}
          className={`oc-product-image-img ${imageStatus === 'loaded' ? 'oc-loaded' : 'oc-loading'}`}
          crossOrigin="anonymous"
          loading="lazy"
        />
        
        {imageStatus === 'loading' && (
          <div className="oc-image-loading">
            <div className="oc-loading-spinner"></div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="oc-product-image-container">
      {renderImage()}
    </div>
  );
};

export default OrderConfirmation;