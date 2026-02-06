import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './OrderConfirmation.css';

/**
 * ORDER CONFIRMATION COMPONENT
 * 
 * Componente para mostrar la confirmación de un pedido exitoso.
 * Maneja la visualización de detalles de la orden, envío de correos de confirmación
 * y proporciona herramientas de depuración para desarrollo.
 * 
 * Características principales:
 * - Visualización detallada de pedidos confirmados
 * - Sistema de envío de correos de confirmación al comprador y vendedor
 * - Recuperación de órdenes desde múltiples fuentes (state, localStorage, API)
 * - Herramientas de depuración y diagnóstico para desarrollo
 * - Manejo de errores y estados de carga
 * 
 * @component
 * @example
 * // Redirección después de pago exitoso
 * navigate('/order-confirmation', { state: orderData });
 */

/**
 * URL base de la API según entorno
 * @constant {string} API_BASE_URL
 */
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://lucesademexico-shop.com.mx/api'
  : 'http://localhost:4004/api';

/**
 * Componente OrderConfirmation - Confirmación de pedido
 * 
 * Este componente maneja:
 * 1. Recuperación de datos de orden desde múltiples fuentes
 * 2. Envío de correos de confirmación al comprador y vendedor
 * 3. Visualización detallada de productos y totales
 * 4. Herramientas de depuración para diagnóstico
 * 5. Estados de error y recuperación
 * 
 * @returns {JSX.Element} Componente de confirmación de orden
 */
const OrderConfirmation = () => {
  // ==========================================================================
  // HOOKS DE RUTA Y CONTEXTO
  // ==========================================================================
  
  /**
   * Hook de ubicación de React Router
   * @const {Object} location - Objeto de ubicación actual con state
   */
  const location = useLocation();
  
  /**
   * Hook de navegación de React Router
   * @const {function} navigate - Función para navegar entre rutas
   */
  const navigate = useNavigate();
  
  /**
   * Contexto de autenticación
   * @const {Object} authContext - Contexto de autenticación
   * @const {Object} user - Usuario autenticado
   */
  const { user } = useAuth();
  
  // ==========================================================================
  // ESTADOS DEL COMPONENTE
  // ==========================================================================
  
  /**
   * @state {Object|null} orderData - Datos completos de la orden
   */
  const [orderData, setOrderData] = useState(null);
  
  /**
   * @state {boolean} loading - Estado de carga inicial
   */
  const [loading, setLoading] = useState(true);
  
  /**
   * @state {string|null} error - Mensaje de error si ocurre
   */
  const [error, setError] = useState(null);
  
  /**
   * @state {Object} emailStatus - Estado de envío de correos
   * @property {string} buyer - Estado para correo del comprador
   * @property {string} seller - Estado para correo del vendedor
   * Valores: 'pending', 'sending', 'sent', 'failed'
   */
  const [emailStatus, setEmailStatus] = useState({
    buyer: 'pending',
    seller: 'pending'
  });
  
  /**
   * @state {Object|null} debugInfo - Información de depuración
   */
  const [debugInfo, setDebugInfo] = useState(null);
  
  // ==========================================================================
  // EFECTO PRINCIPAL: CARGA DE DATOS Y ENVÍO DE CORREOS
  // ==========================================================================
  
  /**
   * Efecto principal que se ejecuta al montar el componente
   * Busca datos de orden en múltiples fuentes y envía correos de confirmación
   * 
   * Orden de búsqueda:
   * 1. State de la ruta (location.state)
   * 2. localStorage (almacenamiento local)
   * 3. API del backend (última orden del usuario)
   * 
   * @effect
   * @dependencies [location.state, user] - Se ejecuta al cambiar estos valores
   */
  useEffect(() => {
    console.log('🔍 OrderConfirmation - Montando componente');
    console.log('📍 Location state:', location.state);
    
    const fetchOrderDetails = async () => {
      try {
        const stateData = location.state;
        
        if (!stateData) {
          console.log('⚠️ No hay state data, buscando en localStorage...');
          
          // Intentar obtener de localStorage
          const lastOrderKey = Object.keys(localStorage).find(key => 
            key.startsWith('lucesa_order_')
          );
          
          if (lastOrderKey) {
            const savedOrder = localStorage.getItem(lastOrderKey);
            if (savedOrder) {
              const parsedOrder = JSON.parse(savedOrder);
              console.log('✅ Orden encontrada en localStorage:', parsedOrder.order_number);
              setOrderData(parsedOrder);
              setLoading(false);
              
              // Intentar enviar correos si no se han enviado
              setTimeout(() => {
                sendOrderConfirmationEmails(parsedOrder);
              }, 1000);
              
              return;
            }
          }
          
          // Intentar obtener última orden del backend
          const token = localStorage.getItem('lucesa-token');
          if (token && user) {
            try {
              console.log('🔍 Buscando última orden en el backend...');
              const response = await fetch(`${API_BASE_URL}/orders/debug/last-order`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.success && data.order) {
                  console.log('✅ Última orden encontrada:', data.order.order_number);
                  setOrderData(data.order);
                  setLoading(false);
                  return;
                }
              }
            } catch (fetchError) {
              console.warn('No se pudo obtener última orden:', fetchError);
            }
          }
          
          setError('No se recibieron datos de la orden');
          setLoading(false);
          return;
        }

        console.log('📋 Datos recibidos del state:', {
          orderId: stateData.id || stateData.orderId,
          orderNumber: stateData.order_number || stateData.orderNumber,
          items: stateData.cartItems?.length || stateData.items?.length || 0
        });

        // Guardar en localStorage para referencia futura
        const orderKey = `lucesa_order_${stateData.id || stateData.orderId || 'temp'}`;
        localStorage.setItem(orderKey, JSON.stringify(stateData));
        localStorage.setItem('last_order_id', stateData.id || stateData.orderId);

        setOrderData(stateData);
        
        // Verificar si la orden ya tiene emails_sent
        if (stateData.emails_sent) {
          console.log('✅ Correos ya enviados desde el backend');
          setEmailStatus({ buyer: 'sent', seller: 'sent' });
        } else {
          // Enviar correos después de un breve delay
          console.log('⏳ Correos no enviados aún, programando envío...');
          setTimeout(() => {
            sendOrderConfirmationEmails(stateData);
          }, 1500);
        }
        
      } catch (err) {
        console.error('❌ Error en OrderConfirmation:', err);
        setError('Error al cargar los datos de la orden');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location.state, user]);
  
  // ==========================================================================
  // FUNCIONES DE ENVÍO DE CORREOS
  // ==========================================================================
  
  /**
   * Envía correos de confirmación al comprador y notificación al vendedor
   * 
   * @async
   * @function sendOrderConfirmationEmails
   * @param {Object} order - Datos de la orden a confirmar
   * @throws {Error} Si falla el envío de correos
   */
  const sendOrderConfirmationEmails = async (order) => {
    try {
      console.log('='.repeat(60));
      console.log('🔍 FRONTEND: Iniciando envío de correos');
      console.log('='.repeat(60));
      console.log('   📦 Orden:', order.order_number || order.orderNumber);
      console.log('   👤 Usuario:', user?.email);
      
      const token = localStorage.getItem('lucesa-token');
      if (!token) {
        console.error('❌ FRONTEND: No hay token JWT disponible');
        setEmailStatus({ buyer: 'failed', seller: 'failed' });
        return;
      }
      
      // Verificar si ya se enviaron correos para esta orden
      const emailSentKey = `email_sent_${order.id || order.orderId || order.order_number}`;
      if (localStorage.getItem(emailSentKey)) {
        console.log('📧 Correos ya enviados para esta orden (verificado en localStorage)');
        setEmailStatus({ buyer: 'sent', seller: 'sent' });
        return;
      }
      
      console.log('📧 Preparando envío de correos de confirmación...');
      
      // Obtener productos del pedido
      const products = order.cartItems || order.items || [];
      console.log('📦 Productos del pedido:', products);
      
      if (products.length > 0) {
        console.log('   Primer producto:', JSON.stringify(products[0], null, 2));
        console.log('   Campos del producto:', Object.keys(products[0]));
      }
      
      const emailData = {
        orderId: order.id || order.orderId,
        buyerEmail: user.email,
        buyerName: user.nombre || user.username || 'Cliente',
        orderNumber: order.order_number || order.orderNumber || order.orderId || `LUCESA-${order.id}`,
        products: products,
        totalAmount: order.total || order.total_amount || 0,
        orderDate: order.created_at ? 
          new Date(order.created_at).toLocaleDateString('es-MX') : 
          new Date().toLocaleDateString('es-MX'),
        paymentMethod: 'Mercado Pago',
        shippingAddress: order.shipping_address || order.shippingAddress
      };
      
      console.log('📤 Datos que se enviarán al backend:');
      console.log('   - Email del comprador:', emailData.buyerEmail);
      console.log('   - Número de orden:', emailData.orderNumber);
      console.log('   - Cantidad de productos:', emailData.products.length);
      console.log('   - Primer producto:', emailData.products[0]);
      console.log('   - Total:', emailData.totalAmount);
      
      setEmailStatus({ buyer: 'sending', seller: 'sending' });
      
      console.log('🚀 Enviando petición a API...');
      const response = await fetch(`${API_BASE_URL}/orders/send-confirmation-emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });
      
      console.log('📥 Respuesta recibida del backend:');
      console.log('   - Status:', response.status);
      console.log('   - OK:', response.ok);
      
      const result = await response.json();
      console.log('📧 Resultado del envío:', result);
      
      if (result.success) {
        console.log('✅ Correos enviados exitosamente desde frontend');
        setEmailStatus({
          buyer: result.emailsResults?.find(r => r.recipient === 'buyer')?.success ? 'sent' : 'failed',
          seller: result.emailsResults?.find(r => r.recipient === 'seller')?.success ? 'sent' : 'failed'
        });
        
        // Guardar información de debug
        setDebugInfo({
          sentAt: new Date().toISOString(),
          productsSent: result.debug?.products_sent || emailData.products.length,
          sampleProduct: result.debug?.sample_product
        });
        
        // Marcar como enviado en localStorage
        localStorage.setItem(emailSentKey, 'true');
        
        // Guardar detalles de correos enviados
        localStorage.setItem(`email_details_${emailData.orderNumber}`, JSON.stringify({
          sentAt: new Date().toISOString(),
          buyerEmail: emailData.buyerEmail,
          sellerEmail: 'lucesacorreooficial@gmail.com',
          status: result.summary,
          from: 'frontend',
          products: emailData.products.length
        }));
      } else {
        console.warn('⚠️ No se pudieron enviar los correos:', result.error);
        setEmailStatus({ buyer: 'failed', seller: 'failed' });
      }
      
    } catch (error) {
      console.error('❌ FRONTEND: Error enviando correos:', error);
      setEmailStatus({ buyer: 'failed', seller: 'failed' });
    }
  };
  
  /**
   * Envía correos después de un timeout si no se enviaron inicialmente
   * 
   * @effect
   * @dependencies [orderData, user, emailStatus.buyer]
   */
  useEffect(() => {
    const forceSendEmailsTimer = setTimeout(() => {
      if (orderData && user && emailStatus.buyer === 'pending') {
        console.log('🔄 Forzando envío de correos después de timeout...');
        sendOrderConfirmationEmails(orderData);
      }
    }, 5000); // 5 segundos después

    return () => clearTimeout(forceSendEmailsTimer);
  }, [orderData, user, emailStatus.buyer]);
  
  // ==========================================================================
  // FUNCIONES DE DIAGNÓSTICO Y DEPURACIÓN
  // ==========================================================================
  
  /**
   * Ejecuta un diagnóstico de los datos de correo
   * Envía los datos al backend para análisis y muestra los resultados
   * 
   * @async
   * @function testEmailDataDiagnostic
   */
  const testEmailDataDiagnostic = async () => {
    try {
      const token = localStorage.getItem('lucesa-token');
      if (!token) {
        alert('No hay sesión activa');
        return;
      }
      
      console.log('🧪 Ejecutando diagnóstico de datos de correo...');
      
      const testData = {
        orderId: orderData.id || orderData.orderId,
        buyerEmail: user.email,
        buyerName: user.nombre || user.username || 'Cliente',
        orderNumber: orderData.order_number || orderData.orderNumber,
        products: orderData.cartItems || orderData.items || [],
        totalAmount: orderData.total || orderData.total_amount || 0,
        orderDate: orderData.created_at ? 
          new Date(orderData.created_at).toLocaleDateString('es-MX') : 
          new Date().toLocaleDateString('es-MX')
      };

      console.log('📊 Datos que se enviarán para diagnóstico:', testData);
      
      const response = await fetch(`${API_BASE_URL}/orders/debug-email-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      const result = await response.json();
      console.log('📈 Resultado del diagnóstico:', result);
      
      // Guardar resultado para mostrar en UI
      setDebugInfo({
        diagnostic: result.analysis,
        timestamp: new Date().toISOString()
      });
      
      // Mostrar alerta con información
      const productFields = result.analysis?.product_fields || [];
      const sample = result.analysis?.sample_product;
      
      let message = `🧪 DIAGNÓSTICO COMPLETADO\n\n`;
      message += `Productos: ${result.analysis?.products_count || 0}\n`;
      message += `Campos del producto: ${productFields.join(', ')}\n\n`;
      
      if (sample) {
        message += `MUESTRA DE PRODUCTO:\n`;
        Object.keys(sample).forEach(key => {
          message += `${key}: ${sample[key]}\n`;
        });
      }
      
      alert(message);
      
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
      alert('Error de conexión en diagnóstico');
    }
  };
  
  /**
   * Reenvía los correos de confirmación
   * Útil cuando falla el envío inicial
   * 
   * @async
   * @function resendEmails
   */
  const resendEmails = async () => {
    if (!orderData || !user) {
      alert('No hay datos de orden o usuario');
      return;
    }
    
    const confirm = window.confirm('¿Reenviar correo de confirmación?');
    if (!confirm) return;
    
    try {
      setEmailStatus({ buyer: 'sending', seller: 'sending' });
      
      const token = localStorage.getItem('lucesa-token');
      const orderId = orderData.id || orderData.orderId;
      
      if (!orderId) {
        alert('No se pudo identificar la orden');
        return;
      }
      
      console.log('🔄 Reenviando correos para orden:', orderId);
      
      const response = await fetch(
        `${API_BASE_URL}/orders/${orderId}/resend-emails`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = await response.json();
      console.log('📧 Resultado de reenvío:', result);
      
      if (result.success) {
        alert('✅ ' + result.message);
        setEmailStatus({ buyer: 'sent', seller: 'sent' });
        
        // Actualizar localStorage
        const emailSentKey = `email_sent_${orderId}`;
        localStorage.setItem(emailSentKey, 'true');
        
        // Actualizar debug info
        setDebugInfo({
          resentAt: new Date().toISOString(),
          productsSent: result.debug?.products_sent,
          sampleProduct: result.debug?.sample_product
        });
      } else {
        alert('❌ ' + (result.message || 'Error reenviando correos'));
        setEmailStatus({ buyer: 'failed', seller: 'failed' });
      }
      
    } catch (error) {
      console.error('Error reenviando correos:', error);
      alert('Error de conexión al reenviar correos');
      setEmailStatus({ buyer: 'failed', seller: 'failed' });
    }
  };
  
  /**
   * Prueba el servicio de correos enviando un correo de prueba
   * 
   * @async
   * @function testEmailService
   */
  const testEmailService = async () => {
    try {
      const token = localStorage.getItem('lucesa-token');
      if (!token) {
        alert('No hay sesión activa');
        return;
      }
      
      const testEmail = prompt('Ingresa un email para prueba:', user.email);
      if (!testEmail) return;
      
      console.log('🧪 Probando servicio de correos con email:', testEmail);
      
      const response = await fetch(`${API_BASE_URL}/orders/test-buyer-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: testEmail })
      });
      
      const result = await response.json();
      console.log('Resultado de prueba:', result);
      
      if (result.success) {
        alert(`✅ Correo de prueba enviado a ${testEmail}\nRevisa tu bandeja de entrada (y spam).`);
      } else {
        alert(`❌ Error: ${result.message || result.error}`);
      }
      
    } catch (error) {
      console.error('Error probando servicio de correos:', error);
      alert('Error de conexión');
    }
  };
  
  /**
   * Muestra información detallada de depuración en consola
   * Guarda los datos en localStorage para análisis posterior
   * 
   * @function debugOrder
   */
  const debugOrder = () => {
    if (!orderData) {
      alert('No hay datos de orden');
      return;
    }
    
    console.log('='.repeat(60));
    console.log('🔍 DEBUG - Datos completos de la orden');
    console.log('='.repeat(60));
    console.log('📋 OrderData completo:', JSON.stringify(orderData, null, 2));
    
    // Guardar en localStorage para fácil acceso
    localStorage.setItem('debug_order_data', JSON.stringify(orderData, null, 2));
    
    // Mostrar información relevante
    const debugInfo = {
      orderId: orderData.id || orderData.orderId,
      orderNumber: orderData.order_number || orderData.orderNumber,
      customerEmail: orderData.customer_email || user?.email,
      itemsCount: orderData.cartItems?.length || orderData.items?.length || 0,
      total: orderData.total || orderData.total_amount,
      emails_sent: orderData.emails_sent || false,
      emailStatus: emailStatus
    };
    
    console.log('📊 Información de depuración:', debugInfo);
    
    // Analizar productos
    const products = orderData.cartItems || orderData.items || [];
    if (products.length > 0) {
      console.log('📦 Análisis de productos:');
      products.forEach((product, index) => {
        console.log(`   Producto ${index + 1}:`);
        console.log(`     - Campos:`, Object.keys(product));
        console.log(`     - Datos:`, product);
      });
    }
    
    alert('✅ Datos de orden guardados en consola y localStorage\n\nRevisa la consola del navegador (F12) para ver los detalles.');
  };
  
  // ==========================================================================
  // ESTADOS DE CARGA
  // ==========================================================================
  
  /**
   * Estado de carga: muestra spinner y mensaje
   */
  if (loading) {
    return (
      <div className="oc-page">
        <div className="oc-container">
          <div className="oc-loading">
            <div className="oc-loading-spinner"></div>
            <h2>Cargando detalles de tu pedido...</h2>
            <p>Estamos obteniendo la información de tu compra.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // ==========================================================================
  // ESTADOS DE ERROR
  // ==========================================================================
  
  /**
   * Estado de error: muestra mensaje y opciones de recuperación
   */
  if (error) {
    return (
      <div className="oc-page">
        <div className="oc-container">
          <div className="oc-error">
            <h2>⚠️ Error</h2>
            <p>{error}</p>
            <div className="oc-actions">
              <Link to="/my-account" className="oc-btn oc-btn-primary">
                Ver mis pedidos
              </Link>
              <Link to="/" className="oc-btn oc-btn-secondary">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  /**
   * Estado sin datos de orden: guía al usuario
   */
  if (!orderData) {
    return (
      <div className="oc-page">
        <div className="oc-container">
          <div className="oc-error">
            <h2>Orden no encontrada</h2>
            <p>No se pudo encontrar la información de tu pedido.</p>
            <p className="oc-help-text">
              Esto puede pasar si refrescaste la página. Puedes encontrar tu orden en "Mis Pedidos".
            </p>
            <div className="oc-actions">
              <Link to="/user-profile?tab=orders" className="oc-btn oc-btn-primary">
                Ver mis pedidos
              </Link>
              <Link to="/" className="oc-btn oc-btn-secondary">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // ==========================================================================
  // EXTRACCIÓN Y FORMATEO DE DATOS
  // ==========================================================================
  
  /**
   * Extrae y formatea datos de la orden para renderizado
   */
  const orderNumber = orderData.order_number || orderData.orderNumber || orderData.orderId || 'N/A';
  const total = orderData.total || orderData.total_amount || 0;
  const subtotal = orderData.subtotal || orderData.subtotal || 0;
  const tax = orderData.tax || orderData.tax_amount || 0;
  const shipping = orderData.shipping || orderData.shipping_amount || 0;
  const cartItems = orderData.cartItems || orderData.items || [];
  const orderDate = orderData.created_at ? 
    new Date(orderData.created_at).toLocaleDateString('es-MX') : 
    new Date().toLocaleDateString('es-MX');

  console.log('📊 Datos de orden para renderizar:', {
    orderNumber,
    total,
    itemsCount: cartItems.length,
    emailStatus
  });
  
  // ==========================================================================
  // RENDERIZADO PRINCIPAL
  // ==========================================================================
  
  return (
    <div className="oc-page">
      <div className="oc-container">
        <div className="oc-card">
          {/* ENCABEZADO DE CONFIRMACIÓN */}
          <div className="oc-header">
            <div className="oc-success-icon">✅</div>
            <h1 className="oc-title">¡Pedido Confirmado!</h1>
            <p className="oc-order-number">Número de orden: <strong>{orderNumber}</strong></p>
            
            {/* Estado de correos (comentado por ahora) */}
            {/* <div className="oc-email-status">...</div> */}
            
            {/* Información de depuración (comentado por ahora) */}
            {/* {debugInfo && (
              <div className="oc-debug-info">...</div>
            )} */}
            
            {/* Badge LUCESA (comentado por ahora) */}
            {/* {orderNumber.startsWith('LUCESA-') && (
              <div className="oc-lucesa-badge">...</div>
            )} */}
          </div>

          {/* DETALLES DE LA ORDEN */}
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
                    {orderDate}
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
                {orderData.shipping_address && (
                  <div className="oc-detail-row">
                    <span className="oc-detail-label">Dirección de envío:</span>
                    <span className="oc-detail-value">
                      {typeof orderData.shipping_address === 'string' 
                        ? orderData.shipping_address
                        : orderData.shipping_address.nombre || orderData.shipping_address.direccion || 'No especificada'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ACCIONES */}
          <div className="oc-actions">
            <Link to="/products" className="oc-btn oc-btn-primary">
              Seguir Comprando
            </Link>
            <Link to="/my-account" className="oc-btn oc-btn-secondary">
              Ver Mis Pedidos
            </Link>
            
            {/* Acciones de depuración (comentadas por ahora) */}
            {/* <div className="oc-debug-actions">...</div> */}
          </div>

          {/* INFORMACIÓN ADICIONAL */}
          <div className="oc-additional-info">
            <div className="oc-info-item">
              <span className="oc-info-icon">🚚</span>
              <span className="oc-info-text">Envío Gratis</span>
            </div>
            <div className="oc-info-item">
              <span className="oc-info-icon">🛡️</span>
              <span className="oc-info-text">Garantía 30 Días</span>
            </div>
            <div className="oc-info-item">
              <span className="oc-info-icon">🔒</span>
              <span className="oc-info-text">Pago Seguro</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;