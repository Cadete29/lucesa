import React from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import ProductCard from '../components/Product Card/ProductCard'; // Ajusta la ruta según tu estructura
import './Favorites.css';

const Favorites = () => {
  const { favorites, clearFavorites } = useFavorites();

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
            <ProductCard 
              key={product.id} 
              product={product}
              variant="favorites"
              showActions={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Favorites;