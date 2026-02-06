import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * URL base de la API según entorno
 * @constant {string} API_BASE_URL
 */
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://lucesademexico-shop.com.mx/api'
  : 'http://localhost:4004/api';

/**
 * PAGO EXITO COMPONENT
 * 
 * Componente de procesamiento de éxito de pago para integración con Mercado Pago.
 * Maneja la redirección desde Mercado Pago después de un pago exitoso,
 * recupera la información de la orden y redirige a la página de confirmación.
 * 
 * Características principales:
 * - Procesamiento de múltiples parámetros de redirección de Mercado Pago
 * - Estrategias de búsqueda de órdenes (external_reference, payment_id, preference_id)
 * - Integración con localStorage para persistencia entre sesiones
 * - Manejo robusto de errores y casos edge
 * - Sistema de depuración integrado
 * - Redirección inteligente basada en disponibilidad de datos
 * 
 * @component
 * @example
 * // Uso como página de callback de Mercado Pago
 * <Route path="/payment-success" element={<PagoExito />} />
 * 
 * // Redirección desde Mercado Pago incluye múltiples parámetros:
 * // https://tudominio.com/payment-success?
 * //   payment_id=123456789
 * //   &external_reference=ORDER_123
 * //   &collection_status=approved
 * //   &preference_id=987654321
 */

/**
 * Componente PagoExito - Procesador de pagos exitosos
 * 
 * Este componente se activa cuando:
 * 1. Mercado Pago redirige al usuario después de un pago exitoso
 * 2. Se reciben parámetros de redirección en la URL
 * 3. Necesita recuperar y validar la información de la orden
 * 
 * Flujo del componente:
 * 1. Extraer parámetros de la URL de redirección
 * 2. Guardar parámetros para depuración
 * 3. Intentar múltiples estrategias para encontrar la orden
 * 4. Redirigir a página de confirmación con datos de la orden
 * 5. Manejar errores y casos fallback
 * 
 * @returns {JSX.Element|null} Componente de procesamiento o null si redirige
 */
const PagoExito = () => {
  /**
   * Hook para acceder a la ubicación actual (URL y parámetros)
   * @const {Object} location - Objeto de ubicación de React Router
   * @property {Object} location.search - String de búsqueda de la URL
   */
  const location = useLocation();
  
  /**
   * Hook para navegación programática
   * @const {function} navigate - Función de navegación de React Router
   */
  const navigate = useNavigate();
  
  /**
   * Estado de carga durante el procesamiento
   * @state {boolean} loading - Controla la visualización del spinner
   */
  const [loading, setLoading] = useState(true);

  /**
   * Efecto principal: procesa el éxito del pago al montar el componente
   * Se ejecuta una sola vez cuando el componente se monta
   * 
   * @effect
   * @dependencies [location, navigate]
   * @fires processPaymentSuccess - Función principal de procesamiento
   */
  useEffect(() => {
    /**
     * Función principal que procesa el éxito del pago
     * Implementa múltiples estrategias para encontrar la orden
     * 
     * @async
     * @function processPaymentSuccess
     * @throws {Error} Si no se puede procesar el pago o encontrar la orden
     * @fires navigate - Para redirigir a confirmación o error
     */
    const processPaymentSuccess = async () => {
      try {
        // Parsear parámetros de la URL
        const urlParams = new URLSearchParams(location.search);
        
        console.log('🔍 Parámetros recibidos de Mercado Pago:');
        console.log('URL completa:', window.location.href);
        
        // ====================================================================
        // EXTRACCIÓN DE PARÁMETROS
        // ====================================================================
        
        // Extraer TODOS los parámetros posibles de Mercado Pago
        const paymentId = urlParams.get('payment_id') || urlParams.get('payment-id');
        const preferenceId = urlParams.get('preference_id') || urlParams.get('preference-id');
        const externalReference = urlParams.get('external_reference') || urlParams.get('external-reference');
        const collectionId = urlParams.get('collection_id') || urlParams.get('collection-id');
        const collectionStatus = urlParams.get('collection_status');
        const merchantOrderId = urlParams.get('merchant_order_id');
        
        // Log de diagnóstico de parámetros extraídos
        console.log('📊 Parámetros extraídos:', {
          paymentId,
          preferenceId,
          externalReference,
          collectionId,
          collectionStatus,
          merchantOrderId
        });

        // ====================================================================
        // GUARDADO PARA DEPURACIÓN
        // ====================================================================
        
        /**
         * Guarda los parámetros recibidos en localStorage para depuración
         * Útil cuando el usuario reporta problemas o para debugging en producción
         */
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

        // ====================================================================
        // ESTRATEGIA 1: external_reference (MÁS CONFIABLE)
        // ====================================================================
        if (externalReference) {
          console.log('✅ Usando external_reference:', externalReference);
          
          // Buscar en localStorage si tenemos datos de la orden
          const orderKey = `lucesa_order_${externalReference}`;
          const savedOrder = localStorage.getItem(orderKey);
          
          if (savedOrder) {
            console.log('✅ Orden encontrada en localStorage');
            const orderData = JSON.parse(savedOrder);
            
            // Redirigir a confirmación con datos de la orden
            navigate('/order-confirmation', {
              replace: true,        // Reemplazar en historial
              state: orderData      // Pasar datos de la orden
            });
          } else {
            // Si no está en localStorage, obtener del backend
            console.log('🔍 Obteniendo orden del backend con external_reference:', externalReference);
            await fetchOrderFromBackend(externalReference);
          }
          return; // Terminar ejecución
        }

        // ====================================================================
        // ESTRATEGIA 2: payment_id (PARA WEBHOOKS O REDIRECCIONES DIRECTAS)
        // ====================================================================
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
                // Continuar si hay error parseando un item
                continue;
              }
            }
          }
          
          // Si no está en localStorage, buscar en el backend
          await findOrderByPaymentId(paymentId);
          return;
        }

        // ====================================================================
        // ESTRATEGIA 3: preference_id (FALLBACK)
        // ====================================================================
        if (preferenceId) {
          console.log('🎫 Buscando orden por preference_id:', preferenceId);
          
          // Buscar en localStorage por preference_id
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
          
          // Si se llega aquí, no se encontró por preference_id
          console.warn('⚠️ No se encontró orden por preference_id');
        }

        // ====================================================================
        // ESTRATEGIA 4: FALLBACK Y ERROR HANDLING
        // ====================================================================
        
        // Si no se encontró nada con ninguna estrategia
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
        // Manejo de errores generales
        console.error('❌ Error en processPaymentSuccess:', error);
        navigate('/payment-error', {
          replace: true,
          state: { error: error.message }
        });
      } finally {
        // Siempre detener el estado de loading
        setLoading(false);
      }
    };

    // ========================================================================
    // FUNCIONES AUXILIARES
    // ========================================================================

    /**
     * Obtiene una orden del backend usando external_reference
     * 
     * @async
     * @function fetchOrderFromBackend
     * @param {string} orderId - ID de la orden (external_reference)
     * @throws {Error} Si falla la llamada a la API o la orden no existe
     * @fires navigate - Redirige a confirmación con datos de la orden
     */
    const fetchOrderFromBackend = async (orderId) => {
      try {
        // Obtener token de autenticación
        const token = localStorage.getItem('lucesa-token');
        
        // Llamar a la API para obtener detalles de la orden
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Verificar respuesta
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.order) {
            console.log('✅ Orden obtenida del backend:', data.order);
            
            // Guardar en localStorage para futuras referencias
            localStorage.setItem(`lucesa_order_${orderId}`, JSON.stringify(data.order));
            
            // Redirigir a confirmación
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
        
        // Fallback: crear datos mínimos de orden
        const minimalOrderData = {
          orderId: orderId,
          order_number: `LUCESA-${orderId}`,
          message: 'Orden encontrada pero no se pudieron cargar todos los detalles',
          isFallback: true
        };
        
        navigate('/order-confirmation', {
          replace: true,
          state: minimalOrderData
        });
      }
    };

    /**
     * Busca una orden en el backend usando payment_id de Mercado Pago
     * 
     * @async
     * @function findOrderByPaymentId
     * @param {string} paymentId - ID de pago de Mercado Pago
     * @throws {Error} Si falla la llamada a la API
     * @fires navigate - Redirige a confirmación con datos encontrados
     */
    const findOrderByPaymentId = async (paymentId) => {
      try {
        const token = localStorage.getItem('lucesa-token');
        
        // Endpoint especial para buscar orden por payment_id
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
            
            // Guardar en localStorage para futuras referencias
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
        
        // Fallback: crear orden mínima con información disponible
        const minimalOrderData = {
          mp_payment_id: paymentId,
          order_number: `MP-${paymentId.substring(0, 8)}`,
          message: 'Pago procesado exitosamente. Tu orden está siendo procesada.',
          isFallback: true,
          timestamp: new Date().toISOString()
        };
        
        navigate('/order-confirmation', {
          replace: true,
          state: minimalOrderData
        });
      }
    };

    // Ejecutar el procesamiento principal
    processPaymentSuccess();
  }, [location, navigate]); // Dependencias: location y navigate

  // ==========================================================================
  // RENDERIZADO CONDICIONAL: ESTADO DE CARGA
  // ==========================================================================

  /**
   * Estado de carga: muestra spinner y mensaje informativo
   * Incluye botón de depuración para troubleshooting
   */
  if (loading) {
    return (
      <div className="pago-exito-loading">
        {/* Spinner de carga */}
        <div className="loading-spinner"></div>
        
        {/* Mensaje principal */}
        <h2>Procesando tu pago...</h2>
        <p>Estamos confirmando los detalles de tu compra.</p>
        
        {/* Botón de depuración para desarrollo/testing */}
        <button 
          onClick={() => {
            // Recuperar y mostrar parámetros guardados para depuración
            const params = localStorage.getItem('mp_last_payment_params');
            console.log('🔍 Depuración - Parámetros de pago:', params);
            
            // Opción 1: Mostrar en consola (para desarrolladores)
            console.log('📋 Parámetros JSON:', JSON.parse(params || '{}'));
            
            // Opción 2: Mostrar alerta (para usuarios que reportan problemas)
            alert('Consulta la consola del navegador para ver los detalles de depuración');
            
            // Opción 3: Copiar al portapapeles
            if (params) {
              navigator.clipboard.writeText(params);
              alert('Parámetros copiados al portapapeles');
            }
          }}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          aria-label="Mostrar información de depuración"
          title="Útil para debugging o reportar problemas"
        >
          Mostrar Depuración
        </button>
        
        {/* Nota para el usuario */}
        <p style={{ 
          marginTop: '20px', 
          fontSize: '12px', 
          color: '#666',
          fontStyle: 'italic'
        }}>
          Esta página se cerrará automáticamente cuando el proceso termine.
        </p>
      </div>
    );
  }

  /**
   * Estado normal: componente no renderiza nada (ya redirigió)
   * @returns {null}
   */
  return null;
};

export default PagoExito;