import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

// ✅ Función de normalización de producto
const normalizarProducto = (producto) => {
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

// ✅ Tipo de cambio fijo
const TIPO_CAMBIO_MXN = 18.50;

const ProductCard = ({ product, onQuickView }) => {
    const [imageStatus, setImageStatus] = useState('loading');
    const [currentImageUrl, setCurrentImageUrl] = useState('');
    const imgRef = useRef(null);
    const retryCountRef = useRef(0);

    // ✅ Normalizar el producto
    const normalizedProduct = useMemo(() => {
        return normalizarProducto(product);
    }, [product]);

    // ✅ CÁLCULO CORREGIDO DE PRECIOS EN MXN - CON PROMOCIONES
    const productCalculations = useMemo(() => {
        const hasActivePromotion = normalizedProduct.promociones && normalizedProduct.promociones.length > 0;
        const currentPromotion = hasActivePromotion ? normalizedProduct.promociones[0] : null;
        
        // ✅ CORRECCIÓN: Siempre convertir a MXN ya que los precios vienen en USD
        const convertirAMXN = (precio) => {
            // Si no hay precio, retornar 0
            if (!precio) return 0;
            
            // SIEMPRE convertir a MXN (los precios vienen en USD)
            return precio * (normalizedProduct.tipoCambio || TIPO_CAMBIO_MXN);
        };

        // Precio base en MXN (SIEMPRE convertir)
        const precioBaseMXN = convertirAMXN(normalizedProduct.precio);
        
        // Precio promocional en MXN (si existe promoción o precioPromocion)
        const precioPromoMXN = currentPromotion ? 
            convertirAMXN(currentPromotion.promocion) : 
            (normalizedProduct.precioPromocion ? convertirAMXN(normalizedProduct.precioPromocion) : null);

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

        return {
            tienePromocionActiva,
            currentPromotion,
            precioBaseMXN: formatearPrecio(precioBaseMXN),
            precioPromoMXN: tienePromocionActiva ? formatearPrecio(precioPromoMXN) : null,
            discountPercentage,
            precioFinalMXN: tienePromocionActiva ? formatearPrecio(precioPromoMXN) : formatearPrecio(precioBaseMXN),
            precioOriginalUSD: normalizedProduct.precio,
            tipoCambioUsado: normalizedProduct.tipoCambio || TIPO_CAMBIO_MXN
        };
    }, [
        normalizedProduct.promociones, 
        normalizedProduct.precio, 
        normalizedProduct.precioPromocion,
        normalizedProduct.tipoCambio
    ]);

    // ✅ Configurar imagen
    useEffect(() => {
        if (!normalizedProduct.codigo) {
            setImageStatus('error');
            return;
        }

        retryCountRef.current = 0;
        setImageStatus('loading');
        
        const url = `http://localhost:4004/api/images/code/${normalizedProduct.codigo}?size=full&t=${Date.now()}`;
        setCurrentImageUrl(url);
    }, [normalizedProduct.codigo]);

    // ✅ Manejo de imagen con cleanup
    useEffect(() => {
        if (!imgRef.current || !currentImageUrl) return;

        const img = imgRef.current;
        let isMounted = true;
        
        const handleLoad = () => {
            if (!isMounted) return;
            setImageStatus('loaded');
        };

        const handleError = () => {
            if (!isMounted) return;
            
            if (retryCountRef.current < 2) {
                retryCountRef.current += 1;
                
                setTimeout(() => {
                    if (!isMounted) return;
                    const retryUrl = `http://localhost:4004/api/images/code/${normalizedProduct.codigo}?size=full&t=${Date.now()}&retry=${retryCountRef.current}`;
                    setCurrentImageUrl(retryUrl);
                    setImageStatus('loading');
                }, 1000);
            } else {
                setImageStatus('error');
            }
        };

        img.addEventListener('load', handleLoad);
        img.addEventListener('error', handleError);

        img.src = currentImageUrl;

        return () => {
            isMounted = false;
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
        };
    }, [currentImageUrl, normalizedProduct.codigo]);

    // ✅ CORRECCIÓN: Añadir handleQuickView que faltaba
    const handleQuickView = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onQuickView) {
            onQuickView(normalizedProduct);
        }
    }, [onQuickView, normalizedProduct]);

    // ✅ CORRECCIÓN: Añadir handleViewDetails para el botón móvil
    const handleViewDetails = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        // Navegar a la página de detalles
        window.location.href = `/product/${normalizedProduct.idProducto || normalizedProduct.id || normalizedProduct.codigo}`;
    }, [normalizedProduct]);

    const {
        tienePromocionActiva,
        precioBaseMXN,
        precioPromoMXN,
        discountPercentage,
        precioFinalMXN,
        precioOriginalUSD,
        tipoCambioUsado
    } = productCalculations;

    // ✅ NO RENDERIZAR SI EL PRODUCTO NO TIENE EXISTENCIA
    if (!normalizedProduct.disponible) {
        return null;
    }

    return (
        <div className="product-card" data-code={normalizedProduct.codigo}>
            {/* Badge de promoción - SOLO SI TIENE PROMOCIÓN ACTIVA */}
            {tienePromocionActiva && (
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
                        <small>{normalizedProduct.nombre}</small>
                    </div>
                ) : (
                    <>
                        <img 
                            ref={imgRef}
                            alt={normalizedProduct.nombre}
                            className={`product-img ${imageStatus === 'loaded' ? 'loaded' : 'loading'}`}
                            crossOrigin="anonymous"
                            loading="lazy"
                        />
                        
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
                            to={`/product/${normalizedProduct.idProducto || normalizedProduct.id || normalizedProduct.codigo}`}
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
                    <span className="product-brand">{normalizedProduct.marca}</span>
                    <span className="product-category">{normalizedProduct.subcategoria || normalizedProduct.categoria}</span>
                </div>

                {/* Nombre del producto */}
                <h3 className="product-name" title={normalizedProduct.nombre}>
                    {normalizedProduct.nombre}
                </h3>

                {/* Descripción corta */}
                <p className="product-description">
                    {normalizedProduct.descripcion_corta || (normalizedProduct.descripcion ? 
                        (normalizedProduct.descripcion.length > 100 ? normalizedProduct.descripcion.substring(0, 100) + '...' : normalizedProduct.descripcion) 
                        : 'Descripción no disponible')}
                </p>

                {/* ✅ PRECIOS EN MXN - MOSTRAR ORIGINAL Y PROMOCIÓN SI APPLICA */}
                <div className="product-prices">
                    {tienePromocionActiva ? (
                        <>
                            {/* PRECIO PROMOCIONAL (ACTUAL) */}
                            <div className="price-promo">
                                <span className="current-price">${precioFinalMXN}</span>
                                <span className="currency">MXN</span>
                            </div>
                            
                            {/* PRECIO ORIGINAL (TACHADO) */}
                            <div className="price-original">
                                <span className="original-price">${precioBaseMXN} MXN</span>
                                <span className="discount-amount">
                                    Ahorras ${(parseFloat(precioBaseMXN.replace(/,/g, '')) - parseFloat(precioPromoMXN.replace(/,/g, ''))).toFixed(2)}
                                </span>
                            </div>
                        </>
                    ) : (
                        /* PRECIO NORMAL (SIN PROMOCIÓN) */
                        <div className="price-normal">
                            <span className="current-price">${precioFinalMXN}</span>
                            <span className="currency">MXN</span>
                        </div>
                    )}
                </div>

                {/* Información de conversión */}
                <div className="conversion-info">
                    <small>
                        Precio original: ${precioOriginalUSD} USD • 
                        Tipo de cambio: {tipoCambioUsado} MXN/USD
                    </small>
                </div>

                {/* Existencia */}
                <div className="product-stock">
                    <span className="stock-badge in-stock">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                        {normalizedProduct.existencia > 10 ? 'Disponible' : `Últimas ${normalizedProduct.existencia} unidades`}
                    </span>
                </div>

                {/* Información de debug */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="debug-info">
                        <strong>DEBUG:</strong> 
                        Stock: {normalizedProduct.existencia} | 
                        Precio USD: ${precioOriginalUSD} | 
                        Precio MXN: ${precioFinalMXN} |
                        Tipo Cambio: {tipoCambioUsado} |
                        {tienePromocionActiva && ` Descuento: ${discountPercentage}%`}
                    </div>
                )}

                {/* Botones de acción móviles */}
                <div className="product-actions-mobile">
                    <button 
                        className="btn-mobile btn-quick-view-mobile"
                        onClick={handleQuickView}
                    >
                        Vista Rápida
                    </button>
                    <button 
                        className="btn-mobile btn-details-mobile"
                        onClick={handleViewDetails}
                    >
                        Ver Detalles
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ProductCard);