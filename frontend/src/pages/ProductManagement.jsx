import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminPanels.css';

const ProductManagement = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('warranties');
  const [showAddWarranty, setShowAddWarranty] = useState(false);
  const [showAddReturn, setShowAddReturn] = useState(false);
  const [warrantySearchTerm, setWarrantySearchTerm] = useState('');
  const [returnSearchTerm, setReturnSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderSearch, setShowOrderSearch] = useState(false);

  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://testpaginaweb.shop/api'
    : 'http://localhost:4004/api';

  // Estados para el formulario de garantía
  const [warrantyForm, setWarrantyForm] = useState({
    order_number: '',
    product_code: '',
    product_name: '',
    customer_name: '',
    customer_email: '',
    purchase_date: '',
    purchase_amount: '',
    warranty_application_date: '',
    old_serial_number: '',
    new_serial_number: '',
    status: 'activa',
    ticket_number: ''
  });

  // Estados para el formulario de devolución
  const [returnForm, setReturnForm] = useState({
    ticket_soporte: '',
    producto: '',
    codigo: '',
    usuario: '',
    email: '',
    fecha_devolucion: '',
    motivo: '',
    estado: 'pendiente',
    total_compra: '',
    numero_serie: '',
    observaciones: ''
  });

  // Estados para garantías
  const [warranties, setWarranties] = useState([]);
  const [warrantiesLoading, setWarrantiesLoading] = useState(true);

  // Estados para devoluciones
  const [returns, setReturns] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(true);

  // Cargar órdenes y garantías al montar el componente
  useEffect(() => {
    if (user?.rol === 'admin') {
      loadOrders();
      loadWarranties();
      loadReturns();
    }
  }, [user, token]);

  // Filtrar órdenes cuando cambie el término de búsqueda
  useEffect(() => {
    if (orderSearchTerm) {
      const filtered = orders.filter(order => 
        order.order_number?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        (order.shipping_address?.nombre || order.user_nombre)?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
        order.user_email?.toLowerCase().includes(orderSearchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders([]);
    }
  }, [orderSearchTerm, orders]);

  // Cargar todas las órdenes para el selector
  const loadOrders = async () => {
    try {
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
        // Fallback a datos de ejemplo
        setOrders(getSampleOrders());
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      setOrders(getSampleOrders());
    }
  };

  // Cargar garantías desde la base de datos
  const loadWarranties = async () => {
    try {
      setWarrantiesLoading(true);
      const response = await fetch(`${API_BASE_URL}/warranties`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setWarranties(data.warranties || []);
      } else {
        setWarranties(getSampleWarranties());
      }
    } catch (error) {
      console.error('Error cargando garantías:', error);
      setWarranties(getSampleWarranties());
    } finally {
      setWarrantiesLoading(false);
    }
  };

  // Cargar devoluciones desde la base de datos
  const loadReturns = async () => {
    try {
      setReturnsLoading(true);
      // En producción, aquí iría la llamada real a la API
      setReturns(getSampleReturns());
    } catch (error) {
      console.error('Error cargando devoluciones:', error);
      setReturns(getSampleReturns());
    } finally {
      setReturnsLoading(false);
    }
  };

  // Datos de ejemplo para órdenes
  const getSampleOrders = () => {
    return [
      {
        id: 1,
        order_number: 'ORD-001',
        user_nombre: 'Juan Pérez',
        user_email: 'juan@email.com',
        total_amount: 1200.00,
        created_at: '2024-01-20T10:00:00Z',
        shipping_address: {
          nombre: 'Juan Pérez',
          email: 'juan@email.com'
        },
        items: [
          {
            product_code: 'PROD001',
            product_name: 'Laptop Gaming Pro',
            product_brand: 'GamingBrand'
          }
        ]
      },
      {
        id: 2,
        order_number: 'ORD-002',
        user_nombre: 'María García',
        user_email: 'maria@email.com',
        total_amount: 599.00,
        created_at: '2024-01-18T14:30:00Z',
        shipping_address: {
          nombre: 'María García',
          email: 'maria@email.com'
        },
        items: [
          {
            product_code: 'PROD002',
            product_name: 'Smartphone Android',
            product_brand: 'TechCorp'
          }
        ]
      },
      {
        id: 3,
        order_number: 'ORD-003',
        user_nombre: 'Carlos López',
        user_email: 'carlos@email.com',
        total_amount: 399.00,
        created_at: '2024-01-22T09:15:00Z',
        shipping_address: {
          nombre: 'Carlos López',
          email: 'carlos@email.com'
        },
        items: [
          {
            product_code: 'PROD004',
            product_name: 'Monitor 4K 27"',
            product_brand: 'DisplayTech'
          }
        ]
      }
    ];
  };

  // Datos de ejemplo para garantías
  const getSampleWarranties = () => {
    return [
      {
        id: 1,
        order_number: 'ORD-001',
        product_code: 'PROD001',
        product_name: 'Laptop Gaming Pro',
        customer_name: 'Juan Pérez',
        customer_email: 'juan@email.com',
        purchase_date: '2024-01-20',
        purchase_amount: 1200.00,
        warranty_application_date: '2024-03-15',
        old_serial_number: 'SN-001-OLD',
        new_serial_number: 'SN-001-NEW',
        status: 'activa',
        ticket_number: 'TS-001',
        created_at: '2024-03-15T10:00:00Z'
      },
      {
        id: 2,
        order_number: 'ORD-002',
        product_code: 'PROD002',
        product_name: 'Smartphone Android',
        customer_name: 'María García',
        customer_email: 'maria@email.com',
        purchase_date: '2024-01-18',
        purchase_amount: 599.00,
        warranty_application_date: '2024-03-10',
        old_serial_number: 'SN-002-OLD',
        new_serial_number: 'SN-002-NEW',
        status: 'aplicada',
        ticket_number: 'TS-002',
        created_at: '2024-03-10T14:30:00Z'
      }
    ];
  };

  // Datos de ejemplo para devoluciones
  const getSampleReturns = () => {
    return [
      {
        id: 1,
        producto: 'Auriculares Inalámbricos',
        codigo: 'PROD003',
        usuario: 'Ana Martínez',
        email: 'ana@email.com',
        fecha_devolucion: '2024-01-25',
        motivo: 'Producto defectuoso - No enciende',
        estado: 'pendiente',
        total_compra: 149,
        numero_serie: 'SN-004-001',
        observaciones: 'El producto no enciende al sacarlo de la caja',
        ticket_soporte: 'TS-004'
      },
      {
        id: 2,
        producto: 'Smartphone Android',
        codigo: 'PROD002',
        usuario: 'Roberto Sánchez',
        email: 'roberto@email.com',
        fecha_devolucion: '2024-01-24',
        motivo: 'Cambio de modelo',
        estado: 'aprobada',
        total_compra: 599,
        numero_serie: 'SN-002-001',
        observaciones: 'Cliente prefiere otro modelo',
        ticket_soporte: 'TS-005'
      }
    ];
  };

  // Manejar selección de orden desde el buscador
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
    const firstItem = order.items?.[0];
    if (firstItem) {
      setWarrantyForm({
        order_number: order.order_number,
        product_code: firstItem.product_code,
        product_name: firstItem.product_name,
        customer_name: order.shipping_address?.nombre || order.user_nombre,
        customer_email: order.shipping_address?.email || order.user_email,
        purchase_date: order.created_at.split('T')[0],
        purchase_amount: order.total_amount,
        warranty_application_date: new Date().toISOString().split('T')[0],
        old_serial_number: '',
        new_serial_number: '',
        status: 'activa',
        ticket_number: `TS-${Date.now()}`
      });
    }
    setShowOrderSearch(false);
    setOrderSearchTerm('');
  };

  // Agregar nueva garantía
  const handleAddWarranty = async () => {
    try {
      setLoading(true);
      
      // Simular llamada a API
      const newWarranty = {
        id: warranties.length + 1,
        ...warrantyForm,
        purchase_amount: parseFloat(warrantyForm.purchase_amount),
        created_at: new Date().toISOString()
      };
      
      setWarranties([...warranties, newWarranty]);
      setShowAddWarranty(false);
      resetWarrantyForm();
      setSelectedOrder(null);

    } catch (error) {
      console.error('Error agregando garantía:', error);
      alert('Error de conexión al agregar garantía');
    } finally {
      setLoading(false);
    }
  };

  // Agregar nueva devolución
  const handleAddReturn = () => {
    const newReturn = {
      id: returns.length + 1,
      ...returnForm,
      total_compra: parseFloat(returnForm.total_compra),
      fecha_devolucion: returnForm.fecha_devolucion || new Date().toISOString().split('T')[0]
    };
    
    setReturns([...returns, newReturn]);
    setShowAddReturn(false);
    resetReturnForm();
  };

  // Actualizar estado de garantía
  const handleWarrantyStatusUpdate = async (warrantyId, newStatus) => {
    try {
      setWarranties(warranties.map(warranty =>
        warranty.id === warrantyId ? { ...warranty, status: newStatus } : warranty
      ));
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error de conexión al actualizar estado');
    }
  };

  // Manejar acciones de garantía
  const handleWarrantyAction = (warrantyId, action) => {
    if (action === 'extender') {
      setWarranties(warranties.map(warranty => 
        warranty.id === warrantyId 
          ? { 
              ...warranty, 
              status: 'activa',
              warranty_application_date: new Date().toISOString().split('T')[0]
            } 
          : warranty
      ));
    } else {
      alert(`${action} garantía ${warrantyId}`);
    }
  };

  // Manejar acciones de devolución
  const handleReturnAction = (returnId, action) => {
    if (action === 'aprobar') {
      setReturns(returns.map(ret => 
        ret.id === returnId ? { ...ret, estado: 'aprobada' } : ret
      ));
    } else if (action === 'rechazar') {
      setReturns(returns.map(ret => 
        ret.id === returnId ? { ...ret, estado: 'rechazada' } : ret
      ));
    } else {
      alert(`${action} devolución ${returnId}`);
    }
  };

  // Filtrar garantías por búsqueda
  const filteredWarranties = warranties.filter(warranty => 
    warranty.ticket_number?.toLowerCase().includes(warrantySearchTerm.toLowerCase()) ||
    warranty.order_number?.toLowerCase().includes(warrantySearchTerm.toLowerCase()) ||
    warranty.product_name?.toLowerCase().includes(warrantySearchTerm.toLowerCase()) ||
    warranty.customer_name?.toLowerCase().includes(warrantySearchTerm.toLowerCase()) ||
    warranty.customer_email?.toLowerCase().includes(warrantySearchTerm.toLowerCase()) ||
    warranty.old_serial_number?.toLowerCase().includes(warrantySearchTerm.toLowerCase()) ||
    warranty.new_serial_number?.toLowerCase().includes(warrantySearchTerm.toLowerCase())
  );

  // Filtrar devoluciones por búsqueda
  const filteredReturns = returns.filter(returnItem => 
    returnItem.ticket_soporte?.toLowerCase().includes(returnSearchTerm.toLowerCase()) ||
    returnItem.producto?.toLowerCase().includes(returnSearchTerm.toLowerCase()) ||
    returnItem.codigo?.toLowerCase().includes(returnSearchTerm.toLowerCase()) ||
    returnItem.usuario?.toLowerCase().includes(returnSearchTerm.toLowerCase()) ||
    returnItem.email?.toLowerCase().includes(returnSearchTerm.toLowerCase()) ||
    returnItem.numero_serie?.toLowerCase().includes(returnSearchTerm.toLowerCase()) ||
    returnItem.motivo?.toLowerCase().includes(returnSearchTerm.toLowerCase())
  );

  const resetWarrantyForm = () => {
    setWarrantyForm({
      order_number: '',
      product_code: '',
      product_name: '',
      customer_name: '',
      customer_email: '',
      purchase_date: '',
      purchase_amount: '',
      warranty_application_date: '',
      old_serial_number: '',
      new_serial_number: '',
      status: 'activa',
      ticket_number: ''
    });
    setSelectedOrder(null);
    setOrderSearchTerm('');
    setShowOrderSearch(false);
  };

  const resetReturnForm = () => {
    setReturnForm({
      ticket_soporte: '',
      producto: '',
      codigo: '',
      usuario: '',
      email: '',
      fecha_devolucion: '',
      motivo: '',
      estado: 'pendiente',
      total_compra: '',
      numero_serie: '',
      observaciones: ''
    });
  };

  const getWarrantyStatusLabel = (status) => {
    const statusMap = {
      'activa': 'Activa',
      'aplicada': 'Aplicada',
      'expirada': 'Expirada'
    };
    return statusMap[status] || status;
  };

  const getWarrantyStatusColor = (status) => {
    const colorMap = {
      'activa': '#4caf50',
      'aplicada': '#2196f3',
      'expirada': '#f44336'
    };
    return colorMap[status] || '#666';
  };

  const getReturnStatusLabel = (status) => {
    const statusMap = {
      'pendiente': 'Pendiente',
      'aprobada': 'Aprobada',
      'rechazada': 'Rechazada',
      'completada': 'Completada'
    };
    return statusMap[status] || status;
  };

  const getReturnStatusColor = (status) => {
    const colorMap = {
      'pendiente': '#ff9800',
      'aprobada': '#4caf50',
      'rechazada': '#f44336',
      'completada': '#2196f3'
    };
    return colorMap[status] || '#666';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
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
        <h1>🛍️ Gestión de Garantías y Devoluciones</h1>
        <p>Administra garantías y devoluciones del sistema</p>
      </div>

      {/* Navegación por pestañas */}
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'warranties' ? 'active' : ''}`}
          onClick={() => setActiveTab('warranties')}
        >
          🛡️ Garantías ({warranties.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'returns' ? 'active' : ''}`}
          onClick={() => setActiveTab('returns')}
        >
          🔄 Devoluciones ({returns.length})
        </button>
      </div>

      {/* Contenido de Garantías */}
      {activeTab === 'warranties' && (
        <div className="tab-content">
          <div className="admin-toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar garantías por ticket, orden, producto, cliente o número de serie..."
                value={warrantySearchTerm}
                onChange={(e) => setWarrantySearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <button 
              className="btn-primary"
              onClick={() => setShowAddWarranty(true)}
            >
              + Añadir Garantía
            </button>
          </div>

          {/* Formulario de Garantía */}
          {showAddWarranty && (
            <div className="form-modal">
              <div className="form-content">
                <h3>Agregar Nueva Garantía</h3>
                
                {/* Buscador de Órdenes */}
                <div className="form-group">
                  <label>Buscar Orden *</label>
                  <div className="order-search-container">
                    <input
                      type="text"
                      placeholder="Buscar por número de orden, cliente o email..."
                      value={orderSearchTerm}
                      onChange={(e) => {
                        setOrderSearchTerm(e.target.value);
                        setShowOrderSearch(true);
                      }}
                      onFocus={() => setShowOrderSearch(true)}
                      className="search-input"
                    />
                    <span className="search-icon">🔍</span>
                    
                    {/* Resultados de búsqueda */}
                    {showOrderSearch && orderSearchTerm && (
                      <div className="order-search-results">
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map(order => (
                            <div 
                              key={order.id} 
                              className="order-search-result"
                              onClick={() => handleOrderSelect(order)}
                            >
                              <div className="order-info">
                                <strong>{order.order_number}</strong>
                                <span>{order.shipping_address?.nombre || order.user_nombre}</span>
                                <span>{order.user_email}</span>
                              </div>
                              <div className="order-details">
                                <span>{formatCurrency(order.total_amount)}</span>
                                <span>{formatDate(order.created_at)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-results">
                            No se encontraron órdenes
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Información de la Orden Seleccionada */}
                {selectedOrder && (
                  <div className="selected-order-info">
                    <h4>Información de la Orden Seleccionada</h4>
                    <div className="order-details-grid">
                      <div className="detail-item">
                        <strong>Orden:</strong> {selectedOrder.order_number}
                      </div>
                      <div className="detail-item">
                        <strong>Cliente:</strong> {selectedOrder.shipping_address?.nombre || selectedOrder.user_nombre}
                      </div>
                      <div className="detail-item">
                        <strong>Email:</strong> {selectedOrder.shipping_address?.email || selectedOrder.user_email}
                      </div>
                      <div className="detail-item">
                        <strong>Producto:</strong> {selectedOrder.items?.[0]?.product_name}
                      </div>
                      <div className="detail-item">
                        <strong>Código:</strong> {selectedOrder.items?.[0]?.product_code}
                      </div>
                      <div className="detail-item">
                        <strong>Total:</strong> {formatCurrency(selectedOrder.total_amount)}
                      </div>
                      <div className="detail-item">
                        <strong>Fecha Compra:</strong> {formatDate(selectedOrder.created_at)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Campos manuales */}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Número de Ticket *</label>
                    <input
                      type="text"
                      value={warrantyForm.ticket_number}
                      onChange={(e) => setWarrantyForm({...warrantyForm, ticket_number: e.target.value})}
                      placeholder="Ej: TS-001"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha de Aplicación de Garantía *</label>
                    <input
                      type="date"
                      value={warrantyForm.warranty_application_date}
                      onChange={(e) => setWarrantyForm({...warrantyForm, warranty_application_date: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Número de Serie Anterior</label>
                    <input
                      type="text"
                      value={warrantyForm.old_serial_number}
                      onChange={(e) => setWarrantyForm({...warrantyForm, old_serial_number: e.target.value})}
                      placeholder="Ej: SN-001-OLD"
                    />
                  </div>

                  <div className="form-group">
                    <label>Número de Serie Nuevo</label>
                    <input
                      type="text"
                      value={warrantyForm.new_serial_number}
                      onChange={(e) => setWarrantyForm({...warrantyForm, new_serial_number: e.target.value})}
                      placeholder="Ej: SN-001-NEW"
                    />
                  </div>

                  <div className="form-group">
                    <label>Estado de Garantía *</label>
                    <select
                      value={warrantyForm.status}
                      onChange={(e) => setWarrantyForm({...warrantyForm, status: e.target.value})}
                    >
                      <option value="activa">Activa</option>
                      <option value="aplicada">Aplicada</option>
                      <option value="expirada">Expirada</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setShowAddWarranty(false);
                      resetWarrantyForm();
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleAddWarranty}
                    disabled={loading || !warrantyForm.ticket_number || !selectedOrder || !warrantyForm.warranty_application_date}
                  >
                    {loading ? 'Guardando...' : 'Agregar Garantía'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Garantías */}
          {warrantiesLoading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              Cargando garantías...
            </div>
          ) : (
            <div className="admin-table-container">
              <div className="results-info">
                Mostrando {filteredWarranties.length} de {warranties.length} garantías
                {warrantySearchTerm && <span> para "{warrantySearchTerm}"</span>}
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Orden</th>
                    <th>Producto</th>
                    <th>Cliente</th>
                    <th>Fecha Compra</th>
                    <th>Fecha Aplicación</th>
                    <th>Monto</th>
                    <th>Serie Anterior</th>
                    <th>Serie Nuevo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWarranties.map(warranty => (
                    <tr key={warranty.id}>
                      <td>
                        <code>{warranty.ticket_number}</code>
                      </td>
                      <td>
                        <strong>{warranty.order_number}</strong>
                      </td>
                      <td>
                        <strong>{warranty.product_name}</strong>
                        <br />
                        <small>{warranty.product_code}</small>
                      </td>
                      <td>
                        {warranty.customer_name}
                        <br />
                        <small>{warranty.customer_email}</small>
                      </td>
                      <td>{formatDate(warranty.purchase_date)}</td>
                      <td>{formatDate(warranty.warranty_application_date)}</td>
                      <td>{formatCurrency(warranty.purchase_amount)}</td>
                      <td>
                        <code>{warranty.old_serial_number || 'N/A'}</code>
                      </td>
                      <td>
                        <code>{warranty.new_serial_number || 'N/A'}</code>
                      </td>
                      <td>
                        <span 
                          className={`status-badge ${warranty.status}`}
                          style={{ borderColor: getWarrantyStatusColor(warranty.status) }}
                        >
                          {getWarrantyStatusLabel(warranty.status)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <select
                            value={warranty.status}
                            onChange={(e) => handleWarrantyStatusUpdate(warranty.id, e.target.value)}
                            className="status-select"
                          >
                            <option value="activa">Activa</option>
                            <option value="aplicada">Aplicada</option>
                            <option value="expirada">Expirada</option>
                          </select>
                          <button 
                            className="btn-small btn-warning"
                            onClick={() => handleWarrantyAction(warranty.id, 'extender')}
                            disabled={warranty.status === 'expirada'}
                          >
                            ⏳ Extender
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredWarranties.length === 0 && (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>No se encontraron garantías</h3>
                  <p>{warranties.length === 0 ? 'Aún no hay garantías registradas.' : 'Intenta con otros términos de búsqueda.'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contenido de Devoluciones */}
      {activeTab === 'returns' && (
        <div className="tab-content">
          <div className="admin-toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar devoluciones por ticket, producto, cliente o número de serie..."
                value={returnSearchTerm}
                onChange={(e) => setReturnSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <button 
              className="btn-primary"
              onClick={() => setShowAddReturn(true)}
            >
              + Añadir Devolución
            </button>
          </div>

          {/* Formulario de Devolución */}
          {showAddReturn && (
            <div className="form-modal">
              <div className="form-content">
                <h3>Agregar Nueva Devolución</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Número de Ticket *</label>
                    <input
                      type="text"
                      value={returnForm.ticket_soporte}
                      onChange={(e) => setReturnForm({...returnForm, ticket_soporte: e.target.value})}
                      placeholder="Ej: TS-007"
                    />
                  </div>
                  <div className="form-group">
                    <label>Producto *</label>
                    <input
                      type="text"
                      value={returnForm.producto}
                      onChange={(e) => setReturnForm({...returnForm, producto: e.target.value})}
                      placeholder="Ej: Laptop Gaming Pro"
                    />
                  </div>
                  <div className="form-group">
                    <label>Código de Producto *</label>
                    <input
                      type="text"
                      value={returnForm.codigo}
                      onChange={(e) => setReturnForm({...returnForm, codigo: e.target.value})}
                      placeholder="Ej: PROD001"
                    />
                  </div>
                  <div className="form-group">
                    <label>Usuario *</label>
                    <input
                      type="text"
                      value={returnForm.usuario}
                      onChange={(e) => setReturnForm({...returnForm, usuario: e.target.value})}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={returnForm.email}
                      onChange={(e) => setReturnForm({...returnForm, email: e.target.value})}
                      placeholder="Ej: juan@email.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Devolución *</label>
                    <input
                      type="date"
                      value={returnForm.fecha_devolucion}
                      onChange={(e) => setReturnForm({...returnForm, fecha_devolucion: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Total de Compra ($) *</label>
                    <input
                      type="number"
                      value={returnForm.total_compra}
                      onChange={(e) => setReturnForm({...returnForm, total_compra: e.target.value})}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Número de Serie</label>
                    <input
                      type="text"
                      value={returnForm.numero_serie}
                      onChange={(e) => setReturnForm({...returnForm, numero_serie: e.target.value})}
                      placeholder="Ej: SN-001-001"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Motivo de Devolución *</label>
                    <select
                      value={returnForm.motivo}
                      onChange={(e) => setReturnForm({...returnForm, motivo: e.target.value})}
                    >
                      <option value="">Seleccionar motivo</option>
                      <option value="Producto defectuoso">Producto defectuoso</option>
                      <option value="Cambio de modelo">Cambio de modelo</option>
                      <option value="No cumple expectativas">No cumple expectativas</option>
                      <option value="Error en el pedido">Error en el pedido</option>
                      <option value="Arrepentimiento">Arrepentimiento</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Observaciones</label>
                    <textarea
                      value={returnForm.observaciones}
                      onChange={(e) => setReturnForm({...returnForm, observaciones: e.target.value})}
                      placeholder="Observaciones adicionales sobre la devolución..."
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Estado *</label>
                    <select
                      value={returnForm.estado}
                      onChange={(e) => setReturnForm({...returnForm, estado: e.target.value})}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="aprobada">Aprobada</option>
                      <option value="rechazada">Rechazada</option>
                      <option value="completada">Completada</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => {
                      setShowAddReturn(false);
                      resetReturnForm();
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleAddReturn}
                    disabled={!returnForm.ticket_soporte || !returnForm.producto || !returnForm.codigo || !returnForm.usuario || !returnForm.email || !returnForm.fecha_devolucion || !returnForm.motivo || !returnForm.total_compra}
                  >
                    Agregar Devolución
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Devoluciones */}
          {returnsLoading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              Cargando devoluciones...
            </div>
          ) : (
            <div className="admin-table-container">
              <div className="results-info">
                Mostrando {filteredReturns.length} de {returns.length} devoluciones
                {returnSearchTerm && <span> para "{returnSearchTerm}"</span>}
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Producto</th>
                    <th>Usuario</th>
                    <th>Fecha Devolución</th>
                    <th>Total</th>
                    <th>Número Serie</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map(returnItem => (
                    <tr key={returnItem.id}>
                      <td>
                        <code>{returnItem.ticket_soporte}</code>
                      </td>
                      <td>
                        <strong>{returnItem.producto}</strong>
                        <br />
                        <small>{returnItem.codigo}</small>
                      </td>
                      <td>
                        {returnItem.usuario}
                        <br />
                        <small>{returnItem.email}</small>
                      </td>
                      <td>{formatDate(returnItem.fecha_devolucion)}</td>
                      <td>{formatCurrency(returnItem.total_compra)}</td>
                      <td>
                        <code>{returnItem.numero_serie}</code>
                      </td>
                      <td className="motivo-cell">
                        {returnItem.motivo}
                        {returnItem.observaciones && (
                          <div className="observaciones">
                            <small>{returnItem.observaciones}</small>
                          </div>
                        )}
                      </td>
                      <td>
                        <span 
                          className={`status-badge ${returnItem.estado}`}
                          style={{ borderColor: getReturnStatusColor(returnItem.estado) }}
                        >
                          {getReturnStatusLabel(returnItem.estado)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {returnItem.estado === 'pendiente' && (
                            <>
                              <button 
                                className="btn-small btn-success"
                                onClick={() => handleReturnAction(returnItem.id, 'aprobar')}
                              >
                                ✓ Aprobar
                              </button>
                              <button 
                                className="btn-small btn-danger"
                                onClick={() => handleReturnAction(returnItem.id, 'rechazar')}
                              >
                                ✗ Rechazar
                              </button>
                            </>
                          )}
                          <button 
                            className="btn-small"
                            onClick={() => handleReturnAction(returnItem.id, 'detalles')}
                          >
                            📋 Detalles
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredReturns.length === 0 && (
                <div className="no-results">
                  <div className="no-results-icon">🔍</div>
                  <h3>No se encontraron devoluciones</h3>
                  <p>{returns.length === 0 ? 'Aún no hay devoluciones registradas.' : 'Intenta con otros términos de búsqueda.'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductManagement;