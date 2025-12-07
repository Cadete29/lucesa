// OrderConfirmation.jsx - Versión simplificada y corregida
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './OrderConfirmation.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api'
  : 'http://localhost:4004/api';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        console.log('📋 OrderConfirmation - Estado recibido:', location.state);
        
        const stateData = location.state;
        
        if (!stateData) {
          // Intentar obtener de localStorage
          const lastOrderId = localStorage.getItem('last_order_id');
          if (lastOrderId) {
            console.log('🔍 Buscando orden en localStorage:', lastOrderId);
            const savedOrder = localStorage.getItem(`lucesa_order_${lastOrderId}`);
            if (savedOrder) {
              const parsedOrder = JSON.parse(savedOrder);
              setOrderData(parsedOrder);
              setLoading(false);
              return;
            }
          }
          
          setError('No se recibieron datos de la orden');
          setLoading(false);
          return;
        }

        // Si tenemos orderId pero no cartItems, obtener del backend
        if (stateData.orderId && (!stateData.cartItems || stateData.cartItems.length === 0)) {
          console.log('🔍 Obteniendo orden completa del backend:', stateData.orderId);
          
          try {
            const token = localStorage.getItem('lucesa-token');
            if (!token) {
              throw new Error('No hay token de autenticación');
            }
            
            const response = await fetch(`${API_BASE_URL}/orders/${stateData.orderId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.order) {
                console.log('✅ Orden obtenida del backend:', data.order);
                setOrderData(data.order);
              } else {
                console.warn('Respuesta del backend sin éxito:', data);
                setOrderData(stateData);
              }
            } else {
              console.warn('Error HTTP del backend:', response.status);
              setOrderData(stateData);
            }
          } catch (fetchError) {
            console.error('Error obteniendo orden del backend:', fetchError);
            setOrderData(stateData);
          }
        } else {
          setOrderData(stateData);
        }
        
      } catch (err) {
        console.error('Error en OrderConfirmation:', err);
        setError('Error al cargar los datos de la orden');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location.state]);

  if (loading) {
    return (
      <div className="oc-page">
        <div className="oc-container">
          <div className="oc-loading">
            <div className="oc-loading-spinner"></div>
            <h2>Cargando detalles de tu pedido...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="oc-page">
        <div className="oc-container">
          <div className="oc-error">
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <Link to="/user-profile?tab=orders" className="oc-btn oc-btn-primary">
              Ver mis pedidos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="oc-page">
        <div className="oc-container">
          <div className="oc-error">
            <h2>Orden no encontrada</h2>
            <p>No se pudo encontrar la información de tu pedido.</p>
            <Link to="/" className="oc-btn oc-btn-primary">Volver al inicio</Link>
          </div>
        </div>
      </div>
    );
  }

  // Extraer datos con valores por defecto
  const orderNumber = orderData.order_number || orderData.orderId || 'N/A';
  const total = orderData.total || orderData.total_amount || 0;
  const subtotal = orderData.subtotal || orderData.subtotal || 0;
  const tax = orderData.tax || orderData.tax_amount || 0;
  const shipping = orderData.shipping || orderData.shipping_amount || 0;
  const cartItems = orderData.cartItems || orderData.items || [];

  console.log('📊 Datos de orden para renderizar:', {
    orderNumber,
    total,
    subtotal,
    tax,
    shipping,
    itemsCount: cartItems.length
  });

  return (
    <div className="oc-page">
      <div className="oc-container">
        <div className="oc-card">
          <div className="oc-header">
            <div className="oc-success-icon">✅</div>
            <h1 className="oc-title">¡Pedido Confirmado!</h1>
            <p className="oc-order-number">Número de orden: {orderNumber}</p>
            {orderNumber.startsWith('LUCESA-') && (
              <div className="oc-lucesa-badge">
                <span className="oc-lucesa-icon">🏭</span>
                <span className="oc-lucesa-text">Orden LUCESA</span>
              </div>
            )}
          </div>

          <div className="oc-details">
            {/* Sección de productos */}
            <div className="oc-products-section">
              <h3 className="oc-section-title">Productos Comprados</h3>
              
              {cartItems.length > 0 ? (
                <div className="oc-products-list">
                  {cartItems.map((item, index) => {
                    const productName = item.product_name || item.nombre || 'Producto';
                    const productBrand = item.product_brand || item.marca || 'Sin marca';
                    const productCode = item.product_code || item.codigo || 'N/A';
                    const quantity = item.quantity || 1;
                    const unitPrice = item.unit_price || item.precioFinal || item.precio || 0;
                    const totalPrice = unitPrice * quantity;

                    return (
                      <div key={index} className="oc-product-item">
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
                  <p>Puedes ver los detalles completos en tu historial de pedidos.</p>
                </div>
              )}
            </div>

            {/* Resumen del pago */}
            <div className="oc-detail-section">
              <h3 className="oc-section-title">Resumen del Pago</h3>
              <div className="oc-pricing-breakdown">
                <div className="oc-pricing-row">
                  <span className="oc-pricing-label">Subtotal:</span>
                  <span className="oc-pricing-value">
                    ${parseFloat(subtotal).toFixed(2)} MXN
                  </span>
                </div>
                
                <div className="oc-pricing-row">
                  <span className="oc-pricing-label">IVA (16%):</span>
                  <span className="oc-pricing-value">
                    ${parseFloat(tax).toFixed(2)} MXN
                  </span>
                </div>
                
                <div className="oc-pricing-row">
                  <span className="oc-pricing-label">Envío:</span>
                  <span className="oc-pricing-value">
                    {shipping === 0 ? (
                      <span className="oc-free-shipping">GRATIS</span>
                    ) : shipping > 0 ? (
                      `$${parseFloat(shipping).toFixed(2)} MXN`
                    ) : (
                      'No aplica'
                    )}
                  </span>
                </div>
                
                <div className="oc-pricing-divider"></div>
                
                <div className="oc-pricing-row oc-total-row">
                  <span className="oc-total-label">Total:</span>
                  <span className="oc-total-amount">
                    ${parseFloat(total).toFixed(2)} MXN
                  </span>
                </div>
              </div>
            </div>

            {/* Información del pedido */}
            <div className="oc-detail-section">
              <h3 className="oc-section-title">Información del Pedido</h3>
              <div className="oc-detail-grid">
                <div className="oc-detail-row">
                  <span className="oc-detail-label">Número de orden:</span>
                  <span className="oc-detail-value oc-order-number-highlight">
                    {orderNumber}
                  </span>
                </div>
                <div className="oc-detail-row">
                  <span className="oc-detail-label">Fecha:</span>
                  <span className="oc-detail-value">
                    {new Date().toLocaleDateString('es-MX')}
                  </span>
                </div>
                <div className="oc-detail-row">
                  <span className="oc-detail-label">Estado:</span>
                  <span className="oc-status oc-completed">Completado</span>
                </div>
                <div className="oc-detail-row">
                  <span className="oc-detail-label">Método de pago:</span>
                  <span className="oc-detail-value">Mercado Pago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="oc-actions">
            <Link to="/products" className="oc-btn oc-btn-primary">
              Seguir Comprando
            </Link>
            <Link to="/user-profile?tab=orders" className="oc-btn oc-btn-secondary">
              Ver Mis Pedidos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;