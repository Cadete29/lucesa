import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [profileData, setProfileData] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    username: user?.username || ''
  });

  const handleLogout = () => {
    logout();
    navigate('/');
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

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // En un entorno real, aquí subirías la imagen a tu servidor
      // Por ahora, simulamos la subida con una URL local
      const imageUrl = URL.createObjectURL(file);
      
      const result = await updateProfile({ foto_perfil: imageUrl });
      if (result.success) {
        setMessage('Foto de perfil actualizada correctamente');
      } else {
        setError(result.error);
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
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <main className="user-profile-main">
      <div className="container">
        <div className="user-profile-container">
          {/* Sidebar de Navegación */}
          <div className="profile-sidebar">
            <div className="user-info-card">
              <div className="user-avatar">
                {user?.foto_perfil ? (
                  <img src={user.foto_perfil} alt="Avatar" className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.nombre?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <div className="user-details">
                <h3>{user?.nombre || user?.username}</h3>
                <p>{user?.email}</p>
                <span className="member-since">
                  Miembro desde {formatDate(user?.created_at)}
                </span>
              </div>
            </div>

            <nav className="profile-nav">
              <button 
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
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
                onClick={() => setActiveTab('orders')}
              >
                <span className="nav-icon">📦</span>
                Historial de Compras
              </button>

              <button 
                className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <span className="nav-icon">⚙️</span>
                Panel de Administración
              </button>

              <button 
                className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
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
                          <img src={user.foto_perfil} alt="Perfil" />
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
                  <div className="no-orders">
                    <div className="no-orders-icon">📦</div>
                    <h3>Aún no tienes pedidos</h3>
                    <p>Cuando realices tu primera compra, aparecerá aquí.</p>
                    <Link to="/products" className="btn-primary">
                      Comenzar a Comprar
                    </Link>
                  </div>
                  
                  {/* Ejemplo de pedido (comentado para cuando tengas datos reales) */}
                  {/*
                  <div className="order-card">
                    <div className="order-header">
                      <span className="order-id">#ORD-12345</span>
                      <span className="order-date">15 Ene 2024</span>
                      <span className="order-status delivered">Entregado</span>
                    </div>
                    <div className="order-items">
                      <div className="order-item">
                        <img src="/product-image.jpg" alt="Producto" />
                        <div className="item-details">
                          <h4>Nombre del Producto</h4>
                          <p>Cantidad: 1</p>
                          <p>$299.00</p>
                        </div>
                      </div>
                    </div>
                    <div className="order-total">
                      <strong>Total: $299.00</strong>
                    </div>
                  </div>
                  */}
                </div>
              </div>
            )}

            {/* Pestaña: Panel de Administración */}
            {activeTab === 'admin' && (
              <div className="tab-content">
                <h2>Panel de Administración</h2>
                <div className="admin-section">
                  {user?.role === 'admin' ? (
                    <div className="admin-dashboard">
                      <div className="admin-cards">
                        <div className="admin-card">
                          <div className="admin-card-icon">📊</div>
                          <h3>Estadísticas</h3>
                          <p>Ver reportes y métricas del sitio</p>
                          <button className="btn-primary">Ver Dashboard</button>
                        </div>
                        
                        <div className="admin-card">
                          <div className="admin-card-icon">🛍️</div>
                          <h3>Gestión de Productos</h3>
                          <p>Administrar inventario y productos</p>
                          <button className="btn-primary">Gestionar Productos</button>
                        </div>
                        
                        <div className="admin-card">
                          <div className="admin-card-icon">👥</div>
                          <h3>Usuarios</h3>
                          <p>Gestionar usuarios y permisos</p>
                          <button className="btn-primary">Ver Usuarios</button>
                        </div>
                        
                        <div className="admin-card">
                          <div className="admin-card-icon">📝</div>
                          <h3>Pedidos</h3>
                          <p>Administrar órdenes y envíos</p>
                          <button className="btn-primary">Ver Pedidos</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-admin-access">
                      <div className="no-access-icon">🔒</div>
                      <h3>Acceso Restringido</h3>
                      <p>No tienes permisos de administrador para acceder a esta sección.</p>
                      <p>Contacta al administrador del sistema si necesitas acceso.</p>
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
                      <button className="btn-danger">
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
    </main>
  );
};

export default UserProfile;