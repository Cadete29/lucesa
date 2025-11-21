import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, onQuickView }) => {
    const [imageLoaded, setImageLoaded] = useState(true);
    const [imageError, setImageError] = useState(false);

    // Verificar si hay promoción activa
    const hasActivePromotion = product.promociones && product.promociones.length > 0;
    const currentPromotion = hasActivePromotion ? product.promociones[0] : null;
    
    // Calcular precio en MXN si está en USD
    const precioMXN = product.moneda === 'USD' ? 
        (product.precio * product.tipoCambio).toFixed(2) : 
        product.precio;

    const precioPromoMXN = currentPromotion && product.moneda === 'USD' ?
        (currentPromotion.promocion * product.tipoCambio).toFixed(2) :
        currentPromotion?.promocion;

    // Calcular descuento porcentual
    const discountPercentage = currentPromotion ? 
        Math.round(((product.precio - currentPromotion.promocion) / product.precio) * 100) : 
        0;

    // Manejar error de imagen
    const handleImageError = () => {
        setImageLoaded(false);
        setImageError(true);
    };

    // Obtener existencia total
    const getTotalStock = () => {
        if (!product.existencia) return 0;
        return Object.values(product.existencia).reduce((total, stock) => total + stock, 0);
    };

    const totalStock = getTotalStock();

    const handleQuickView = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onQuickView) {
            onQuickView(product);
        }
    };

    return (
        <div className="product-card">
            {/* Badge de promoción */}
            {hasActivePromotion && (
                <div className="promotion-badge">
                    -{discountPercentage}%
                </div>
            )}

            {/* Imagen del producto */}
            <div className="product-image">
                {imageError ? (
                    <div className="image-placeholder">
                        <span>📷</span>
                        <p>Imagen no disponible</p>
                    </div>
                ) : (
                    <img 
                        src={product.imagen} 
                        alt={product.nombre}
                        onLoad={() => setImageLoaded(true)}
                        onError={handleImageError}
                        className={imageLoaded ? 'loaded' : 'loading'}
                    />
                )}
                
                {/* Overlay de acciones */}
                <div className="product-overlay">
                    <button 
                        className="btn-overlay btn-quick-view"
                        onClick={handleQuickView}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Vista Rápida
                    </button>
                    <Link 
                        to={`/product/${product.idProducto}`}
                        className="btn-overlay btn-view-details"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                        </svg>
                        Ver Detalles
                    </Link>
                </div>
            </div>

            {/* Información del producto */}
            <div className="product-info">
                {/* Marca y categoría */}
                <div className="product-meta">
                    <span className="product-brand">{product.marca}</span>
                    <span className="product-category">{product.subcategoria}</span>
                </div>

                {/* Nombre del producto */}
                <h3 className="product-name" title={product.nombre}>
                    {product.nombre}
                </h3>

                {/* Descripción corta */}
                <p className="product-description">
                    {product.descripcion_corta}
                </p>

                {/* Precios */}
                <div className="product-prices">
                    {hasActivePromotion ? (
                        <>
                            <div className="price-promo">
                                <span className="current-price">${precioPromoMXN}</span>
                                <span className="currency">MXN</span>
                            </div>
                            <div className="price-original">
                                <span className="original-price">${precioMXN}</span>
                            </div>
                        </>
                    ) : (
                        <div className="price-normal">
                            <span className="current-price">${product.moneda === 'USD' ? precioMXN : product.precio}</span>
                            <span className="currency">{product.moneda === 'USD' ? 'MXN' : ''}</span>
                        </div>
                    )}
                </div>

                {/* Existencia */}
                <div className="product-stock">
                    {totalStock > 0 ? (
                        <span className="stock-badge in-stock">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M5 13l4 4L19 7"/>
                            </svg>
                            Disponible
                        </span>
                    ) : (
                        <span className="stock-badge out-of-stock">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            Agotado
                        </span>
                    )}
                </div>

                {/* Botones de acción móviles */}
                <div className="product-actions-mobile">
                    <button 
                        className="btn-mobile btn-quick-view-mobile"
                        onClick={handleQuickView}
                    >
                        Vista Rápida
                    </button>
                    <Link 
                        to={`/product/${product.idProducto}`}
                        className="btn-mobile btn-details-mobile"
                    >
                        Ver Detalles
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;