import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, onQuickView }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [finalImageUrl, setFinalImageUrl] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    // Prepara la URL de la imagen con proxy
    useEffect(() => {
        if (product.imagen && product.codigo) {
            // Siempre usar el proxy para evitar problemas de CORS
            const proxyUrl = `http://localhost:4004/api/images/code/${product.codigo}?size=full`;
            
            console.log('🖼️ Usando proxy para imagen:', proxyUrl);
            setImageUrl(proxyUrl);
            setFinalImageUrl(proxyUrl);
            setImageLoaded(false);
            setImageError(false);
            setRetryCount(0);
        } else {
            setImageError(true);
        }
    }, [product.imagen, product.codigo]);

    const handleImageLoad = () => {
        setImageLoaded(true);
        setImageError(false);
        console.log('✅ Imagen cargada via proxy:', imageUrl);
    };

    const handleImageError = () => {
        console.error('❌ Error cargando imagen via proxy:', imageUrl);
        
        // Intentar reconexión (máximo 2 intentos)
        if (retryCount < 2) {
            const newRetryCount = retryCount + 1;
            setRetryCount(newRetryCount);
            console.log(`🔄 Reintento ${newRetryCount} para: ${product.codigo}`);
            
            // Forzar recarga con timestamp para evitar cache
            setTimeout(() => {
                setFinalImageUrl(`${imageUrl}&t=${Date.now()}`);
                setImageLoaded(false);
                setImageError(false);
            }, 1000 * newRetryCount);
        } else {
            setImageLoaded(false);
            setImageError(true);
            console.log('💥 Agotados los reintentos para:', product.codigo);
        }
    };

    // Verificar si hay promoción activa
    const hasActivePromotion = product.promociones && product.promociones.length > 0;
    const currentPromotion = hasActivePromotion ? product.promociones[0] : null;
    
    // Calcular precio en MXN si está en USD
    const precioMXN = product.moneda === 'USD' ? 
        (product.precio * (product.tipoCambio || 20)).toFixed(2) : 
        product.precio;

    const precioPromoMXN = currentPromotion && product.moneda === 'USD' ?
        (currentPromotion.promocion * (product.tipoCambio || 20)).toFixed(2) :
        currentPromotion?.promocion;

    // Calcular descuento porcentual
    const discountPercentage = currentPromotion ? 
        Math.round(((product.precio - currentPromotion.promocion) / product.precio) * 100) : 
        0;

    // Obtener existencia total
    const getTotalStock = () => {
        if (!product.existencia) return 0;
        
        // Si existencia es un objeto con ubicaciones
        if (typeof product.existencia === 'object') {
            return Object.values(product.existencia).reduce((total, stock) => total + stock, 0);
        }
        
        // Si existencia es un número directo
        return product.existencia;
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
                        <small>{product.nombre}</small>
                        {retryCount > 0 && (
                            <div className="retry-info">
                                <small>Intentos: {retryCount}/2</small>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <img 
                            src={finalImageUrl}
                            alt={product.nombre}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            className={imageLoaded ? 'loaded' : 'loading'}
                            style={{
                                opacity: imageLoaded ? 1 : 0,
                                transition: 'opacity 0.3s ease-in-out'
                            }}
                            crossOrigin="anonymous" // Importante para CORS
                        />
                        {!imageLoaded && !imageError && (
                            <div className="image-loading">
                                <div className="loading-spinner"></div>
                                <p>Cargando imagen...</p>
                                {retryCount > 0 && (
                                    <small>Reintento {retryCount}/2</small>
                                )}
                            </div>
                        )}
                    </>
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
                        to={`/product/${product.idProducto || product.id}`}
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
                    <span className="product-category">{product.subcategoria || product.categoria}</span>
                </div>

                {/* Nombre del producto */}
                <h3 className="product-name" title={product.nombre}>
                    {product.nombre}
                </h3>

                {/* Descripción corta */}
                <p className="product-description">
                    {product.descripcion_corta || product.descripcion?.substring(0, 100) + '...'}
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
                            <span className="current-price">${precioMXN}</span>
                            <span className="currency">MXN</span>
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
                        to={`/product/${product.idProducto || product.id}`}
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