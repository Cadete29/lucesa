import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

import paymentService from '../api/paymentService';

const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart, getCartItemsCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
  const [orderData, setOrderData] = useState(null);

  const subtotal = getCartTotal();
  const shipping = subtotal >= 1000 ? 0 : 150;
  const tax = subtotal * 0.16;
  const total = subtotal + tax + shipping;

  // ✅ Validación PERMISIVA - Solo verifica precio y cantidad
  const validateCartItems = (items) => {
    const invalidItems = items.filter(item => {
      const hasPrice = (item.precioFinal || item.precio) > 0;
      const hasQuantity = item.quantity && item.quantity > 0;
      
      return !hasPrice || !hasQuantity;
    });

    if (invalidItems.length > 0) {
      console.warn('⚠️ Productos con precio o cantidad inválida:', invalidItems);
      return false;
    }

    return true;
  };

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

    // ✅ Validación PERMISIVA - Solo precio y cantidad
    if (!validateCartItems(cartItems)) {
      alert('Algunos productos tienen precio o cantidad inválida. Por favor, revisa tu carrito.');
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

      console.log('🛒 Iniciando proceso de pago...');
      console.log('📦 Items:', cartItems.length);
      console.log('🏠 Dirección:', shippingAddress);
      console.log('👤 Cliente:', customerInfo);
      console.log('🔍 Productos en carrito:', cartItems.map(item => ({
        nombre: item.nombre || 'Sin nombre (se generará automáticamente)',
        codigo: item.codigo || 'Sin código',
        precio: item.precioFinal || item.precio,
        cantidad: item.quantity
      })));

      // ✅ EL TOKEN SE ENVÍA AUTOMÁTICAMENTE DESDE EL SERVICE
      const result = await paymentService.createCheckout(
        cartItems,
        shippingAddress,
        customerInfo
      );

      console.log('✅ Pago creado exitosamente:', result);
      
      // Redirigir al checkout de Mercado Pago
      if (result.payment_url) {
        window.location.href = result.payment_url;
      } else {
        throw new Error('No se recibió URL de pago');
      }

    } catch (error) {
      console.error('❌ Error al procesar el pago:', error);
      
      if (error.message.includes('Token inválido') || error.message.includes('expirado')) {
        // Token expirado - forzar logout
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
      <div className="co-page">
        <div className="co-container">
          <div className="co-empty">
            <h2 className="co-empty-title">No hay productos en el carrito</h2>
            <p className="co-empty-text">Agrega algunos productos antes de proceder al checkout</p>
            <button onClick={() => navigate('/products')} className="co-btn co-btn-primary">
              Explorar Productos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="co-page">
      <div className="co-container">
        <div className="co-header">
          <h1 className="co-title">Checkout ({getCartItemsCount()})</h1>
          <div className="co-steps">
            <div className={`co-step ${currentStep >= 1 ? 'co-active' : ''}`}>
              <span className="co-step-number">1</span>
              <span className="co-step-label">Envío</span>
            </div>
            <div className={`co-step ${currentStep >= 2 ? 'co-active' : ''}`}>
              <span className="co-step-number">2</span>
              <span className="co-step-label">Confirmación</span>
            </div>
            <div className={`co-step ${currentStep >= 3 ? 'co-active' : ''}`}>
              <span className="co-step-number">3</span>
              <span className="co-step-label">Pago</span>
            </div>
          </div>
        </div>

        <div className="co-content">
          <div className="co-form-section">
            <div className="co-form">
              {currentStep === 1 && (
                <div className="co-form-step">
                  <h2 className="co-step-title">Información de Envío</h2>
                  
                  <div className="co-form-row">
                    <div className="co-form-group">
                      <label htmlFor="firstName" className="co-label">Nombre *</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="co-input"
                        required
                      />
                    </div>
                    <div className="co-form-group">
                      <label htmlFor="lastName" className="co-label">Apellido *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="co-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="co-form-row">
                    <div className="co-form-group">
                      <label htmlFor="email" className="co-label">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="co-input"
                        required
                      />
                    </div>
                    <div className="co-form-group">
                      <label htmlFor="phone" className="co-label">Teléfono *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="co-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="co-form-group">
                    <label htmlFor="address" className="co-label">Dirección *</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="co-input"
                      required
                      placeholder="Calle, número, colonia"
                    />
                  </div>

                  <div className="co-form-row">
                    <div className="co-form-group">
                      <label htmlFor="city" className="co-label">Ciudad *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="co-input"
                        required
                      />
                    </div>
                    <div className="co-form-group">
                      <label htmlFor="state" className="co-label">Estado *</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="co-input"
                        required
                      />
                    </div>
                    <div className="co-form-group">
                      <label htmlFor="zipCode" className="co-label">Código Postal *</label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="co-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="co-shipping-info-minimum">
                    <div className="co-shipping-header">
                      <span className="co-shipping-icon">🚚</span>
                      <h3 className="co-shipping-title">Información de Envío</h3>
                    </div>
                    
                    {subtotal >= 1000 ? (
                      <div className="co-free-shipping-active">
                        <div className="co-free-shipping-badge-large">🎉 ¡ENVÍO GRATIS!</div>
                        <p className="co-free-shipping-description">
                          Tu compra califica para envío gratis estándar (3-5 días hábiles)
                        </p>
                      </div>
                    ) : (
                      <div className="co-shipping-cost">
                        <div className="co-shipping-warning">
                          <span className="co-warning-icon">📦</span>
                          <div className="co-warning-content">
                            <h4 className="co-warning-title">Costo de envío: $150 MXN</h4>
                            <p className="co-warning-text">
                              El envío gratis está disponible en compras mayores a <strong>$1,000 MXN</strong>
                            </p>
                            <div className="co-amount-needed">
                              <span className="co-amount-label">Faltan para envío gratis: </span>
                              <span className="co-amount-value">${(1000 - subtotal).toFixed(2)} MXN</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="co-form-actions">
                    <button 
                      type="button" 
                      onClick={nextStep} 
                      className="co-btn co-btn-primary"
                      disabled={!canContinueToConfirmation()}
                    >
                      Continuar a Confirmación
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="co-form-step">
                  <h2 className="co-step-title">Revisar y Confirmar Pedido</h2>
                  
                  <div className="co-order-summary">
                    <h3 className="co-section-title">Resumen del Pedido</h3>
                    <div className="co-order-items">
                      {cartItems.map(item => (
                        <CheckoutOrderItem 
                          key={item.id || item.idProducto} 
                          item={item} 
                        />
                      ))}
                    </div>
                  </div>

                  <div className="co-shipping-info">
                    <h3 className="co-section-title">Dirección de Envío</h3>
                    <div className="co-shipping-details">
                      <strong>{formData.firstName} {formData.lastName}</strong><br />
                      {formData.address}<br />
                      {formData.city}, {formData.state} {formData.zipCode}<br />
                      {formData.country}<br />
                      📞 {formData.phone}<br />
                      📧 {formData.email}
                    </div>
                  </div>

                  <div className="co-form-group co-terms">
                    <label className="co-terms-label">
                      <input
                        type="checkbox"
                        name="acceptTerms"
                        checked={formData.acceptTerms}
                        onChange={handleInputChange}
                        required
                      />
                      Acepto los <a href="/terms" target="_blank" rel="noopener noreferrer">términos y condiciones</a> y la{' '}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer">política de privacidad</a>
                    </label>
                  </div>

                  <div className="co-form-actions">
                    <button type="button" onClick={prevStep} className="co-btn co-btn-secondary">
                      ← Volver a Envío
                    </button>
                    <button 
                      type="button" 
                      onClick={nextStep} 
                      className="co-btn co-btn-primary"
                      disabled={!formData.acceptTerms}
                    >
                      Continuar a Pago
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="co-form-step">
                  <h2 className="co-step-title">Pago con Mercado Pago</h2>
                  
                  <div className="co-mercadopago-section">
                    <div className="co-mercadopago-header">
                      <div className="co-mercadopago-logo">
                        <div className="co-mp-icon">
                          <img 
                            src="/mer.svg" 
                            alt="Mercado Pago" 
                            className="co-mp-logo-img"
                          />
                        </div>
                        <h3 className="co-mp-title">Mercado Pago</h3>
                      </div>
                      <p className="co-mp-description">
                        Serás redirigido a Mercado Pago para completar tu pago de manera segura
                      </p>
                    </div>

                    {!isAuthenticated && (
                      <div className="co-auth-required-message">
                        <p className="co-auth-message-text">
                          🔐 <strong>Autenticación requerida:</strong> Debes iniciar sesión para proceder con el pago.
                        </p>
                      </div>
                    )}

                    <div className="co-payment-security">
                      <div className="co-security-badge">
                        <span className="co-security-icon">🔒</span>
                        <div className="co-security-text">
                          <strong>Pago 100% seguro</strong>
                          <span>Tus datos están protegidos con encriptación SSL</span>
                        </div>
                      </div>
                    </div>

                    <div className="co-payment-methods-preview">
                      <h4 className="co-payment-methods-title">Métodos de pago aceptados:</h4>
                      <div className="co-payment-methods-grid">
                        <div className="co-payment-method">
                          <span className="co-method-icon">💳</span>
                          <span className="co-method-name">Tarjetas de crédito</span>
                        </div>
                        <div className="co-payment-method">
                          <span className="co-method-icon">🏦</span>
                          <span className="co-method-name">Tarjetas de débito</span>
                        </div>
                        <div className="co-payment-method">
                          <span className="co-method-icon">📱</span>
                          <span className="co-method-name">Mercado Pago</span>
                        </div>
                      </div>
                    </div>

                    <div className="co-order-total-payment">
                      <h4 className="co-total-payment-title">Total a pagar:</h4>
                      <div className="co-total-payment-amount">${total.toFixed(2)} MXN</div>
                    </div>
                  </div>

                  <div className="co-form-actions">
                    <button type="button" onClick={prevStep} className="co-btn co-btn-secondary">
                      ← Volver a Confirmación
                    </button>
                    
                    {isAuthenticated ? (
                      <button 
                        type="button" 
                        onClick={handleMercadoPagoPayment}
                        className="co-btn co-btn-primary co-btn-mercadopago"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <div className="co-loading-spinner"></div>
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
                        className="co-btn co-btn-primary co-btn-login-required"
                      >
                        🔐 Iniciar Sesión para Pagar
                      </button>
                    )}
                  </div>

                  <div className="co-payment-note">
                    <p className="co-note-text">
                      💡 <strong>Nota:</strong> Después del pago, serás redirigido automáticamente a nuestra página de confirmación.
                    </p>
                    <p className="co-note-text">
                      🔄 <strong>Información:</strong> Los productos sin nombre se procesarán automáticamente con nombres generados.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="co-summary">
            <div className="co-summary-card">
              <h3 className="co-summary-title">Resumen del Pedido</h3>
              
              <div className="co-order-preview">
                {cartItems.map(item => (
                  <CheckoutPreviewItem 
                    key={item.id || item.idProducto} 
                    item={item} 
                  />
                ))}
              </div>

              <div className="co-summary-details">
                <div className="co-summary-row">
                  <span className="co-summary-label">Subtotal ({getCartItemsCount()} productos):</span>
                  <span className="co-summary-value">${subtotal.toFixed(2)} MXN</span>
                </div>
                
                <div className="co-summary-row">
                  <span className="co-summary-label">IVA (16%):</span>
                  <span className="co-summary-value">${tax.toFixed(2)} MXN</span>
                </div>
                
                <div className="co-summary-row">
                  <span className="co-summary-label">Envío:</span>
                  <span className="co-summary-value">
                    {subtotal >= 1000 ? (
                      <span className="co-free-shipping-text">GRATIS</span>
                    ) : (
                      <span className="co-shipping-cost-text">$150.00 MXN</span>
                    )}
                  </span>
                </div>
                
                {subtotal < 1000 && (
                  <div className="co-minimum-notice">
                    <div className="co-minimum-notice-content">
                      <span className="co-notice-icon">🎁</span>
                      <div className="co-notice-text">
                        <strong>¡Envío gratis disponible!</strong>
                        <span>Faltan ${(1000 - subtotal).toFixed(2)} MXN</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="co-summary-divider"></div>
                <div className="co-summary-row co-total">
                  <span className="co-total-label">Total:</span>
                  <span className="co-total-amount">${total.toFixed(2)} MXN</span>
                </div>
              </div>
            </div>

            <div className="co-benefits">
              <h4 className="co-benefits-title">Beneficios de tu compra</h4>
              <div className="co-benefit-item">
                <span className="co-benefit-icon">🚚</span>
                <div className="co-benefit-text">
                  <strong>Envío gratis</strong> en compras mayores a $1,000 MXN
                </div>
              </div>
              <div className="co-benefit-item">
                <span className="co-benefit-icon">💳</span>
                <div className="co-benefit-text">
                  <strong>Pago seguro</strong> con Mercado Pago
                </div>
              </div>
              <div className="co-benefit-item">
                <span className="co-benefit-icon">↩️</span>
                <div className="co-benefit-text">
                  <strong>30 días</strong> para devoluciones
                </div>
              </div>
              <div className="co-benefit-item">
                <span className="co-benefit-icon">🛡️</span>
                <div className="co-benefit-text">
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

const CheckoutOrderItem = ({ item }) => {
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
        <div className="co-order-item-image-error">
          <div className="co-error-icon">📷</div>
          <div className="co-error-text">Imagen no disponible</div>
          <small className="co-error-code">{item.codigo || 'Sin código'}</small>
        </div>
      );
    }

    return (
      <>
        <img 
          ref={imgRef}
          src={currentImageUrl}
          alt={item.nombre || 'Producto Lucesa'}
          className={`co-order-item-image-img ${imageStatus === 'loaded' ? 'co-loaded' : 'co-loading'}`}
          crossOrigin="anonymous"
          loading="lazy"
        />
        
        {imageStatus === 'loading' && (
          <div className="co-image-loading">
            <div className="co-loading-spinner"></div>
            {retryCountRef.current > 0 && (
              <div className="co-retry-text">Intento {retryCountRef.current}</div>
            )}
          </div>
        )}
      </>
    );
  };

  // ✅ Función para generar nombre amigable si no hay nombre
  const getProductName = () => {
    if (item.nombre && item.nombre.trim() !== '') {
      return item.nombre;
    }
    
    if (item.descripcion && item.descripcion.trim() !== '') {
      return item.descripcion.substring(0, 60) + '...';
    }
    
    if (item.codigo) {
      return `Producto ${item.codigo}`;
    }
    
    if (item.marca && item.marca.trim() !== '') {
      return `Producto ${item.marca}`;
    }
    
    return 'Producto Lucesa';
  };

  // ✅ Función para generar código amigable si no hay código
  const getProductCode = () => {
    if (item.codigo && item.codigo.trim() !== '') {
      return item.codigo;
    }
    
    if (item.id) {
      return `ID-${item.id}`;
    }
    
    return 'N/A';
  };

  return (
    <div className="co-order-item">
      <div className="co-order-item-image">
        {renderImage()}
      </div>

      <div className="co-order-item-details">
        <h4 className="co-order-item-name">{getProductName()}</h4>
        <p className="co-order-item-brand">{item.marca || 'Sin marca'}</p>
        <p className="co-order-item-code">Código: {getProductCode()}</p>
        
        {(!item.nombre || !item.codigo) && (
          <div className="co-order-item-info">
            <span className="co-auto-generated-badge">🔄 Nombre generado automáticamente</span>
          </div>
        )}
        
        {item.promociones && item.promociones.length > 0 && (
          <div className="co-order-item-promo">
            <span className="co-order-promo-badge">🔥 Oferta especial</span>
          </div>
        )}
      </div>

      <div className="co-order-item-quantity">
        <span className="co-order-quantity-label">Cantidad:</span>
        <span className="co-order-quantity-value">{item.quantity}</span>
      </div>

      <div className="co-order-item-total">
        <div className="co-order-total-price">
          ${((item.precioFinal || item.precio) * item.quantity).toFixed(2)} MXN
        </div>
        <div className="co-order-unit-price">
          ${typeof item.precioFinal === 'number' ? item.precioFinal.toFixed(2) : parseFloat(item.precioFinal || 0).toFixed(2)} c/u
        </div>
      </div>
    </div>
  );
};

const CheckoutPreviewItem = ({ item }) => {
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
        <div className="co-preview-item-image-error">
          <div className="co-error-icon-small">📷</div>
        </div>
      );
    }

    return (
      <>
        <img 
          ref={imgRef}
          src={currentImageUrl}
          alt={item.nombre || 'Producto Lucesa'}
          className={`co-preview-item-image ${imageStatus === 'loaded' ? 'co-loaded' : 'co-loading'}`}
          crossOrigin="anonymous"
          loading="lazy"
        />
        
        {imageStatus === 'loading' && (
          <div className="co-image-loading-small">
            <div className="co-loading-spinner-small"></div>
          </div>
        )}
      </>
    );
  };

  // ✅ Función para generar nombre amigable si no hay nombre
  const getProductName = () => {
    if (item.nombre && item.nombre.trim() !== '') {
      return item.nombre;
    }
    
    if (item.descripcion && item.descripcion.trim() !== '') {
      return item.descripcion.substring(0, 30) + '...';
    }
    
    if (item.codigo) {
      return `Producto ${item.codigo}`;
    }
    
    return 'Producto Lucesa';
  };

  return (
    <div className="co-preview-item">
      <div className="co-preview-item-image-container">
        {renderImage()}
      </div>
      <div className="co-preview-info">
        <span className="co-preview-name">{getProductName()}</span>
        <span className="co-preview-brand">{item.marca || 'Sin marca'}</span>
        <span className="co-preview-code">Código: {item.codigo || 'N/A'}</span>
        <span className="co-preview-quantity">x{item.quantity}</span>
      </div>
      <span className="co-preview-price">
        ${((item.precioFinal || item.precio) * item.quantity).toFixed(2)}
      </span>
    </div>
  );
};

export default Checkout;