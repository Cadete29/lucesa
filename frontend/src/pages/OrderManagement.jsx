import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './OrderManagement.css';

const OrderManagement = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [lastLoadTime, setLastLoadTime] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' o 'cards'

  // Referencias para scroll
  const modalRef = useRef(null);
  const tableRef = useRef(null);
  const selectedRowRef = useRef(null);

  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://lucesademexico-shop.com.mx/api'
    : 'http://localhost:4004/api';

  // Función para abrir detalles con scroll automático
  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    
    // Guardar referencia a la fila/tarjeta seleccionada
    const element = document.querySelector(`[data-order-id="${order.id}"]`);
    if (element) {
      selectedRowRef.current = element;
      
      // Agregar clase para resaltar
      element.classList.add('row-highlighted');
    }
    
    // Desplazar al modal después de un pequeño delay
    setTimeout(() => {
      if (modalRef.current) {
        modalRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
        
        // Enfocar el botón de cerrar del modal para accesibilidad
        setTimeout(() => {
          const closeButton = modalRef.current?.querySelector('.close-button');
          if (closeButton) closeButton.focus();
        }, 300);
      }
    }, 100);
  };

  // Función para cerrar detalles con scroll automático
  const closeOrderDetails = () => {
    // Guardar la referencia al modal antes de cerrarlo
    const modalElement = modalRef.current;
    setSelectedOrder(null);
    
    // Desplazar al elemento seleccionado
    setTimeout(() => {
      if (selectedRowRef.current) {
        // Remover clase de resaltado
        selectedRowRef.current.classList.remove('row-highlighted');
        
        // Desplazar al elemento
        selectedRowRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
        
        // Enfocar el botón de detalles para accesibilidad
        setTimeout(() => {
          const detailsButton = selectedRowRef.current?.querySelector('.btn-small.btn-primary');
          if (detailsButton) detailsButton.focus();
        }, 300);
      } else {
        // Si no hay elemento seleccionado, desplazar al inicio
        if (tableRef.current) {
          tableRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
          });
        }
      }
    }, 150);
  };

  // Función para cargar todas las órdenes desde la base de datos
  const loadAllOrders = async () => {
    try {
      setLoading(true);
      setError('');
      // Cerrar modal si está abierto al recargar
      setSelectedOrder(null);
      
      console.log('🔍 Cargando órdenes desde backend...');
      console.log('📡 URL:', `${API_BASE_URL}/orders/admin/orders`);
      console.log('🔑 Token presente:', !!token);
      console.log('👤 Usuario ID:', user?.id);
      
      const response = await fetch(`${API_BASE_URL}/orders/admin/orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📥 Respuesta recibida, status:', response.status);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('No tienes permisos de administrador');
        } else if (response.status === 401) {
          throw new Error('Token inválido o expirado');
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('📊 Datos recibidos:', data);
      
      if (data.success) {
        setOrders(data.orders || []);
        setLastLoadTime(new Date());
        console.log(`✅ ${data.orders?.length || 0} órdenes cargadas correctamente`);
        
        if (data.note) {
          console.log('📝 Nota del backend:', data.note);
        }
      } else {
        setError(data.message || 'Error al cargar las órdenes');
        console.error('❌ Error del backend:', data.message);
        // Fallback a datos de ejemplo si hay error
        setOrders(getSampleOrders());
      }
    } catch (error) {
      console.error('❌ Error cargando órdenes:', error);
      setError(`Error de conexión: ${error.message}`);
      
      // Intentar ruta simple como fallback
      try {
        console.log('🔄 Intentando ruta simple como fallback...');
        const simpleResponse = await fetch(`${API_BASE_URL}/orders/admin/orders/simple`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (simpleResponse.ok) {
          const simpleData = await simpleResponse.json();
          if (simpleData.success) {
            setOrders(simpleData.orders || []);
            setLastLoadTime(new Date());
            console.log(`✅ ${simpleData.orders?.length || 0} órdenes cargadas vía ruta simple`);
            setError('');
            return;
          }
        }
      } catch (simpleError) {
        console.error('❌ Error en ruta simple:', simpleError);
      }
      
      // Fallback a datos de ejemplo
      setOrders(getSampleOrders());
    } finally {
      setLoading(false);
    }
  };

  // Datos de ejemplo como fallback
  const getSampleOrders = () => {
    return [
      {
        id: 1,
        order_number: 'LUCESA-1705789800000',
        user_id: 1,
        total_amount: 156.75,
        subtotal: 1291.98,
        tax_amount: 64.77,
        shipping_amount: 0,
        status: 'completed',
        payment_method: 'Mercado Pago',
        shipping_address: {
          nombre: 'Juan Pérez',
          email: 'juan@email.com',
          telefono: '555-123-4567'
        },
        customer_name: 'Juan Pérez',
        customer_email: 'juan@email.com',
        customer_phone: '555-123-4567',
        created_at: '2024-01-20T14:30:00Z',
        items: [
          { 
            id: 1,
            product_name: 'Laptop Gaming Pro', 
            product_code: 'PROD001',
            quantity: 1, 
            unit_price: 1200,
            total_price: 1200,
            product_brand: 'GamingBrand',
            product_image_url: 'https://lucesademexico-shop.com.mx/api/images/code/PROD001?size=small'
          },
          { 
            id: 2,
            product_name: 'Mouse Inalámbrico', 
            product_code: 'PROD005',
            quantity: 2, 
            unit_price: 45.99,
            total_price: 91.98,
            product_brand: 'TechCorp',
            product_image_url: 'https://lucesademexico-shop.com.mx/api/images/code/PROD005?size=small'
          }
        ]
      },
      {
        id: 2,
        order_number: 'LUCESA-1705789500000',
        user_id: 2,
        total_amount: 89.99,
        subtotal: 89.99,
        tax_amount: 4.50,
        shipping_amount: 0,
        status: 'processing',
        payment_method: 'Mercado Pago',
        shipping_address: {
          nombre: 'María García',
          email: 'maria@email.com',
          telefono: '555-987-6543'
        },
        customer_name: 'María García',
        customer_email: 'maria@email.com',
        customer_phone: '555-987-6543',
        created_at: '2024-01-18T10:15:00Z',
        items: [
          { 
            id: 3,
            product_name: 'Teclado Mecánico', 
            product_code: 'PROD006',
            quantity: 1, 
            unit_price: 89.99,
            total_price: 89.99,
            product_brand: 'KeyboardPro',
            product_image_url: 'https://lucesademexico-shop.com.mx/api/images/code/PROD006?size=small'
          }
        ]
      },
      {
        id: 3,
        order_number: 'LUCESA-1705789200000',
        user_id: 3,
        total_amount: 245.50,
        subtotal: 245.50,
        tax_amount: 12.28,
        shipping_amount: 15.00,
        status: 'shipped',
        payment_method: 'Tarjeta de Crédito',
        shipping_address: {
          nombre: 'Carlos Rodríguez',
          email: 'carlos@email.com',
          telefono: '555-456-7890'
        },
        customer_name: 'Carlos Rodríguez',
        customer_email: 'carlos@email.com',
        customer_phone: '555-456-7890',
        created_at: '2024-01-15T16:45:00Z',
        items: [
          { 
            id: 4,
            product_name: 'Monitor 24" Full HD', 
            product_code: 'PROD007',
            quantity: 1, 
            unit_price: 199.99,
            total_price: 199.99,
            product_brand: 'DisplayTech',
            product_image_url: 'https://lucesademexico-shop.com.mx/api/images/code/PROD007?size=small'
          },
          { 
            id: 5,
            product_name: 'Webcam HD', 
            product_code: 'PROD008',
            quantity: 1, 
            unit_price: 45.51,
            total_price: 45.51,
            product_brand: 'CameraPro',
            product_image_url: 'https://lucesademexico-shop.com.mx/api/images/code/PROD008?size=small'
          }
        ]
      },
      {
        id: 4,
        order_number: 'LUCESA-1705788900000',
        user_id: 4,
        total_amount: 78.20,
        subtotal: 78.20,
        tax_amount: 3.91,
        shipping_amount: 0,
        status: 'pending',
        payment_method: 'Mercado Pago',
        shipping_address: {
          nombre: 'Ana López',
          email: 'ana@email.com',
          telefono: '555-321-6547'
        },
        customer_name: 'Ana López',
        customer_email: 'ana@email.com',
        customer_phone: '555-321-6547',
        created_at: '2024-01-10T09:20:00Z',
        items: [
          { 
            id: 6,
            product_name: 'Auriculares Bluetooth', 
            product_code: 'PROD009',
            quantity: 1, 
            unit_price: 78.20,
            total_price: 78.20,
            product_brand: 'AudioTech',
            product_image_url: 'lucesademexico-shop.com.mx'
          }
        ]
      },
      {
        id: 5,
        order_number: 'LUCESA-1705788600000',
        user_id: 5,
        total_amount: 350.75,
        subtotal: 350.75,
        tax_amount: 17.54,
        shipping_amount: 25.00,
        status: 'delivered',
        payment_method: 'Transferencia Bancaria',
        shipping_address: {
          nombre: 'Roberto Sánchez',
          email: 'roberto@email.com',
          telefono: '555-789-0123'
        },
        customer_name: 'Roberto Sánchez',
        customer_email: 'roberto@email.com',
        customer_phone: '555-789-0123',
        created_at: '2024-01-05T11:10:00Z',
        items: [
          { 
            id: 7,
            product_name: 'Tablet 10"', 
            product_code: 'PROD010',
            quantity: 1, 
            unit_price: 325.75,
            total_price: 325.75,
            product_brand: 'TabletPro',
            product_image_url: 'lucesademexico-shop.com.mx'
          }
        ]
      }
    ];
  };

  useEffect(() => {
    if (user?.rol === 'admin' && token) {
      console.log('👤 Usuario admin detectado, cargando órdenes...');
      loadAllOrders();
    } else {
      console.log('⚠️ Usuario no es admin o no autenticado');
      setLoading(false);
    }
  }, [user, token]);

  // Función para actualizar el estado de una orden
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      console.log(`🔄 Actualizando orden ${orderId} a estado: ${newStatus}`);
      
      const response = await fetch(`${API_BASE_URL}/orders/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      console.log('📥 Respuesta de actualización:', response.status);

      const data = await response.json();
      console.log('📊 Datos de actualización:', data);
      
      if (data.success) {
        // Actualizar el estado localmente
        setOrders(orders.map(order =>
          order.id === orderId ? { 
            ...order, 
            status: newStatus
          } : order
        ));
        
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        
        alert(`✅ Estado actualizado a: ${getStatusLabel(newStatus)}`);
        
        // Recargar órdenes para asegurar consistencia
        setTimeout(() => {
          loadAllOrders();
        }, 500);
      } else {
        setError(data.message || 'Error al actualizar el estado');
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('❌ Error actualizando estado:', error);
      setError(`Error de conexión: ${error.message}`);
      alert('❌ Error de conexión al servidor');
    }
  };

  // Función para probar diferentes rutas (debug)
  const testRoutes = async () => {
    console.log('🧪 Probando rutas disponibles...');
    
    const routesToTest = [
      '/orders/admin/orders',
      '/orders/admin/stats',
      '/orders/history'
    ];
    
    for (const route of routesToTest) {
      try {
        console.log(`🔍 Probando: ${route}`);
        const response = await fetch(`${API_BASE_URL}${route}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`   ${route}: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`   ${route}: ERROR - ${error.message}`);
      }
    }
  };

  const filteredOrders = orders.filter(order => 
    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.shipping_address?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.shipping_address?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customer_email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusLabel = (status) => {
    const statusMap = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmado',
      'processing': 'En Proceso',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado',
      'completed': 'Completado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#ff9800',
      'confirmed': '#2196f3',
      'processing': '#2196f3',
      'shipped': '#9c27b0',
      'delivered': '#4caf50',
      'cancelled': '#f44336',
      'completed': '#4caf50'
    };
    return colorMap[status] || '#666';
  };

  const getStatusOptions = (currentStatus) => {
    const options = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': ['pending'],
      'completed': []
    };
    return options[currentStatus] || [];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatLastLoadTime = () => {
    if (!lastLoadTime) return 'Nunca';
    
    const now = new Date();
    const diffMs = now - lastLoadTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins === 1) return 'Hace 1 minuto';
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Hace 1 hora';
    return `Hace ${diffHours} horas`;
  };

  // Manejar tecla Escape para cerrar modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedOrder) {
        closeOrderDetails();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedOrder]);

  // Determinar view mode basado en tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1200) {
        setViewMode('cards');
      } else {
        setViewMode('table');
      }
    };

    // Establecer view mode inicial
    handleResize();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (user?.rol !== 'admin') {
    return (
      <div className="admin-panel">
        <div className="no-access">
          <div className="no-access-icon">🔒</div>
          <h3>Acceso Restringido</h3>
          <p>No tienes permisos de administrador para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>📝 Gestión de Pedidos LUCESA</h1>
        <p>Administra y realiza seguimiento de todos los pedidos del sistema</p>
        
        <div className="header-info">
          <div className="last-update">
            <small>🕒 Última actualización: {formatLastLoadTime()}</small>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={loadAllOrders} 
              className="btn-refresh"
              disabled={loading}
              title="Recargar órdenes desde la base de datos"
            >
              {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
            </button>
            
            <div className="view-toggle">
              {/* <button
                className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
                title="Vista de tabla"
              >
                📊 Tabla
              </button> */}
              {/* <button
                className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Vista de tarjetas"
              >
                🃏 Tarjetas
              </button> */}
            </div>
            
            {/* <button 
              onClick={testRoutes}
              className="btn-debug"
              title="Probar rutas del backend (solo desarrollo)"
            >
              🧪 Probar Rutas
            </button> */}
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️</span>
          <div>
            <strong>Error:</strong> {error}
            <br />
            <small>Algunos datos pueden ser de ejemplo</small>
          </div>
        </div>
      )}

      {/* Información de debug */}
      {/* <div className="debug-info">
        <small>
          🔗 API: {API_BASE_URL} | 
          👤 Admin: {user?.email} | 
          📊 Órdenes: {orders.length} |
          🔑 Token: {token ? '✅ Presente' : '❌ Ausente'} |
          👁️ Vista: {viewMode === 'table' ? 'Tabla' : 'Tarjetas'}
        </small>
      </div> */}

      {/* Búsqueda y filtros */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por número LUCESA, cliente, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="filter-actions">
          <select 
            className="filter-select"
            onChange={(e) => {
              if (e.target.value) {
                setSearchTerm(e.target.value);
              }
            }}
          >
            <option value="">Filtrar por estado</option>
            <option value="pending">Pendiente</option>
            <option value="processing">En Proceso</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregado</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <div>
            <p>Cargando pedidos desde la base de datos...</p>
            <small>Conectando a: {API_BASE_URL}/orders/admin/orders</small>
          </div>
        </div>
      ) : (
        <div className="orders-container">
          <div className="results-info">
            <span>
              Mostrando <strong>{filteredOrders.length}</strong> de <strong>{orders.length}</strong> pedidos
              {searchTerm && <span> para "<em>{searchTerm}</em>"</span>}
            </span>
            <span className="lucesa-count">
              🏭 {filteredOrders.filter(o => o.order_number?.startsWith('LUCESA-')).length} órdenes LUCESA
            </span>
          </div>

          {/* Vista de Tabla (Desktop) */}
          {viewMode === 'table' && filteredOrders.length > 0 && (
            <div className="admin-table-container responsive-table" ref={tableRef}>
              <table className="admin-table desktop-view">
                <thead>
                  <tr>
                    <th>Número LUCESA</th>
                    <th>Cliente</th>
                    <th>Productos</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr 
                      key={order.id} 
                      className="order-row"
                      data-order-id={order.id}
                      ref={selectedOrder?.id === order.id ? selectedRowRef : null}
                    >
                      <td>
                        <div className="order-number-cell">
                          <strong className="lucesa-order-number">
                            {order.order_number}
                          </strong>
                          {order.order_number?.startsWith('LUCESA-') && (
                            <span className="lucesa-badge-small">🏭</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="customer-info">
                          <strong>{order.customer_name || order.shipping_address?.nombre || 'Cliente'}</strong>
                          <br />
                          <small>{order.customer_email || order.shipping_address?.email || 'Sin email'}</small>
                          {(order.customer_phone || order.shipping_address?.telefono) && (
                            <div><small> {order.customer_phone || order.shipping_address?.telefono}</small></div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="products-list">
                          {order.items?.slice(0, 2).map((item, index) => (
                            <div key={index} className="product-item-small">
                              <div className="product-image-small">
                                {item.product_image_url ? (
                                  <img 
                                    src={item.product_image_url} 
                                    alt={item.product_name}
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div className="image-placeholder-small">
                                  📦
                                </div>
                              </div>
                              <div className="product-info-small">
                                <strong>{item.product_name}</strong>
                                <div className="product-meta">
                                  <span>Código: {item.product_code}</span>
                                  <span>Cantidad: {item.quantity}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {order.items?.length > 2 && (
                            <div className="more-items">
                              +{order.items.length - 2} más...
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="total-info">
                          <strong>{formatCurrency(order.total_amount)}</strong>
                          <div className="breakdown">
                            <small>Sub: {formatCurrency(order.subtotal)}</small>
                            <small>IVA: {formatCurrency(order.tax_amount)}</small>
                            {order.shipping_amount > 0 && (
                              <small>Envío: {formatCurrency(order.shipping_amount)}</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span 
                          className={`status-badge ${order.status}`}
                          style={{ borderColor: getStatusColor(order.status) }}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td>
                        <div className="date-cell">
                          {formatDate(order.created_at)}
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-small btn-primary"
                            onClick={() => selectedOrder?.id === order.id ? closeOrderDetails() : openOrderDetails(order)}
                            title="Ver detalles del pedido"
                            aria-expanded={selectedOrder?.id === order.id}
                            aria-controls={`order-details-${order.id}`}
                          >
                            {selectedOrder?.id === order.id ? '👁️ Cerrar' : '👁️ Detalles'}
                          </button>
                          
                          {selectedOrder?.id === order.id && (
                            <div className="status-actions">
                              {getStatusOptions(order.status).map(status => (
                                <button
                                  key={status}
                                  className={`btn-small btn-status ${status === 'cancelled' ? 'btn-danger' : 'btn-success'}`}
                                  onClick={() => handleStatusUpdate(order.id, status)}
                                  title={`Cambiar a ${getStatusLabel(status)}`}
                                >
                                  {status === 'cancelled' ? ' Cancelar' : 
                                   status === 'processing' ? ' Procesar' : 
                                   status === 'shipped' ? ' Enviar' :
                                   status === 'delivered' ? ' Entregar' : 
                                   '↩ Reabrir'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Vista de Tarjetas (Mobile/Tablet) */}
          {viewMode === 'cards' && filteredOrders.length > 0 && (
            <div className="mobile-cards-view" ref={tableRef}>
              {filteredOrders.map(order => (
                <div 
                  key={`mobile-${order.id}`} 
                  className="order-card"
                  data-order-id={order.id}
                  ref={selectedOrder?.id === order.id ? selectedRowRef : null}
                >
                  <div className="card-header">
                    <div className="card-order-number">
                      <strong>{order.order_number}</strong>
                      {order.order_number?.startsWith('LUCESA-') && (
                        {/* <span className="lucesa-badge-small">🏭</span> */}
                      )}
                    </div>
                    <span 
                      className={`status-badge ${order.status}`}
                      style={{ borderColor: getStatusColor(order.status) }}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  
                  <div className="card-content">
                    <div className="card-section">
                      <h4>Cliente</h4>
                      <div className="customer-info">
                        <strong>{order.customer_name || order.shipping_address?.nombre || 'Cliente'}</strong>
                        <small>{order.customer_email || order.shipping_address?.email || 'Sin email'}</small>
                        {(order.customer_phone || order.shipping_address?.telefono) && (
                          <small> {order.customer_phone || order.shipping_address?.telefono}</small>
                        )}
                      </div>
                    </div>
                    
                    <div className="card-section">
                      <h4>Productos</h4>
                      <div className="products-list-compact">
                        {order.items?.slice(0, 3).map((item, index) => (
                          <div key={index} className="product-item-compact">
                            <div className="product-image-compact">
                              {item.product_image_url ? (
                                <img 
                                  src={item.product_image_url} 
                                  alt={item.product_name}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className="image-placeholder-compact">
                                📦
                              </div>
                            </div>
                            <div className="product-info-compact">
                              <div className="product-name-compact">{item.product_name}</div>
                              <div className="product-meta-compact">
                                <span>x{item.quantity}</span>
                                <span>{formatCurrency(item.unit_price)} c/u</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {order.items?.length > 3 && (
                          <div className="more-items-compact">
                            +{order.items.length - 3} productos más
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="card-grid">
                      <div className="card-grid-item">
                        <span className="card-label">Total</span>
                        <span className="card-value total-value">{formatCurrency(order.total_amount)}</span>
                      </div>
                      <div className="card-grid-item">
                        <span className="card-label">Fecha</span>
                        <span className="card-value">{formatDate(order.created_at).split(',')[0]}</span>
                      </div>
                      <div className="card-grid-item">
                        <span className="card-label">Pago</span>
                        <span className="card-value">{order.payment_method || 'Mercado Pago'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-actions">
                    <button 
                      className="btn-small btn-primary"
                      onClick={() => selectedOrder?.id === order.id ? closeOrderDetails() : openOrderDetails(order)}
                      title="Ver detalles del pedido"
                    >
                      {selectedOrder?.id === order.id ? '👁️ Cerrar' : '👁️ Detalles'}
                    </button>
                    
                    <div className="status-actions-compact">
                      {getStatusOptions(order.status).map(status => (
                        <button
                          key={status}
                          className={`btn-small btn-status ${status === 'cancelled' ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => handleStatusUpdate(order.id, status)}
                          title={`Cambiar a ${getStatusLabel(status)}`}
                        >
                          {status === 'cancelled' ? '❌ Cancelar' : 
                           status === 'processing' ? '🚚 Procesar' : 
                           status === 'shipped' ? '📦 Enviar' :
                           status === 'delivered' ? '✅ Entregar' : 
                           '↩️ Reabrir'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {filteredOrders.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>No se encontraron pedidos</h3>
              <p>
                {orders.length === 0 
                  ? 'Aún no hay pedidos en el sistema. Los pedidos aparecerán aquí cuando los clientes realicen compras.' 
                  : 'Intenta con otros términos de búsqueda.'}
              </p>
              <button 
                onClick={loadAllOrders}
                className="btn-primary"
              >
                 Reintentar Carga
              </button>
            </div>
          )}

          {/* Vista Detallada */}
          {selectedOrder && (
            <div 
              className="order-detail-modal"
              ref={modalRef}
              id={`order-details-${selectedOrder.id}`}
              role="dialog"
              aria-labelledby={`order-modal-title-${selectedOrder.id}`}
              aria-modal="true"
            >
              <div className="order-detail-content">
                <div className="order-detail-header">
                  <h3 id={`order-modal-title-${selectedOrder.id}`}>
                    {/* <span className="lucesa-order-badge">🏭</span> */}
                    Detalles del Pedido - {selectedOrder.order_number}
                  </h3>
                  <button 
                    className="close-button"
                    onClick={closeOrderDetails}
                    title="Cerrar detalles y volver a la tabla"
                    aria-label="Cerrar detalles"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="order-detail-body">
                  <div className="detail-section">
                    <h4>Información del Cliente</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <strong>Nombre:</strong> {selectedOrder.customer_name || selectedOrder.shipping_address?.nombre || 'No especificado'}
                      </div>
                      <div className="detail-item">
                        <strong>Email:</strong> {selectedOrder.customer_email || selectedOrder.shipping_address?.email || 'No especificado'}
                      </div>
                      <div className="detail-item">
                        <strong>Teléfono:</strong> {selectedOrder.customer_phone || selectedOrder.shipping_address?.telefono || 'No especificado'}
                      </div>
                      {/* <div className="detail-item">
                        <strong>Usuario ID:</strong> {selectedOrder.user_id || 'No disponible'}
                      </div> */}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Productos del Pedido</h4>
                    <div className="products-detail-list">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="product-detail-item">
                          <div className="product-image">
                            {item.product_image_url ? (
                              <img 
                                src={item.product_image_url} 
                                alt={item.product_name}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            {/* <div className="image-placeholder">
                              📦
                            </div> */}
                          </div>
                          <div className="product-info">
                            <strong>{item.product_name}</strong>
                            <div className="product-meta">
                              <span>Código: {item.product_code}</span>
                              <span>Marca: {item.product_brand || 'No especificada'}</span>
                              <span>Cantidad: {item.quantity}</span>
                              <span>Precio unitario: {formatCurrency(item.unit_price)}</span>
                            </div>
                          </div>
                          <div className="product-pricing">
                            <strong>Total: {formatCurrency(item.total_price)}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Resumen de Pago</h4>
                    <div className="payment-summary">
                      <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Impuestos (16%):</span>
                        <span>{formatCurrency(selectedOrder.tax_amount)}</span>
                      </div>
                      {selectedOrder.shipping_amount > 0 ? (
                        <div className="summary-row">
                          <span>Envío:</span>
                          <span>{formatCurrency(selectedOrder.shipping_amount)}</span>
                        </div>
                      ) : (
                        <div className="summary-row">
                          <span>Envío:</span>
                          <span className="free-shipping">GRATIS</span>
                        </div>
                      )}
                      <div className="summary-row total">
                        <strong>Total:</strong>
                        <strong>{formatCurrency(selectedOrder.total_amount)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Gestionar Estado</h4>
                    <div className="status-management">
                      <div className="current-status">
                        <strong>Estado actual: </strong>
                        <span 
                          className={`status-badge large ${selectedOrder.status}`}
                          style={{ borderColor: getStatusColor(selectedOrder.status) }}
                        >
                          {getStatusLabel(selectedOrder.status)}
                        </span>
                      </div>
                      
                      {getStatusOptions(selectedOrder.status).length > 0 ? (
                        <div className="status-actions-full">
                          <p>Cambiar estado:</p>
                          <div className="status-buttons-grid">
                            {getStatusOptions(selectedOrder.status).map(status => (
                              <button
                                key={status}
                                className={`btn-primary ${status === 'cancelled' ? 'btn-danger' : 'btn-success'}`}
                                onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                              >
                                {status === 'cancelled' ? '❌ Cancelar Pedido' : 
                                 status === 'processing' ? '🚚 Marcar como En Proceso' : 
                                 status === 'shipped' ? '📦 Marcar como Enviado' :
                                 status === 'delivered' ? '✅ Marcar como Entregado' : 
                                 '↩️ Reabrir Pedido'}
                              </button>
                            ))}
                        </div>
                        </div>
                      ) : (
                        <div className="no-actions-message">
                          <span className="no-actions">✅ No hay acciones disponibles (estado final)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="order-detail-footer">
                  <div className="timestamps">
                    <small> Creado: {formatDate(selectedOrder.created_at)}</small>
                  </div>
                  {/* <button 
                    className="btn-secondary"
                    onClick={() => window.print()}
                  >
                    🖨️ Imprimir Detalles
                  </button> */}
                  <button 
                    className="btn-secondary"
                    onClick={closeOrderDetails}
                    title="Volver a la tabla"
                  >
                    ↩ Volver a la tabla
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderManagement