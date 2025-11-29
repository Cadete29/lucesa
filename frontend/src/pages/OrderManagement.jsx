import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanels.css';

const OrderManagement = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://testpaginaweb.shop/api'
    : 'http://localhost:4004/api';

  // Función para cargar todas las órdenes desde la base de datos
  const loadAllOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || 'Error al cargar las órdenes');
        // Fallback a datos de ejemplo si hay error
        setOrders(getSampleOrders());
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      setError('Error de conexión al cargar las órdenes');
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
        order_number: 'ORD-001',
        user_id: 1,
        total_amount: 156.75,
        subtotal: 1291.98,
        tax_amount: 64.77,
        shipping_amount: 0,
        status: 'confirmed',
        payment_method: 'Tarjeta de Crédito',
        shipping_address: {
          nombre: 'Juan Pérez',
          email: 'juan@email.com'
        },
        created_at: '2024-01-20T14:30:00Z',
        items: [
          { 
            product_name: 'Laptop Gaming Pro', 
            product_code: 'PROD001',
            quantity: 1, 
            unit_price: 1200,
            total_price: 1200,
            product_brand: 'GamingBrand',
            product_image_url: 'https://testpaginaweb.shop/api/images/code/PROD001?size=small'
          },
          { 
            product_name: 'Mouse Inalámbrico', 
            product_code: 'PROD005',
            quantity: 2, 
            unit_price: 45.99,
            total_price: 91.98,
            product_brand: 'TechCorp',
            product_image_url: 'https://testpaginaweb.shop/api/images/code/PROD005?size=small'
          }
        ]
      },
      {
        id: 2,
        order_number: 'ORD-002',
        user_id: 2,
        total_amount: 89.99,
        subtotal: 89.99,
        tax_amount: 4.50,
        shipping_amount: 0,
        status: 'processing',
        payment_method: 'PayPal',
        shipping_address: {
          nombre: 'María García',
          email: 'maria@email.com'
        },
        created_at: '2024-01-18T10:15:00Z',
        items: [
          { 
            product_name: 'Teclado Mecánico', 
            product_code: 'PROD006',
            quantity: 1, 
            unit_price: 89.99,
            total_price: 89.99,
            product_brand: 'KeyboardPro',
            product_image_url: 'https://testpaginaweb.shop/api/images/code/PROD006?size=small'
          }
        ]
      }
    ];
  };

  useEffect(() => {
    if (user?.rol === 'admin') {
      loadAllOrders();
    }
  }, [user, token]);

  // Función para actualizar el estado de una orden
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        // Actualizar el estado localmente
        setOrders(orders.map(order =>
          order.id === orderId ? { 
            ...order, 
            status: newStatus
          } : order
        ));
        setSelectedOrder(null);
      } else {
        setError(data.message || 'Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      setError('Error de conexión al actualizar el estado');
    }
  };

  const filteredOrders = orders.filter(order => 
    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.shipping_address?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.shipping_address?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusLabel = (status) => {
    const statusMap = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmado',
      'processing': 'En Proceso',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
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
      'cancelled': '#f44336'
    };
    return colorMap[status] || '#666';
  };

  const getStatusOptions = (currentStatus) => {
    const options = {
      'pending': ['confirmed', 'cancelled'],
      'confirmed': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': [],
      'cancelled': ['pending']
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
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
        <h1>📝 Gestión de Pedidos</h1>
        <p>Administra y realiza seguimiento de todos los pedidos del sistema</p>
        <button 
          onClick={loadAllOrders} 
          className="btn-refresh"
          disabled={loading}
        >
          {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* Búsqueda */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar pedidos por número, cliente o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          Cargando pedidos...
        </div>
      ) : (
        <div className="orders-container">
          <div className="results-info">
            Mostrando {filteredOrders.length} de {orders.length} pedidos
            {searchTerm && <span> para "{searchTerm}"</span>}
          </div>

          {/* Tabla de Pedidos */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Número de Orden</th>
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
                  <tr key={order.id}>
                    <td>
                      <strong>{order.order_number}</strong>
                    </td>
                    <td>
                      <div className="customer-info">
                        <strong>{order.shipping_address?.nombre || 'Cliente'}</strong>
                        <br />
                        <small>{order.shipping_address?.email || 'Sin email'}</small>
                        {order.shipping_address?.telefono && (
                          <br />
                        )}
                        <small>{order.shipping_address?.telefono || ''}</small>
                      </div>
                    </td>
                    <td>
                      <div className="products-list">
                        {order.items?.map((item, index) => (
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
                      {formatDate(order.created_at)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-small btn-primary"
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        >
                          {selectedOrder?.id === order.id ? '👁️ Ocultar' : '👁️ Ver'}
                        </button>
                        
                        {selectedOrder?.id === order.id && (
                          <div className="status-actions">
                            {getStatusOptions(order.status).map(status => (
                              <button
                                key={status}
                                className={`btn-small ${status === 'cancelled' ? 'btn-danger' : 'btn-success'}`}
                                onClick={() => handleStatusUpdate(order.id, status)}
                              >
                                {status === 'cancelled' ? '❌' : 
                                 status === 'processing' ? '🚚' : 
                                 status === 'shipped' ? '📦' :
                                 status === 'delivered' ? '✅' : 
                                 '↩️'}
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

          {/* Vista Detallada */}
          {selectedOrder && (
            <div className="order-detail-modal">
              <div className="order-detail-content">
                <div className="order-detail-header">
                  <h3>Detalles del Pedido - {selectedOrder.order_number}</h3>
                  <button 
                    className="close-button"
                    onClick={() => setSelectedOrder(null)}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="order-detail-body">
                  <div className="detail-section">
                    <h4>Información del Cliente</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <strong>Nombre:</strong> {selectedOrder.shipping_address?.nombre || 'No especificado'}
                      </div>
                      <div className="detail-item">
                        <strong>Email:</strong> {selectedOrder.shipping_address?.email || 'No especificado'}
                      </div>
                      <div className="detail-item">
                        <strong>Teléfono:</strong> {selectedOrder.shipping_address?.telefono || 'No especificado'}
                      </div>
                      <div className="detail-item">
                        <strong>Método de Pago:</strong> {selectedOrder.payment_method || 'No especificado'}
                      </div>
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
                            <div className="image-placeholder">
                              📦
                            </div>
                          </div>
                          <div className="product-info">
                            <strong>{item.product_name}</strong>
                            <div className="product-meta">
                              <span>Código: {item.product_code}</span>
                              <span>Marca: {item.product_brand || 'No especificada'}</span>
                              <span>Cantidad: {item.quantity}</span>
                            </div>
                          </div>
                          <div className="product-pricing">
                            <span>Precio unitario: {formatCurrency(item.unit_price)}</span>
                            <span>Total: {formatCurrency(item.total_price)}</span>
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
                        <span>Impuestos:</span>
                        <span>{formatCurrency(selectedOrder.tax_amount)}</span>
                      </div>
                      {selectedOrder.shipping_amount > 0 && (
                        <div className="summary-row">
                          <span>Envío:</span>
                          <span>{formatCurrency(selectedOrder.shipping_amount)}</span>
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
                      <strong>Estado actual: </strong>
                      <span 
                        className={`status-badge large ${selectedOrder.status}`}
                        style={{ borderColor: getStatusColor(selectedOrder.status) }}
                      >
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                      
                      <div className="status-actions-full">
                        <p>Cambiar estado:</p>
                        {getStatusOptions(selectedOrder.status).map(status => (
                          <button
                            key={status}
                            className={`btn-primary ${status === 'cancelled' ? 'btn-danger' : ''}`}
                            onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                          >
                            {status === 'cancelled' ? '❌ Cancelar Pedido' : 
                             status === 'processing' ? '🚚 Marcar como En Proceso' : 
                             status === 'shipped' ? '📦 Marcar como Enviado' :
                             status === 'delivered' ? '✅ Marcar como Entregado' : 
                             '↩️ Reabrir Pedido'}
                          </button>
                        ))}
                        {getStatusOptions(selectedOrder.status).length === 0 && (
                          <span className="no-actions">No hay acciones disponibles</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {filteredOrders.length === 0 && (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>No se encontraron pedidos</h3>
              <p>{orders.length === 0 ? 'Aún no hay pedidos en el sistema.' : 'Intenta con otros términos de búsqueda.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;