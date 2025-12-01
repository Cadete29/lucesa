// src/components/Admin/AdminFavorites.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './AdminFavorites.css';

const AdminFavorites = () => {
    const [stats, setStats] = useState(null);
    const [topProducts, setTopProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://testpaginaweb.shop/api'
        : 'http://localhost:4004/api';

    useEffect(() => {
        if (user?.rol === 'admin') {
            loadFavoritesStats();
        }
    }, [user]);

    const loadFavoritesStats = async () => {
        try {
            setLoading(true);
            setError('');
            
            const token = localStorage.getItem('lucesa-token');
            console.log('📊 Cargando estadísticas de favoritos...');
            
            const response = await fetch(`${API_BASE_URL}/favorites/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status} al cargar estadísticas`);
            }

            const result = await response.json();
            console.log('📈 Respuesta de estadísticas:', result);
            
            if (result.success) {
                setStats(result.data.stats);
                setTopProducts(result.data.top_products || []);
                console.log('✅ Estadísticas cargadas correctamente');
            } else {
                throw new Error(result.message || 'Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            setError(error.message);
            
            // Establecer estadísticas por defecto
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

    return (
        <div className="admin-favorites">
            <div className="admin-favorites-header">
                <h2>📊 Estadísticas de Favoritos</h2>
                <button onClick={loadFavoritesStats} className="btn-refresh">
                    🔄 Actualizar
                </button>
            </div>

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

            {stats && (
                <div className="favorites-stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">❤️</div>
                        <div className="stat-info">
                            <h3>Total de Favoritos</h3>
                            <span className="stat-number">{stats.total_favorites}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <h3>Usuarios con Favoritos</h3>
                            <span className="stat-number">{stats.total_users_with_favorites}</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon">📦</div>
                        <div className="stat-info">
                            <h3>Productos Únicos</h3>
                            <span className="stat-number">{stats.unique_products}</span>
                        </div>
                    </div>

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

            <div className="top-products-section">
                <h3>🔥 Productos Más Favoritos</h3>
                
                {topProducts.length > 0 ? (
                    <div className="top-products-list">
                        {topProducts.map((product, index) => (
                            <div key={product.product_id} className="top-product-item">
                                <div className="product-rank">
                                    #{index + 1}
                                </div>
                                <div className="product-info">
                                    <h4>{product.product_name || 'Producto sin nombre'}</h4>
                                    <p>Código: {product.product_id}</p>
                                    <p>Marca: {product.brand || 'No especificada'}</p>
                                </div>
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