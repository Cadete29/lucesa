import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

// ✅ Configuración de URLs por entorno
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Información de envío
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'México',
    
    // Información de pago
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    
    // Método de envío
    shippingMethod: 'standard',
    
    // Términos
    acceptTerms: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getCartTotal();
  const shipping = formData.shippingMethod === 'express' ? 199 : 
                  subtotal > 500 ? 0 : 99;
  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + shipping + tax;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simular procesamiento de pago
    setTimeout(() => {
      setIsProcessing(false);
      clearCart();
      navigate('/order-confirmation', { 
        state: { 
          orderId: `ORD-${Date.now()}`,
          total: total.toFixed(2)
        }
      });
    }, 3000);
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ✅ Función para obtener URL de imagen usando la configuración por entorno
  const getImageUrl = (codigo) => {
    return `${IMAGE_BASE_URL}/${codigo}?size=small`;
  };

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="empty-checkout">
            <h2>No hay productos en el carrito</h2>
            <p>Agrega algunos productos antes de proceder al checkout</p>
            <button onClick={() => navigate('/products')} className="btn-primary">
              Explorar Productos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <div className="checkout-header">
          <h1>Finalizar Compra</h1>
          <div className="checkout-steps">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Envío</span>
            </div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Pago</span>
            </div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Confirmación</span>
            </div>
          </div>
        </div>

        <div className="checkout-content">
          <div className="checkout-form-section">
            <form onSubmit={handleSubmit} className="checkout-form">
              {/* Paso 1: Información de Envío */}
              {currentStep === 1 && (
                <div className="form-step">
                  <h2>Información de Envío</h2>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">Nombre *</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName">Apellido *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Teléfono *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="address">Dirección *</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      placeholder="Calle, número, colonia"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city">Ciudad *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="state">Estado *</label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="zipCode">Código Postal *</label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Método de Envío *</label>
                    <div className="shipping-options">
                      <label className="shipping-option">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value="standard"
                          checked={formData.shippingMethod === 'standard'}
                          onChange={handleInputChange}
                          required
                        />
                        <div className="option-content">
                          <span className="option-title">Envío Estándar</span>
                          <span className="option-desc">3-5 días hábiles</span>
                          <span className="option-price">
                            {subtotal > 500 ? 'GRATIS' : '$99 MXN'}
                          </span>
                        </div>
                      </label>
                      
                      <label className="shipping-option">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value="express"
                          checked={formData.shippingMethod === 'express'}
                          onChange={handleInputChange}
                        />
                        <div className="option-content">
                          <span className="option-title">Envío Express</span>
                          <span className="option-desc">1-2 días hábiles</span>
                          <span className="option-price">$199 MXN</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={nextStep} className="btn-primary">
                      Continuar a Pago
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 2: Información de Pago */}
              {currentStep === 2 && (
                <div className="form-step">
                  <h2>Información de Pago</h2>
                  
                  <div className="form-group">
                    <label htmlFor="cardNumber">Número de Tarjeta *</label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cardName">Nombre en la Tarjeta *</label>
                    <input
                      type="text"
                      id="cardName"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="expiryDate">Fecha de Expiración *</label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        placeholder="MM/AA"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cvv">CVV *</label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>

                  <div className="payment-methods">
                    <div className="payment-icons">
                      <span>💳</span>
                      <span>📱</span>
                      <span>🏦</span>
                    </div>
                    <p className="payment-security">
                      🔒 Tu información de pago está segura y encriptada
                    </p>
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={prevStep} className="btn-secondary">
                      ← Volver
                    </button>
                    <button type="button" onClick={nextStep} className="btn-primary">
                      Revisar Pedido
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 3: Confirmación */}
              {currentStep === 3 && (
                <div className="form-step">
                  <h2>Revisar y Confirmar</h2>
                  
                  <div className="order-summary">
                    <h3>Resumen del Pedido</h3>
                    <div className="order-items">
                      {cartItems.map(item => (
                        <div key={item.id || item.idProducto} className="order-item">
                          <img 
                            src={getImageUrl(item.codigo)} 
                            alt={item.nombre}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xOCAxOEgzMFYzMEgxOFYxOFpNMzAgMThINDJWMzBIMzBWMThaTTE4IDMwSDMwVDQySDE4VjMwWiIgZmlsbD0iI0RFRUVGMCIvPgo8L3N2Zz4=';
                            }}
                          />
                          <div className="item-info">
                            <h4>{item.nombre}</h4>
                            <p>Cantidad: {item.quantity}</p>
                          </div>
                          <div className="item-total">
                            ${((item.precioFinal || item.precio) * item.quantity).toFixed(2)} MXN
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="shipping-info-review">
                    <h3>Dirección de Envío</h3>
                    <p>
                      {formData.firstName} {formData.lastName}<br />
                      {formData.address}<br />
                      {formData.city}, {formData.state} {formData.zipCode}<br />
                      {formData.country}
                    </p>
                  </div>

                  <div className="form-group terms">
                    <label>
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

                  <div className="form-actions">
                    <button type="button" onClick={prevStep} className="btn-secondary">
                      ← Volver
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary btn-confirm"
                      disabled={!formData.acceptTerms || isProcessing}
                    >
                      {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="checkout-summary">
            <div className="summary-card">
              <h3>Resumen del Pedido</h3>
              
              <div className="order-preview">
                {cartItems.slice(0, 3).map(item => (
                  <div key={item.id || item.idProducto} className="preview-item">
                    <img 
                      src={getImageUrl(item.codigo)} 
                      alt={item.nombre}
                    />
                    <div className="preview-info">
                      <span className="preview-name">{item.nombre}</span>
                      <span className="preview-quantity">x{item.quantity}</span>
                    </div>
                    <span className="preview-price">
                      ${((item.precioFinal || item.precio) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                {cartItems.length > 3 && (
                  <div className="more-items">
                    +{cartItems.length - 3} productos más
                  </div>
                )}
              </div>

              <div className="summary-details">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)} MXN</span>
                </div>
                <div className="summary-row">
                  <span>Envío:</span>
                  <span>
                    {shipping === 0 ? 'GRATIS' : `$${shipping} MXN`}
                  </span>
                </div>
                <div className="summary-row">
                  <span>IVA (16%):</span>
                  <span>${tax.toFixed(2)} MXN</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span className="total-amount">${total.toFixed(2)} MXN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;