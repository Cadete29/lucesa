// src/components/Product Card/ProductCard.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '../../context/FavoritesContext';
import './ProductCard.css';

// ✅ Configuración de URLs por entorno
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

// ✅ CONFIGURACIÓN DEL PORCENTAJE ADICIONAL
const PORCENTAJE_ADICIONAL = 10; // 10% adicional a todos los productos

// ✅ Función para agregar el porcentaje adicional
const agregarPorcentajeAdicionalPcard = (precio) => {
  if (!precio || typeof precio !== 'number' || isNaN(precio) || precio <= 0) {
    return 0;
  }
  return precio * (1 + (PORCENTAJE_ADICIONAL / 100));
};

// ✅ Función de normalización de producto
const normalizarProductoPcard = (producto) => {
  if (!producto) return null;
  
  // ✅ EXTRAER TODOS LOS CAMPOS REQUERIDOS
  const productoNormalizado = {
    // ✅ DATOS BÁSICOS (REQUERIDOS)
    id: producto.id || producto.idProducto || `prod_${Date.now()}`,
    codigo: producto.codigo || 'N/A',
    nombre: producto.nombre || 'Producto sin nombre',
    modelo: producto.modelo || producto.numParte || producto.no_parte || '',
    marca: producto.marca || 'Sin marca',
    categoria: producto.categoria || 'General',
    subcategoria: producto.subcategoria || '',
    descripcion_corta: producto.descripcion_corta || producto.descripcion || '',
    imagen: producto.imagen || '',
    
    // ✅ DATOS DE PRECIO (ORIGINALES DEL BACKEND)
    precio: typeof producto.precio === 'number' ? producto.precio : 
            typeof producto.precio === 'string' ? parseFloat(producto.precio) || 0 : 0,
    
    precioPromocion: typeof producto.precioPromocion === 'number' ? producto.precioPromocion : 
                     typeof producto.precioPromocion === 'string' ? parseFloat(producto.precioPromocion) || 0 : 0,
    
    moneda: producto.moneda || 'USD',
    
    // ✅ PRECIO MXN DEL BACKEND (ya convertido si era necesario)
    precioMXN: producto.precioMXN || 0,
    
    // ✅ ESPECIFICACIONES
    especificaciones: Array.isArray(producto.especificaciones) ? producto.especificaciones : [],
    
    // ✅ EXISTENCIA Y DISPONIBILIDAD
    existencia: typeof producto.existencia === 'number' ? producto.existencia : 
                typeof producto.existencia === 'string' ? parseInt(producto.existencia) || 0 : 
                typeof producto.existenciaTotal === 'number' ? producto.existenciaTotal : 
                typeof producto.existenciaTotal === 'string' ? parseInt(producto.existenciaTotal) || 0 : 0,
    
    disponible: producto.disponible !== undefined ? Boolean(producto.disponible) : 
                (producto.existencia || producto.existenciaTotal || 0) > 0,
    
    stock: typeof producto.stock === 'number' ? producto.stock : 
           (producto.existencia || producto.existenciaTotal || 0),
    
    // ✅ PROMOCIONES
    promociones: Array.isArray(producto.promociones) ? producto.promociones : [],
    
    // ✅ CAMPOS ADICIONALES
    existenciaTotal: producto.existenciaTotal || producto.existencia || 0,
    tieneExistencia: (producto.existencia || producto.existenciaTotal || 0) > 0,
    tipo_cambio: producto.tipo_cambio || producto.tipoCambio || 0,
    imagenFecha: producto.imagenFecha || '',
    upc: producto.upc || '',
    ean: producto.ean || '',
    sustituto: producto.sustituto || '',
    status: producto.status || (producto.activo === 1 ? 'Activo' : 'Inactivo'),
    fuente: producto.fuente || 'unknown',
    ultimaActualizacion: producto.ultimaActualizacion || new Date().toISOString(),
    almacenes: producto.almacenes || {},
    idProducto: producto.idProducto || producto.id,
    descripcion: producto.descripcion || producto.descripcion_corta || '',
    numParte: producto.numParte || producto.no_parte || '',
    
    // ✅ CAMPOS CALCULADOS
    tienePromocion: Boolean(producto.precioPromocion && producto.precioPromocion > 0),
    porcentajeDescuento: producto.precioPromocion && producto.precio && producto.precio > 0 ? 
      Math.round((1 - producto.precioPromocion / producto.precio) * 100) : 0,
    precioFinal: producto.precioPromocion && producto.precioPromocion > 0 ? 
      producto.precioPromocion : producto.precio
  };
  
  // ✅ CALCULAR ESTADO DE STOCK
  const existencia = productoNormalizado.existencia;
  productoNormalizado.sinStock = existencia === 0;
  productoNormalizado.stockBajo = existencia > 0 && existencia <= 5;
  productoNormalizado.stockSuficiente = existencia > 5;
  
  return productoNormalizado;
};

const ProductCard = ({ product, onQuickView, onAddToCart }) => {
    const navigate = useNavigate();
    const [imageStatusPcard, setImageStatusPcard] = useState('loading');
    const [currentImageUrlPcard, setCurrentImageUrlPcard] = useState('');
    const [isFavoriteLoadingPcard, setIsFavoriteLoadingPcard] = useState(false);
    const [favoriteErrorPcard, setFavoriteErrorPcard] = useState('');
    const imgRefPcard = useRef(null);
    const retryCountRefPcard = useRef(0);

    // ✅ Contexto de favoritos
    const { isFavorite, toggleFavorite, favorites } = useFavorites();

    // ✅ Normalizar el producto
    const normalizedProductPcard = useMemo(() => {
        const normalized = normalizarProductoPcard(product);
        
        // ✅ DEBUG: Verificar que tenemos un código válido
        if (normalized) {
            console.log('✅ ProductCard - Producto normalizado:', {
                id: normalized.id,
                codigo: normalized.codigo,
                nombre: normalized.nombre,
                tieneCodigoValido: normalized.codigo && normalized.codigo !== 'N/A',
                esIDInterno: normalized.id && (normalized.id.startsWith('json_') || normalized.id.startsWith('xml_')),
                porcentajeAdicional: `${PORCENTAJE_ADICIONAL}%`
            });
            
            // ✅ ADVERTENCIA: Si no tenemos código válido
            if (!normalized.codigo || normalized.codigo === 'N/A') {
                console.warn('⚠️ ProductCard - Producto sin código válido:', {
                    id: normalized.id,
                    nombre: normalized.nombre
                });
            }
        }
        
        return normalized;
    }, [product]);

    // ✅ Verificar si el producto está en favoritos
    const productIsFavoritePcard = useMemo(() => {
        if (!normalizedProductPcard) return false;
        return isFavorite(normalizedProductPcard.id);
    }, [isFavorite, normalizedProductPcard]);

    // ✅ Manejo de favoritos
    const handleFavoriteClickPcard = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!normalizedProductPcard) return;
        
        setIsFavoriteLoadingPcard(true);
        setFavoriteErrorPcard('');
        
        try {
            await toggleFavorite(normalizedProductPcard);
        } catch (error) {
            console.error('❌ ProductCard - Error al toggle favorite:', error);
            setFavoriteErrorPcard(error.message);
        } finally {
            setIsFavoriteLoadingPcard(false);
        }
    }, [toggleFavorite, normalizedProductPcard]);

    // ✅ CÁLCULO DE PRECIOS CON 10% ADICIONAL
    const productCalculationsPcard = useMemo(() => {
        if (!normalizedProductPcard) {
            return {
                tienePromocionActivaPcard: false,
                precioBaseMXNPcard: '0.00',
                precioPromoMXNPcard: null,
                discountPercentagePcard: 0,
                precioFinalMXNPcard: '0.00',
                ahorroMXNPcard: '0.00',
                porcentajeAdicional: PORCENTAJE_ADICIONAL
            };
        }
        
        // ✅ PRECIO BASE EN MXN (ya convertido del backend) + 10%
        const precioMXNOriginal = normalizedProductPcard.precioMXN || normalizedProductPcard.precio || 0;
        const precioBaseCon10 = agregarPorcentajeAdicionalPcard(precioMXNOriginal);
        
        // ✅ PRECIO PROMOCIONAL EN MXN + 10%
        let precioPromoCon10 = null;
        let tienePromocionActivaPcard = false;
        let discountPercentagePcard = 0;
        
        // Verificar promociones activas
        if (normalizedProductPcard.promociones && normalizedProductPcard.promociones.length > 0) {
            const currentPromotion = normalizedProductPcard.promociones[0];
            if (currentPromotion?.promocion) {
                // Convertir promoción a MXN si es necesario
                let precioPromoMXN = currentPromotion.promocion;
                if (normalizedProductPcard.moneda === 'USD') {
                    precioPromoMXN = currentPromotion.promocion * (normalizedProductPcard.tipo_cambio || 18.4);
                }
                precioPromoCon10 = agregarPorcentajeAdicionalPcard(precioPromoMXN);
            }
        } else if (normalizedProductPcard.precioPromocion) {
            // Precio promocional directo
            let precioPromoMXN = normalizedProductPcard.precioPromocion;
            if (normalizedProductPcard.moneda === 'USD') {
                precioPromoMXN = normalizedProductPcard.precioPromocion * (normalizedProductPcard.tipo_cambio || 18.4);
            }
            precioPromoCon10 = agregarPorcentajeAdicionalPcard(precioPromoMXN);
        }

        // Determinar si tiene promoción activa
        tienePromocionActivaPcard = precioPromoCon10 !== null && precioPromoCon10 < precioBaseCon10;
        
        // Calcular porcentaje de descuento
        if (tienePromocionActivaPcard && precioBaseCon10 > 0) {
            discountPercentagePcard = Math.round(((precioBaseCon10 - precioPromoCon10) / precioBaseCon10) * 100);
        }

        // Formatear precios
        const formatearPrecioPcard = (precio) => {
            if (typeof precio !== 'number' || isNaN(precio)) return '0.00';
            return precio.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };

        // Calcular ahorro
        const ahorroMXNPcard = tienePromocionActivaPcard ? (precioBaseCon10 - precioPromoCon10) : 0;

        return {
            tienePromocionActivaPcard,
            precioBaseMXNPcard: formatearPrecioPcard(precioBaseCon10),
            precioPromoMXNPcard: tienePromocionActivaPcard ? formatearPrecioPcard(precioPromoCon10) : null,
            discountPercentagePcard,
            precioFinalMXNPcard: tienePromocionActivaPcard ? formatearPrecioPcard(precioPromoCon10) : formatearPrecioPcard(precioBaseCon10),
            ahorroMXNPcard: formatearPrecioPcard(ahorroMXNPcard),
            // Información para debug
            precioOriginalBase: precioMXNOriginal,
            precioBaseCon10,
            precioPromoCon10,
            porcentajeAdicional: PORCENTAJE_ADICIONAL,
            monedaOriginal: normalizedProductPcard.moneda
        };
    }, [normalizedProductPcard]);

    // ✅ Configurar imagen
    useEffect(() => {
        if (!normalizedProductPcard?.codigo || normalizedProductPcard.codigo === 'N/A') {
            setImageStatusPcard('error');
            return;
        }

        retryCountRefPcard.current = 0;
        setImageStatusPcard('loading');
        
        const url = `${IMAGE_BASE_URL}/${normalizedProductPcard.codigo}?size=full&t=${Date.now()}`;
        setCurrentImageUrlPcard(url);
    }, [normalizedProductPcard?.codigo]);

    // ✅ Manejo de imagen
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
    }, [currentImageUrlPcard, normalizedProductPcard?.codigo]);

    // ✅ Manejo de vista rápida
    const handleQuickViewPcard = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onQuickView && normalizedProductPcard) {
            onQuickView(normalizedProductPcard);
        }
    }, [onQuickView, normalizedProductPcard]);

    // ✅ CORREGIDO: Manejo de ver detalles - USAR CÓDIGO, NO ID INTERNO
    const handleViewDetailsPcard = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!normalizedProductPcard) return;
        
        // ✅ IMPORTANTE: Usar el CÓDIGO del producto, no el ID interno
        const productCode = normalizedProductPcard.codigo;
        
        if (productCode && productCode !== 'N/A') {
            console.log('🔗 ProductCard - Navegando a detalles con código:', productCode);
            navigate(`/product/${productCode}`);
        } else {
            // Si no hay código válido, usar el ID como último recurso
            console.warn('⚠️ ProductCard - No hay código válido, usando ID interno:', normalizedProductPcard.id);
            navigate(`/product/${normalizedProductPcard.id}`);
        }
    }, [normalizedProductPcard, navigate]);

    // ✅ Manejo de agregar al carrito
    const handleAddToCartClickPcard = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onAddToCart && normalizedProductPcard) {
            onAddToCart(normalizedProductPcard);
        }
    }, [onAddToCart, normalizedProductPcard]);

    // ✅ NO RENDERIZAR SI NO HAY PRODUCTO
    if (!normalizedProductPcard) {
        return null;
    }

    const {
        tienePromocionActivaPcard,
        precioBaseMXNPcard,
        precioPromoMXNPcard,
        discountPercentagePcard,
        precioFinalMXNPcard,
        ahorroMXNPcard,
        monedaOriginal,
        porcentajeAdicional
    } = productCalculationsPcard;

    // ✅ NO RENDERIZAR SI EL PRODUCTO NO TIENE EXISTENCIA
    if (!normalizedProductPcard.disponible) {
        return null;
    }

    // ✅ Obtener URL correcta para detalles
    const detailUrl = normalizedProductPcard.codigo && normalizedProductPcard.codigo !== 'N/A' 
        ? `/product/${normalizedProductPcard.codigo}`
        : `/product/${normalizedProductPcard.id}`;

    return (
        <div className="product-card-pcard" data-code={normalizedProductPcard.codigo} data-product-id={normalizedProductPcard.id}>
            {/* ✅ Badge de promoción */}
            {tienePromocionActivaPcard && discountPercentagePcard > 0 && (
                <div className="promotion-badge-pcard" title={`Descuento del ${discountPercentagePcard}%`}>
                    -{discountPercentagePcard}%
                </div>
            )}

            {/* ✅ Botón de favoritos */}
            <button 
                className={`favorite-btn-pcard ${productIsFavoritePcard ? 'favorite-active' : ''} ${isFavoriteLoadingPcard ? 'loading' : ''}`}
                onClick={handleFavoriteClickPcard}
                disabled={isFavoriteLoadingPcard}
                aria-label={productIsFavoritePcard ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                title={productIsFavoritePcard ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
                {isFavoriteLoadingPcard ? (
                    <div className="favorite-spinner-pcard"></div>
                ) : (
                    <svg 
                        className="favorite-icon" 
                        viewBox="0 0 24 24" 
                        fill={productIsFavoritePcard ? 'currentColor' : 'none'} 
                        stroke="currentColor"
                    >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                )}
            </button>

            {/* ✅ Imagen del producto */}
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
                            to={detailUrl}
                            className="btn-overlay-pcard btn-view-details-pcard"
                            onClick={(e) => {
                                console.log('🔗 ProductCard - Click en detalles:', {
                                    codigo: normalizedProductPcard.codigo,
                                    url: detailUrl
                                });
                            }}
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

            {/* ✅ Información del producto */}
            <div className="product-info-pcard">
                {/* ✅ Marca y categoría */}
                <div className="product-meta-pcard">
                    <span className="product-brand-pcard" title={normalizedProductPcard.marca}>
                        {normalizedProductPcard.marca}
                    </span>
                    <span className="product-category-pcard" title={`${normalizedProductPcard.categoria}${normalizedProductPcard.subcategoria ? ' > ' + normalizedProductPcard.subcategoria : ''}`}>
                        {normalizedProductPcard.subcategoria || normalizedProductPcard.categoria}
                    </span>
                </div>

                {/* ✅ Nombre del producto */}
                <h3 className="product-name-pcard" title={normalizedProductPcard.nombre}>
                    <Link to={detailUrl} onClick={handleViewDetailsPcard}>
                        {normalizedProductPcard.nombre}
                    </Link>
                </h3>

                {/* ✅ Descripción corta */}
                <p className="product-description-pcard">
                    {normalizedProductPcard.descripcion_corta || (normalizedProductPcard.descripcion ? 
                        (normalizedProductPcard.descripcion.length > 100 ? normalizedProductPcard.descripcion.substring(0, 100) + '...' : normalizedProductPcard.descripcion) 
                        : 'Descripción no disponible')}
                </p>

                {/* ✅ PRECIOS EN MXN CON 10% ADICIONAL */}
                <div className="product-prices-pcard">
                    {tienePromocionActivaPcard ? (
                        <>
                            {/* PRECIO PROMOCIONAL CON 10% */}
                            <div className="price-promo-pcard">
                                <span className="current-price-pcard">${precioFinalMXNPcard}</span>
                                <span className="currency-pcard">MXN</span>
                                {/* <span className="price-note-pcard">
                                    +{porcentajeAdicional}%
                                </span> */}
                            </div>
                            
                            {/* PRECIO ORIGINAL CON 10% (TACHADO) */}
                            <div className="price-original-pcard">
                                <span className="original-price-pcard">${precioBaseMXNPcard} MXN</span>
                                <span className="discount-amount-pcard">
                                    Ahorras ${ahorroMXNPcard} MXN
                                </span>
                            </div>
                        </>
                    ) : (
                        /* PRECIO NORMAL CON 10% (SIN PROMOCIÓN) */
                        <div className="price-normal-pcard">
                            <span className="current-price-pcard">${precioFinalMXNPcard}</span>
                            <span className="currency-pcard">MXN</span>
                            {/* <span className="price-note-pcard">
                                +{porcentajeAdicional}%
                            </span> */}
                        </div>
                    )}
                    
                    {/* ✅ NOTA INFORMATIVA SOBRE EL 10% */}
                    {/* <div className="price-additional-info-pcard">
                        <small>
                            {monedaOriginal === 'USD' 
                                ? `Precio convertido de USD + ${porcentajeAdicional}% adicional` 
                                : `Precio en MXN + ${porcentajeAdicional}% adicional`}
                        </small>
                    </div> */}
                </div>

                {/* ✅ Existencia */}
                <div className="product-stock-pcard">
                    <span className={`stock-badge-pcard ${normalizedProductPcard.stockBajo ? 'stock-low-pcard' : 'in-stock-pcard'}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                        {normalizedProductPcard.existencia > 10 ? 'Disponible' : `Últimas ${normalizedProductPcard.existencia} unidades`}
                    </span>
                </div>

                {/* ✅ Información adicional */}
                {normalizedProductPcard.modelo && (
                    <div className="product-model-pcard">
                        <small>Modelo: {normalizedProductPcard.modelo}</small>
                    </div>
                )}

                {/* ✅ Información de debug (solo desarrollo) */}
                {/* {process.env.NODE_ENV === 'development' && (
                    <div className="debug-info-pcard">
                        <details>
                            <summary>📊 DEBUG Info</summary>
                            <ul>
                                <li><strong>ID:</strong> {normalizedProductPcard.id}</li>
                                <li><strong>Código:</strong> {normalizedProductPcard.codigo}</li>
                                <li><strong>Es código válido:</strong> {normalizedProductPcard.codigo && normalizedProductPcard.codigo !== 'N/A' ? 'SÍ' : 'NO'}</li>
                                <li><strong>URL detalles:</strong> {detailUrl}</li>
                                <li><strong>Precio MXN:</strong> ${normalizedProductPcard.precioMXN?.toFixed(2)}</li>
                                <li><strong>+{porcentajeAdicional}%:</strong> ${precioFinalMXNPcard}</li>
                                <li><strong>Existencia:</strong> {normalizedProductPcard.existencia}</li>
                                <li><strong>Favorito:</strong> {productIsFavoritePcard ? 'SÍ' : 'NO'}</li>
                            </ul>
                        </details>
                    </div>
                )} */}

                {/* ✅ Mensaje de error */}
                {favoriteErrorPcard && (
                    <div className="favorite-error-pcard">
                        ❌ {favoriteErrorPcard}
                    </div>
                )}

                {/* ✅ Botones de acción móviles */}
                <div className="product-actions-mobile-pcard">
                    <button 
                        className="btn-mobile-pcard btn-quick-view-mobile-pcard"
                        onClick={handleQuickViewPcard}
                    >
                        Vista Rápida
                    </button>
                    {/* <button 
                        className="btn-mobile-pcard btn-details-mobile-pcard"
                        onClick={handleViewDetailsPcard}
                    >
                        Ver Detalles
                    </button> */}
                </div>
            </div>
        </div>
    );
};

export default React.memo(ProductCard);