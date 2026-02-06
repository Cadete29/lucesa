import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import ProductCard from '../components/Product Card/ProductCard';
import './Favorites.css';

/**
 * FAVORITES COMPONENT
 * 
 * Componente principal para mostrar y gestionar los productos favoritos del usuario.
 * Permite buscar, filtrar, ordenar y eliminar productos de la lista de favoritos.
 * 
 * Características principales:
 * - Vista completa de todos los productos favoritos del usuario
 * - Sistema de búsqueda y filtrado en tiempo real
 * - Múltiples criterios de ordenamiento
 * - Sincronización con el backend
 * - Diseño responsive con grid de 6 columnas
 * - Integración con ProductCard para consistencia visual
 * 
 * @component
 * @example
 * // Uso en rutas de navegación
 * <Route path="/favorites" element={<Favorites />} />
 */

/**
 * Componente Favorites - Gestión de productos favoritos
 * 
 * Este componente maneja:
 * 1. Visualización de todos los productos favoritos del usuario
 * 2. Búsqueda y filtrado por texto
 * 3. Ordenamiento por diferentes criterios
 * 4. Eliminación de favoritos individuales o masiva
 * 5. Estados de carga y sincronización
 * 
 * @returns {JSX.Element} Componente de favoritos
 */
const Favorites = () => {
  // ==========================================================================
  // CONTEXTO DE FAVORITOS
  // ==========================================================================
  
  /**
   * Contexto de favoritos para obtener datos y funciones
   * @const {Object} favoritesContext - Contexto de favoritos
   * @const {Array} favorites - Lista de productos favoritos
   * @const {function} clearFavorites - Elimina todos los favoritos
   * @const {function} searchFavorites - Busca favoritos por término
   * @const {number} favoritesCount - Número total de favoritos
   * @const {boolean} loading - Estado de carga inicial
   * @const {boolean} syncing - Estado de sincronización con backend
   */
  const { 
    favorites, 
    clearFavorites, 
    searchFavorites,
    favoritesCount,
    loading,
    syncing 
  } = useFavorites();
  
  // ==========================================================================
  // ESTADOS DEL COMPONENTE
  // ==========================================================================
  
  /**
   * @state {string} searchTerm - Término de búsqueda para filtrar favoritos
   */
  const [searchTerm, setSearchTerm] = useState('');
  
  /**
   * @state {string} sortBy - Criterio de ordenamiento actual
   * Valores: 'added', 'name', 'price', 'price-desc', 'brand'
   */
  const [sortBy, setSortBy] = useState('added');
  
  // ==========================================================================
  // FILTRADO Y ORDENAMIENTO (MEMOIZADO)
  // ==========================================================================
  
  /**
   * Filtra y ordena los favoritos basándose en el término de búsqueda y criterio de orden
   * 
   * @const {Array} filteredAndSortedFavorites - Favoritos procesados
   * @memoize Depende de favorites, searchTerm, sortBy, searchFavorites
   */
  const filteredAndSortedFavorites = useMemo(() => {
    // Aplicar búsqueda si hay término
    let result = searchTerm ? searchFavorites(searchTerm) : favorites;
    
    // Aplicar ordenamiento según criterio seleccionado
    switch (sortBy) {
      case 'name':
        // Orden alfabético por nombre
        result = [...result].sort((a, b) => 
          (a.nombre || '').localeCompare(b.nombre || '')
        );
        break;
      case 'price':
        // Precio ascendente
        result = [...result].sort((a, b) => 
          (a.precioFinal || a.precioMXN || 0) - (b.precioFinal || b.precioMXN || 0)
        );
        break;
      case 'price-desc':
        // Precio descendente
        result = [...result].sort((a, b) => 
          (b.precioFinal || b.precioMXN || 0) - (a.precioFinal || a.precioMXN || 0)
        );
        break;
      case 'brand':
        // Orden alfabético por marca
        result = [...result].sort((a, b) => 
          (a.marca || '').localeCompare(b.marca || '')
        );
        break;
      case 'added':
      default:
        // Más recientes primero (por fecha de agregado)
        result = [...result].sort((a, b) => 
          new Date(b.favorited_at || 0) - new Date(a.favorited_at || 0)
        );
        break;
    }
    
    return result;
  }, [favorites, searchTerm, sortBy, searchFavorites]);
  
  // ==========================================================================
  // MANEJO DE ACCIONES
  // ==========================================================================
  
  /**
   * Limpia el término de búsqueda
   * 
   * @function handleClearSearch
   */
  const handleClearSearch = () => {
    setSearchTerm('');
  };
  
  /**
   * Elimina todos los favoritos con confirmación
   * 
   * @async
   * @function handleClearAll
   * @throws {Error} Si falla la eliminación de favoritos
   */
  const handleClearAll = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todos tus favoritos? Esta acción no se puede deshacer.')) {
      try {
        await clearFavorites();
      } catch (error) {
        console.error('Error al limpiar favoritos:', error);
        alert('Error al limpiar favoritos. Por favor, intenta nuevamente.');
      }
    }
  };
  
  // ==========================================================================
  // ESTADOS ESPECIALES: CARGA
  // ==========================================================================
  
  /**
   * Estado de carga: muestra spinner y mensaje
   */
  if (loading) {
    return (
      <div className="favorites-page">
        <div className="favorites-container">
          <div className="favorites-loading">
            <div className="favorites-loading-spinner"></div>
            <p>Cargando tus favoritos...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // ==========================================================================
  // ESTADOS ESPECIALES: SIN FAVORITOS
  // ==========================================================================
  
  /**
   * Estado sin favoritos: mensaje invitando a explorar productos
   */
  if (favoritesCount === 0) {
    return (
      <div className="favorites-page">
        <div className="favorites-container">
          <div className="favorites-header">
            <div className="favorites-header-top">
              <Link to="/products" className="favorites-back-button">← Volver a Productos</Link>
              <div className="favorites-title-section">
                <h1>Mis Favoritos</h1>
                <div className="favorites-additional-info">
                  <span className="favorites-heart-badge">❤️</span>
                  <small>Aquí verás todos los productos que te gusten</small>
                </div>
              </div>
            </div>
          </div>
          
          <div className="favorites-no-products">
            <div className="favorites-no-products-icon">❤️</div>
            <h3>No tienes productos favoritos</h3>
            <p>Explora nuestros productos y añade tus favoritos para verlos aquí.</p>
            <Link to="/products" className="favorites-btn-primary">
              Explorar Productos
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // ==========================================================================
  // RENDERIZADO PRINCIPAL
  // ==========================================================================
  
  return (
    <div className="favorites-page">
      <div className="favorites-container">
        {/* HEADER PRINCIPAL */}
        <div className="favorites-header">
          <div className="favorites-header-top">
            {/* Botón para volver a productos */}
            <Link to="/products" className="favorites-back-button">← Volver a Productos</Link>
            
            {/* Título y contadores */}
            <div className="favorites-title-section">
              <h1>Mis Favoritos</h1>
              <div className="favorites-additional-info">
                <span className="favorites-count-badge">
                  {favoritesCount} {favoritesCount === 1 ? 'producto' : 'productos'}
                </span>
                {syncing && <span className="favorites-syncing-badge">Sincronizando...</span>}
              </div>
            </div>
          </div>
          
          {/* BÚSQUEDA Y ACCIONES RÁPIDAS */}
          <div className="favorites-search">
            {/* Campo de búsqueda */}
            <div className="favorites-search-box">
              <input
                type="text"
                placeholder="Buscar en favoritos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="favorites-search-input"
              />
              {/* Botón para limpiar búsqueda (solo visible cuando hay texto) */}
              {searchTerm && (
                <button onClick={handleClearSearch} className="favorites-search-clear">×</button>
              )}
            </div>
            
            {/* Botón para eliminar todos los favoritos */}
            <button 
              onClick={handleClearAll}
              className="favorites-btn-clear-all"
              disabled={syncing}
            >
              🗑️ Limpiar Todos
            </button>
          </div>
        </div>
        
        {/* CONTROLES DE ORDENAMIENTO Y FILTRO */}
        <div className="favorites-controls">
          <div className="favorites-sort-filter">
            <div className="favorites-sort-filter-container">
              {/* Selector de ordenamiento */}
              <label htmlFor="sort-favorites">Ordenar por:</label>
              <select 
                id="sort-favorites"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="favorites-sort-select"
              >
                <option value="added">Más recientes</option>
                <option value="name">Nombre A-Z</option>
                <option value="price">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="brand">Marca</option>
              </select>
            </div>
            
            {/* Información de resultados */}
            <div className="favorites-info">
              <span className="favorites-filtered-count">
                {filteredAndSortedFavorites.length} {searchTerm ? 'resultados' : 'productos'}
              </span>
              
              {/* Botón para limpiar búsqueda (si hay término activo) */}
              {searchTerm && (
                <button onClick={handleClearSearch} className="favorites-btn-clear-search">
                  Limpiar búsqueda
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* GRILLA DE PRODUCTOS (6 COLUMNAS COMO LA PÁGINA DE PRODUCTOS) */}
        <div className="favorites-grid">
          {filteredAndSortedFavorites.length > 0 ? (
            // Renderizar ProductCards para cada favorito
            filteredAndSortedFavorites.map(product => (
              <ProductCard 
                key={`${product.id}_favorite`} 
                product={product}
                variant="favorites" // Variante especial para favoritos
                showActions={true} // Mostrar botones de acción
              />
            ))
          ) : searchTerm ? (
            // Estado: búsqueda sin resultados
            <div className="favorites-no-search-results">
              <div className="favorites-no-products-icon">🔍</div>
              <h3>No se encontraron productos</h3>
              <p>No hay favoritos que coincidan con "{searchTerm}"</p>
              <button onClick={handleClearSearch} className="favorites-btn-primary">
                Ver todos los favoritos
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Favorites;