import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart, getCartItemsCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'México',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    acceptTerms: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getCartTotal();
  const shipping = subtotal >= 1000 ? 0 : null;
  const tax = subtotal * 0.16;
  const total = subtotal + tax + (shipping === 0 ? 0 : 0);

  const canContinueToPayment = () => {
    if (currentStep === 1) {
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
      const fieldsValid = requiredFields.every(field => formData[field] && formData[field].trim() !== '');
      const minimumAmountValid = subtotal >= 1000;
      return fieldsValid && minimumAmountValid;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (subtotal < 1000) {
      alert('La compra mínima para continuar con el pago es de $1000 MXN.');
      return;
    }
    
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      clearCart();
      navigate('/order-confirmation', { 
        state: { 
          orderId: `ORD-${Date.now()}`,
          total: total,
          cartItems: cartItems,
          subtotal: subtotal,
          tax: tax,
          shipping: shipping
        }
      });
    }, 3000);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!canContinueToPayment()) {
        if (subtotal < 1000) {
          alert(`La compra mínima para continuar con el pago es de $1000 MXN. Tu compra actual es de $${subtotal.toFixed(2)} MXN.`);
        } else {
          alert('Por favor completa todos los campos obligatorios antes de continuar.');
        }
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
              <span className="co-step-label">Pago</span>
            </div>
            <div className={`co-step ${currentStep >= 3 ? 'co-active' : ''}`}>
              <span className="co-step-number">3</span>
              <span className="co-step-label">Confirmación</span>
            </div>
          </div>
        </div>

        <div className="co-content">
          <div className="co-form-section">
            <form onSubmit={handleSubmit} className="co-form">
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
                      <div className="co-minimum-required">
                        <div className="co-minimum-warning">
                          <span className="co-warning-icon">⚠️</span>
                          <div className="co-warning-content">
                            <h4 className="co-warning-title">Compra mínima requerida</h4>
                            <p className="co-warning-text">
                              Para continuar con el pago, tu compra debe ser de al menos <strong>$1,000 MXN</strong>
                            </p>
                            <div className="co-amount-needed">
                              <span className="co-amount-label">Faltan: </span>
                              <span className="co-amount-value">${(1000 - subtotal).toFixed(2)} MXN</span>
                            </div>
                          </div>
                        </div>
                        <div className="co-shipping-note">
                          <p>Una vez que tu compra alcance los $1,000 MXN, el envío estándar será gratuito.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="co-form-actions">
                    <button 
                      type="button" 
                      onClick={nextStep} 
                      className="co-btn co-btn-primary"
                      disabled={!canContinueToPayment()}
                    >
                      {subtotal >= 1000 ? 'Continuar a Pago' : 'Compra Mínima No Alcanzada'}
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="co-form-step">
                  <h2 className="co-step-title">Información de Pago</h2>
                  
                  <div className="co-form-group">
                    <label htmlFor="cardNumber" className="co-label">Número de Tarjeta *</label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="co-input"
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </div>

                  <div className="co-form-group">
                    <label htmlFor="cardName" className="co-label">Nombre en la Tarjeta *</label>
                    <input
                      type="text"
                      id="cardName"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      className="co-input"
                      required
                    />
                  </div>

                  <div className="co-form-row">
                    <div className="co-form-group">
                      <label htmlFor="expiryDate" className="co-label">Fecha de Expiración *</label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="co-input"
                        placeholder="MM/AA"
                        required
                      />
                    </div>
                    <div className="co-form-group">
                      <label htmlFor="cvv" className="co-label">CVV *</label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        className="co-input"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>

                  <div className="co-payment-methods">
                    <div className="co-payment-icons">
                      <span>💳</span>
                      <span>📱</span>
                      <span>🏦</span>
                    </div>
                    <p className="co-payment-security">
                      🔒 Tu información de pago está segura y encriptada
                    </p>
                  </div>

                  <div className="co-form-actions">
                    <button type="button" onClick={prevStep} className="co-btn co-btn-secondary">
                      ← Volver
                    </button>
                    <button type="button" onClick={nextStep} className="co-btn co-btn-primary">
                      Revisar Pedido
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="co-form-step">
                  <h2 className="co-step-title">Revisar y Confirmar</h2>
                  
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
                      {formData.firstName} {formData.lastName}<br />
                      {formData.address}<br />
                      {formData.city}, {formData.state} {formData.zipCode}<br />
                      {formData.country}
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
                      Acepto los <a href="/terms">términos y condiciones</a> y la{' '}
                      <a href="/privacy">política de privacidad</a>
                    </label>
                  </div>

                  <div className="co-form-actions">
                    <button type="button" onClick={prevStep} className="co-btn co-btn-secondary">
                      ← Volver
                    </button>
                    <button 
                      type="submit" 
                      className="co-btn co-btn-primary co-btn-confirm"
                      disabled={!formData.acceptTerms || isProcessing || subtotal < 1000}
                    >
                      {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
                    </button>
                  </div>
                </div>
              )}
            </form>
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
                      <span className="co-shipping-unavailable">No disponible</span>
                    )}
                  </span>
                </div>
                
                {subtotal < 1000 && (
                  <div className="co-minimum-notice">
                    <div className="co-minimum-notice-content">
                      <span className="co-notice-icon">📦</span>
                      <div className="co-notice-text">
                        <strong>Compra mínima: $1,000 MXN</strong>
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
                <span className="co-benefit-icon">💰</span>
                <div className="co-benefit-text">
                  <strong>Precios competitivos</strong> con la mejor calidad
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
          <small className="co-error-code">{item.codigo}</small>
        </div>
      );
    }

    return (
      <>
        <img 
          ref={imgRef}
          src={currentImageUrl}
          alt={item.nombre || 'Producto'}
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

  return (
    <div className="co-order-item">
      <div className="co-order-item-image">
        {renderImage()}
      </div>

      <div className="co-order-item-details">
        <h4 className="co-order-item-name">{item.nombre || 'Producto sin nombre'}</h4>
        <p className="co-order-item-brand">{item.marca || 'Sin marca'}</p>
        <p className="co-order-item-code">Código: {item.codigo || 'N/A'}</p>
        
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
          alt={item.nombre || 'Producto'}
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

  return (
    <div className="co-preview-item">
      <div className="co-preview-item-image-container">
        {renderImage()}
      </div>
      <div className="co-preview-info">
        <span className="co-preview-name">{item.nombre || 'Producto sin nombre'}</span>
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