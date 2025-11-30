// src/pages/Favorites.jsx
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import ProductCard from '../components/Product Card/ProductCard';
import './Favorites.css';

const Favorites = () => {
  const { 
    favorites, 
    clearFavorites, 
    searchFavorites,
    favoritesCount,
    loading,
    syncing 
  } = useFavorites();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('added');

  // Filtrar y ordenar favoritos
  const filteredAndSortedFavorites = useMemo(() => {
    let result = searchTerm ? searchFavorites(searchTerm) : favorites;

    // Ordenar
    switch (sortBy) {
      case 'name':
        result = [...result].sort((a, b) => 
          (a.nombre || '').localeCompare(b.nombre || '')
        );
        break;
      case 'price':
        result = [...result].sort((a, b) => 
          (a.precio || 0) - (b.precio || 0)
        );
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => 
          (b.precio || 0) - (a.precio || 0)
        );
        break;
      case 'brand':
        result = [...result].sort((a, b) => 
          (a.marca || '').localeCompare(b.marca || '')
        );
        break;
      case 'added':
      default:
        // Ordenar por fecha de agregado (más reciente primero)
        result = [...result].sort((a, b) => 
          new Date(b.favorited_at || 0) - new Date(a.favorited_at || 0)
        );
        break;
    }

    return result;
  }, [favorites, searchTerm, sortBy, searchFavorites]);

  const handleClearSearch = () => {
    setSearchTerm('');
  };

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

  if (loading) {
    return (
      <div className="favorites-page">
        <div className="container-lucesa">
          <div className="favorites-loading">
            <div className="loading-spinner"></div>
            <p>Cargando tus favoritos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (favoritesCount === 0) {
    return (
      <div className="favorites-page">
        <div className="container-lucesa">
          <div className="favorites-header">
            <h1>Mis Favoritos</h1>
          </div>
          <div className="empty-favorites">
            <div className="empty-icon">❤️</div>
            <h2>No tienes productos favoritos</h2>
            <p>Explora nuestros productos y añade tus favoritos para verlos aquí.</p>
            <Link to="/products" className="btn-primary">
              Explorar Productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="container-lucesa">
        <div className="favorites-header">
          <div className="favorites-title-section">
            <h1>Mis Favoritos</h1>
            <div className="favorites-count">
              {favoritesCount} {favoritesCount === 1 ? 'producto' : 'productos'}
              {syncing && <span className="syncing-badge">Sincronizando...</span>}
            </div>
          </div>
          
          <div className="favorites-actions">
            <button 
              onClick={handleClearAll}
              className="btn-clear-all"
              disabled={syncing}
            >
              🗑️ Limpiar Todos
            </button>
          </div>
        </div>

        {/* Controles de búsqueda y ordenamiento */}
        <div className="favorites-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar en favoritos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button onClick={handleClearSearch} className="search-clear">
                ×
              </button>
            )}
          </div>

          <div className="sort-controls">
            <label htmlFor="sort-favorites">Ordenar por:</label>
            <select 
              id="sort-favorites"
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="added">Más recientes</option>
              <option value="name">Nombre A-Z</option>
              <option value="price">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="brand">Marca</option>
            </select>
          </div>
        </div>

        {/* Resultados de búsqueda */}
        {searchTerm && (
          <div className="search-results-info">
            <p>
              {filteredAndSortedFavorites.length} de {favoritesCount} productos coinciden con "{searchTerm}"
            </p>
            <button onClick={handleClearSearch} className="btn-clear-search">
              Limpiar búsqueda
            </button>
          </div>
        )}

        {/* Grid de productos */}
        <div className="favorites-grid">
          {filteredAndSortedFavorites.map(product => (
            <ProductCard 
              key={product.id} 
              product={product}
              variant="favorites"
              showActions={true}
            />
          ))}
        </div>

        {/* Mensaje si no hay resultados de búsqueda */}
        {searchTerm && filteredAndSortedFavorites.length === 0 && (
          <div className="no-search-results">
            <div className="no-results-icon">🔍</div>
            <h3>No se encontraron productos</h3>
            <p>No hay favoritos que coincidan con "{searchTerm}"</p>
            <button onClick={handleClearSearch} className="btn-primary">
              Ver todos los favoritos
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;