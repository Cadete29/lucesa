// src/components/Admin/AdminFavorites.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminFavorites.css';

/**
 * ADMIN FAVORITES COMPONENT
 * 
 * Panel de administración para visualizar estadísticas de productos favoritos.
 * Permite a administradores ver métricas sobre los productos más populares
 * entre los usuarios basados en su sistema de favoritos.
 * 
 * Características principales:
 * - Estadísticas generales de favoritos (totales, usuarios, productos únicos)
 * - Lista de productos más agregados a favoritos
 * - Actualización manual de datos
 * - Manejo de errores con estados por defecto
 * - Interfaz de administración exclusiva para rol 'admin'
 * 
 * @component
 * @example
 * // Uso en el panel de administración
 * {user?.rol === 'admin' && <AdminFavorites />}
 */

/**
 * Componente AdminFavorites - Panel de estadísticas de favoritos
 * 
 * Este componente proporciona a los administradores:
 * 1. Métricas generales sobre el uso de favoritos en la plataforma
 * 2. Ranking de productos más populares entre los usuarios
 * 3. Herramientas para monitorear tendencias de interés
 * 4. Interfaz para actualizar datos en tiempo real
 * 
 * @returns {JSX.Element} Componente de panel de administración de favoritos
 */
const AdminFavorites = () => {
    // ==========================================================================
    // ESTADOS DEL COMPONENTE
    // ==========================================================================
    
    /**
     * @state {Object|null} stats - Estadísticas generales de favoritos
     * @property {number} total_favorites - Total de favoritos registrados
     * @property {number} total_users_with_favorites - Usuarios con al menos un favorito
     * @property {number} unique_products - Productos únicos en favoritos
     * @property {number} avg_favorites_per_user - Promedio de favoritos por usuario
     */
    const [stats, setStats] = useState(null);
    
    /**
     * @state {Array} topProducts - Lista de productos más favoritos
     * @property {string} product_id - ID del producto
     * @property {string} product_name - Nombre del producto
     * @property {string} brand - Marca del producto
     * @property {number} favorite_count - Cantidad de veces agregado a favoritos
     */
    const [topProducts, setTopProducts] = useState([]);
    
    /**
     * @state {boolean} loading - Estado de carga de datos
     */
    const [loading, setLoading] = useState(true);
    
    /**
     * @state {string} error - Mensaje de error si falla la carga
     */
    const [error, setError] = useState('');
    
    // ==========================================================================
    // CONTEXTO Y CONFIGURACIÓN
    // ==========================================================================
    
    /**
     * Contexto de autenticación para verificar permisos de administrador
     * @const {Object} authContext - Contexto de autenticación
     * @const {Object} user - Datos del usuario actual
     * @const {string} user.rol - Rol del usuario ('admin' o 'user')
     */
    const { user } = useAuth();
    
    /**
     * URL base de la API según entorno (producción/desarrollo)
     * @constant {string} API_BASE_URL
     */
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://lucesademexico-shop.com.mx/api'
        : 'http://localhost:4004/api';
    
    // ==========================================================================
    // EFECTOS
    // ==========================================================================
    
    /**
     * Efecto que carga las estadísticas de favoritos al montar el componente
     * Solo se ejecuta si el usuario tiene rol 'admin'
     * 
     * @effect
     * @dependencies [user] - Se ejecuta cuando el usuario cambia
     */
    useEffect(() => {
        if (user?.rol === 'admin') {
            loadFavoritesStats();
        }
    }, [user]);
    
    // ==========================================================================
    // FUNCIONES PRINCIPALES
    // ==========================================================================
    
    /**
     * Carga las estadísticas de favoritos desde la API
     * Maneja estados de carga, éxito y error
     * Establece valores por defecto en caso de error
     * 
     * @async
     * @function loadFavoritesStats
     * @throws {Error} Si la API responde con error
     */
    const loadFavoritesStats = async () => {
        try {
            setLoading(true);
            setError('');
            
            const token = localStorage.getItem('lucesa-token');
            console.log('📊 Cargando estadísticas de favoritos...');
            
            // Realizar petición a la API de estadísticas
            const response = await fetch(`${API_BASE_URL}/favorites/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Verificar respuesta HTTP
            if (!response.ok) {
                throw new Error(`Error ${response.status} al cargar estadísticas`);
            }

            const result = await response.json();
            console.log('📈 Respuesta de estadísticas:', result);
            
            // Procesar respuesta exitosa
            if (result.success) {
                setStats(result.data.stats);
                setTopProducts(result.data.top_products || []);
                console.log('✅ Estadísticas cargadas correctamente');
            } else {
                throw new Error(result.message || 'Error en la respuesta del servidor');
            }
        } catch (error) {
            // Manejo de errores
            console.error('❌ Error cargando estadísticas:', error);
            setError(error.message);
            
            // Establecer estadísticas por defecto para mantener funcionalidad
            setStats({
                total_favorites: 0,
                total_users_with_favorites: 0,
                unique_products: 0,
                avg_favorites_per_user: 0
            });
            setTopProducts([]);
        } finally {
            setLoading(false);
        }
    };
    
    // ==========================================================================
    // RENDERIZADO CONDICIONAL - ESTADO DE CARGA
    // ==========================================================================
    
    /**
     * Renderiza el estado de carga del componente
     * Muestra un spinner y mensaje mientras se obtienen datos
     */
    if (loading) {
        return (
            <div className="admin-favorites">
                <div className="admin-favorites-loading">
                    <div className="loading-spinner"></div>
                    <p>Cargando estadísticas de favoritos...</p>
                </div>
            </div>
        );
    }
    
    // ==========================================================================
    // RENDERIZADO PRINCIPAL
    // ==========================================================================
    
    return (
        <div className="admin-favorites">
            {/* Encabezado del panel */}
            <div className="admin-favorites-header">
                <h2>📊 Estadísticas de Favoritos</h2>
                <button onClick={loadFavoritesStats} className="btn-refresh">
                    🔄 Actualizar
                </button>
            </div>

            {/* Sección de errores */}
            {error && (
                <div className="admin-favorites-error">
                    <div className="error-icon">⚠️</div>
                    <h3>Error</h3>
                    <p>{error}</p>
                    <p className="error-detail">
                        Se muestran estadísticas por defecto. 
                        Esto puede ocurrir si no hay datos de favoritos aún.
                    </p>
                    <button onClick={loadFavoritesStats} className="btn-retry">
                        Reintentar
                    </button>
                </div>
            )}

            {/* Grid de estadísticas generales */}
            {stats && (
                <div className="favorites-stats-grid">
                    {/* Tarjeta: Total de Favoritos */}
                    <div className="stat-card">
                        <div className="stat-icon">❤️</div>
                        <div className="stat-info">
                            <h3>Total de Favoritos</h3>
                            <span className="stat-number">{stats.total_favorites}</span>
                        </div>
                    </div>

                    {/* Tarjeta: Usuarios con Favoritos */}
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <h3>Usuarios con Favoritos</h3>
                            <span className="stat-number">{stats.total_users_with_favorites}</span>
                        </div>
                    </div>

                    {/* Tarjeta: Productos Únicos */}
                    <div className="stat-card">
                        <div className="stat-icon">📦</div>
                        <div className="stat-info">
                            <h3>Productos Únicos</h3>
                            <span className="stat-number">{stats.unique_products}</span>
                        </div>
                    </div>

                    {/* Tarjeta: Promedio por Usuario */}
                    <div className="stat-card">
                        <div className="stat-icon">📈</div>
                        <div className="stat-info">
                            <h3>Promedio por Usuario</h3>
                            <span className="stat-number">
                                {parseFloat(stats.avg_favorites_per_user).toFixed(1)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Sección de productos más favoritos */}
            <div className="top-products-section">
                <h3>🔥 Productos Más Favoritos</h3>
                
                {topProducts.length > 0 ? (
                    <div className="top-products-list">
                        {topProducts.map((product, index) => (
                            <div key={product.product_id} className="top-product-item">
                                {/* Ranking del producto */}
                                <div className="product-rank">
                                    #{index + 1}
                                </div>
                                
                                {/* Información del producto */}
                                <div className="product-info">
                                    <h4>{product.product_name || 'Producto sin nombre'}</h4>
                                    <p>Código: {product.product_id}</p>
                                    <p>Marca: {product.brand || 'No especificada'}</p>
                                </div>
                                
                                {/* Estadísticas del producto */}
                                <div className="product-stats">
                                    <span className="favorite-count">
                                        ❤️ {product.favorite_count} favoritos
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-top-products">
                        <p>No hay productos favoritos aún.</p>
                        <p className="no-data-info">
                            Los productos aparecerán aquí cuando los usuarios comiencen a agregar favoritos.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFavorites;