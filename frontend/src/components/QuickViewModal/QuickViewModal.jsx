import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './QuickViewModal.css';

const QuickViewModal = ({ product, isOpen, onClose, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    if (!isOpen || !product) return null;

    // ✅ USAR LA MISMA LÓGICA QUE PRODUCTCARD PARA PRECIOS
    const convertirAMXN = (precio) => {
        if (!precio) return 0;
        return precio * (product.tipoCambio || 20);
    };

    // Precio base en MXN (SIEMPRE convertir)
    const precioBaseMXN = convertirAMXN(product.precio);

    // Precio promocional en MXN (si existe promoción o precioPromocion)
    const precioPromoMXN = product.promociones && product.promociones.length > 0 ? 
        convertirAMXN(product.promociones[0].promocion) : 
        (product.precioPromocion ? convertirAMXN(product.precioPromocion) : null);

    // Determinar si tiene promoción activa
    const tienePromocionActiva = precioPromoMXN !== null && precioPromoMXN < precioBaseMXN;

    // Formatear a 2 decimales
    const formatearPrecio = (precio) => {
        if (typeof precio !== 'number') return '0.00';
        return precio.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const discountPercentage = tienePromocionActiva ? 
        Math.round(((precioBaseMXN - precioPromoMXN) / precioBaseMXN) * 100) : 
        0;

    // Variables formateadas
    const precioBaseFormateado = formatearPrecio(precioBaseMXN);
    const precioPromoFormateado = tienePromocionActiva ? formatearPrecio(precioPromoMXN) : null;
    const precioFinalFormateado = tienePromocionActiva ? precioPromoFormateado : precioBaseFormateado;

    // ✅ CORRECCIÓN: Usar la misma lógica de stock que ProductDetail
    const getTotalStock = () => {
        if (!product.existencia) return 0;
        
        if (typeof product.existencia === 'object' && product.existencia !== null) {
            return Object.values(product.existencia).reduce((total, stock) => {
                const stockNum = Number(stock);
                return total + (isNaN(stockNum) ? 0 : stockNum);
            }, 0);
        } else if (typeof product.existencia === 'number') {
            return product.existencia;
        } else if (typeof product.existencia === 'string') {
            return Number(product.existencia) || 0;
        }
        
        return 0;
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
        onClose();
    };

    // ✅ CORRECCIÓN: Usar el mismo sistema de imágenes que ProductDetail
    const getImageUrl = (codigo, size = 'full') => {
        return `http://localhost:4004/api/images/code/${codigo}?size=${size}`;
    };

    const images = product.imagenes_adicionales && product.imagenes_adicionales.length > 0
        ? [getImageUrl(product.codigo), ...product.imagenes_adicionales]
        : [getImageUrl(product.codigo)];

    // ✅ CORRECCIÓN: Obtener el ID correcto para el enlace
    const getProductDetailUrl = () => {
        const productId = product.idProducto || product.id || product.codigo;
        return `/product/${productId}`;
    };

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
                                onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjAgMTIwSDE0MFYxNDBIMTIwVjEyMFpNMTYwIDEyMEgxODBWMTQwSDE2MFYxMjBaTTIwMCAxMjBIMjIwVjE0MEgyMDBWMTIwWk0xMjAgMTYwSDE0MFYxODBIMTIwVjE2MFpNMTYwIDE2MEgxODBWMTgwSDE2MFYxNjBaTTIwMCAxNjBIMjIwVjE4MEgyMDBWMTYwWk0xMjAgMjAwSDE0MFYyMjBIMTIwVjIwMFpNMTYwIDIwMEgxODBWMjIwSDE2MFYyMDBaTTIwMCAyMDBIMjIwVjIyMEgyMDBWMjAwWiIgZmlsbD0iI0RERURGMCIvPgo8dGV4dCB4PSIyMDAiIHk9IjI0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTY5Njk2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZW4gTm8gRGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+';
                                }}
                            />
                            {tienePromocionActiva && (
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

                    {/* Información del producto - Misma estructura que ProductDetail */}
                    <div className="quickview-info">
                        <div className="product-header">
                            <span className="product-brand">{product.marca}</span>
                            <h2 className="product-title">{product.nombre}</h2>
                            <div className="product-codes">
                                <span><strong>Clave:</strong> {product.codigo}</span>
                                {product.numParte && <span><strong>Número de parte:</strong> {product.numParte}</span>}
                            </div>
                        </div>

                        <div className="product-pricing">
                            {tienePromocionActiva ? (
                                <div className="pricing-with-promo">
                                    <div className="current-price">
                                        <span className="currency">MXN </span>
                                        <span className="price">${precioPromoFormateado}</span>
                                    </div>
                                    <div className="original-price">
                                        <span className="price">${precioBaseFormateado}</span>
                                        <span className="discount">-{discountPercentage}%</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="pricing-normal">
                                    <span className="currency">MXN </span>
                                    <span className="price">${precioFinalFormateado}</span>
                                </div>
                            )}
                            
                            {product.moneda === 'USD' && (
                                <div className="exchange-info">
                                    <span>Tipo de cambio: ${product.tipoCambio || 20} MXN/USD</span>
                                </div>
                            )}
                        </div>

                        <div className="product-description">
                            <p>{product.descripcion}</p>
                        </div>

                        {/* Stock - Misma lógica que ProductDetail */}
                        <div className="product-stock-info">
                            {totalStock > 0 ? (
                                <span className="in-stock">✓ En stock ({totalStock} disponibles)</span>
                            ) : (
                                <span className="out-of-stock">✗ Agotado</span>
                            )}
                            
                            {totalStock > 0 && product.existencia && typeof product.existencia === 'object' && (
                                <div className="stock-locations-quick">
                                    <strong>Disponible en:</strong>
                                    <div className="locations-list">
                                        {Object.entries(product.existencia).map(([location, stock]) => {
                                            const stockNum = Number(stock) || 0;
                                            return stockNum > 0 ? (
                                                <div key={location} className="location-item">
                                                    <span className="location-name">{location}:</span>
                                                    <span className="location-stock">{stockNum} unidades</span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
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

                        {/* ✅ CORRECCIÓN: Enlace corregido */}
                        <div className="view-details-link">
                            <Link 
                                to={getProductDetailUrl()} 
                                onClick={onClose}
                                className="details-link"
                            >
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