// src/components/OrderConfirmationTransfer.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './OrderConfirmationTransfer.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://lucesademexico-shop.com.mx/api'
  : 'http://localhost:4004/api';

const OrderConfirmationTransfer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullEmail, setShowFullEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState({
    buyer: 'pending',
    seller: 'pending'
  });
  const [debugInfo, setDebugInfo] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  useEffect(() => {
    console.log('🔍 OrderConfirmationTransfer - Montando componente');
    console.log('📍 Location state:', location.state);
    
    const fetchOrderDetails = async () => {
      try {
        const stateData = location.state;
        
        if (!stateData) {
          console.log('⚠️ No hay state data, buscando en localStorage...');
          
          // Intentar obtener de localStorage
          const lastOrderKey = Object.keys(localStorage).find(key => 
            key.startsWith('lucesa_transfer_order_')
          );
          
          if (lastOrderKey) {
            const savedOrder = localStorage.getItem(lastOrderKey);
            if (savedOrder) {
              const parsedOrder = JSON.parse(savedOrder);
              console.log('✅ Orden de transferencia encontrada en localStorage:', parsedOrder.order_number);
              setOrderData(parsedOrder);
              setLoading(false);
              
              // Verificar si ya se enviaron correos
              const emailSentKey = `transfer_email_sent_${parsedOrder.id || parsedOrder.orderId || parsedOrder.order_number}`;
              if (localStorage.getItem(emailSentKey)) {
                console.log('📧 Correos de transferencia ya enviados para esta orden');
                setEmailStatus({ buyer: 'sent', seller: 'sent' });
              } else {
                // Intentar enviar correos
                setTimeout(() => {
                  sendTransferConfirmationEmails(parsedOrder);
                }, 1500);
              }
              
              return;
            }
          }
          
          // Intentar obtener última orden de transferencia del backend
          const token = localStorage.getItem('lucesa-token');
          if (token && user) {
            try {
              console.log('🔍 Buscando última orden de transferencia en el backend...');
              const response = await fetch(`${API_BASE_URL}/orders/debug/last-transfer-order`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.order) {
                  console.log('✅ Última orden de transferencia encontrada:', data.order.order_number);
                  setOrderData(data.order);
                  setLoading(false);
                  
                  // Verificar correos
                  if (data.order.emails_sent) {
                    setEmailStatus({ buyer: 'sent', seller: 'sent' });
                  } else {
                    setTimeout(() => {
                      sendTransferConfirmationEmails(data.order);
                    }, 1500);
                  }
                  
                  return;
                }
              }
            } catch (fetchError) {
              console.warn('No se pudo obtener última orden de transferencia:', fetchError);
            }
          }
          
          setError('No se recibieron datos de la orden de transferencia');
          setLoading(false);
          return;
        }

        console.log('📋 Datos recibidos del state:', {
          orderId: stateData.id || stateData.orderId,
          orderNumber: stateData.order_number || stateData.orderNumber,
          items: stateData.cartItems?.length || stateData.items?.length || 0,
          email_sent: stateData.email_sent || false
        });

        // Guardar en localStorage para referencia futura
        const orderKey = `lucesa_transfer_order_${stateData.id || stateData.orderId || 'temp'}`;
        localStorage.setItem(orderKey, JSON.stringify(stateData));
        localStorage.setItem('last_transfer_order_id', stateData.id || stateData.orderId);

        setOrderData(stateData);
        
        // Verificar si ya se enviaron correos
        if (stateData.email_sent) {
          console.log('✅ Correos de transferencia ya enviados desde el backend');
          setEmailStatus({ buyer: 'sent', seller: 'sent' });
        } else {
          // Enviar correos después de un breve delay
          console.log('⏳ Correos de transferencia no enviados aún, programando envío...');
          setTimeout(() => {
            sendTransferConfirmationEmails(stateData);
          }, 1500);
        }
        
      } catch (err) {
        console.error('❌ Error en OrderConfirmationTransfer:', err);
        setError('Error al cargar los datos de la orden');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location.state, user]);

  // Limpiar carrito al montar
  useEffect(() => {
    if (orderData) {
      clearCart();
    }
  }, [orderData, clearCart]);

  // Función para enviar correos de transferencia
  const sendTransferConfirmationEmails = async (order) => {
    try {
      console.log('='.repeat(60));
      console.log('🔍 FRONTEND: Iniciando envío de correos de transferencia');
      console.log('='.repeat(60));
      console.log('   🏦 Orden de transferencia:', order.order_number);
      
      const token = localStorage.getItem('lucesa-token');
      if (!token) {
        console.error('❌ FRONTEND: No hay token JWT disponible');
        setEmailStatus({ buyer: 'failed', seller: 'failed' });
        return;
      }
      
      // Verificar si ya se enviaron correos
      const emailSentKey = `transfer_email_sent_${order.id || order.orderId || order.order_number}`;
      if (localStorage.getItem(emailSentKey)) {
        console.log('📧 Correos de transferencia ya enviados para esta orden (verificado en localStorage)');
        setEmailStatus({ buyer: 'sent', seller: 'sent' });
        return;
      }
      
      console.log('📧 Preparando envío de correos de transferencia...');
      
      // Obtener datos del cliente
      const customerInfo = order.customerInfo || {};
      const customerName = customerInfo.firstName && customerInfo.lastName 
        ? `${customerInfo.firstName} ${customerInfo.lastName}`
        : customerInfo.name || user?.nombre || user?.username || 'Cliente';
      const customerEmail = customerInfo.email || user?.email;
      
      if (!customerEmail) {
        console.error('❌ No se pudo obtener email del cliente');
        setEmailStatus({ buyer: 'failed', seller: 'failed' });
        return;
      }
      
      const emailData = {
        orderId: order.id || order.orderId,
        buyerEmail: customerEmail,
        buyerName: customerName,
        orderNumber: order.order_number || order.orderNumber,
        products: order.cartItems || order.items || [],
        totalAmount: order.total || order.total_amount || 0,
        orderDate: order.created_at ? 
          new Date(order.created_at).toLocaleDateString('es-MX') : 
          new Date().toLocaleDateString('es-MX'),
        transferInfo: order.transfer_info,
        shippingAddress: order.shippingAddress || order.shipping_address
      };
      
      console.log('📤 Datos para correo de transferencia:');
      console.log('   - Email del comprador:', emailData.buyerEmail);
      console.log('   - Número de orden:', emailData.orderNumber);
      console.log('   - Total:', emailData.totalAmount);
      
      setIsSendingEmail(true);
      setEmailStatus({ buyer: 'sending', seller: 'sending' });
      
      const response = await fetch(`${API_BASE_URL}/payments/send-transfer-confirmation-emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });
      
      console.log('📥 Respuesta del backend:', response.status);
      
      const result = await response.json();
      console.log('📧 Resultado del envío:', result);
      
      if (result.success) {
        console.log('✅ Correos de transferencia enviados exitosamente');
        setEmailStatus({
          buyer: 'sent',
          seller: 'sent'
        });
        
        // Actualizar debug info
        setDebugInfo({
          sentAt: new Date().toISOString(),
          productsSent: result.debug?.products_sent || emailData.products.length,
          sampleProduct: result.debug?.sample_product,
          summary: result.summary
        });
        
        // Guardar en localStorage
        localStorage.setItem(emailSentKey, 'true');
        
        // Guardar detalles
        localStorage.setItem(`transfer_email_details_${emailData.orderNumber}`, JSON.stringify({
          sentAt: new Date().toISOString(),
          buyerEmail: emailData.buyerEmail,
          status: result.summary,
          from: 'frontend',
          orderType: 'transfer'
        }));
        
      } else {
        console.warn('⚠️ No se pudieron enviar los correos de transferencia:', result.error);
        setEmailStatus({ buyer: 'failed', seller: 'failed' });
        
        setDebugInfo({
          error: result.error,
          message: result.message,
          sentAt: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.error('❌ FRONTEND: Error enviando correos de transferencia:', error);
      setEmailStatus({ buyer: 'failed', seller: 'failed' });
      
      setDebugInfo({
        error: error.message,
        sentAt: new Date().toISOString()
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Función para reenviar correos
  const resendTransferEmails = async () => {
    if (!orderData) {
      alert('No hay datos de orden');
      return;
    }
    
    const confirm = window.confirm('¿Reenviar instrucciones de transferencia por correo?');
    if (!confirm) return;
    
    console.log('🔄 Reenviando correos de transferencia...');
    await sendTransferConfirmationEmails(orderData);
  };

  // Función para forzar envío de correos después de un tiempo
  useEffect(() => {
    const forceSendEmailsTimer = setTimeout(() => {
      if (orderData && user && emailStatus.buyer === 'pending') {
        console.log('🔄 Forzando envío de correos de transferencia después de timeout...');
        sendTransferConfirmationEmails(orderData);
      }
    }, 8000); // 8 segundos después

    return () => clearTimeout(forceSendEmailsTimer);
  }, [orderData, user, emailStatus.buyer]);

  // Función para truncar email largo
  const truncateEmail = (email, maxLength = 25) => {
    if (!email) return '';
    if (email.length <= maxLength) return email;
    
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return email.slice(0, maxLength) + '...';
    
    const username = email.slice(0, atIndex);
    const domain = email.slice(atIndex);
    
    if (username.length > maxLength - domain.length) {
      const truncatedUsername = username.slice(0, maxLength - domain.length - 3) + '...';
      return truncatedUsername + domain;
    }
    
    return email;
  };

  // Función para formatear teléfono
  const formatPhone = (phone) => {
    if (!phone) return '';
    // Formato: (XXX) XXX-XXXX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Función para copiar datos bancarios
  const copyBankInfo = () => {
    if (!orderData) return;
    
    const bankInfo = `
 INFORMACIÓN BANCARIA - LUCESA
===============================
Banco: ${orderData.transfer_info?.bank_name || 'BBVA'}
Número de cuenta: ${orderData.transfer_info?.account_number || '00743648380125258480'}
Titular: ${orderData.transfer_info?.account_holder || 'SERVICIOS DE TECNOLOGIA, INFRAESTRUCTURA Y SOLUCIONES GLOBALES LUCE'}
CLABE: ${orderData.transfer_info?.clabe || '012180001252584809'}
Referencia: ${orderData.transfer_info?.reference || orderData.order_number}
Monto: $${parseFloat(orderData.total || orderData.total_amount || 0).toFixed(2)} MXN
===============================
Orden: ${orderData.order_number}
Fecha: ${orderData.created_at ? 
  new Date(orderData.created_at).toLocaleDateString('es-MX') : 
  new Date().toLocaleDateString('es-MX')}
    `.trim();
    
    navigator.clipboard.writeText(bankInfo)
      .then(() => {
        alert('✅ Datos bancarios copiados al portapapeles\n\nLos puedes pegar en la aplicación de tu banco.');
      })
      .catch(() => {
        alert('❌ No se pudieron copiar los datos. Intenta seleccionar y copiar manualmente.');
      });
  };

  if (loading) {
    return (
      <div className="oct-page">
        <div className="oct-container">
          <div className="oct-loading">
            <div className="oct-loading-spinner"></div>
            <h2>Cargando detalles de tu pedido...</h2>
            <p>Estamos obteniendo la información de tu compra por transferencia.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="oct-page">
        <div className="oct-container">
          <div className="oct-error">
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <div className="oct-actions">
              <Link to="/my-account" className="oct-btn oct-btn-primary">
                Ver mis pedidos
              </Link>
              <Link to="/" className="oct-btn oct-btn-secondary">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="oct-page">
        <div className="oct-container">
          <div className="oct-error">
            <h2>Orden no encontrada</h2>
            <p>No se pudo encontrar la información de tu pedido por transferencia.</p>
            <p className="oct-help-text">
              Esto puede pasar si refrescaste la página. Puedes encontrar tu orden en "Mis Pedidos".
            </p>
            <div className="oct-actions">
              <Link to="/user-profile?tab=orders" className="oct-btn oct-btn-primary">
                Ver mis pedidos
              </Link>
              <Link to="/" className="oct-btn oct-btn-secondary">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extraer datos con valores por defecto
  const orderNumber = orderData.order_number || 'N/A';
  const total = orderData.total || orderData.total_amount || 0;
  const subtotal = orderData.subtotal || 0;
  const tax = orderData.tax || orderData.tax_amount || 0;
  const shipping = orderData.shipping || orderData.shipping_amount || 0;
  const cartItems = orderData.cartItems || orderData.items || [];
  const orderDate = orderData.created_at ? 
    new Date(orderData.created_at).toLocaleDateString('es-MX') : 
    new Date().toLocaleDateString('es-MX');
  const customerInfo = orderData.customerInfo || {};
  const shippingAddress = orderData.shippingAddress || {};
  
  // Datos del cliente con valores por defecto
  const customerName = customerInfo.firstName && customerInfo.lastName 
    ? `${customerInfo.firstName} ${customerInfo.lastName}`
    : customerInfo.name || user?.nombre || user?.username || 'Cliente';
  const customerEmail = customerInfo.email || user?.email || '';
  const customerPhone = formatPhone(customerInfo.phone || '');

  return (
    <div className="oct-page">
      <div className="oct-container">
        <div className="oct-card">
          <div className="oct-header">
            {/* <div className="oct-icon">🏦</div> */}
            <h1 className="oct-title">¡Pedido Registrado para Transferencia!</h1>
            <p className="oct-order-number">Número de orden: <strong>{orderNumber}</strong></p>
            <p className="oct-total">
              Total a pagar: <strong>${parseFloat(total).toFixed(2)} MXN</strong>
            </p>
            
            {/* Estado de correos */}
            <div className="oct-email-status">
              <div className={`oct-email-status-item ${emailStatus.buyer}`}>
                <span className="oct-email-status-icon">
                  {emailStatus.buyer === 'sent' ? '✅' : 
                   emailStatus.buyer === 'sending' ? '⏳' : 
                   emailStatus.buyer === 'failed' ? '❌' : '📧'}
                </span>
                <span className="oct-email-status-text">
                  {emailStatus.buyer === 'sent' ? 'Instrucciones enviadas al correo' : 
                   emailStatus.buyer === 'sending' ? 'Enviando instrucciones...' : 
                   emailStatus.buyer === 'failed' ? 'Error enviando correo' : 'Instrucciones pendientes'}
                </span>
              </div>
              
              {(emailStatus.buyer === 'failed' || emailStatus.seller === 'failed') && (
                <button 
                  onClick={resendTransferEmails}
                  className="oct-resend-btn"
                  disabled={isSendingEmail}
                >
                  {isSendingEmail ? 'Enviando...' : '📧 Reenviar instrucciones'}
                </button>
              )}
            </div>
            
            {/* Debug info (opcional, para desarrollo) */}
            {debugInfo && process.env.NODE_ENV === 'development' && (
              <div className="oct-debug-info">
                <details>
                  <summary> Información de depuración</summary>
                  <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </details>
              </div>
            )}
            
            {orderNumber.startsWith('TRANSFER-') && (
              <div className="oct-transfer-badge">
                {/* <span className="oct-transfer-icon">💳</span> */}
                <span className="oct-transfer-text">Pago por Transferencia</span>
              </div>
            )}
          </div>

          <div className="oct-details">
            {/* Sección de productos */}
            <div className="oct-products-section">
              <h3 className="oct-section-title">Productos Comprados</h3>
              
              {cartItems.length > 0 ? (
                <div className="oct-products-list">
                  {cartItems.map((item, index) => {
                    const productName = item.product_name || item.nombre || 'Producto';
                    const productBrand = item.product_brand || item.marca || 'Sin marca';
                    const productCode = item.product_code || item.codigo || 'N/A';
                    const quantity = item.quantity || 1;
                    const unitPrice = item.unit_price || item.precioFinal || item.precio || 0;
                    const totalPrice = unitPrice * quantity;

                    return (
                      <div key={index} className="oct-product-item">
                        <div className="oct-product-info">
                          <h4 className="oct-product-name">{productName}</h4>
                          <div className="oct-product-details">
                            <span className="oct-product-brand">{productBrand}</span>
                            <span className="oct-product-code">Código: {productCode}</span>
                            <span className="oct-product-quantity">Cantidad: {quantity}</span>
                          </div>
                        </div>
                        <div className="oct-product-pricing">
                          <span className="oct-product-unit-price">
                            ${parseFloat(unitPrice).toFixed(2)} c/u
                          </span>
                          <span className="oct-product-total-price">
                            ${parseFloat(totalPrice).toFixed(2)} MXN
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="oct-no-products">
                  <p>No se encontraron productos en este pedido.</p>
                  <p>Puedes ver los detalles completos en tu historial de pedidos.</p>
                </div>
              )}
            </div>

            {/* Resumen del pago */}
            <div className="oct-detail-section">
              <h3 className="oct-section-title">Resumen del Pago</h3>
              <div className="oct-pricing-breakdown">
                <div className="oct-pricing-row">
                  <span className="oct-pricing-label">Subtotal:</span>
                  <span className="oct-pricing-value">
                    ${parseFloat(subtotal).toFixed(2)} MXN
                  </span>
                </div>
                
                <div className="oct-pricing-row">
                  <span className="oct-pricing-label">IVA (16%):</span>
                  <span className="oct-pricing-value">
                    ${parseFloat(tax).toFixed(2)} MXN
                  </span>
                </div>
                
                <div className="oct-pricing-row">
                  <span className="oct-pricing-label">Envío:</span>
                  <span className="oct-pricing-value">
                    {shipping === 0 ? (
                      <span className="oct-free-shipping">GRATIS</span>
                    ) : shipping > 0 ? (
                      `$${parseFloat(shipping).toFixed(2)} MXN`
                    ) : (
                      'No aplica'
                    )}
                  </span>
                </div>
                
                <div className="oct-pricing-divider"></div>
                
                <div className="oct-pricing-row oct-total-row">
                  <span className="oct-total-label">Total:</span>
                  <span className="oct-total-amount">
                    ${parseFloat(total).toFixed(2)} MXN
                  </span>
                </div>
              </div>
            </div>

            {/* Información del pedido - MEJORADA */}
            <div className="oct-detail-section oct-info-section">
              <h3 className="oct-section-title">Información del Pedido</h3>
              
              <div className="oct-info-grid">
                {/* Grupo 1: Información básica */}
                <div className="oct-info-group">
                  <div className="oct-info-group-header">
                    {/* <div className="oct-info-group-icon">📋</div> */}
                    <h4 className="oct-info-group-title">Datos del Pedido</h4>
                  </div>
                  
                  <div className="oct-info-row oct-order-number-row">
                    <span className="oct-info-label">Número de orden</span>
                    <span className="oct-info-value">{orderNumber}</span>
                  </div>
                  
                  <div className="oct-info-row">
                    <span className="oct-info-label">Fecha</span>
                    <span className="oct-info-value">{orderDate}</span>
                  </div>
                  
                  <div className="oct-info-row oct-status-row">
                    <span className="oct-info-label">Estado</span>
                    <span className="oct-info-value">
                       Pendiente de Pago
                    </span>
                  </div>
                  
                  <div className="oct-info-row oct-payment-method-row">
                    <span className="oct-info-label">Método de pago</span>
                    <span className="oct-info-value">
                      {/* <span className="oct-payment-icon">🏦</span>  */}Transferencia Bancaria
                    </span>
                  </div>
                </div>
                
                {/* Grupo 2: Información del cliente - MEJORADO */}
                <div className="oct-info-group">
                  <div className="oct-info-group-header">
                    {/* <div className="oct-info-group-icon">👤</div> */}
                    <h4 className="oct-info-group-title">Datos del Cliente</h4>
                  </div>
                  
                  <div className="oct-info-row">
                    <span className="oct-info-label">Cliente</span>
                    <span className="oct-info-value oct-customer-name">
                      {customerName}
                    </span>
                  </div>
                  
                  <div className="oct-info-row oct-email-row">
                    <span className="oct-info-label">Email</span>
                    <div className="oct-info-value oct-email-value">
                      <span 
                        className={`oct-email-text ${showFullEmail ? 'oct-email-full' : 'oct-email-truncated'}`}
                        title={customerEmail}
                      >
                        {showFullEmail ? customerEmail : truncateEmail(customerEmail, 30)}
                      </span>
                      {customerEmail.length > 25 && (
                        <button 
                          className="oct-email-toggle"
                          onClick={() => setShowFullEmail(!showFullEmail)}
                          title={showFullEmail ? "Mostrar menos" : "Mostrar completo"}
                        >
                          {showFullEmail ? '👁️' : '👁️‍🗨️'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="oct-info-row">
                    <span className="oct-info-label">Teléfono</span>
                    <span className="oct-info-value oct-phone-value">
                      {customerPhone}
                    </span>
                  </div>
                </div>
                
                {/* Grupo 3: Dirección de envío */}
                <div className="oct-info-group">
                  <div className="oct-info-group-header">
                    {/* <div className="oct-info-group-icon">📍</div> */}
                    <h4 className="oct-info-group-title">Dirección de Envío</h4>
                  </div>
                  
                  <div className="oct-info-row oct-address-row">
                    <div className="oct-address-value">
                      {shippingAddress.address ? (
                        <>
                          <div className="oct-address-line">
                            {/* <span className="oct-address-icon">🏠</span> */}
                            <span>{shippingAddress.address}</span>
                          </div>
                          
                          <div className="oct-address-line">
                            {/* <span className="oct-address-icon">🏙️</span> */}
                            <span>
                              {shippingAddress.city || ''}{shippingAddress.city && shippingAddress.state ? ', ' : ''}
                              {shippingAddress.state || ''} {shippingAddress.zipCode || ''}
                            </span>
                          </div>
                          
                          <div className="oct-address-line">
                            {/* <span className="oct-address-icon">🌎</span> */}
                            <span>{shippingAddress.country || 'México'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="oct-no-address">
                          <span className="oct-address-icon">⚠️</span>
                          <span>No se especificó dirección de envío</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instrucciones de transferencia */}
            <div className="oct-detail-section oct-transfer-section">
              <h3 className="oct-section-title">Instrucciones de Transferencia</h3>
              
              <div className="oct-bank-info">
                <div className="oct-bank-row">
                  <span className="oct-bank-label">Banco:</span>
                  <span className="oct-bank-value">{orderData.transfer_info?.bank_name || 'BBVA'}</span>
                </div>
                <div className="oct-bank-row">
                  <span className="oct-bank-label">Número de cuenta:</span>
                  <span className="oct-bank-value oct-highlight">
                    {orderData.transfer_info?.account_number || '00743648380125258480'}
                  </span>
                </div>
                <div className="oct-bank-row">
                  <span className="oct-bank-label">Titular:</span>
                  <span className="oct-bank-value">{orderData.transfer_info?.account_holder || 'SERVICIOS DE TECNOLOGIA, INFRAESTRUCTURA Y SOLUCIONES GLOBALES LUCE'}</span>
                </div>
                <div className="oct-bank-row">
                  <span className="oct-bank-label">CLABE:</span>
                  <span className="oct-bank-value oct-highlight">
                    {orderData.transfer_info?.clabe || '012180001252584809'}
                  </span>
                </div>
                <div className="oct-bank-row">
                  <span className="oct-bank-label">Referencia:</span>
                  <span className="oct-bank-value oct-reference">
                    {orderData.transfer_info?.reference || orderNumber}
                  </span>
                </div>
                <div className="oct-bank-row">
                  <span className="oct-bank-label">Monto exacto:</span>
                  <span className="oct-bank-value oct-total-amount">
                    ${parseFloat(total).toFixed(2)} MXN
                  </span>
                </div>
              </div>
              
              <div className="oct-instructions-section">
                <h4 className="oct-instructions-title">Pasos a seguir:</h4>
                <ol className="oct-instructions">
                  <li>Realiza la transferencia por el monto exacto: <strong>${parseFloat(total).toFixed(2)} MXN</strong></li>
                  <li>Usa la referencia proporcionada en el concepto de la transferencia</li>
                  <li>Guarda el comprobante de transferencia (captura de pantalla o foto)</li>
                  <li>Envía el comprobante por:
                    <ul className="oct-contact-methods">
                      <li>
                        <strong>WhatsApp:</strong> {orderData.transfer_info?.whatsapp || '+5215611926523'}
                      </li>
                      <li>
                        <strong>Email:</strong> {orderData.transfer_info?.email || 'lucesacorreooficial@gmail.com'}
                      </li>
                    </ul>
                  </li>
                  <li>Incluye tu número de orden (<strong>{orderNumber}</strong>) en el mensaje</li>
                </ol>
                
                <div className="oct-bank-note">
                   <strong>Importante:</strong> Usa exactamente la referencia proporcionada para que podamos identificar tu pago rápidamente.
                </div>
                
                <div className="oct-timer-note">
                   <strong>Tiempo límite:</strong> Tienes 72 horas para completar la transferencia. Después de este tiempo, tu orden será cancelada automáticamente.
                </div>
                
                <div className="oct-email-note">
                   <strong>Correo enviado:</strong> {emailStatus.buyer === 'sent' ? 'Sí - Revisa tu bandeja de entrada (y spam)' : 
                    emailStatus.buyer === 'sending' ? 'Enviando...' : 
                    emailStatus.buyer === 'failed' ? 'Error al enviar' : 'Pendiente'}
                </div>
              </div>
            </div>

            {/* Información importante */}
            <div className="oct-detail-section oct-important-section">
              <h3 className="oct-section-title">⚠️ Información Importante</h3>
              <ul className="oct-important-list">
                <li>Tu pedido será procesado una vez confirmado el pago</li>
                <li>El tiempo de procesamiento es de 24-48 horas hábiles después de confirmar el pago</li>
                <li>Recibirás un correo de confirmación cuando se verifique el pago</li>
                <li>Para cualquier duda, contáctanos por WhatsApp</li>
                <li>Tu orden será cancelada si no recibimos el comprobante en 72 horas</li>
                <li>Los tiempos de entrega comienzan a contar desde la confirmación del pago</li>
                <li>Verifica que los datos bancarios sean correctos antes de realizar la transferencia</li>
                <li>Guarda el comprobante de transferencia hasta que se confirme tu pedido</li>
              </ul>
            </div>
          </div>

          {/* Acciones */}
          <div className="oct-actions">
            <button 
              onClick={() => window.print()}
              className="oct-btn oct-btn-secondary"
            >
               Imprimir Instrucciones
            </button>
            <button 
              onClick={copyBankInfo}
              className="oct-btn oct-btn-copy"
            >
               Copiar Datos Bancarios
            </button>
            <Link to="/my-account" className="oct-btn oct-btn-primary">
              Ver Mis Pedidos
            </Link>
            <Link to="/products" className="oct-btn oct-btn-tertiary">
              Seguir Comprando
            </Link>
            
            {(emailStatus.buyer === 'failed' || emailStatus.buyer === 'pending') && (
              <button 
                onClick={resendTransferEmails}
                className="oct-btn oct-btn-emergency"
                disabled={isSendingEmail}
              >
                {isSendingEmail ? '⏳ Enviando...' : '🔄 Reenviar Instrucciones'}
              </button>
            )}
          </div>

          {/* Información adicional */}
          <div className="oct-additional-info">
            <div className="oct-info-item">
              {/* <span className="oct-info-icon">🏦</span> */}
              <span className="oct-info-text">Transferencia Segura</span>
            </div>
            <div className="oct-info-item">
              {/* <span className="oct-info-icon">⏰</span> */}
              <span className="oct-info-text">Confirmación 24-48h</span>
            </div>
            <div className="oct-info-item">
              {/* <span className="oct-info-icon">📞</span> */}
              <span className="oct-info-text">Soporte WhatsApp</span>
            </div>
            <div className="oct-info-item">
              {/* <span className="oct-info-icon">🛡️</span> */}
              <span className="oct-info-text">Garantía 30 Días</span>
            </div>
            <div className="oct-info-item">
              {/* <span className="oct-info-icon">📧</span> */}
              <span className="oct-info-text">
                {emailStatus.buyer === 'sent' ? 'Correo enviado' : 
                 emailStatus.buyer === 'sending' ? 'Enviando...' : 
                 'Correo pendiente'}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="oct-footer">
            <p className="oct-footer-text">
              <strong>Gracias por tu compra.</strong><br />
              Tu pedido <strong>#{orderNumber}</strong> ha sido registrado y está <strong>pendiente de pago</strong>.<br />
              Por favor, completa la transferencia para procesar tu pedido.
            </p>
            <p className="oct-footer-email-note">
              {emailStatus.buyer === 'sent' ? 
                '✅ Revisa tu correo electrónico para las instrucciones completas.' : 
                emailStatus.buyer === 'sending' ? 
                '⏳ Enviando instrucciones a tu correo...' : 
                '📧 Las instrucciones se enviarán a tu correo en breve.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationTransfer;