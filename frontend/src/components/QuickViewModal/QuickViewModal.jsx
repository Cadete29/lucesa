import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './QuickViewModal.css';

const QuickViewModal = ({ product, isOpen, onClose, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    if (!isOpen || !product) return null;

    // Cálculos de precios
    const hasActivePromotion = product.promociones && product.promociones.length > 0;
    const currentPromotion = hasActivePromotion ? product.promociones[0] : null;
    
    const precioMXN = product.moneda === 'USD' ? 
        (product.precio * product.tipoCambio).toFixed(2) : 
        product.precio;

    const precioPromoMXN = currentPromotion && product.moneda === 'USD' ?
        (currentPromotion.promocion * product.tipoCambio).toFixed(2) :
        currentPromotion?.promocion;

    const discountPercentage = currentPromotion ? 
        Math.round(((product.precio - currentPromotion.promocion) / product.precio) * 100) : 
        0;

    // Stock total
    const getTotalStock = () => {
        if (!product.existencia) return 0;
        return Object.values(product.existencia).reduce((total, stock) => total + stock, 0);
    };

    const totalStock = getTotalStock();

    const handleQuantityChange = (value) => {
        if (value < 1) return;
        if (value > totalStock) return;
        setQuantity(value);
    };

    const handleAddToCart = () => {
        onAddToCart(product, quantity);
        onClose();
    };

    const handleQuickBuy = () => {
        onAddToCart(product, quantity);
        // Aquí podrías redirigir al carrito o mostrar un mensaje
        onClose();
    };

    const images = product.imagenes_adicionales ? 
        [product.imagen, ...product.imagenes_adicionales] : 
        [product.imagen];

    return (
        <div className="quickview-modal">
            <div className="modal-overlay" onClick={onClose}></div>
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>
                    ×
                </button>

                <div className="quickview-content">
                    {/* Galería de imágenes */}
                    <div className="quickview-gallery">
                        <div className="main-image">
                            <img 
                                src={images[selectedImage]} 
                                alt={product.nombre}
                            />
                            {hasActivePromotion && (
                                <div className="promotion-badge">
                                    -{discountPercentage}% OFF
                                </div>
                            )}
                        </div>
                        
                        {images.length > 1 && (
                            <div className="image-thumbnails">
                                {images.map((img, index) => (
                                    <button
                                        key={index}
                                        className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(index)}
                                    >
                                        <img src={img} alt={`${product.nombre} ${index + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Información del producto */}
                    <div className="quickview-info">
                        <div className="product-header">
                            <span className="product-brand">{product.marca}</span>
                            <h2 className="product-title">{product.nombre}</h2>
                            <div className="product-codes">
                                <span><strong>Clave:</strong> {product.clave}</span>
                                {product.numParte && <span><strong>Número de parte:</strong> {product.numParte}</span>}
                            </div>
                        </div>

                        <div className="product-pricing">
                            {hasActivePromotion ? (
                                <div className="pricing-with-promo">
                                    <div className="current-price">
                                        <span className="currency">MXN </span>
                                        <span className="price">${precioPromoMXN}</span>
                                    </div>
                                    <div className="original-price">
                                        <span className="price">${precioMXN}</span>
                                        <span className="discount">-{discountPercentage}%</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="pricing-normal">
                                    <span className="currency">{product.moneda === 'USD' ? 'MXN ' : ''}</span>
                                    <span className="price">${product.moneda === 'USD' ? precioMXN : product.precio}</span>
                                </div>
                            )}
                        </div>

                        <div className="product-description">
                            <p>{product.descripcion_corta}</p>
                        </div>

                        {/* Stock */}
                        <div className="product-stock-info">
                            {totalStock > 0 ? (
                                <span className="in-stock">✓ En stock ({totalStock} disponibles)</span>
                            ) : (
                                <span className="out-of-stock">✗ Agotado</span>
                            )}
                        </div>

                        {/* Cantidad y acciones */}
                        <div className="product-actions">
                            <div className="quantity-selector">
                                <label>Cantidad:</label>
                                <div className="quantity-controls">
                                    <button 
                                        onClick={() => handleQuantityChange(quantity - 1)}
                                        disabled={quantity <= 1 || totalStock === 0}
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number" 
                                        value={quantity}
                                        min="1"
                                        max={totalStock}
                                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                        disabled={totalStock === 0}
                                    />
                                    <button 
                                        onClick={() => handleQuantityChange(quantity + 1)}
                                        disabled={quantity >= totalStock || totalStock === 0}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="action-buttons">
                                <button 
                                    className="btn-add-cart"
                                    onClick={handleAddToCart}
                                    disabled={totalStock === 0}
                                >
                                    🛒 Agregar al Carrito
                                </button>
                                <button 
                                    className="btn-buy-now"
                                    onClick={handleQuickBuy}
                                    disabled={totalStock === 0}
                                >
                                    ⚡ Comprar Ahora
                                </button>
                            </div>
                        </div>

                        {/* Enlace a detalles completos */}
                        <div className="view-details-link">
                            <Link to={`/product/${product.idProducto}`} onClick={onClose}>
                                Ver detalles completos del producto →
                            </Link>
                        </div>

                        {/* Especificaciones rápidas */}
                        {product.especificaciones && (
                            <div className="quick-specs">
                                <h4>Especificaciones principales:</h4>
                                <div className="specs-grid">
                                    {Object.entries(product.especificaciones).slice(0, 4).map(([key, value]) => (
                                        <div key={key} className="spec-item">
                                            <span className="spec-label">{key}:</span>
                                            <span className="spec-value">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickViewModal;