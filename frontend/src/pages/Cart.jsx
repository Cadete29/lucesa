import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

// ✅ Configuración de URLs por entorno
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

const Cart = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal,
    getCartItemsCount 
  } = useCart();
  
  const navigate = useNavigate();

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // ✅ Función para obtener URL de imagen usando la configuración por entorno
  const getImageUrl = (codigo) => {
    return `${IMAGE_BASE_URL}/${codigo}?size=medium`;
  };

  const subtotal = getCartTotal();
  const shipping = subtotal > 500 ? 0 : 99;
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-header">
            <h1>Carrito de Compras</h1>
          </div>
          <div className="empty-cart">
            <div className="empty-icon">🛒</div>
            <h2>Tu carrito está vacío</h2>
            <p>Agrega algunos productos increíbles a tu carrito</p>
            <Link to="/products" className="btn-primary">
              Explorar Productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>Carrito de Compras ({getCartItemsCount()})</h1>
          <button onClick={clearCart} className="clear-cart-btn">
            Limpiar Carrito
          </button>
        </div>

        <div className="cart-content">
          <div className="cart-items-section">
            {cartItems.map(item => (
              <div key={item.id || item.idProducto} className="cart-item-large">
                <div className="item-image">
                  <img 
                    src={getImageUrl(item.codigo)} 
                    alt={item.nombre}
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNiAzNkg1NFY1NEgzNlYzNlpNNjYgMzZIODRWNTZINjZWMzZaTTM2IDY2SDU0VDg0SDM2VjY2WiIgZmlsbD0iI0RFRUVGMCIvPgo8L3N2Zz4=';
                    }}
                  />
                </div>

                <div className="item-details">
                  <h3 className="item-name">
                    <Link to={`/product/${item.idProducto || item.id}`}>
                      {item.nombre}
                    </Link>
                  </h3>
                  <p className="item-brand">{item.marca}</p>
                  <p className="item-code">Código: {item.codigo}</p>
                  
                  {item.promociones && item.promociones.length > 0 && (
                    <div className="item-promo">
                      <span className="promo-badge">🔥 Oferta especial</span>
                    </div>
                  )}
                </div>

                <div className="item-price-section">
                  <div className="price">${item.precioFinal || item.precio} MXN</div>
                </div>

                <div className="item-quantity">
                  <div className="quantity-controls-large">
                    <button 
                      onClick={() => handleQuantityChange(item.id || item.idProducto, item.quantity - 1)}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={item.quantity}
                      min="1"
                      onChange={(e) => handleQuantityChange(
                        item.id || item.idProducto, 
                        parseInt(e.target.value) || 1
                      )}
                      className="quantity-input"
                    />
                    <button 
                      onClick={() => handleQuantityChange(item.id || item.idProducto, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="item-total">
                  <div className="total-price">
                    ${((item.precioFinal || item.precio) * item.quantity).toFixed(2)} MXN
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.id || item.idProducto)}
                    className="remove-item-btn"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h3>Resumen del Pedido</h3>
              
              <div className="summary-row">
                <span>Subtotal ({getCartItemsCount()} productos):</span>
                <span>${subtotal.toFixed(2)} MXN</span>
              </div>
              
              <div className="summary-row">
                <span>Envío:</span>
                <span>
                  {shipping === 0 ? (
                    <span className="free-shipping">¡GRATIS! 🎉</span>
                  ) : (
                    `$${shipping} MXN`
                  )}
                </span>
              </div>

              {subtotal < 500 && (
                <div className="shipping-notice">
                  <span>¡Faltan ${(500 - subtotal).toFixed(2)} para envío gratis!</span>
                </div>
              )}

              <div className="summary-divider"></div>

              <div className="summary-row total">
                <span>Total:</span>
                <span className="total-amount">${total.toFixed(2)} MXN</span>
              </div>

              <button onClick={handleCheckout} className="btn-checkout">
                Proceder al Checkout
              </button>

              <Link to="/products" className="continue-shopping">
                ← Continuar Comprando
              </Link>
            </div>

            <div className="cart-benefits">
              <h4>Beneficios de tu compra</h4>
              <div className="benefit-item">
                <span className="benefit-icon">🚚</span>
                <div>
                  <strong>Envío gratis</strong> en compras mayores a $500 MXN
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">↩️</span>
                <div>
                  <strong>30 días</strong> para devoluciones
                </div>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">🛡️</span>
                <div>
                  <strong>Garantía</strong> incluida en todos los productos
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;