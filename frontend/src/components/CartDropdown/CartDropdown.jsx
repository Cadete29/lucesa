import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './CartDropdown.css';

// ✅ Configuración de URLs por entorno
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

const CartDropdown = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal, 
    getCartItemsCount,
    closeCart 
  } = useCart();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  // ✅ Función para obtener URL de imagen usando la configuración por entorno
  const getImageUrl = (codigo) => {
    return `${IMAGE_BASE_URL}/${codigo}?size=small`;
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-dropdown">
        <div className="cart-header">
          <h3>Carrito de Compras</h3>
          <button onClick={closeCart} className="close-cart">×</button>
        </div>
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <p>Tu carrito está vacío</p>
          <Link to="/products" className="btn-primary" onClick={closeCart}>
            Explorar Productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-dropdown">
      <div className="cart-header">
        <h3>Carrito ({getCartItemsCount()})</h3>
        <button onClick={closeCart} className="close-cart">×</button>
      </div>

      <div className="cart-items">
        {cartItems.map(item => (
          <div key={item.id || item.idProducto} className="cart-item">
            <div className="item-image">
              <img 
                src={getImageUrl(item.codigo)} 
                alt={item.nombre}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEgzNlYzNkgyNFYyNFpNNDQgMjRINTZWMzZINDRWMjRaTTI0IDQ0SDM2VjU2SDI0VjQ0Wk00NCA0NEg1NlY1Nkg0NFY0NFoiIGZpbGw9IiNERURFRjAiLz4KPC9zdmc+';
                }}
              />
            </div>
            
            <div className="item-details">
              <h4 className="item-name">{item.nombre}</h4>
              <p className="item-brand">{item.marca}</p>
              <div className="item-price">${item.precioFinal || item.precio} MXN</div>
            </div>

            <div className="item-controls">
              <div className="quantity-controls">
                <button 
                  onClick={() => handleQuantityChange(item.id || item.idProducto, item.quantity - 1)}
                  className="quantity-btn"
                >
                  -
                </button>
                <span className="quantity">{item.quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(item.id || item.idProducto, item.quantity + 1)}
                  className="quantity-btn"
                >
                  +
                </button>
              </div>
              <button 
                onClick={() => removeFromCart(item.id || item.idProducto)}
                className="remove-btn"
                title="Eliminar"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <div className="cart-total">
          <span>Total:</span>
          <span className="total-amount">${getCartTotal().toFixed(2)} MXN</span>
        </div>
        <div className="cart-actions">
          <Link to="/cart" className="btn-secondary" onClick={closeCart}>
            Ver Carrito
          </Link>
          <Link to="/checkout" className="btn-primary" onClick={closeCart}>
            Finalizar Compra
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartDropdown;