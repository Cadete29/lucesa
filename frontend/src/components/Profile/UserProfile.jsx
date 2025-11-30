import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProductManagement from '../../pages/ProductManagement';
import OrderManagement from '../../pages/OrderManagement';
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
  
  // Nuevos estados para órdenes
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);

  // Estado para los datos del perfil
  const [profileData, setProfileData] = useState({
    nombre: '',
    username: '',
    email: ''
  });

  // Estado para el formulario de edición
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Inicializar datos del perfil cuando el usuario cambia
  useEffect(() => {
    if (user) {
      setProfileData({
        nombre: user?.nombre || '',
        username: user?.username || '',
        email: user?.email || ''
      });
    }
  }, [user]);

  // Cargar órdenes cuando se active la pestaña de historial
  useEffect(() => {
    if (activeTab === 'orders' && user) {
      loadOrderHistory();
    }
  }, [activeTab, user]);

  const loadOrderHistory = async () => {
    try {
      setOrdersLoading(true);
      const orders = await getOrderHistory();
      setUserOrders(orders);
    } catch (error) {
      console.error('Error cargando historial de órdenes:', error);
      setError('Error al cargar el historial de compras');
      // Fallback a órdenes locales si hay error
      setUserOrders(user?.orders || []);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleViewOrderDetails = async (orderId) => {
    try {
      setOrderDetailsLoading(true);
      const order = await getOrderDetails(orderId);
      setSelectedOrder(order);
    } catch (error) {
      console.error('Error cargando detalles de orden:', error);
      setError('Error al cargar los detalles de la orden');
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const handleCloseOrderDetails = () => {
    setSelectedOrder(null);
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
    setSelectedOrder(null); // Cerrar detalles de orden al cambiar pestaña
  };

  const handleAdminTabChange = (tabName) => {
    setSelectedAdminTab(tabName);
    setMobileMenuOpen(false);
  };

  const handleBackToAdmin = () => {
    setSelectedAdminTab(null);
  };

  // Función para manejar cambios en los campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para activar/desactivar edición
  const toggleEdit = () => {
    if (isEditing) {
      // Si estaba editando y cancela, restaurar valores originales
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

  // Función para actualizar el perfil
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setError('');
    setMessage('');

    // Validaciones
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
      console.log('📝 Enviando datos de actualización:', profileData);
      
      const result = await updateProfile({
        nombre: profileData.nombre.trim(),
        username: profileData.username.trim()
      });

      if (result.success) {
        setMessage('Perfil actualizado correctamente');
        setIsEditing(false);
        // Los datos se actualizan automáticamente a través del contexto
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
      const formData = new FormData();
      formData.append('profileImage', file);

      const token = localStorage.getItem('lucesa-token');

      console.log('📤 Subiendo imagen...');
      const response = await fetch(`${API_BASE_URL}/user/me/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();
      console.log('📨 Respuesta del servidor:', data);

      if (data.success) {
        setMessage('Foto de perfil actualizada correctamente');
        // Actualizar el usuario en el contexto y localStorage
        if (data.data && data.data.user) {
          const updatedUser = { ...user, ...data.data.user };
          localStorage.setItem('lucesa-user', JSON.stringify(updatedUser));
          // Forzar actualización del contexto
          window.location.reload();
        }
      } else {
        setError(data.message || 'Error al subir la imagen');
      }
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      setError('Error de conexión al subir la imagen');
    } finally {
      setUploadLoading(false);
      // Limpiar el input file
      event.target.value = '';
    }
  };

  const removeProfilePhoto = async () => {
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
      console.log('📨 Respuesta del servidor (eliminar):', data);

      if (data.success) {
        setMessage('Foto de perfil eliminada correctamente');
        // Actualizar el usuario en el contexto y localStorage
        if (data.data && data.data.user) {
          const updatedUser = { ...user, ...data.data.user };
          localStorage.setItem('lucesa-user', JSON.stringify(updatedUser));
          // Forzar actualización del contexto
          window.location.reload();
        }
      } else {
        setError(data.message || 'Error al eliminar la foto');
      }
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
      setError('Error de conexión al eliminar la foto');
    } finally {
      setUploadLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderStatusText = (status) => {
    const statusMap = {
      'confirmed': 'Confirmado',
      'processing': 'En proceso',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const getOrderStatusClass = (status) => {
    const statusClassMap = {
      'confirmed': 'confirmed',
      'processing': 'processing',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled'
    };
    return statusClassMap[status] || 'confirmed';
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Función para obtener la URL completa de la imagen
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    console.log('🖼️ Ruta de imagen recibida:', imagePath);
    
    // Si ya es una URL completa, devolverla tal cual
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Si es una ruta relativa, construir la URL completa
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://testpaginaweb.shop'
      : 'http://localhost:4004';
    
    // Asegurarse de que la ruta comience con /
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    const fullUrl = `${baseUrl}${normalizedPath}`;
    
    console.log('🔗 URL completa de imagen:', fullUrl);
    return fullUrl;
  };

  // Función para manejar errores de carga de imagen
  const handleImageError = (e, imagePath) => {
    console.error('❌ Error cargando imagen:', imagePath);
    console.error('Elemento de imagen:', e.target);
    e.target.style.display = 'none';
    
    // Mostrar el fallback
    const fallback = e.target.nextSibling;
    if (fallback) {
      fallback.style.display = 'flex';
      console.log('✅ Mostrando fallback');
    }
  };

  // Función para obtener URL de imagen de producto
  const getProductImageUrl = (productCode) => {
    if (!productCode) return null;
    
    const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
      ? 'https://testpaginaweb.shop/api/images/code'
      : 'http://localhost:4004/api/images/code';
    
    return `${IMAGE_BASE_URL}/${productCode}?size=small`;
  };

  return (
    <main className="user-profile-main">
      <div className="container">
        <div className="user-profile-card">
          {/* Header */}
          <div className="profile-card-header">
            <h1 className="profile-card-title">Mi Cuenta</h1>
            <div className="profile-card-subtitle">Gestiona tu perfil y preferencias</div>
            
            {/* Botón de menú móvil */}
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Abrir menú"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
          
          <div className="user-profile-container">
            {/* Sidebar de Navegación - DESKTOP */}
            <div className="profile-sidebar">
              <div className="user-info-card">
                <div className="user-avatar">
                  {user?.images_profile ? (
                    <img 
                      src={getProfileImageUrl(user.images_profile)} 
                      alt="Avatar del usuario" 
                      className="avatar-image" 
                      onError={(e) => handleImageError(e, user.images_profile)}
                    />
                  ) : null}
                  <div className={`avatar-placeholder ${user?.images_profile ? 'avatar-fallback' : ''}`}>
                    {user?.nombre?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </div>
                </div>
                <div className="user-details">
                  <h3>{user?.nombre || user?.username || 'Usuario'}</h3>
                  <p>{user?.email || 'email@ejemplo.com'}</p>
                  <span className="member-since">
                    Miembro desde {formatDate(user?.created_at)}
                  </span>
                  {user?.rol === 'admin' && (
                    <span className="admin-badge">Administrador</span>
                  )}
                </div>
              </div>

              <nav className="profile-nav">
                <button 
                  className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => handleTabChange('profile')}
                >
                  <span className="nav-icon">👤</span>
                  Mi Perfil
                </button>
                
                <Link to="/favorites" className="nav-item">
                  <span className="nav-icon">❤️</span>
                  Mis Favoritos
                </Link>

                <button 
                  className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => handleTabChange('orders')}
                >
                  <span className="nav-icon">📦</span>
                  Historial de Compras
                </button>

                {user?.rol === 'admin' && (
                  <button 
                    className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
                    onClick={() => handleTabChange('admin')}
                  >
                    <span className="nav-icon">⚙️</span>
                    Panel de Administración
                  </button>
                )}

                <button 
                  className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => handleTabChange('settings')}
                >
                  <span className="nav-icon">🔧</span>
                  Configuración
                </button>

                <button className="nav-item logout-btn" onClick={handleLogout}>
                  <span className="nav-icon">🚪</span>
                  Cerrar Sesión
                </button>
              </nav>
            </div>

            {/* Overlay del Menú Móvil */}
            <div 
              className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`} 
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            
            {/* Sidebar Móvil */}
            <div className={`mobile-sidebar ${mobileMenuOpen ? 'active' : ''}`}>
              <div className="mobile-user-info">
                <div className="user-avatar">
                  {user?.images_profile ? (
                    <img 
                      src={getProfileImageUrl(user.images_profile)} 
                      alt="Avatar del usuario" 
                      className="avatar-image" 
                      onError={(e) => handleImageError(e, user.images_profile)}
                    />
                  ) : null}
                  <div className={`avatar-placeholder ${user?.images_profile ? 'avatar-fallback' : ''}`}>
                    {user?.nombre?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </div>
                </div>
                <div className="user-details">
                  <h3>{user?.nombre || user?.username || 'Usuario'}</h3>
                  <p>{user?.email || 'email@ejemplo.com'}</p>
                  {user?.rol === 'admin' && (
                    <span className="admin-badge">Administrador</span>
                  )}
                </div>
              </div>

              <nav className="mobile-profile-nav">
                <button 
                  className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => handleTabChange('profile')}
                >
                  <span className="nav-icon">👤</span>
                  Mi Perfil
                </button>
                
                <Link to="/favorites" className="nav-item" onClick={() => setMobileMenuOpen(false)}>
                  <span className="nav-icon">❤️</span>
                  Mis Favoritos
                </Link>

                <button 
                  className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                  onClick={() => handleTabChange('orders')}
                >
                  <span className="nav-icon">📦</span>
                  Historial de Compras
                </button>

                {user?.rol === 'admin' && (
                  <button 
                    className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
                    onClick={() => handleTabChange('admin')}
                  >
                    <span className="nav-icon">⚙️</span>
                    Panel de Administración
                  </button>
                )}

                <button 
                  className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => handleTabChange('settings')}
                >
                  <span className="nav-icon">🔧</span>
                  Configuración
                </button>

                <button className="nav-item logout-btn" onClick={handleLogout}>
                  <span className="nav-icon">🚪</span>
                  Cerrar Sesión
                </button>
              </nav>
            </div>

            {/* Contenido Principal */}
            <div className="profile-content">
              {message && (
                <div className="profile-message success">
                  <span>✅</span>
                  {message}
                </div>
              )}

              {error && (
                <div className="profile-message error">
                  <span>⚠️</span>
                  {error}
                </div>
              )}

              {/* Pestaña: Mi Perfil */}
              {activeTab === 'profile' && (
                <div className="tab-content">
                  <div className="profile-header">
                    <h2>Mi Perfil</h2>
                    <button 
                      onClick={toggleEdit}
                      className={`btn-edit ${isEditing ? 'editing' : ''}`}
                    >
                      {isEditing ? '✕ Cancelar' : '✏️ Editar'}
                    </button>
                  </div>
                  
                  <div className="profile-section">
                    <div className="photo-section">
                      <h3>Foto de Perfil</h3>
                      <div className="photo-upload">
                        <div className="current-photo">
                          {user?.images_profile ? (
                            <>
                              <img 
                                src={getProfileImageUrl(user.images_profile)} 
                                alt="Foto de perfil" 
                                className="profile-photo" 
                                onError={(e) => handleImageError(e, user.images_profile)}
                              />
                              <div className="photo-fallback" style={{display: 'none'}}>
                                <span>👤</span>
                                <p>Error al cargar imagen</p>
                                <small>Ruta en BD: {user.images_profile}</small>
                              </div>
                            </>
                          ) : (
                            <div className="no-photo">
                              <span>👤</span>
                              <p>Sin foto de perfil</p>
                            </div>
                          )}
                        </div>
                        <div className="photo-actions">
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
                        <div className="photo-requirements">
                          <p><strong>Formatos aceptados:</strong> JPEG, PNG, GIF</p>
                          <p><strong>Tamaño máximo:</strong> 5MB</p>
                        </div>
                      </div>
                    </div>

                    <div className="profile-info-section">
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
                        <div className="profile-info-display">
                          <div className="info-item">
                            <label>Nombre Completo:</label>
                            <span>{user?.nombre || 'No especificado'}</span>
                          </div>
                          <div className="info-item">
                            <label>Username:</label>
                            <span>@{user?.username || 'No especificado'}</span>
                          </div>
                          <div className="info-item">
                            <label>Email:</label>
                            <span>{user?.email || 'No especificado'}</span>
                          </div>
                          <div className="info-item">
                            <label>Rol:</label>
                            <span className={`role-badge ${user?.rol}`}>
                              {user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
                            </span>
                          </div>
                          <div className="info-item">
                            <label>Miembro desde:</label>
                            <span>{formatDate(user?.created_at)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Pestaña: Historial de Compras */}
              {activeTab === 'orders' && (
                <div className="tab-content">
                  <div className="orders-header">
                    <h2>Historial de Compras</h2>
                    <button 
                      onClick={loadOrderHistory} 
                      className="btn-refresh"
                      disabled={ordersLoading}
                    >
                      {ordersLoading ? '🔄 Cargando...' : '🔄 Actualizar'}
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
                        {userOrders.map((order, index) => (
                          <div key={order.id || index} className="order-card">
                            <div className="order-header">
                              <div className="order-basic-info">
                                <span className="order-id">Orden #{order.order_number || order.id}</span>
                                <span className="order-date">
                                  {formatDateTime(order.order_date || order.date || order.created_at)}
                                </span>
                              </div>
                              <span className={`order-status ${getOrderStatusClass(order.status)}`}>
                                {getOrderStatusText(order.status)}
                              </span>
                            </div>
                            
                            <div className="order-items">
                              {(order.items || order.items_details || []).slice(0, 3).map((item, itemIndex) => (
                                <div key={itemIndex} className="order-item">
                                  <div className="item-image">
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
                                  <div className="item-details">
                                    <h4>{item.product_name || item.nombre || 'Producto'}</h4>
                                    <p>Cantidad: {item.quantity || 1}</p>
                                    <p>${(item.unit_price || item.precioFinal || item.precio || 0).toFixed(2)} c/u</p>
                                    <p className="item-total">
                                      Total: ${(item.total_price || (item.quantity * (item.unit_price || item.precio || 0))).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {(order.items || order.items_details || []).length > 3 && (
                                <div className="more-items">
                                  +{(order.items || order.items_details || []).length - 3} más productos
                                </div>
                              )}
                            </div>
                            
                            <div className="order-footer">
                              <div className="order-total">
                                <strong>Total: ${order.total_amount?.toFixed(2) || order.total?.toFixed(2) || '0.00'}</strong>
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
                        ))}
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

                  {/* Modal de Detalles de Orden */}
                  {selectedOrder && (
                    <div className="order-details-modal">
                      <div className="modal-overlay" onClick={handleCloseOrderDetails}></div>
                      <div className="modal-content">
                        <div className="modal-header">
                          <h3>Detalles de Orden #{selectedOrder.order_number || selectedOrder.id}</h3>
                          <button className="modal-close" onClick={handleCloseOrderDetails}>✕</button>
                        </div>
                        
                        <div className="modal-body">
                          <div className="order-info-grid">
                            <div className="info-item">
                              <label>Fecha:</label>
                              <span>{formatDateTime(selectedOrder.order_date || selectedOrder.date || selectedOrder.created_at)}</span>
                            </div>
                            <div className="info-item">
                              <label>Estado:</label>
                              <span className={`status-badge ${getOrderStatusClass(selectedOrder.status)}`}>
                                {getOrderStatusText(selectedOrder.status)}
                              </span>
                            </div>
                            <div className="info-item">
                              <label>Subtotal:</label>
                              <span>${selectedOrder.subtotal?.toFixed(2) || selectedOrder.subtotal_amount?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="info-item">
                              <label>IVA:</label>
                              <span>${selectedOrder.tax_amount?.toFixed(2) || selectedOrder.tax?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="info-item">
                              <label>Envío:</label>
                              <span>${selectedOrder.shipping_amount?.toFixed(2) || selectedOrder.shipping?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="info-item total">
                              <label>Total:</label>
                              <span>${selectedOrder.total_amount?.toFixed(2) || selectedOrder.total?.toFixed(2) || '0.00'}</span>
                            </div>
                          </div>

                          <div className="order-products">
                            <h4>Productos</h4>
                            <div className="products-list">
                              {(selectedOrder.items || selectedOrder.items_details || []).map((item, index) => (
                                <div key={index} className="product-item">
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
                                    <h5>{item.product_name || item.nombre}</h5>
                                    <p>Código: {item.product_code || item.codigo || 'N/A'}</p>
                                    <p>Marca: {item.product_brand || item.marca || 'No especificada'}</p>
                                  </div>
                                  <div className="product-pricing">
                                    <p>${(item.unit_price || item.precio || 0).toFixed(2)} c/u</p>
                                    <p>Cantidad: {item.quantity || 1}</p>
                                    <p className="product-total">
                                      ${(item.total_price || (item.quantity * (item.unit_price || item.precio || 0))).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Pestaña: Panel de Administración */}
              {activeTab === 'admin' && (
                <div className="tab-content">
                  <div className="admin-section">
                    {user?.rol === 'admin' ? (
                      <div className="admin-dashboard">
                        {/* Mostrar menú de administración o el componente seleccionado */}
                        {!selectedAdminTab ? (
                          <div>
                            <div className="admin-header-internal">
                              <h2>Panel de Administración</h2>
                              <p>Selecciona una opción para gestionar el sistema</p>
                            </div>
                            <div className="admin-cards">
                              <div className="admin-card">
                                <div className="admin-card-icon">🛍️</div>
                                <h3>Gestión de Productos</h3>
                                <p>Administrar productos, garantías y devoluciones</p>
                                <button 
                                  className="btn-primary"
                                  onClick={() => handleAdminTabChange('products')}
                                >
                                  Gestionar Productos
                                </button>
                              </div>
                              
                              <div className="admin-card">
                                <div className="admin-card-icon">📝</div>
                                <h3>Gestión de Pedidos</h3>
                                <p>Ver y administrar todos los pedidos</p>
                                <button 
                                  className="btn-primary"
                                  onClick={() => handleAdminTabChange('orders')}
                                >
                                  Ver Pedidos
                                </button>
                              </div>

                              {/* <div className="admin-card">
                                <div className="admin-card-icon">👥</div>
                                <h3>Gestión de Usuarios</h3>
                                <p>Administrar usuarios y permisos</p>
                                <button className="btn-primary">
                                  Gestionar Usuarios
                                </button>
                              </div> */}

                              {/* <div className="admin-card">
                                <div className="admin-card-icon">📊</div>
                                <h3>Reportes y Análisis</h3>
                                <p>Ver reportes y estadísticas del sistema</p>
                                <button className="btn-primary">
                                  Ver Reportes
                                </button>
                              </div> */}

                              <div className="admin-card">
                                  <div className="admin-card-icon">❤️</div>
                                  <h3>Gestión de Favoritos</h3>
                                  <p>Ver estadísticas de productos favoritos</p>
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
                          <div className="admin-content">
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
                      <div className="no-admin-access">
                        <div className="no-access-icon">🔒</div>
                        <h3>Acceso Restringido</h3>
                        <p>No tienes permisos de administrador para acceder a esta sección.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pestaña: Configuración */}
              {activeTab === 'settings' && (
                <div className="tab-content">
                  <h2>Configuración</h2>
                  <div className="settings-section">
                    <div className="setting-group">
                      <h3>Preferencias de Notificación</h3>
                      <div className="setting-item">
                        <label className="switch">
                          <input type="checkbox" defaultChecked />
                          <span className="slider"></span>
                        </label>
                        <span>Notificaciones por email</span>
                      </div>
                      <div className="setting-item">
                        <label className="switch">
                          <input type="checkbox" defaultChecked />
                          <span className="slider"></span>
                        </label>
                        <span>Notificaciones de ofertas</span>
                      </div>
                      <div className="setting-item">
                        <label className="switch">
                          <input type="checkbox" />
                          <span className="slider"></span>
                        </label>
                        <span>Notificaciones de nuevos productos</span>
                      </div>
                    </div>

                    <div className="setting-group">
                      <h3>Privacidad</h3>
                      <div className="setting-item">
                        <label className="switch">
                          <input type="checkbox" defaultChecked />
                          <span className="slider"></span>
                        </label>
                        <span>Perfil público</span>
                      </div>
                      <div className="setting-item">
                        <label className="switch">
                          <input type="checkbox" />
                          <span className="slider"></span>
                        </label>
                        <span>Mostrar actividad reciente</span>
                      </div>
                    </div>

                    <div className="setting-group">
                      <h3>Zona Peligrosa</h3>
                      <div className="danger-zone">
                        <button type="button" className="btn-danger">
                          Eliminar Mi Cuenta
                        </button>
                        <p>Esta acción no se puede deshacer. Se perderán todos tus datos.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UserProfile;