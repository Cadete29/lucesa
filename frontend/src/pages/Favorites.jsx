import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import './Favorites.css';

const Favorites = () => {
  const { favorites, removeFromFavorites, clearFavorites } = useFavorites();

  if (favorites.length === 0) {
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
          <h1>Mis Favoritos ({favorites.length})</h1>
          <button 
            onClick={clearFavorites}
            className="btn-clear"
          >
            Limpiar Todos
          </button>
        </div>

        <div className="favorites-grid">
          {favorites.map(product => (
            <div key={product.id} className="favorite-card">
              <Link to={`/product/${product.id}`} className="favorite-image">
                <img 
                  src={product.image || '/placeholder-product.jpg'} 
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = '/placeholder-product.jpg';
                  }}
                />
              </Link>
              
              <div className="favorite-info">
                <h3 className="favorite-title">
                  <Link to={`/product/${product.id}`}>
                    {product.name}
                  </Link>
                </h3>
                <p className="favorite-price">${product.price}</p>
                {product.description && (
                  <p className="favorite-description">
                    {product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description
                    }
                  </p>
                )}
              </div>

              <div className="favorite-actions">
                <button 
                  onClick={() => removeFromFavorites(product.id)}
                  className="btn-remove"
                  aria-label="Eliminar de favoritos"
                >
                  ❌ Eliminar
                </button>
                <button className="btn-add-cart">
                  🛒 Añadir al Carrito
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Favorites;