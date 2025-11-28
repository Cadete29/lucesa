import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProductManagement from '../../pages/ProductManagement';
import OrderManagement from '../../pages/OrderManagement';
import './UserProfile.css';

const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

const UserProfile = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedAdminTab, setSelectedAdminTab] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    username: user?.username || ''
  });

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
    setMobileMenuOpen(false);
  };

  const handleAdminTabChange = (tabName) => {
    setSelectedAdminTab(tabName);
    setMobileMenuOpen(false);
  };

  const handleBackToAdmin = () => {
    setSelectedAdminTab(null);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        setMessage('Perfil actualizado correctamente');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch('/api/upload-profile-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const result = await updateProfile({ foto_perfil: data.imageUrl });
        if (result.success) {
          setMessage('Foto de perfil actualizada correctamente');
        } else {
          setError(result.error);
        }
      } else {
        setError('Error al subir la imagen');
      }
    } catch (error) {
      setError('Error al subir la imagen');
    } finally {
      setLoading(false);
    }
  };

  const removeProfilePhoto = async () => {
    setLoading(true);
    try {
      const result = await updateProfile({ foto_perfil: null });
      if (result.success) {
        setMessage('Foto de perfil eliminada');
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Error al eliminar la foto');
    } finally {
      setLoading(false);
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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Datos de ejemplo para pedidos (deberías reemplazar con datos reales)
  const sampleOrders = [
    {
      id: 'ORD-001',
      date: new Date('2024-01-15'),
      status: 'delivered',
      total: 156.75,
      items: [
        { codigo: 'PROD001', nombre: 'Laptop Gaming', precio: 1200, quantity: 1 },
        { codigo: 'PROD002', nombre: 'Mouse Inalámbrico', precio: 45.99, quantity: 2 }
      ]
    },
    {
      id: 'ORD-002',
      date: new Date('2024-01-10'),
      status: 'shipped',
      total: 89.99,
      items: [
        { codigo: 'PROD003', nombre: 'Teclado Mecánico', precio: 89.99, quantity: 1 }
      ]
    }
  ];

  const userOrders = user?.orders || sampleOrders;

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
                  {user?.foto_perfil ? (
                    <img 
                      src={user.foto_perfil} 
                      alt="Avatar del usuario" 
                      className="avatar-image" 
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.nombre?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </div>
                  )}
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
                  {user?.foto_perfil ? (
                    <img 
                      src={user.foto_perfil} 
                      alt="Avatar del usuario" 
                      className="avatar-image" 
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {user?.nombre?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </div>
                  )}
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
                  <h2>Mi Perfil</h2>
                  <div className="profile-section">
                    <div className="photo-section">
                      <h3>Foto de Perfil</h3>
                      <div className="photo-upload">
                        <div className="current-photo">
                          {user?.foto_perfil ? (
                            <img 
                              src={user.foto_perfil} 
                              alt="Foto de perfil" 
                              className="profile-photo" 
                            />
                          ) : (
                            <div className="no-photo">
                              <span>👤</span>
                              <p>Sin foto de perfil</p>
                            </div>
                          )}
                        </div>
                        <div className="photo-actions">
                          <label htmlFor="photo-upload" className="btn-primary">
                            {loading ? 'Subiendo...' : 'Cambiar Foto'}
                          </label>
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={loading}
                            style={{ display: 'none' }}
                          />
                          {user?.foto_perfil && (
                            <button 
                              type="button"
                              className="btn-secondary"
                              onClick={removeProfilePhoto}
                              disabled={loading}
                            >
                              Eliminar Foto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="profile-form">
                      <h3>Información Personal</h3>
                      <div className="form-group">
                        <label htmlFor="nombre">Nombre Completo</label>
                        <input
                          type="text"
                          id="nombre"
                          value={profileData.nombre}
                          onChange={(e) => setProfileData({...profileData, nombre: e.target.value})}
                          placeholder="Tu nombre completo"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                          type="text"
                          id="username"
                          value={profileData.username}
                          onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                          placeholder="Tu nombre de usuario"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          placeholder="tu@email.com"
                          disabled
                        />
                        <small>El email no se puede modificar</small>
                      </div>

                      <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Guardando...' : 'Actualizar Perfil'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Pestaña: Historial de Compras */}
              {activeTab === 'orders' && (
                <div className="tab-content">
                  <h2>Historial de Compras</h2>
                  <div className="orders-section">
                    {userOrders && userOrders.length > 0 ? (
                      <div className="orders-list">
                        {userOrders.map((order, index) => (
                          <div key={order.id || index} className="order-card">
                            <div className="order-header">
                              <span className="order-id">#{order.id}</span>
                              <span className="order-date">
                                {formatDate(order.date)}
                              </span>
                              <span className={`order-status ${order.status}`}>
                                {order.status === 'confirmed' ? 'Confirmado' : 
                                 order.status === 'shipped' ? 'Enviado' : 
                                 order.status === 'delivered' ? 'Entregado' : 
                                 order.status}
                              </span>
                            </div>
                            
                            <div className="order-items">
                              {order.items && order.items.slice(0, 3).map((item, itemIndex) => (
                                <div key={itemIndex} className="order-item">
                                  <div className="item-image">
                                    {item.codigo ? (
                                      <img 
                                        src={`${IMAGE_BASE_URL}/${item.codigo}?size=small`} 
                                        alt={item.nombre} 
                                        className="item-img"
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
                                    <h4>{item.nombre || 'Producto'}</h4>
                                    <p>Cantidad: {item.quantity || 1}</p>
                                    <p>${(item.precioFinal || item.precio || 0).toFixed(2)}</p>
                                  </div>
                                </div>
                              ))}
                              {order.items && order.items.length > 3 && (
                                <div className="more-items">
                                  +{order.items.length - 3} más productos
                                </div>
                              )}
                            </div>
                            
                            <div className="order-total">
                              <strong>Total: ${order.total?.toFixed(2) || '0.00'}</strong>
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