// src/components/Checkout/Checkout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

import paymentService from '../api/paymentService';

// ✅ Configuración de URLs por entorno - USANDO LA MISMA QUE EL CARRITO
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart, getCartItemsCount, debugCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // DEBUG: Verificar carrito
  useEffect(() => {
    console.log('🔍 CHECKOUT - Productos en carrito:', cartItems.map(item => ({
      id: item.id,
      idProducto: item.idProducto,
      codigo: item.codigo,
      nombre: item.nombre,
      tieneCodigo: !!item.codigo,
      codigoValido: item.codigo && item.codigo !== 'N/A'
    })));
  }, [cartItems]);

  const [formData, setFormData] = useState({
    firstName: user?.nombre?.split(' ')[0] || '',
    lastName: user?.nombre?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'México',
    acceptTerms: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getCartTotal();
  const shipping = subtotal >= 1000 ? 0 : 150;
  const tax = subtotal * 0.16;
  const total = subtotal + tax + shipping;

  const canContinueToConfirmation = () => {
    if (currentStep === 1) {
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
      return requiredFields.every(field => formData[field] && formData[field].trim() !== '');
    }
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMercadoPagoPayment = async () => {
    if (!formData.acceptTerms) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }

    setIsProcessing(true);

    try {
      const shippingAddress = {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: 'México'
      };

      const customerInfo = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      };

      const result = await paymentService.createCheckout(
        cartItems,
        shippingAddress,
        customerInfo
      );
      
      if (result.order_number && result.payment_url) {
        window.location.href = result.payment_url;
      } else {
        throw new Error('No se recibió URL de pago');
      }

    } catch (error) {
      console.error('❌ Error al procesar el pago:', error);
      
      if (error.message.includes('Token inválido') || error.message.includes('expirado')) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        logout();
        navigate('/login');
      } else {
        alert('Error al procesar el pago: ' + error.message);
      }
      
      setIsProcessing(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!canContinueToConfirmation()) {
        alert('Por favor completa todos los campos obligatorios antes de continuar.');
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="lcs-co-page">
        <div className="lcs-co-container">
          <div className="lcs-co-empty">
            <h2 className="lcs-co-empty-title">No hay productos en el carrito</h2>
            <p className="lcs-co-empty-text">Agrega algunos productos antes de proceder al checkout</p>
            <button onClick={() => navigate('/products')} className="lcs-co-btn lcs-co-btn-primary">
              Explorar Productos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lcs-co-page">
      <div className="lcs-co-container">
        <div className="lcs-co-header">
          <h1 className="lcs-co-title">Checkout ({getCartItemsCount()})</h1>
          <div className="lcs-co-steps">
            <div className={`lcs-co-step ${currentStep >= 1 ? 'lcs-co-active' : ''}`}>
              <span className="lcs-co-step-number">1</span>
              <span className="lcs-co-step-label">Envío</span>
            </div>
            <div className={`lcs-co-step ${currentStep >= 2 ? 'lcs-co-active' : ''}`}>
              <span className="lcs-co-step-number">2</span>
              <span className="lcs-co-step-label">Confirmación</span>
            </div>
            <div className={`lcs-co-step ${currentStep >= 3 ? 'lcs-co-active' : ''}`}>
              <span className="lcs-co-step-number">3</span>
              <span className="lcs-co-step-label">Pago</span>
            </div>
          </div>
        </div>

        <div className="lcs-co-content">
          <div className="lcs-co-form-section">
            <div className="lcs-co-form">
              {currentStep === 1 && (
                <div className="lcs-co-form-step">
                  <h2 className="lcs-co-step-title">Información de Envío</h2>
                  
                  <div className="lcs-co-form-row">
                    <div className="lcs-co-form-group">
                      <label htmlFor="firstName" className="lcs-co-label">Nombre *</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="lcs-co-input"
                        required
                      />
                    </div>
                    <div className="lcs-co-form-group">
                      <label htmlFor="lastName" className="lcs-co-label">Apellido *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="lcs-co-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="lcs-co-form-row">
                    <div className="lcs-co-form-group">
                      <label htmlFor="email" className="lcs-co-label">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="lcs-co-input"
                        required
                      />
                    </div>
                    <div className="lcs-co-form-group">
                      <label htmlFor="phone" className="lcs-co-label">Teléfono *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="lcs-co-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="lcs-co-form-group">
                    <label htmlFor="address" className="lcs-co-label">Dirección *</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="lcs-co-input"
                      required
                      placeholder="Calle, número, colonia"
                    />
                  </div>

                  <div className="lcs-co-form-row">
                    <div className="lcs-co-form-group">
                      <label htmlFor="city" className="lcs-co-label">Ciudad *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="lcs-co-input"
                        required
                      />
                    </div>
                    <div className="lcs-co-form-group">
                      <label htmlFor="state" className="lcs-co-label">Estado *</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="lcs-co-input"
                        required
                      />
                    </div>
                    <div className="lcs-co-form-group">
                      <label htmlFor="zipCode" className="lcs-co-label">Código Postal *</label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="lcs-co-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="lcs-co-form-actions">
                    <button 
                      type="button" 
                      onClick={nextStep} 
                      className="lcs-co-btn lcs-co-btn-primary"
                      disabled={!canContinueToConfirmation()}
                    >
                      Continuar a Confirmación
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="lcs-co-form-step">
                  <h2 className="lcs-co-step-title">Revisar y Confirmar Pedido</h2>
                  
                  <div className="lcs-co-order-summary">
                    <h3 className="lcs-co-section-title">Resumen del Pedido</h3>
                    <div className="lcs-co-order-items">
                      {cartItems.map(item => (
                        <CheckoutOrderItem 
                          key={item.id || item.idProducto} 
                          item={item} 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="lcs-co-shipping-info">
                    <h3 className="lcs-co-section-title">Dirección de Envío</h3>
                    <div className="lcs-co-shipping-details">
                      <strong>{formData.firstName} {formData.lastName}</strong><br />
                      {formData.address}<br />
                      {formData.city}, {formData.state} {formData.zipCode}<br />
                      {formData.country}<br />
                      📞 {formData.phone}<br />
                      📧 {formData.email}
                    </div>
                  </div>

                  <div className="lcs-co-form-group lcs-co-terms">
                    <label className="lcs-co-terms-label">
                      <input
                        type="checkbox"
                        name="acceptTerms"
                        checked={formData.acceptTerms}
                        onChange={handleInputChange}
                        required
                      />
                      Acepto los <a href="/terms-of-service" target="_blank" rel="noopener noreferrer">términos y condiciones</a> y la{' '}
                      <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">política de privacidad</a>
                    </label>
                  </div>

                  <div className="lcs-co-form-actions">
                    <button type="button" onClick={prevStep} className="lcs-co-btn lcs-co-btn-secondary">
                      ← Volver a Envío
                    </button>
                    <button 
                      type="button" 
                      onClick={nextStep} 
                      className="lcs-co-btn lcs-co-btn-primary"
                      disabled={!formData.acceptTerms}
                    >
                      Continuar a Pago
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="lcs-co-form-step">
                  <h2 className="lcs-co-step-title">Pago con Mercado Pago</h2>
                  
                  <div className="lcs-co-mercadopago-section">
                    <div className="lcs-co-mercadopago-header">
                      <div className="lcs-co-mercadopago-logo">
                        <div className="lcs-co-mp-icon">
                          <img 
                            src="/mer.svg" 
                            alt="Mercado Pago" 
                            className="lcs-co-mp-logo-img"
                          />
                        </div>
                        <h3 className="lcs-co-mp-title">Mercado Pago</h3>
                      </div>
                      <p className="lcs-co-mp-description">
                        Serás redirigido a Mercado Pago para completar tu pago de manera segura
                      </p>
                    </div>

                    {!isAuthenticated && (
                      <div className="lcs-co-auth-required-message">
                        <p className="lcs-co-auth-message-text">
                          🔐 <strong>Autenticación requerida:</strong> Debes iniciar sesión para proceder con el pago.
                        </p>
                      </div>
                    )}

                    <div className="lcs-co-payment-security">
                      <div className="lcs-co-security-badge">
                        <span className="lcs-co-security-icon">🔒</span>
                        <div className="lcs-co-security-text">
                          <strong>Pago 100% seguro</strong>
                          <span>Tus datos están protegidos con encriptación SSL</span>
                        </div>
                      </div>
                    </div>

                    <div className="lcs-co-order-total-payment">
                      <h4 className="lcs-co-total-payment-title">Total a pagar:</h4>
                      <div className="lcs-co-total-payment-amount">${total.toFixed(2)} MXN</div>
                    </div>
                  </div>

                  <div className="lcs-co-form-actions">
                    <button type="button" onClick={prevStep} className="lcs-co-btn lcs-co-btn-secondary">
                      ← Volver a Confirmación
                    </button>
                    
                    {isAuthenticated ? (
                      <button 
                        type="button" 
                        onClick={handleMercadoPagoPayment}
                        className="lcs-co-btn lcs-co-btn-primary lcs-co-btn-mercadopago"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <div className="lcs-co-loading-spinner"></div>
                            Conectando con Mercado Pago...
                          </>
                        ) : (
                          'Pagar con Mercado Pago'
                        )}
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => navigate('/login', { 
                          state: { 
                            from: '/checkout',
                            message: 'Inicia sesión para completar tu compra'
                          }
                        })}
                        className="lcs-co-btn lcs-co-btn-primary lcs-co-btn-login-required"
                      >
                        🔐 Iniciar Sesión para Pagar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lcs-co-summary">
            <div className="lcs-co-summary-card">
              <h3 className="lcs-co-summary-title">Resumen del Pedido</h3>
              
              <div className="lcs-co-order-preview">
                {cartItems.map(item => (
                  <CheckoutPreviewItem 
                    key={item.id || item.idProducto} 
                    item={item} 
                  />
                ))}
              </div>

              <div className="lcs-co-summary-details">
                <div className="lcs-co-summary-row">
                  <span className="lcs-co-summary-label">Subtotal ({getCartItemsCount()} productos):</span>
                  <span className="lcs-co-summary-value">${subtotal.toFixed(2)} MXN</span>
                </div>
                
                <div className="lcs-co-summary-row">
                  <span className="lcs-co-summary-label">IVA (16%):</span>
                  <span className="lcs-co-summary-value">${tax.toFixed(2)} MXN</span>
                </div>
                
                <div className="lcs-co-summary-row">
                  <span className="lcs-co-summary-label">Envío:</span>
                  <span className="lcs-co-summary-value">
                    {subtotal >= 1000 ? (
                      <span className="lcs-co-free-shipping-text">GRATIS</span>
                    ) : (
                      <span className="lcs-co-shipping-cost-text">$150.00 MXN</span>
                    )}
                  </span>
                </div>
                
                <div className="lcs-co-summary-divider"></div>
                <div className="lcs-co-summary-row lcs-co-total">
                  <span className="lcs-co-total-label">Total:</span>
                  <span className="lcs-co-total-amount">${total.toFixed(2)} MXN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ COMPONENTE DE ITEM PARA CHECKOUT - MISMAS FUNCIONALIDADES QUE EL CARRITO
const CheckoutOrderItem = ({ item }) => {
  const [imageStatus, setImageStatus] = useState('loading');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef(null);
  const retryCountRef = useRef(0);

  // ✅ EXACTAMENTE LA MISMA LÓGICA QUE EL CARRITO
  useEffect(() => {
    console.log('🖼️ CheckoutOrderItem - Iniciando carga para:', {
      nombre: item.nombre,
      codigo: item.codigo,
      id: item.id
    });

    if (!item.codigo || item.codigo === 'N/A') {
      console.warn('⚠️ No hay código válido para:', item.nombre);
      setImageStatus('error');
      return;
    }

    retryCountRef.current = 0;
    setImageStatus('loading');
    setImageError(false);
    
    // ✅ EXACTAMENTE LA MISMA URL QUE USA EL CARRITO
    const url = `${IMAGE_BASE_URL}/${item.codigo}?size=full&t=${Date.now()}`;
    console.log('🔗 URL generada (igual que carrito):', url);
    setCurrentImageUrl(url);
  }, [item.codigo, item.nombre, item.id]);

  // ✅ EXACTAMENTE EL MISMO MANEJO DE IMAGENES QUE EL CARRITO
  useEffect(() => {
    if (!imgRef.current || !currentImageUrl) return;

    const img = imgRef.current;
    let isMounted = true;
    
    const handleLoad = () => {
      if (!isMounted) return;
      console.log('✅ Imagen cargada exitosamente:', currentImageUrl);
      setImageStatus('loaded');
    };

    const handleError = () => {
      if (!isMounted) return;
      
      console.error('❌ Error cargando imagen:', {
        url: currentImageUrl,
        codigo: item.codigo,
        retryCount: retryCountRef.current
      });
      
      if (retryCountRef.current < 2) {
        retryCountRef.current += 1;
        
        setTimeout(() => {
          if (!isMounted) return;
          const sizes = ['full', 'medium', 'small', ''];
          const retrySize = sizes[retryCountRef.current] || 'full';
          const retryUrl = `${IMAGE_BASE_URL}/${item.codigo}${retrySize ? `?size=${retrySize}` : ''}&t=${Date.now()}&retry=${retryCountRef.current}`;
          console.log('🔄 Reintento', retryCountRef.current, 'con URL:', retryUrl);
          setCurrentImageUrl(retryUrl);
          setImageStatus('loading');
        }, 500);
      } else {
        setImageError(true);
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

  // ✅ MISMOS ESTILOS Y ESTRUCTURA QUE EL CARRITO
  const renderImage = () => {
    if (imageStatus === 'error' || imageError) {
      return (
        <div className="lcs-co-order-item-image-error">
          <div className="lcs-co-error-icon">📷</div>
          <div className="lcs-co-error-text">Imagen no disponible</div>
          <small className="lcs-co-error-code">{item.codigo || 'Sin código'}</small>
        </div>
      );
    }

    return (
      <>
        <img 
          ref={imgRef}
          src={currentImageUrl}
          alt={item.nombre || 'Producto'}
          className={`lcs-co-order-item-image-img ${imageStatus === 'loaded' ? 'lcs-co-loaded' : 'lcs-co-loading'}`}
          crossOrigin="anonymous"
          loading="lazy"
        />
        
        {imageStatus === 'loading' && (
          <div className="lcs-co-image-loading">
            <div className="lcs-co-loading-spinner"></div>
            {retryCountRef.current > 0 && (
              <div className="lcs-co-retry-text">Intento {retryCountRef.current}</div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="lcs-co-order-item">
      <div className="lcs-co-order-item-image">
        {renderImage()}
      </div>

      <div className="lcs-co-order-item-details">
        <h4 className="lcs-co-order-item-name">
          {item.nombre || 'Producto sin nombre'}
        </h4>
        <p className="lcs-co-order-item-brand">{item.marca || 'Sin marca'}</p>
        <p className="lcs-co-order-item-code">Código: {item.codigo || 'N/A'}</p>
        
        {item.promociones && item.promociones.length > 0 && (
          <div className="lcs-co-item-promo">
            <span className="lcs-co-promo-badge">🔥 Oferta especial</span>
          </div>
        )}
      </div>

      <div className="lcs-co-order-item-quantity">
        <span className="lcs-co-order-quantity-label">Cantidad:</span>
        <span className="lcs-co-order-quantity-value">{item.quantity}</span>
      </div>

      <div className="lcs-co-order-item-total">
        <div className="lcs-co-order-total-price">
          ${((item.precioFinal || item.precio) * item.quantity).toFixed(2)} MXN
        </div>
        {item.precioFinal !== item.precio && (
          <div className="lcs-co-order-unit-price">
            ${(item.precioFinal || item.precio).toFixed(2)} c/u
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ COMPONENTE DE PREVIEW - MISMAS FUNCIONALIDADES QUE EL DROPDOWN DEL CARRITO
const CheckoutPreviewItem = ({ item }) => {
  const [imageStatus, setImageStatus] = useState('loading');
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef(null);
  const retryCountRef = useRef(0);

  // ✅ EXACTAMENTE LA MISMA LÓGICA QUE EL DROPDOWN DEL CARRITO
  useEffect(() => {
    if (!item.codigo || item.codigo === 'N/A') {
      setImageStatus('error');
      return;
    }

    retryCountRef.current = 0;
    setImageStatus('loading');
    setImageError(false);
    
    // ✅ MISMA URL QUE USA EL DROPDOWN DEL CARRITO
    const url = `${IMAGE_BASE_URL}/${item.codigo}?size=full&t=${Date.now()}`;
    setCurrentImageUrl(url);
  }, [item.codigo]);

  // ✅ EXACTAMENTE EL MISMO MANEJO QUE EL DROPDOWN DEL CARRITO
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
        setImageError(true);
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

  // ✅ MISMOS ESTILOS Y ESTRUCTURA QUE EL DROPDOWN DEL CARRITO
  const renderImage = () => {
    if (imageStatus === 'error' || imageError) {
      return (
        <div className="lcs-co-preview-item-image-error">
          <div className="lcs-co-error-icon-small">📷</div>
          <small className="lcs-co-error-text-small">Sin imagen</small>
        </div>
      );
    }

    return (
      <>
        <img 
          ref={imgRef}
          src={currentImageUrl}
          alt={item.nombre || 'Producto'}
          className={`lcs-co-preview-item-image ${imageStatus === 'loaded' ? 'lcs-co-loaded' : 'lcs-co-loading'}`}
          crossOrigin="anonymous"
          loading="lazy"
        />
        
        {imageStatus === 'loading' && (
          <div className="lcs-co-image-loading-small">
            <div className="lcs-co-loading-spinner-small"></div>
            {retryCountRef.current > 0 && (
              <div className="lcs-co-retry-text-small">Intento {retryCountRef.current}</div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="lcs-co-preview-item">
      <div className="lcs-co-preview-item-image-container">
        {renderImage()}
      </div>
      <div className="lcs-co-preview-info">
        <span className="lcs-co-preview-name">{item.nombre || `Producto ${item.codigo}`}</span>
        <span className="lcs-co-preview-brand">{item.marca || 'Sin marca'}</span>
        <span className="lcs-co-preview-quantity">x{item.quantity}</span>
      </div>
      <span className="lcs-co-preview-price">
        ${((item.precioFinal || item.precio) * item.quantity).toFixed(2)}
      </span>
    </div>
  );
};

// ✅ FUNCIÓN DE DEBUG PARA VERIFICAR
if (process.env.NODE_ENV === 'development') {
  window.debugCheckoutImages = () => {
    const cart = JSON.parse(localStorage.getItem('ctonline_cart') || '[]');
    
    console.log('🐛 DEBUG CHECKOUT IMAGES');
    console.log('📦 Total items en carrito:', cart.length);
    
    cart.forEach((item, index) => {
      console.log(`📦 Item ${index + 1}:`, {
        nombre: item.nombre,
        codigo: item.codigo,
        id: item.id,
        idProducto: item.idProducto,
        // URL que debería funcionar
        testUrl: `${IMAGE_BASE_URL}/${item.codigo}`,
        // Todas las propiedades disponibles
        propiedades: Object.keys(item).filter(key => 
          !['addedAt', 'imagen', 'imagenFecha'].includes(key)
        )
      });
      
      // Probar la URL directamente
      if (item.codigo) {
        const testUrl = `${IMAGE_BASE_URL}/${item.codigo}`;
        console.log(`   🔗 Test URL: ${testUrl}`);
        
        // Crear imagen de prueba
        const img = new Image();
        img.onload = () => console.log(`   ✅ URL funciona: ${testUrl}`);
        img.onerror = () => console.log(`   ❌ URL falla: ${testUrl}`);
        img.src = testUrl;
      }
    });
  };
}

export default Checkout;