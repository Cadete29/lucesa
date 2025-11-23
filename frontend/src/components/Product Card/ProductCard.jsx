import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, onQuickView }) => {
    const [imageStatus, setImageStatus] = useState('loading'); // 'loading', 'loaded', 'error'
    const [currentImageUrl, setCurrentImageUrl] = useState('');
    const imgRef = useRef(null);
    const retryCountRef = useRef(0);

    useEffect(() => {
        if (!product.codigo) {
            setImageStatus('error');
            return;
        }

        retryCountRef.current = 0;
        setImageStatus('loading');
        
        const url = `http://localhost:4004/api/images/code/${product.codigo}?size=full&t=${Date.now()}`;
        console.log('🖼️ Configurando imagen:', product.codigo);
        setCurrentImageUrl(url);

    }, [product.codigo]);

    useEffect(() => {
        if (!imgRef.current || !currentImageUrl) return;

        const img = imgRef.current;
        
        const handleLoad = () => {
            console.log('✅ Imagen cargada:', product.codigo);
            setImageStatus('loaded');
        };

        const handleError = () => {
            console.error('❌ Error cargando:', product.codigo);
            
            if (retryCountRef.current < 2) {
                retryCountRef.current += 1;
                console.log(`🔄 Reintento ${retryCountRef.current} para:`, product.codigo);
                
                setTimeout(() => {
                    const retryUrl = `http://localhost:4004/api/images/code/${product.codigo}?size=full&t=${Date.now()}&retry=${retryCountRef.current}`;
                    setCurrentImageUrl(retryUrl);
                    setImageStatus('loading');
                }, 1000);
            } else {
                setImageStatus('error');
            }
        };

        img.addEventListener('load', handleLoad);
        img.addEventListener('error', handleError);

        // Forzar la carga de la imagen
        img.src = currentImageUrl;

        return () => {
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
        };
    }, [currentImageUrl, product.codigo]);

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
        
        if (typeof product.existencia === 'object') {
            return Object.values(product.existencia).reduce((total, stock) => {
                const stockValue = typeof stock === 'number' ? stock : parseInt(stock) || 0;
                return total + stockValue;
            }, 0);
        }
        
        return typeof product.existencia === 'number' ? product.existencia : parseInt(product.existencia) || 0;
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
        <div className="product-card" data-code={product.codigo}>
            {/* Badge de promoción */}
            {hasActivePromotion && (
                <div className="promotion-badge">
                    -{discountPercentage}%
                </div>
            )}

            {/* Imagen del producto */}
            <div className="product-image">
                {imageStatus === 'error' ? (
                    <div className="image-placeholder">
                        <div className="placeholder-icon">📷</div>
                        <p>Imagen no disponible</p>
                        <small>{product.nombre}</small>
                    </div>
                ) : (
                    <>
                        <img 
                            ref={imgRef}
                            alt={product.nombre}
                            className={`product-img ${imageStatus === 'loaded' ? 'loaded' : 'loading'}`}
                            crossOrigin="anonymous"
                            loading="lazy"
                        />
                        
                        {/* Loading - se oculta con CSS cuando la imagen está cargada */}
                        {imageStatus === 'loading' && (
                            <div className="image-loading">
                                <div className="loading-spinner"></div>
                                <p>Cargando imagen...</p>
                                {retryCountRef.current > 0 && (
                                    <small>Reintento {retryCountRef.current}/2</small>
                                )}
                            </div>
                        )}
                    </>
                )}
                
                {/* Overlay de acciones - solo cuando la imagen está cargada */}
                {imageStatus === 'loaded' && (
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
                )}
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
                    {product.descripcion_corta || (product.descripcion ? 
                        (product.descripcion.length > 100 ? product.descripcion.substring(0, 100) + '...' : product.descripcion) 
                        : 'Descripción no disponible')}
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
                            {totalStock > 10 ? 'Disponible' : `Últimas ${totalStock} unidades`}
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