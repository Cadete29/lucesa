import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../../context/FavoritesContext';
import './ProductCard.css';

// ✅ Configuración de URLs por entorno
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

// ✅ Función de normalización de producto
const normalizarProductoPcard = (producto) => {
  if (!producto) return producto;
  
  const existencia = producto.existencia || producto.existenciaTotal || 0;
  const existenciaTotal = producto.existenciaTotal || producto.existencia || 0;
  
  return {
    ...producto,
    existencia,
    existenciaTotal,
    disponible: existencia > 0,
    tieneExistencia: existencia > 0,
    stock: existencia,
    sinStock: existencia === 0,
    stockBajo: existencia > 0 && existencia <= 5,
    stockSuficiente: existencia > 5
  };
};

const ProductCard = ({ product, onQuickView }) => {
    const [imageStatusPcard, setImageStatusPcard] = useState('loading');
    const [currentImageUrlPcard, setCurrentImageUrlPcard] = useState('');
    const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
    const imgRefPcard = useRef(null);
    const retryCountRefPcard = useRef(0);

    // ✅ Contexto de favoritos
    const { isFavorite, toggleFavorite } = useFavorites();

    // ✅ Normalizar el producto
    const normalizedProductPcard = useMemo(() => {
        return normalizarProductoPcard(product);
    }, [product]);

    // ✅ Verificar si el producto está en favoritos
    const productIsFavorite = useMemo(() => {
        return isFavorite(normalizedProductPcard.id);
    }, [isFavorite, normalizedProductPcard.id]);

    // ✅ Manejo de favoritos
    const handleFavoriteClick = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsFavoriteLoading(true);
        try {
            await toggleFavorite(normalizedProductPcard);
        } catch (error) {
            console.error('Error al toggle favorite:', error);
        } finally {
            setIsFavoriteLoading(false);
        }
    }, [toggleFavorite, normalizedProductPcard]);

    // ✅ CÁLCULO DE PRECIOS EN MXN CON 10% ADICIONAL (BASE Y PROMOCIONES)
    const productCalculationsPcard = useMemo(() => {
        const hasActivePromotionPcard = normalizedProductPcard.promociones && normalizedProductPcard.promociones.length > 0;
        const currentPromotionPcard = hasActivePromotionPcard ? normalizedProductPcard.promociones[0] : null;
        
        // ✅ FUNCIÓN PARA AGREGAR 10% AL PRECIO (APLICA PARA BASE Y PROMOCIONES)
        const agregarDiezPorcientoPcard = (precio) => {
            if (!precio || typeof precio !== 'number') return 0;
            // Agregar 10% al precio original
            return precio * 1.10;
        };

        // Precio base en MXN con 10% adicional
        const precioBaseOriginalPcard = normalizedProductPcard.precio || 0;
        const precioBaseMXNPcard = agregarDiezPorcientoPcard(precioBaseOriginalPcard);
        
        // ✅ PRECIO PROMOCIONAL CON 10% ADICIONAL
        let precioPromoOriginalPcard = null;
        let precioPromoMXNPcard = null;

        if (currentPromotionPcard) {
            // Si hay promoción activa, aplicar 10% al precio promocional
            precioPromoOriginalPcard = currentPromotionPcard.promocion;
            precioPromoMXNPcard = agregarDiezPorcientoPcard(precioPromoOriginalPcard);
        } else if (normalizedProductPcard.precioPromocion) {
            // Si hay precio promocional directo, aplicar 10%
            precioPromoOriginalPcard = normalizedProductPcard.precioPromocion;
            precioPromoMXNPcard = agregarDiezPorcientoPcard(precioPromoOriginalPcard);
        }

        // Determinar si tiene promoción activa (comparando precios con 10% incluido)
        const tienePromocionActivaPcard = precioPromoMXNPcard !== null && precioPromoMXNPcard < precioBaseMXNPcard;

        // Formatear a 2 decimales
        const formatearPrecioPcard = (precio) => {
            if (typeof precio !== 'number') return '0.00';
            return precio.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };

        // ✅ CÁLCULO DE DESCUENTO CONSIDERANDO EL 10% ADICIONAL
        const discountPercentagePcard = tienePromocionActivaPcard ? 
            Math.round(((precioBaseMXNPcard - precioPromoMXNPcard) / precioBaseMXNPcard) * 100) : 
            0;

        // Calcular ahorro en MXN
        const ahorroMXNPcard = tienePromocionActivaPcard ? 
            (precioBaseMXNPcard - precioPromoMXNPcard) : 0;

        return {
            tienePromocionActivaPcard,
            currentPromotionPcard,
            precioBaseMXNPcard: formatearPrecioPcard(precioBaseMXNPcard),
            precioPromoMXNPcard: tienePromocionActivaPcard ? formatearPrecioPcard(precioPromoMXNPcard) : null,
            discountPercentagePcard,
            precioFinalMXNPcard: tienePromocionActivaPcard ? formatearPrecioPcard(precioPromoMXNPcard) : formatearPrecioPcard(precioBaseMXNPcard),
            ahorroMXNPcard: formatearPrecioPcard(ahorroMXNPcard),
            // Precios originales para referencia en debug
            precioOriginalBasePcard: precioBaseOriginalPcard,
            precioOriginalPromoPcard: precioPromoOriginalPcard,
            // Precios con 10% para cálculos internos
            precioBaseConIncremento: precioBaseMXNPcard,
            precioPromoConIncremento: precioPromoMXNPcard
        };
    }, [
        normalizedProductPcard.promociones, 
        normalizedProductPcard.precio, 
        normalizedProductPcard.precioPromocion
    ]);

    // ✅ Configurar imagen con URL dinámica por entorno
    useEffect(() => {
        if (!normalizedProductPcard.codigo) {
            setImageStatusPcard('error');
            return;
        }

        retryCountRefPcard.current = 0;
        setImageStatusPcard('loading');
        
        const url = `${IMAGE_BASE_URL}/${normalizedProductPcard.codigo}?size=full&t=${Date.now()}`;
        setCurrentImageUrlPcard(url);
    }, [normalizedProductPcard.codigo]);

    // ✅ Manejo de imagen con cleanup
    useEffect(() => {
        if (!imgRefPcard.current || !currentImageUrlPcard) return;

        const img = imgRefPcard.current;
        let isMountedPcard = true;
        
        const handleLoadPcard = () => {
            if (!isMountedPcard) return;
            setImageStatusPcard('loaded');
        };

        const handleErrorPcard = () => {
            if (!isMountedPcard) return;
            
            if (retryCountRefPcard.current < 2) {
                retryCountRefPcard.current += 1;
                
                setTimeout(() => {
                    if (!isMountedPcard) return;
                    const retryUrl = `${IMAGE_BASE_URL}/${normalizedProductPcard.codigo}?size=full&t=${Date.now()}&retry=${retryCountRefPcard.current}`;
                    setCurrentImageUrlPcard(retryUrl);
                    setImageStatusPcard('loading');
                }, 1000);
            } else {
                setImageStatusPcard('error');
            }
        };

        img.addEventListener('load', handleLoadPcard);
        img.addEventListener('error', handleErrorPcard);

        img.src = currentImageUrlPcard;

        return () => {
            isMountedPcard = false;
            img.removeEventListener('load', handleLoadPcard);
            img.removeEventListener('error', handleErrorPcard);
        };
    }, [currentImageUrlPcard, normalizedProductPcard.codigo]);

    // ✅ Manejo de vista rápida
    const handleQuickViewPcard = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onQuickView) {
            onQuickView(normalizedProductPcard);
        }
    }, [onQuickView, normalizedProductPcard]);

    // ✅ Manejo de ver detalles
    const handleViewDetailsPcard = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `/product/${normalizedProductPcard.idProducto || normalizedProductPcard.id || normalizedProductPcard.codigo}`;
    }, [normalizedProductPcard]);

    const {
        tienePromocionActivaPcard,
        precioBaseMXNPcard,
        precioPromoMXNPcard,
        discountPercentagePcard,
        precioFinalMXNPcard,
        ahorroMXNPcard,
        precioOriginalBasePcard,
        precioOriginalPromoPcard
    } = productCalculationsPcard;

    // ✅ NO RENDERIZAR SI EL PRODUCTO NO TIENE EXISTENCIA
    if (!normalizedProductPcard.disponible) {
        return null;
    }

    return (
        <div className="product-card-pcard" data-code={normalizedProductPcard.codigo}>
            {/* Badge de promoción - SOLO SI TIENE PROMOCIÓN ACTIVA */}
            {tienePromocionActivaPcard && (
                <div className="promotion-badge-pcard">
                    -{discountPercentagePcard}%
                </div>
            )}

            {/* Botón de favoritos - POSICIONADO SOBRE LA IMAGEN */}
            <button 
                className={`favorite-btn-pcard ${productIsFavorite ? 'favorite-active' : ''} ${isFavoriteLoading ? 'loading' : ''}`}
                onClick={handleFavoriteClick}
                disabled={isFavoriteLoading}
                aria-label={productIsFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
                {isFavoriteLoading ? (
                    <div className="favorite-spinner"></div>
                ) : (
                    <svg 
                        className="favorite-icon" 
                        viewBox="0 0 24 24" 
                        fill={productIsFavorite ? 'currentColor' : 'none'} 
                        stroke="currentColor"
                    >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                )}
            </button>

            {/* Imagen del producto */}
            <div className="product-image-pcard">
                {imageStatusPcard === 'error' ? (
                    <div className="image-placeholder-pcard">
                        <div className="placeholder-icon-pcard">📷</div>
                        <p>Imagen no disponible</p>
                        <small>{normalizedProductPcard.nombre}</small>
                    </div>
                ) : (
                    <>
                        <img 
                            ref={imgRefPcard}
                            alt={normalizedProductPcard.nombre}
                            className={`product-img-pcard ${imageStatusPcard === 'loaded' ? 'loaded-pcard' : 'loading-pcard'}`}
                            crossOrigin="anonymous"
                            loading="lazy"
                        />
                        
                        {imageStatusPcard === 'loading' && (
                            <div className="image-loading-pcard">
                                <div className="loading-spinner-pcard"></div>
                                <p>Cargando imagen...</p>
                                {retryCountRefPcard.current > 0 && (
                                    <small>Reintento {retryCountRefPcard.current}/2</small>
                                )}
                            </div>
                        )}
                    </>
                )}
                
                {imageStatusPcard === 'loaded' && (
                    <div className="product-overlay-pcard">
                        <button 
                            className="btn-overlay-pcard btn-quick-view-pcard"
                            onClick={handleQuickViewPcard}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Vista Rápida
                        </button>
                        <Link 
                            to={`/product/${normalizedProductPcard.idProducto || normalizedProductPcard.id || normalizedProductPcard.codigo}`}
                            className="btn-overlay-pcard btn-view-details-pcard"
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
            <div className="product-info-pcard">
                {/* Marca y categoría */}
                <div className="product-meta-pcard">
                    <span className="product-brand-pcard">{normalizedProductPcard.marca}</span>
                    <span className="product-category-pcard">{normalizedProductPcard.subcategoria || normalizedProductPcard.categoria}</span>
                </div>

                {/* Nombre del producto */}
                <h3 className="product-name-pcard" title={normalizedProductPcard.nombre}>
                    {normalizedProductPcard.nombre}
                </h3>

                {/* Descripción corta */}
                <p className="product-description-pcard">
                    {normalizedProductPcard.descripcion_corta || (normalizedProductPcard.descripcion ? 
                        (normalizedProductPcard.descripcion.length > 100 ? normalizedProductPcard.descripcion.substring(0, 100) + '...' : normalizedProductPcard.descripcion) 
                        : 'Descripción no disponible')}
                </p>

                {/* ✅ PRECIOS EN MXN CON 10% ADICIONAL (BASE Y PROMOCIONES) */}
                <div className="product-prices-pcard">
                    {tienePromocionActivaPcard ? (
                        <>
                            {/* PRECIO PROMOCIONAL (ACTUAL) CON 10% */}
                            <div className="price-promo-pcard">
                                <span className="current-price-pcard">${precioFinalMXNPcard}</span>
                                <span className="currency-pcard">MXN</span>
                            </div>
                            
                            {/* PRECIO ORIGINAL (TACHADO) CON 10% */}
                            <div className="price-original-pcard">
                                <span className="original-price-pcard">${precioBaseMXNPcard} MXN</span>
                                <span className="discount-amount-pcard">
                                    Ahorras ${ahorroMXNPcard} MXN
                                </span>
                            </div>
                        </>
                    ) : (
                        /* PRECIO NORMAL (SIN PROMOCIÓN) CON 10% */
                        <div className="price-normal-pcard">
                            <span className="current-price-pcard">${precioFinalMXNPcard}</span>
                            <span className="currency-pcard">MXN</span>
                        </div>
                    )}
                </div>

                {/* Existencia */}
                <div className="product-stock-pcard">
                    <span className="stock-badge-pcard in-stock-pcard">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                        {normalizedProductPcard.existencia > 10 ? 'Disponible' : `Últimas ${normalizedProductPcard.existencia} unidades`}
                    </span>
                </div>

                {/* Información de debug */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="debug-info-pcard">
                        <strong>DEBUG:</strong> 
                        Entorno: {process.env.NODE_ENV} | 
                        Stock: {normalizedProductPcard.existencia} | 
                        Base Original: ${precioOriginalBasePcard} | 
                        Base +10%: ${precioBaseMXNPcard} |
                        {tienePromocionActivaPcard && 
                            ` Promo Original: $${precioOriginalPromoPcard} | 
                            Promo +10%: $${precioPromoMXNPcard} | 
                            Descuento: ${discountPercentagePcard}%`}
                    </div>
                )}

                {/* Botones de acción móviles */}
                <div className="product-actions-mobile-pcard">
                    <button 
                        className="btn-mobile-pcard btn-quick-view-mobile-pcard"
                        onClick={handleQuickViewPcard}
                    >
                        Vista Rápida
                    </button>
                    <button 
                        className="btn-mobile-pcard btn-details-mobile-pcard"
                        onClick={handleViewDetailsPcard}
                    >
                        Ver Detalles
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ProductCard);