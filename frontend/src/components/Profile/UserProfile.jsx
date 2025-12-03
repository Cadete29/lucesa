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
  
  // Estados para órdenes
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Estado para los datos del perfil
  const [profileData, setProfileData] = useState({
    nombre: '',
    username: '',
    email: ''
  });

  // Estado para el formulario de edición
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  // Estado para forzar recarga de imagen
  const [imageReloadKey, setImageReloadKey] = useState(0);

  // Inicializar datos del perfil
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

  // Función para cargar historial de órdenes
  const loadOrderHistory = async () => {
    try {
      setOrdersLoading(true);
      console.log('🔄 Cargando historial de compras desde el servidor...');
      
      const orders = await getOrderHistory();
      
      console.log(`📊 Órdenes recibidas del servidor:`, {
        count: orders?.length || 0,
        orders: orders
      });
      
      // Formatear las órdenes para asegurar estructura correcta
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
        })),
        items_details: (order.items || order.items_details || []).map(item => ({
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
      
      console.log(`✅ Órdenes formateadas:`, {
        count: formattedOrders.length,
        primeraOrden: formattedOrders[0] ? {
          id: formattedOrders[0].id,
          order_number: formattedOrders[0].order_number,
          itemsCount: formattedOrders[0].items?.length || 0,
          items: formattedOrders[0].items
        } : 'No hay órdenes'
      });
      
      setUserOrders(formattedOrders);
      
    } catch (error) {
      console.error('❌ Error cargando historial de compras:', error);
      setError('Error al cargar el historial de compras');
      
      // Fallback a datos de ejemplo
      console.log('📋 Mostrando datos de ejemplo para desarrollo');
      setUserOrders(getSampleOrders());
    } finally {
      setOrdersLoading(false);
    }
  };

  // Función para obtener datos de ejemplo
  const getSampleOrders = () => {
    return [
      {
        id: 1,
        order_number: 'LUCESA-20240115-001',
        status: 'delivered',
        total_amount: 1299.99,
        total: 1299.99,
        created_at: '2024-01-15T10:30:00Z',
        order_date: '2024-01-15T10:30:00Z',
        items: [
          {
            id: 1,
            product_code: 'PROD001',
            product_name: 'Laptop Gaming Pro',
            nombre: 'Laptop Gaming Pro',
            codigo: 'PROD001',
            unit_price: 1200,
            precio: 1200,
            precioFinal: 1200,
            quantity: 1,
            total_price: 1200,
            product_brand: 'GamingBrand',
            marca: 'GamingBrand',
            product_image_url: '/api/images/code/PROD001?size=small'
          },
          {
            id: 2,
            product_code: 'PROD002',
            product_name: 'Mouse Gamer RGB',
            nombre: 'Mouse Gamer RGB',
            codigo: 'PROD002',
            unit_price: 99.99,
            precio: 99.99,
            precioFinal: 99.99,
            quantity: 1,
            total_price: 99.99,
            product_brand: 'GamingBrand',
            marca: 'GamingBrand',
            product_image_url: '/api/images/code/PROD002?size=small'
          }
        ]
      },
      {
        id: 2,
        order_number: 'LUCESA-20240220-002',
        status: 'processing',
        total_amount: 599.99,
        total: 599.99,
        created_at: '2024-02-20T14:20:00Z',
        order_date: '2024-02-20T14:20:00Z',
        items: [
          {
            id: 3,
            product_code: 'PROD003',
            product_name: 'Teclado Mecánico',
            nombre: 'Teclado Mecánico',
            codigo: 'PROD003',
            unit_price: 299.99,
            precio: 299.99,
            precioFinal: 299.99,
            quantity: 2,
            total_price: 599.98,
            product_brand: 'TechBrand',
            marca: 'TechBrand',
            product_image_url: '/api/images/code/PROD003?size=small'
          }
        ]
      }
    ];
  };

  // Función para ver detalles de orden
  const handleViewOrderDetails = async (orderId) => {
    try {
      console.log('🔍 Intentando ver detalles de orden:', orderId);
      setOrderDetailsLoading(true);
      
      // Buscar la orden en las órdenes cargadas primero
      const orderFromList = userOrders.find(order => order.id === orderId);
      
      if (orderFromList) {
        console.log('✅ Orden encontrada en la lista:', orderFromList.order_number);
        setSelectedOrder(orderFromList);
        setShowOrderModal(true);
        return;
      }
      
      // Si no está en la lista, intentar obtener del servidor
      console.log('🔄 Orden no encontrada en lista, consultando servidor...');
      const order = await getOrderDetails(orderId);
      
      if (order) {
        console.log('✅ Detalles obtenidos del servidor:', order.order_number);
        setSelectedOrder(order);
        setShowOrderModal(true);
      } else {
        console.error('❌ No se pudo obtener detalles de la orden');
        setError('No se pudieron cargar los detalles de la orden');
      }
    } catch (error) {
      console.error('❌ Error cargando detalles de orden:', error);
      setError('Error al cargar los detalles de la orden');
      
      // Mostrar datos de ejemplo como fallback
      const sampleOrder = getSampleOrders().find(o => o.id === orderId) || getSampleOrders()[0];
      setSelectedOrder(sampleOrder);
      setShowOrderModal(true);
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

  // Función para construir la URL de la imagen de perfil
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // Si ya es una URL completa
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://testpaginaweb.shop'
      : 'http://localhost:4004';
    
    // Normalizar la ruta
    let normalizedPath = imagePath;
    
    // Asegurar que empiece con /
    if (!normalizedPath.startsWith('/')) {
      normalizedPath = `/${normalizedPath}`;
    }
    
    // Agregar timestamp para evitar caché
    const timestamp = imageReloadKey || Date.now();
    const finalUrl = `${baseUrl}${normalizedPath}?t=${timestamp}`;
    
    return finalUrl;
  };

  // Función para subir foto de perfil (CON ELIMINACIÓN DE IMAGEN ANTERIOR)
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
      
      // PASO 1: Primero eliminar la imagen anterior si existe
      if (user?.images_profile) {
        console.log('🗑️ Eliminando imagen anterior...');
        try {
          const deleteResponse = await fetch(`${API_BASE_URL}/user/me/remove-photo`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const deleteData = await deleteResponse.json();
          
          if (deleteData.success) {
            console.log('✅ Imagen anterior eliminada exitosamente');
          } else {
            console.log('⚠️ No se pudo eliminar la imagen anterior, continuando...', deleteData.message);
          }
        } catch (deleteError) {
          console.error('⚠️ Error al eliminar imagen anterior:', deleteError);
          // Continuar con la subida aunque falle la eliminación
        }
      }

      // PASO 2: Subir la nueva imagen
      console.log('📤 Subiendo nueva imagen...', {
        filename: file.name,
        size: file.size,
        type: file.type
      });

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
      console.log('📥 Respuesta del servidor:', data);

      if (data.success) {
        setMessage('Foto de perfil actualizada correctamente');
        
        // Forzar recarga de imagen actualizando la key
        setImageReloadKey(Date.now());
        
        // Actualizar el usuario en localStorage
        if (data.data && data.data.user) {
          const updatedUser = {
            ...user,
            images_profile: data.data.user.images_profile
          };
          
          localStorage.setItem('lucesa-user', JSON.stringify(updatedUser));
          
          // Recargar la página después de un breve delay para mostrar el mensaje
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
          console.log('✅ Nueva foto subida exitosamente, página se recargará en 1.5 segundos');
        }
      } else {
        setError(data.message || 'Error al subir la imagen');
      }
    } catch (error) {
      console.error('❌ Error subiendo imagen:', error);
      setError('Error de conexión al subir la imagen');
    } finally {
      setUploadLoading(false);
      event.target.value = '';
    }
  };

  // Función para eliminar foto de perfil (CON RECARGA AUTOMÁTICA)
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
        
        // Actualizar localStorage
        if (data.data && data.data.user) {
          const updatedUser = {
            ...user,
            images_profile: null
          };
          
          localStorage.setItem('lucesa-user', JSON.stringify(updatedUser));
          
          // Recargar la página después de un breve delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          
          console.log('✅ Foto eliminada, página se recargará en 1.5 segundos');
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

  // Función para manejar errores en la carga de imágenes
  const handleImageError = (e, imagePath) => {
    console.error('❌ Error cargando imagen:', {
      rutaOriginal: imagePath,
      urlConstruida: getProfileImageUrl(imagePath),
      srcActual: e.target.src,
      timestamp: new Date().toISOString()
    });
    
    e.target.style.display = 'none';
    
    const fallback = e.target.nextSibling;
    if (fallback) {
      fallback.style.display = 'flex';
    }
  };

  // Función para formatear fecha
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

  // Función para formatear fecha y hora
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

  // Función para obtener texto del estado de la orden
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

  // Función para obtener clase CSS del estado de la orden
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

  // Función para alternar menú móvil
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Función para obtener URL de imagen de producto
  const getProductImageUrl = (productCode) => {
    if (!productCode) return null;
    
    const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
      ? 'https://testpaginaweb.shop/api/images/code'
      : 'http://localhost:4004/api/images/code';
    
    return `${IMAGE_BASE_URL}/${productCode}?size=small`;
  };

  // Renderizar la sección de historial de compras
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
              {userOrders.map((order, index) => {
                const items = order.items || order.items_details || [];
                
                return (
                  <div key={order.id || index} className="order-card">
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
                    
                    {/* ITEMS DE LA ORDEN */}
                    {items.length > 0 ? (
                      <div className="order-items">
                        {items.slice(0, 3).map((item, itemIndex) => {
                          const itemName = item.nombre || item.product_name || 'Producto';
                          const itemPrice = item.precio || item.unit_price || item.precioFinal || 0;
                          const itemQuantity = item.quantity || 1;
                          const itemTotal = item.total_price || (itemPrice * itemQuantity);
                          const itemImageUrl = item.product_image_url || getProductImageUrl(item.codigo || item.product_code);
                          
                          return (
                            <div key={itemIndex} className="order-item">
                              <div className="item-image">
                                {itemImageUrl ? (
                                  <img 
                                    src={itemImageUrl} 
                                    alt={itemName}
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
                                <h4>{itemName}</h4>
                                <p>Código: {item.codigo || item.product_code || 'N/A'}</p>
                                <p>Cantidad: {itemQuantity}</p>
                                <p>${itemPrice.toFixed(2)} c/u</p>
                                <p className="item-total">
                                  Total: ${itemTotal.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        
                        {items.length > 3 && (
                          <div className="more-items">
                            +{items.length - 3} más productos
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="no-items">
                        <p>No se encontraron productos en esta orden</p>
                      </div>
                    )}
                    
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

        {/* Modal de Detalles de Orden */}
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
                <button className="modal-close" onClick={handleCloseOrderDetails} aria-label="Cerrar">
                  <span>✕</span>
                </button>
              </div>
              
              <div className="modal-body">
                {/* Información general de la orden */}
                <div className="order-summary-section">
                  <div className="order-summary-grid">
                    <div className="summary-item">
                      <div className="summary-label">Fecha de la orden</div>
                      <div className="summary-value">{formatDateTime(selectedOrder.order_date || selectedOrder.created_at)}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Número de orden</div>
                      <div className="summary-value order-number">#{selectedOrder.order_number || selectedOrder.id}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Estado</div>
                      <div className="summary-value">
                        <span className={`order-status-badge ${getOrderStatusClass(selectedOrder.status)}`}>
                          {getOrderStatusText(selectedOrder.status)}
                        </span>
                      </div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Total de productos</div>
                      <div className="summary-value">
                        {selectedOrder.items?.length || selectedOrder.items_details?.length || 0} items
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección de productos */}
                <div className="order-products-section">
                  <div className="section-header">
                    <h4>📋 Productos de la Orden</h4>
                    <div className="items-count">
                      ({selectedOrder.items?.length || selectedOrder.items_details?.length || 0} productos)
                    </div>
                  </div>
                  
                  <div className="products-list-container">
                    {(selectedOrder.items || selectedOrder.items_details || []).length > 0 ? (
                      <div className="products-grid">
                        {(selectedOrder.items || selectedOrder.items_details || []).map((item, index) => {
                          const itemName = item.nombre || item.product_name || 'Producto sin nombre';
                          const itemCode = item.codigo || item.product_code || 'N/A';
                          const itemBrand = item.marca || item.product_brand || 'Sin marca';
                          const itemPrice = item.precio || item.unit_price || item.precioFinal || 0;
                          const itemQuantity = item.quantity || 1;
                          const itemTotal = item.total_price || (itemPrice * itemQuantity);
                          const itemImageUrl = item.product_image_url || getProductImageUrl(item.codigo || item.product_code);
                          
                          return (
                            <div key={index} className="product-card">
                              <div className="product-card-header">
                                <div className="product-number">#{index + 1}</div>
                                <div className="product-codigo">Código: {itemCode}</div>
                              </div>
                              
                              <div className="product-card-body">
                                {/* Imagen del producto */}
                                <div className="product-image-wrapper">
                                  {itemImageUrl ? (
                                    <img 
                                      src={itemImageUrl} 
                                      alt={itemName}
                                      className="product-image-detail"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextElementSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className="product-image-fallback">
                                    <span>📦</span>
                                  </div>
                                </div>
                                
                                {/* Información del producto */}
                                <div className="product-info-wrapper">
                                  <div className="product-name">{itemName}</div>
                                  <div className="product-brand">Marca: {itemBrand}</div>
                                  
                                  <div className="product-specs-grid">
                                    <div className="spec-item">
                                      <span className="spec-label">Precio unitario:</span>
                                      <span className="spec-value">${itemPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="spec-item">
                                      <span className="spec-label">Cantidad:</span>
                                      <span className="spec-value">{itemQuantity}</span>
                                    </div>
                                    <div className="spec-item">
                                      <span className="spec-label">Subtotal:</span>
                                      <span className="spec-value">${(itemPrice * itemQuantity).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Total del producto */}
                                <div className="product-total-wrapper">
                                  <div className="product-total-label">Total del producto</div>
                                  <div className="product-total-amount">${itemTotal.toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="no-products-message">
                        <div className="no-products-icon">📦</div>
                        <div className="no-products-text">
                          <p>No se encontraron productos en esta orden</p>
                          <small>Es posible que la información de productos no esté disponible</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumen de precios */}
                <div className="order-totals-section">
                  <div className="section-header">
                    <h4>💰 Resumen de Pagos</h4>
                  </div>
                  
                  <div className="totals-grid">
                    <div className="total-row">
                      <div className="total-label">Subtotal de productos:</div>
                      <div className="total-value">
                        ${(selectedOrder.subtotal || selectedOrder.subtotal_amount || 
                          (selectedOrder.total_amount || selectedOrder.total || 0) - 
                          (selectedOrder.tax_amount || selectedOrder.tax || 0) - 
                          (selectedOrder.shipping_amount || selectedOrder.shipping || 0)).toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="total-row">
                      <div className="total-label">Envío:</div>
                      <div className="total-value">${(selectedOrder.shipping_amount || selectedOrder.shipping || 0).toFixed(2)}</div>
                    </div>
                    
                    <div className="total-row">
                      <div className="total-label">Impuestos (IVA):</div>
                      <div className="total-value">${(selectedOrder.tax_amount || selectedOrder.tax || 0).toFixed(2)}</div>
                    </div>
                    
                    <div className="total-row grand-total">
                      <div className="total-label">Total de la orden:</div>
                      <div className="total-value">${(selectedOrder.total_amount || selectedOrder.total || 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="btn-close-modal" onClick={handleCloseOrderDetails}>
                  Cerrar Detalles
                </button>
                {/* <div className="order-actions">
                  <button className="btn-secondary">
                    📄 Descargar Factura
                  </button>
                  <button className="btn-primary">
                    📞 Contactar Soporte
                  </button>
                </div> */}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar la sección de perfil
  const renderProfileSection = () => (
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
                    key={`profile-img-${imageReloadKey}`}
                    src={getProfileImageUrl(user.images_profile)} 
                    alt="Foto de perfil" 
                    className="profile-photo" 
                    onError={(e) => handleImageError(e, user.images_profile)}
                    onLoad={() => console.log('✅ Imagen de perfil cargada exitosamente')}
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
              <p><strong>Nota:</strong> Al cambiar la foto, la anterior será eliminada automáticamente</p>
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
              {/* <div className="info-item">
                <label>Rol:</label>
                <span className={`role-badge ${user?.rol}`}>
                  {user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
              </div> */}
              <div className="info-item">
                <label>Miembro desde:</label>
                <span>{formatDate(user?.created_at)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Renderizar la sección de administración
  const renderAdminSection = () => (
    <div className="tab-content">
      <div className="admin-section">
        {user?.rol === 'admin' ? (
          <div className="admin-dashboard">
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
  );

  // Renderizar la sección de configuración
  const renderSettingsSection = () => (
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
  );

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
                      key={`avatar-${imageReloadKey}`}
                      src={getProfileImageUrl(user.images_profile)} 
                      alt="Avatar del usuario" 
                      className="avatar-image" 
                      onError={(e) => handleImageError(e, user.images_profile)}
                      onLoad={() => console.log('✅ Avatar cargado')}
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

                {/* <button 
                  className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => handleTabChange('settings')}
                >
                  <span className="nav-icon">🔧</span>
                  Configuración
                </button> */}

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
                      key={`mobile-avatar-${imageReloadKey}`}
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

                {/* <button 
                  className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => handleTabChange('settings')}
                >
                  <span className="nav-icon">🔧</span>
                  Configuración
                </button> */}

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
              {activeTab === 'profile' && renderProfileSection()}

              {/* Pestaña: Historial de Compras */}
              {activeTab === 'orders' && renderOrdersSection()}

              {/* Pestaña: Panel de Administración */}
              {activeTab === 'admin' && renderAdminSection()}

              {/* Pestaña: Configuración */}
              {activeTab === 'settings' && renderSettingsSection()}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UserProfile;