import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProductManagement from '../../pages/ProductManagement';
import OrderManagement from '../../pages/OrderManagement';
import AdminFavorites from '../AdminFavorites';
import './UserProfile.css';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api'
  : 'http://localhost:4004/api';

const UserProfile = () => {
  const { user, logout, updateProfile, getOrderHistory, getOrderDetails } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedAdminTab, setSelectedAdminTab] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [profileData, setProfileData] = useState({
    nombre: '',
    username: '',
    email: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [imageReloadKey, setImageReloadKey] = useState(0);

  // Controlar el scroll del body cuando el menú móvil está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user?.nombre || '',
        username: user?.username || '',
        email: user?.email || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders' && user) {
      loadOrderHistory();
    }
  }, [activeTab, user]);

  const loadOrderHistory = async () => {
    try {
      setOrdersLoading(true);
      const orders = await getOrderHistory();
      
      const formattedOrders = (orders || []).map(order => ({
        id: order.id,
        order_number: order.order_number || `ORD-${order.id}`,
        status: order.status || 'pending',
        total_amount: order.total_amount || order.total || 0,
        total: order.total_amount || order.total || 0,
        subtotal: order.subtotal || 0,
        tax_amount: order.tax_amount || 0,
        shipping_amount: order.shipping_amount || 0,
        created_at: order.created_at || new Date().toISOString(),
        order_date: order.order_date || order.created_at || new Date().toISOString(),
        items: (order.items || order.items_details || []).map(item => ({
          id: item.id,
          product_code: item.product_code || item.codigo || `PROD-${Math.random().toString(36).substr(2, 9)}`,
          product_name: item.product_name || item.nombre || 'Producto sin nombre',
          nombre: item.product_name || item.nombre || 'Producto sin nombre',
          codigo: item.product_code || item.codigo || `PROD-${Math.random().toString(36).substr(2, 9)}`,
          product_brand: item.product_brand || item.marca || 'Sin marca',
          marca: item.product_brand || item.marca || 'Sin marca',
          product_image_url: item.product_image_url,
          unit_price: item.unit_price || item.precio || item.precioFinal || 0,
          precio: item.unit_price || item.precio || item.precioFinal || 0,
          precioFinal: item.unit_price || item.precio || item.precioFinal || 0,
          quantity: item.quantity || 1,
          total_price: item.total_price || ((item.unit_price || item.precio || 0) * (item.quantity || 1))
        }))
      }));
      
      setUserOrders(formattedOrders);
    } catch (error) {
      console.error('Error cargando historial de compras:', error);
      setError('Error al cargar el historial de compras');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleViewOrderDetails = async (orderId) => {
    try {
      setOrderDetailsLoading(true);
      const orderFromList = userOrders.find(order => order.id === orderId);
      
      if (orderFromList) {
        setSelectedOrder(orderFromList);
        setShowOrderModal(true);
        return;
      }
      
      const order = await getOrderDetails(orderId);
      
      if (order) {
        setSelectedOrder(order);
        setShowOrderModal(true);
      } else {
        setError('No se pudieron cargar los detalles de la orden');
      }
    } catch (error) {
      console.error('Error cargando detalles de orden:', error);
      setError('Error al cargar los detalles de la orden');
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const handleCloseOrderDetails = () => {
    setSelectedOrder(null);
    setShowOrderModal(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleTabChange = (tabName) => {
    if (tabName === 'admin' && user?.rol !== 'admin') {
      setActiveTab('profile');
      setError('No tienes permisos para acceder al panel de administración');
      return;
    }
    setActiveTab(tabName);
    setSelectedAdminTab(null);
    setError('');
    setMessage('');
    setMobileMenuOpen(false);
    setSelectedOrder(null);
    setShowOrderModal(false);
  };

  const handleAdminTabChange = (tabName) => {
    setSelectedAdminTab(tabName);
    setMobileMenuOpen(false);
  };

  const handleBackToAdmin = () => {
    setSelectedAdminTab(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleEdit = () => {
    if (isEditing) {
      setProfileData({
        nombre: user?.nombre || '',
        username: user?.username || '',
        email: user?.email || ''
      });
    }
    setIsEditing(!isEditing);
    setError('');
    setMessage('');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setError('');
    setMessage('');

    if (!profileData.nombre.trim()) {
      setError('El nombre completo es obligatorio');
      setEditLoading(false);
      return;
    }

    if (!profileData.username.trim()) {
      setError('El nombre de usuario es obligatorio');
      setEditLoading(false);
      return;
    }

    if (profileData.username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      setEditLoading(false);
      return;
    }

    try {
      const result = await updateProfile({
        nombre: profileData.nombre.trim(),
        username: profileData.username.trim()
      });

      if (result.success) {
        setMessage('Perfil actualizado correctamente');
        setIsEditing(false);
      } else {
        setError(result.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error en actualización:', error);
      setError('Error al actualizar el perfil. Por favor, intenta nuevamente.');
    } finally {
      setEditLoading(false);
    }
  };

  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://testpaginaweb.shop'
      : 'http://localhost:4004';
    
    let normalizedPath = imagePath;
    
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }
    
    const timestamp = imageReloadKey || Date.now();
    const finalUrl = `${baseUrl}${normalizedPath}?t=${timestamp}`;
    
    return finalUrl;
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida (JPEG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    setUploadLoading(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('lucesa-token');
      
      if (user?.images_profile) {
        try {
          await fetch(`${API_BASE_URL}/user/me/remove-photo`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (deleteError) {
          console.error('Error al eliminar imagen anterior:', deleteError);
        }
      }

      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch(`${API_BASE_URL}/user/me/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Foto de perfil actualizada correctamente');
        setImageReloadKey(Date.now());
        
        if (data.data && data.data.user) {
          const updatedUser = {
            ...user,
            images_profile: data.data.user.images_profile
          };
          
          localStorage.setItem('lucesa-user', JSON.stringify(updatedUser));
          
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        setError(data.message || 'Error al subir la imagen');
      }
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      setError('Error de conexión al subir la imagen');
    } finally {
      setUploadLoading(false);
      event.target.value = '';
    }
  };

  const removeProfilePhoto = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar tu foto de perfil?')) {
      return;
    }

    setUploadLoading(true);
    setError('');
    setMessage('');

    try {
      const token = localStorage.getItem('lucesa-token');

      const response = await fetch(`${API_BASE_URL}/user/me/remove-photo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Foto de perfil eliminada correctamente');
        
        if (data.data && data.data.user) {
          const updatedUser = {
            ...user,
            images_profile: null
          };
          
          localStorage.setItem('lucesa-user', JSON.stringify(updatedUser));
          
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        setError(data.message || 'Error al eliminar la foto');
      }
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      setError('Error de conexión al eliminar la foto');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    const fallback = e.target.nextSibling;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getOrderStatusText = (status) => {
    const statusMap = {
      'confirmed': 'Confirmado',
      'processing': 'En proceso',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado',
      'completed': 'Completado',
      'pending': 'Pendiente'
    };
    return statusMap[status] || status;
  };

  const getOrderStatusClass = (status) => {
    const statusClassMap = {
      'confirmed': 'confirmed',
      'processing': 'processing',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'completed': 'completed',
      'pending': 'pending'
    };
    return statusClassMap[status] || 'confirmed';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const renderOrdersSection = () => {
    return (
      <div className="tab-content">
        <div className="orders-header">
          <h2>Historial de Compras</h2>
          <button 
            onClick={loadOrderHistory} 
            className="btn-refresh"
            disabled={ordersLoading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            {ordersLoading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
        
        <div className="orders-section">
          {ordersLoading ? (
            <div className="orders-loading">
              <div className="loading-spinner"></div>
              <p>Cargando tu historial de compras...</p>
            </div>
          ) : userOrders && userOrders.length > 0 ? (
            <div className="orders-list">
              {userOrders.map((order, index) => {
                const items = order.items || [];
                
                return (
                  <div key={order.id || index} className="order-item">
                    <div className="order-header">
                      <div className="order-basic-info">
                        <span className="order-id">Orden #{order.order_number || order.id}</span>
                        <span className="order-date">
                          {formatDateTime(order.order_date || order.created_at)}
                        </span>
                      </div>
                      <span className={`order-status ${getOrderStatusClass(order.status)}`}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </div>
                    
                    <div className="order-items-summary">
                      {items.slice(0, 3).map((item, itemIndex) => {
                        const itemName = item.nombre || item.product_name || 'Producto';
                        const itemPrice = item.precio || item.unit_price || item.precioFinal || 0;
                        const itemQuantity = item.quantity || 1;
                        const itemTotal = item.total_price || (itemPrice * itemQuantity);
                        
                        return (
                          <div key={itemIndex} className="order-product-item">
                            <div className="product-item-info">
                              <span className="product-item-name">{itemName}</span>
                              <span className="product-item-details">
                                {itemQuantity} x ${itemPrice.toFixed(2)} = ${itemTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {items.length > 3 && (
                        <div className="more-items-summary">
                          +{items.length - 3} más productos
                        </div>
                      )}
                    </div>
                    
                    <div className="order-footer">
                      <div className="order-total">
                        <strong>Total: ${(order.total_amount || order.total || 0).toFixed(2)}</strong>
                      </div>
                      <button 
                        className="btn-view-details"
                        onClick={() => handleViewOrderDetails(order.id)}
                        disabled={orderDetailsLoading}
                      >
                        {orderDetailsLoading ? 'Cargando...' : 'Ver Detalles'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-orders">
              <div className="no-orders-icon">📦</div>
              <h3>Aún no tienes pedidos</h3>
              <p>Cuando realices tu primera compra, aparecerá aquí.</p>
              <Link to="/products" className="btn-primary">
                Comenzar a Comprar
              </Link>
            </div>
          )}
        </div>

        {showOrderModal && selectedOrder && (
          <div className="order-details-modal active">
            <div className="modal-overlay" onClick={handleCloseOrderDetails}></div>
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-header-content">
                  <h3>📦 Detalles de Orden #{selectedOrder.order_number || selectedOrder.id}</h3>
                  <div className="order-status-badge">
                    <span className={`order-status ${getOrderStatusClass(selectedOrder.status)}`}>
                      {getOrderStatusText(selectedOrder.status)}
                    </span>
                  </div>
                </div>
                <button className="modal-close" onClick={handleCloseOrderDetails}>
                  <span>✕</span>
                </button>
              </div>
              
              <div className="modal-body">
                <div className="order-info-grid">
                  <div className="order-info-item">
                    <span className="order-info-label">Fecha de la orden:</span>
                    <span className="order-info-value">{formatDateTime(selectedOrder.order_date || selectedOrder.created_at)}</span>
                  </div>
                  <div className="order-info-item">
                    <span className="order-info-label">Número de orden:</span>
                    <span className="order-info-value">#{selectedOrder.order_number || selectedOrder.id}</span>
                  </div>
                  <div className="order-info-item">
                    <span className="order-info-label">Estado:</span>
                    <span className={`order-info-value ${getOrderStatusClass(selectedOrder.status)}`}>
                      {getOrderStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <div className="order-info-item">
                    <span className="order-info-label">Total de productos:</span>
                    <span className="order-info-value">{selectedOrder.items?.length || 0} items</span>
                  </div>
                </div>

                <div className="order-products-list">
                  <h4>📋 Productos de la Orden ({selectedOrder.items?.length || 0})</h4>
                  
                  <div className="products-container">
                    {(selectedOrder.items || []).length > 0 ? (
                      (selectedOrder.items || []).map((item, index) => {
                        const itemName = item.nombre || item.product_name || 'Producto sin nombre';
                        const itemCode = item.codigo || item.product_code || 'N/A';
                        const itemPrice = item.precio || item.unit_price || item.precioFinal || 0;
                        const itemQuantity = item.quantity || 1;
                        const itemTotal = item.total_price || (itemPrice * itemQuantity);
                        
                        return (
                          <div key={index} className="product-item-detail">
                            <div className="product-detail-header">
                              <span className="product-number">#{index + 1}</span>
                              <span className="product-code">Código: {itemCode}</span>
                            </div>
                            
                            <div className="product-detail-content">
                              <div className="product-name">{itemName}</div>
                              <div className="product-details-grid">
                                <div className="product-detail">
                                  <span>Precio unitario:</span>
                                  <span>${itemPrice.toFixed(2)}</span>
                                </div>
                                <div className="product-detail">
                                  <span>Cantidad:</span>
                                  <span>{itemQuantity}</span>
                                </div>
                                <div className="product-detail">
                                  <span>Subtotal:</span>
                                  <span>${(itemPrice * itemQuantity).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="product-total">
                              <span className="total-label">Total:</span>
                              <span className="total-amount">${itemTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-products">
                        <div className="no-products-icon">📦</div>
                        <p>No se encontraron productos en esta orden</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="order-totals">
                  <h4>💰 Resumen de Pagos</h4>
                  
                  <div className="totals-list">
                    <div className="total-item">
                      <span>Subtotal de productos:</span>
                      <span>${(selectedOrder.subtotal || selectedOrder.subtotal_amount || 
                        (selectedOrder.total_amount || selectedOrder.total || 0) - 
                        (selectedOrder.tax_amount || selectedOrder.tax || 0) - 
                        (selectedOrder.shipping_amount || selectedOrder.shipping || 0)).toFixed(2)}</span>
                    </div>
                    
                    <div className="total-item">
                      <span>Envío:</span>
                      <span>${(selectedOrder.shipping_amount || selectedOrder.shipping || 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="total-item">
                      <span>Impuestos (IVA):</span>
                      <span>${(selectedOrder.tax_amount || selectedOrder.tax || 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="total-item grand-total">
                      <span>Total de la orden:</span>
                      <span>${(selectedOrder.total_amount || selectedOrder.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn-close-modal" onClick={handleCloseOrderDetails}>
                  Cerrar Detalles
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderProfileSection = () => (
    <div className="tab-content">
      <div className="profile-header-inner">
        <h2>Mi Perfil</h2>
        <button 
          onClick={toggleEdit}
          className={`btn-edit ${isEditing ? 'editing' : ''}`}
        >
          {isEditing ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Cancelar
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '6px'}}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Editar
            </>
          )}
        </button>
      </div>
      
      <div className="profile-content-container">
        <div className="photo-section">
          <h3>Foto de Perfil</h3>
          <div className="photo-container">
            <div className="current-photo">
              {user?.images_profile ? (
                <>
                  <img 
                    key={`profile-img-${imageReloadKey}`}
                    src={getProfileImageUrl(user.images_profile)} 
                    alt="Foto de perfil" 
                    className="profile-photo" 
                    onError={handleImageError}
                  />
                  <div className="photo-fallback" style={{display: 'none'}}>
                    <span>👤</span>
                    <p>Error al cargar imagen</p>
                  </div>
                </>
              ) : (
                <div className="no-photo">
                  <span>👤</span>
                  <p>Sin foto de perfil</p>
                </div>
              )}
            </div>
            <div className="photo-controls">
              <label htmlFor="photo-upload" className={`btn-primary ${uploadLoading ? 'disabled' : ''}`}>
                {uploadLoading ? '📤 Subiendo...' : '📷 Cambiar Foto'}
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadLoading}
                style={{ display: 'none' }}
              />
              {user?.images_profile && (
                <button 
                  type="button"
                  className={`btn-secondary ${uploadLoading ? 'disabled' : ''}`}
                  onClick={removeProfilePhoto}
                  disabled={uploadLoading}
                >
                  🗑️ Eliminar Foto
                </button>
              )}
            </div>
          </div>
          <div className="photo-info">
            <p><strong>Formatos aceptados:</strong> JPEG, PNG, GIF</p>
            <p><strong>Tamaño máximo:</strong> 5MB</p>
            <p><strong>Nota:</strong> Al cambiar la foto, la anterior será eliminada automáticamente</p>
          </div>
        </div>

        <div className="info-section">
          <h3>Información Personal</h3>
          
          {isEditing ? (
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre Completo *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={profileData.nombre}
                  onChange={handleInputChange}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={profileData.username}
                  onChange={handleInputChange}
                  placeholder="Tu nombre de usuario"
                  required
                  minLength="3"
                />
                <small>Mínimo 3 caracteres</small>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  disabled
                />
                <small>El email no se puede modificar</small>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={editLoading}
                >
                  {editLoading ? '💾 Guardando...' : '💾 Guardar Cambios'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={toggleEdit}
                  disabled={editLoading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="info-display">
              <div className="info-row">
                <span className="info-label">Nombre Completo:</span>
                <span className="info-value">{user?.nombre || 'No especificado'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Username:</span>
                <span className="info-value">@{user?.username || 'No especificado'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{user?.email || 'No especificado'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Miembro desde:</span>
                <span className="info-value">{formatDate(user?.created_at)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAdminSection = () => (
    <div className="tab-content">
      <div className="admin-section">
        {user?.rol === 'admin' ? (
          <div className="admin-content">
            {!selectedAdminTab ? (
              <div>
                <div className="admin-header">
                  <h2>Panel de Administración</h2>
                  <p>Selecciona una opción para gestionar el sistema</p>
                </div>
                <div className="admin-actions">
                  <div className="admin-action">
                    <div className="admin-action-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4895CF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                      </svg>
                    </div>
                    <div className="admin-action-info">
                      <h3>Gestión de Productos</h3>
                      <p>Administrar productos, garantías y devoluciones</p>
                    </div>
                    <button 
                      className="btn-primary"
                      onClick={() => handleAdminTabChange('products')}
                    >
                      Gestionar
                    </button>
                  </div>
                  
                  <div className="admin-action">
                    <div className="admin-action-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4895CF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    </div>
                    <div className="admin-action-info">
                      <h3>Gestión de Pedidos</h3>
                      <p>Ver y administrar todos los pedidos</p>
                    </div>
                    <button 
                      className="btn-primary"
                      onClick={() => handleAdminTabChange('orders')}
                    >
                      Ver Pedidos
                    </button>
                  </div>

                  <div className="admin-action">
                    <div className="admin-action-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4895CF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </div>
                    <div className="admin-action-info">
                      <h3>Gestión de Favoritos</h3>
                      <p>Ver estadísticas de productos favoritos</p>
                    </div>
                    <button 
                      className="btn-primary"
                      onClick={() => handleAdminTabChange('favorites')}
                    >
                      Ver Estadísticas
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="admin-panel">
                <button 
                  className="back-button"
                  onClick={handleBackToAdmin}
                >
                  ← Volver al Panel Principal
                </button>
                
                {selectedAdminTab === 'products' && <ProductManagement />}
                {selectedAdminTab === 'orders' && <OrderManagement />}
                {selectedAdminTab === 'favorites' && <AdminFavorites />}
              </div>
            )}
          </div>
        ) : (
          <div className="no-admin">
            <div className="no-admin-icon">🔒</div>
            <h3>Acceso Restringido</h3>
            <p>No tienes permisos de administrador para acceder a esta sección.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="user-profile">
      {/* Header Principal */}
      <header className="profile-header">
        <div className="header-content">
          <h1>Mi Cuenta</h1>
          <p>Gestiona tu perfil y preferencias</p>
        </div>
        
        <button 
          className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Abrir menú"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>
      
      <div className="profile-layout">
        {/* Sidebar de Navegación - Escritorio */}
        <aside className="profile-sidebar">
          <div className="user-summary">
            <div className="user-avatar">
              {user?.images_profile ? (
                <img 
                  key={`avatar-${imageReloadKey}`}
                  src={getProfileImageUrl(user.images_profile)} 
                  alt="Avatar del usuario" 
                  className="avatar-img" 
                  onError={handleImageError}
                />
              ) : null}
              <div className={`avatar-default ${user?.images_profile ? 'avatar-fallback' : ''}`}>
                {user?.nombre?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="user-info">
              <h3>{user?.nombre || user?.username || 'Usuario'}</h3>
              <p>{user?.email || 'email@ejemplo.com'}</p>
              <span className="member-since">
                Miembro desde {formatDate(user?.created_at)}
              </span>
              {user?.rol === 'admin' && (
                <span className="admin-tag">Administrador</span>
              )}
            </div>
          </div>

          <nav className="navigation-menu">
            <button 
              className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleTabChange('profile')}
            >
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </span>
              Mi Perfil
            </button>
            
            <Link to="/favorites" className="nav-btn">
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </span>
              Mis Favoritos
            </Link>

            <button 
              className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => handleTabChange('orders')}
            >
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  <path d="M8 21v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"></path>
                </svg>
              </span>
              Historial de Compras
            </button>

            {user?.rol === 'admin' && (
              <button 
                className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => handleTabChange('admin')}
              >
                <span className="nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </span>
                Panel de Administración
              </button>
            )}

            <button className="nav-btn logout" onClick={handleLogout}>
              <span className="nav-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </span>
              Cerrar Sesión
            </button>
          </nav>
        </aside>

        {/* Overlay del Menú Móvil */}
        <div 
          className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`} 
          onClick={closeMobileMenu}
        ></div>
        
        {/* Sidebar Móvil */}
        <aside className={`mobile-sidebar ${mobileMenuOpen ? 'active' : ''}`}>
          {/* Header fijo del sidebar móvil */}
          <div className="mobile-sidebar-header">
            <div className="user-avatar">
              {user?.images_profile ? (
                <img 
                  key={`mobile-header-avatar-${imageReloadKey}`}
                  src={getProfileImageUrl(user.images_profile)} 
                  alt="Avatar" 
                  className="avatar-img" 
                  onError={handleImageError}
                />
              ) : null}
              <div className={`avatar-default ${user?.images_profile ? 'avatar-fallback' : ''}`}>
                {user?.nombre?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="user-info">
              <h3>{user?.nombre || user?.username || 'Usuario'}</h3>
              <p>{user?.email || 'email@ejemplo.com'}</p>
            </div>
            <button className="close-sidebar-btn" onClick={closeMobileMenu}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          {/* Contenido desplazable del sidebar */}
          <div className="mobile-sidebar-content">
            <div className="mobile-user-summary">
              <div className="user-avatar">
                {user?.images_profile ? (
                  <img 
                    key={`mobile-avatar-${imageReloadKey}`}
                    src={getProfileImageUrl(user.images_profile)} 
                    alt="Avatar del usuario" 
                    className="avatar-img" 
                    onError={handleImageError}
                  />
                ) : null}
                <div className={`avatar-default ${user?.images_profile ? 'avatar-fallback' : ''}`}>
                  {user?.nombre?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="user-info">
                <h3>{user?.nombre || user?.username || 'Usuario'}</h3>
                <p>{user?.email || 'email@ejemplo.com'}</p>
                <span className="member-since">
                  Miembro desde {formatDate(user?.created_at)}
                </span>
                {/* {user?.rol === 'admin' && (
                  <span className="admin-tag">Administrador</span>
                )} */}
              </div>
            </div>

            <nav className="mobile-navigation-menu">
              <button 
                className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabChange('profile')}
              >
                <span className="nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                Mi Perfil
              </button>
              
              <Link to="/favorites" className="nav-btn" onClick={closeMobileMenu}>
                <span className="nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </span>
                Mis Favoritos
              </Link>

              <button 
                className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => handleTabChange('orders')}
              >
                <span className="nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    <path d="M8 21v-4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"></path>
                  </svg>
                </span>
                Historial de Compras
              </button>

              {user?.rol === 'admin' && (
                <button 
                  className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => handleTabChange('admin')}
                >
                  <span className="nav-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </span>
                  Panel de Administración
                </button>
              )}

              <button className="nav-btn logout" onClick={handleLogout}>
                <span className="nav-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </span>
                Cerrar Sesión
              </button>
            </nav>
          </div>
        </aside>

        {/* Área de Contenido Principal */}
        <main className="profile-main-content">
          {message && (
            <div className="alert success">
              <span>✅</span>
              {message}
            </div>
          )}

          {error && (
            <div className="alert error">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {activeTab === 'profile' && renderProfileSection()}
          {activeTab === 'orders' && renderOrdersSection()}
          {activeTab === 'admin' && renderAdminSection()}
        </main>
      </div>
    </div>
  );
};

export default UserProfile;