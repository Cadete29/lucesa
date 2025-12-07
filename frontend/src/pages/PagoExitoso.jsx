// PagoExito.jsx - CORREGIDO
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api'
  : 'http://localhost:4004/api';

const PagoExito = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        
        console.log('🔍 Parámetros recibidos de Mercado Pago:');
        console.log('URL completa:', window.location.href);
        
        // Extraer TODOS los parámetros posibles
        const paymentId = urlParams.get('payment_id') || urlParams.get('payment-id');
        const preferenceId = urlParams.get('preference_id') || urlParams.get('preference-id');
        const externalReference = urlParams.get('external_reference') || urlParams.get('external-reference');
        const collectionId = urlParams.get('collection_id') || urlParams.get('collection-id');
        const collectionStatus = urlParams.get('collection_status');
        const merchantOrderId = urlParams.get('merchant_order_id');
        
        console.log('📊 Parámetros extraídos:', {
          paymentId,
          preferenceId,
          externalReference,
          collectionId,
          collectionStatus,
          merchantOrderId
        });

        // 🔴 GUARDAR PARA DEPURACIÓN
        localStorage.setItem('mp_last_payment_params', JSON.stringify({
          timestamp: new Date().toISOString(),
          url: window.location.href,
          params: {
            paymentId,
            preferenceId,
            externalReference,
            collectionId,
            collectionStatus,
            merchantOrderId
          }
        }));

        // ESTRATEGIA 1: Si tenemos external_reference, ir directo a OrderConfirmation
        if (externalReference) {
          console.log('✅ Usando external_reference:', externalReference);
          
          // Buscar en localStorage si tenemos datos de la orden
          const orderKey = `lucesa_order_${externalReference}`;
          const savedOrder = localStorage.getItem(orderKey);
          
          if (savedOrder) {
            console.log('✅ Orden encontrada en localStorage');
            const orderData = JSON.parse(savedOrder);
            navigate('/order-confirmation', {
              replace: true,
              state: orderData
            });
          } else {
            // Si no está en localStorage, obtener del backend
            console.log('🔍 Obteniendo orden del backend con external_reference:', externalReference);
            await fetchOrderFromBackend(externalReference);
          }
          return;
        }

        // ESTRATEGIA 2: Si tenemos payment_id, buscar la orden
        if (paymentId) {
          console.log('💰 Buscando orden por payment_id:', paymentId);
          
          // Primero buscar en localStorage por payment_id
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('lucesa_order_')) {
              try {
                const orderData = JSON.parse(localStorage.getItem(key));
                if (orderData.mp_payment_id === paymentId || 
                    orderData.paymentId === paymentId) {
                  console.log('✅ Orden encontrada en localStorage por payment_id');
                  navigate('/order-confirmation', {
                    replace: true,
                    state: orderData
                  });
                  return;
                }
              } catch (e) {
                continue;
              }
            }
          }
          
          // Si no está en localStorage, buscar en el backend
          await findOrderByPaymentId(paymentId);
          return;
        }

        // ESTRATEGIA 3: Si tenemos preference_id, buscar la orden
        if (preferenceId) {
          console.log('🎫 Buscando orden por preference_id:', preferenceId);
          
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('lucesa_order_')) {
              try {
                const orderData = JSON.parse(localStorage.getItem(key));
                if (orderData.mp_preference_id === preferenceId) {
                  console.log('✅ Orden encontrada en localStorage por preference_id');
                  navigate('/order-confirmation', {
                    replace: true,
                    state: orderData
                  });
                  return;
                }
              } catch (e) {
                continue;
              }
            }
          }
        }

        // Si no se encontró nada, mostrar error
        console.error('❌ No se pudo encontrar la orden con los parámetros disponibles');
        navigate('/payment-error', {
          replace: true,
          state: {
            error: 'No se pudo encontrar tu orden después del pago exitoso',
            params: {
              paymentId,
              preferenceId,
              externalReference
            }
          }
        });

      } catch (error) {
        console.error('❌ Error en processPaymentSuccess:', error);
        navigate('/payment-error', {
          replace: true,
          state: { error: error.message }
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchOrderFromBackend = async (orderId) => {
      try {
        const token = localStorage.getItem('lucesa-token');
        
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.order) {
            console.log('✅ Orden obtenida del backend:', data.order);
            
            // Guardar en localStorage para futuras referencias
            localStorage.setItem(`lucesa_order_${orderId}`, JSON.stringify(data.order));
            
            navigate('/order-confirmation', {
              replace: true,
              state: data.order
            });
          } else {
            throw new Error(data.message || 'Error en la respuesta del servidor');
          }
        } else {
          throw new Error(`Error HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Error obteniendo orden del backend:', error);
        
        // Intentar obtener información básica
        const minimalOrderData = {
          orderId: orderId,
          order_number: `LUCESA-${orderId}`,
          message: 'Orden encontrada pero no se pudieron cargar todos los detalles'
        };
        
        navigate('/order-confirmation', {
          replace: true,
          state: minimalOrderData
        });
      }
    };

    const findOrderByPaymentId = async (paymentId) => {
      try {
        const token = localStorage.getItem('lucesa-token');
        
        const response = await fetch(`${API_BASE_URL}/payments/find-order-by-payment/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.order) {
            console.log('✅ Orden encontrada por payment_id:', data.order);
            
            // Guardar en localStorage
            localStorage.setItem(`lucesa_order_${data.order.id}`, JSON.stringify(data.order));
            
            navigate('/order-confirmation', {
              replace: true,
              state: data.order
            });
          } else {
            throw new Error(data.message || 'Orden no encontrada');
          }
        } else {
          throw new Error(`Error HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Error buscando orden por payment_id:', error);
        
        // Crear una orden mínima
        const minimalOrderData = {
          mp_payment_id: paymentId,
          order_number: `MP-${paymentId.substring(0, 8)}`,
          message: 'Pago procesado exitosamente'
        };
        
        navigate('/order-confirmation', {
          replace: true,
          state: minimalOrderData
        });
      }
    };

    processPaymentSuccess();
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="pago-exito-loading">
        <div className="loading-spinner"></div>
        <h2>Procesando tu pago...</h2>
        <p>Estamos confirmando los detalles de tu compra.</p>
        <button 
          onClick={() => {
            const params = localStorage.getItem('mp_last_payment_params');
            console.log('🔍 Depuración:', params);
            alert('Consulta la consola para ver los detalles de depuración');
          }}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Mostrar Depuración
        </button>
      </div>
    );
  }

  return null;
};

export default PagoExito;