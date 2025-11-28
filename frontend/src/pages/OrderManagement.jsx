import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanels.css';

const OrderManagement = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Datos de ejemplo basados en la estructura de OrderConfirmation
  const sampleOrders = [
    {
      id: 'ORD-001',
      usuario: 'Juan Pérez',
      email: 'juan@email.com',
      telefono: '+1 234 567 8900',
      fecha: '2024-01-20T14:30:00',
      total: 156.75,
      subtotal: 1291.98,
      impuestos: 64.77,
      envio: 0,
      estado: 'completado',
      metodo_pago: 'Tarjeta de Crédito',
      items: [
        { 
          producto: 'Laptop Gaming Pro', 
          codigo: 'PROD001',
          cantidad: 1, 
          precio: 1200,
          precioFinal: 1200,
          marca: 'GamingBrand'
        },
        { 
          producto: 'Mouse Inalámbrico', 
          codigo: 'PROD005',
          cantidad: 2, 
          precio: 45.99,
          precioFinal: 45.99,
          marca: 'TechCorp'
        }
      ]
    },
    {
      id: 'ORD-002',
      usuario: 'María García',
      email: 'maria@email.com',
      telefono: '+1 234 567 8901',
      fecha: '2024-01-18T10:15:00',
      total: 89.99,
      subtotal: 89.99,
      impuestos: 4.50,
      envio: 0,
      estado: 'en_proceso',
      metodo_pago: 'PayPal',
      items: [
        { 
          producto: 'Teclado Mecánico', 
          codigo: 'PROD006',
          cantidad: 1, 
          precio: 89.99,
          precioFinal: 89.99,
          marca: 'KeyboardPro'
        }
      ]
    },
    {
      id: 'ORD-003',
      usuario: 'Carlos López',
      email: 'carlos@email.com',
      telefono: '+1 234 567 8902',
      fecha: '2024-01-15T16:45:00',
      total: 299.50,
      subtotal: 299.50,
      impuestos: 14.98,
      envio: 0,
      estado: 'pendiente',
      metodo_pago: 'Tarjeta de Débito',
      items: [
        { 
          producto: 'Monitor 4K 27"', 
          codigo: 'PROD004',
          cantidad: 1, 
          precio: 299.50,
          precioFinal: 299.50,
          marca: 'DisplayTech'
        }
      ]
    },
    {
      id: 'ORD-004',
      usuario: 'Ana Martínez',
      email: 'ana@email.com',
      telefono: '+1 234 567 8903',
      fecha: '2024-01-12T09:20:00',
      total: 45.99,
      subtotal: 45.99,
      impuestos: 2.30,
      envio: 0,
      estado: 'cancelado',
      metodo_pago: 'Transferencia Bancaria',
      items: [
        { 
          producto: 'Auriculares Bluetooth', 
          codigo: 'PROD007',
          cantidad: 1, 
          precio: 45.99,
          precioFinal: 45.99,
          marca: 'AudioPlus'
        }
      ]
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setOrders(sampleOrders);
      setLoading(false);
    }, 1500);
  }, []);

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusLabel = (status) => {
    const statusMap = {
      'pendiente': 'Pendiente',
      'en_proceso': 'En Proceso',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pendiente': '#ff9800',
      'en_proceso': '#2196f3',
      'completado': '#4caf50',
      'cancelado': '#f44336'
    };
    return colorMap[status] || '#666';
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders(orders.map(order =>
      order.id === orderId ? { 
        ...order, 
        estado: newStatus
      } : order
    ));
    setSelectedOrder(null);
  };

  const getStatusOptions = (currentStatus) => {
    const options = {
      'pendiente': ['en_proceso', 'cancelado'],
      'en_proceso': ['completado', 'cancelado'],
      'completado': [],
      'cancelado': ['pendiente']
    };
    return options[currentStatus] || [];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
      </div>

      {/* Búsqueda */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar pedidos por ID, usuario o email..."
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

          {/* Tabla de Pedidos Simplificada */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Número de Orden</th>
                  <th>Productos Comprados</th>
                  <th>Códigos de Productos</th>
                  <th>Total de Compra</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.id}</strong>
                      <br />
                      <small>{order.usuario}</small>
                      <br />
                      <small>{order.email}</small>
                    </td>
                    <td>
                      {order.items.map((item, index) => (
                        <div key={index} className="order-product-item">
                          <strong>{item.producto}</strong>
                          <div className="product-details">
                            <span>Cantidad: {item.cantidad}</span>
                            <span>Marca: {item.marca}</span>
                            <span>Precio: {formatCurrency(item.precioFinal || item.precio)}</span>
                          </div>
                        </div>
                      ))}
                    </td>
                    <td>
                      {order.items.map((item, index) => (
                        <div key={index} className="product-code-item">
                          <code>{item.codigo}</code>
                          {item.marca && <small>{item.marca}</small>}
                        </div>
                      ))}
                    </td>
                    <td>
                      <div className="total-breakdown">
                        <div className="breakdown-row">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        <div className="breakdown-row">
                          <span>Impuestos:</span>
                          <span>{formatCurrency(order.impuestos)}</span>
                        </div>
                        {order.envio > 0 && (
                          <div className="breakdown-row">
                            <span>Envío:</span>
                            <span>{formatCurrency(order.envio)}</span>
                          </div>
                        )}
                        <div className="breakdown-row total-row">
                          <strong>Total:</strong>
                          <strong>{formatCurrency(order.total)}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className={`status-badge ${order.estado}`}
                        style={{ borderColor: getStatusColor(order.estado) }}
                      >
                        {getStatusLabel(order.estado)}
                      </span>
                    </td>
                    <td>
                      {formatDate(order.fecha)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-small"
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                        >
                          {selectedOrder?.id === order.id ? '👁️ Ocultar' : '👁️ Ver'}
                        </button>
                        
                        {selectedOrder?.id === order.id && (
                          <div className="status-actions">
                            {getStatusOptions(order.estado).map(status => (
                              <button
                                key={status}
                                className={`btn-small ${status === 'cancelado' ? 'btn-danger' : 'btn-success'}`}
                                onClick={() => handleStatusUpdate(order.id, status)}
                              >
                                {status === 'cancelado' ? '❌' : 
                                 status === 'en_proceso' ? '🚚' : 
                                 status === 'completado' ? '✅' : 
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

          {/* Vista Detallada cuando se selecciona un pedido */}
          {selectedOrder && (
            <div className="order-detail-modal">
              <div className="order-detail-content">
                <div className="order-detail-header">
                  <h3>Detalles del Pedido - {selectedOrder.id}</h3>
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
                        <strong>Nombre:</strong> {selectedOrder.usuario}
                      </div>
                      <div className="detail-item">
                        <strong>Email:</strong> {selectedOrder.email}
                      </div>
                      <div className="detail-item">
                        <strong>Teléfono:</strong> {selectedOrder.telefono}
                      </div>
                      <div className="detail-item">
                        <strong>Método de Pago:</strong> {selectedOrder.metodo_pago}
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Productos del Pedido</h4>
                    <div className="products-detail-list">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="product-detail-item">
                          <div className="product-info">
                            <strong>{item.producto}</strong>
                            <div className="product-meta">
                              <span>Código: {item.codigo}</span>
                              <span>Marca: {item.marca}</span>
                              <span>Cantidad: {item.cantidad}</span>
                            </div>
                          </div>
                          <div className="product-pricing">
                            <span>Precio unitario: {formatCurrency(item.precioFinal || item.precio)}</span>
                            <span>Total: {formatCurrency((item.precioFinal || item.precio) * item.cantidad)}</span>
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
                        <span>{formatCurrency(selectedOrder.impuestos)}</span>
                      </div>
                      {selectedOrder.envio > 0 && (
                        <div className="summary-row">
                          <span>Envío:</span>
                          <span>{formatCurrency(selectedOrder.envio)}</span>
                        </div>
                      )}
                      <div className="summary-row total">
                        <strong>Total:</strong>
                        <strong>{formatCurrency(selectedOrder.total)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>Gestionar Estado</h4>
                    <div className="status-management">
                      <strong>Estado actual: </strong>
                      <span 
                        className={`status-badge large ${selectedOrder.estado}`}
                        style={{ borderColor: getStatusColor(selectedOrder.estado) }}
                      >
                        {getStatusLabel(selectedOrder.estado)}
                      </span>
                      
                      <div className="status-actions-full">
                        <p>Cambiar estado:</p>
                        {getStatusOptions(selectedOrder.estado).map(status => (
                          <button
                            key={status}
                            className={`btn-primary ${status === 'cancelado' ? 'btn-danger' : ''}`}
                            onClick={() => {
                              handleStatusUpdate(selectedOrder.id, status);
                              setSelectedOrder(null);
                            }}
                          >
                            {status === 'cancelado' ? '❌ Cancelar Pedido' : 
                             status === 'en_proceso' ? '🚚 Marcar como En Proceso' : 
                             status === 'completado' ? '✅ Completar Pedido' : 
                             '↩️ Reabrir Pedido'}
                          </button>
                        ))}
                        {getStatusOptions(selectedOrder.estado).length === 0 && (
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
              <p>Intenta con otros términos de búsqueda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;