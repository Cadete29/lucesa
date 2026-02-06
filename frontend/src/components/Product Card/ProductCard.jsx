import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '../../context/FavoritesContext';
import { useCart } from '../../context/CartContext';
import './ProductCard.css';

// ✅ Configuración de URLs por entorno
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://lucesademexico-shop.com.mx/api/images/code'
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

// ✅ Función para obtener la URL de imagen
const getImageUrlPcard = (codigo, index = 0) => {
    if (!codigo || codigo === 'N/A') return '';
    return `${IMAGE_BASE_URL}/${codigo}${index > 0 ? `?index=${index}` : ''}`;
};

// ✅ Función para cargar todas las imágenes del producto
const fetchProductImages = async (codigo) => {
    try {
        const response = await fetch(`${IMAGE_BASE_URL}/${codigo}/all`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.availableImages?.length > 0) {
                return data.availableImages.map(img => ({
                    url: getImageUrlPcard(codigo, img.index),
                    index: img.index
                }));
            }
        }
    } catch (error) {
        console.log('⚠️ ProductCard - No se pudieron obtener múltiples imágenes:', error.message);
    }
    
    // Fallback: imagen única
    return [{
        url: getImageUrlPcard(codigo),
        index: 0
    }];
};

// ✅ Función de normalización de producto
const normalizarProductoPcard = (producto) => {
  if (!producto) return null;
  
  const productoNormalizado = {
    // ✅ DATOS BÁSICOS
    id: producto.id || producto.idProducto || `prod_${Date.now()}`,
    codigo: producto.codigo || 'N/A',
    nombre: producto.nombre || 'Producto sin nombre',
    modelo: producto.modelo || producto.numParte || producto.no_parte || '',
    marca: producto.marca || 'Sin marca',
    categoria: producto.categoria || 'General',
    subcategoria: producto.subcategoria || '',
    descripcion_corta: producto.descripcion_corta || producto.descripcion || '',
    imagen: producto.imagen || '',
    
    // ✅ DATOS DE PRECIO
    precio: typeof producto.precio === 'number' ? producto.precio : 
            typeof producto.precio === 'string' ? parseFloat(producto.precio) || 0 : 0,
    
    precioPromocion: typeof producto.precioPromocion === 'number' ? producto.precioPromocion : 
                     typeof producto.precioPromocion === 'string' ? parseFloat(producto.precioPromocion) || 0 : 0,
    
    moneda: producto.moneda || 'USD',
    
    // ✅ PRECIO MXN DEL BACKEND
    precioMXN: producto.precioMXN || 0,
    
    // ✅ PRECIO PROMOCIONAL MXN DEL BACKEND
    precioPromocionMXN: producto.precioPromocionMXN,
    
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
    const [isAddingToCartPcard, setIsAddingToCartPcard] = useState(false);
    const imgRefPcard = useRef(null);
    const retryCountRefPcard = useRef(0);

    // ✅ Contexto de favoritos
    const { isFavorite, toggleFavorite } = useFavorites();
    
    // ✅ Contexto del carrito
    const { addToCart } = useCart();

    // ✅ Normalizar el producto
    const normalizedProductPcard = useMemo(() => {
        const normalized = normalizarProductoPcard(product);
        
        if (normalized && normalized.codigo) {
            normalized.codigo = normalized.codigo.trim().toUpperCase();
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

    // ✅ CÁLCULO DE PRECIOS CON 10% ADICIONAL - SINCronizado con QuickViewModal
    const productCalculationsPcard = useMemo(() => {
        if (!normalizedProductPcard) {
            return {
                tienePromocionActivaPcard: false,
                precioBaseMXNPcard: '0.00',
                precioPromoMXNPcard: null,
                discountPercentagePcard: 0,
                precioFinalMXNPcard: '0.00',
                ahorroMXNPcard: '0.00',
                precioBaseNumerico: 0,
                precioPromoNumerico: null,
                precioFinalNumerico: 0,
                porcentajeAdicional: PORCENTAJE_ADICIONAL,
                monedaOriginal: 'USD'
            };
        }
        
        // ✅ PRECIO BASE EN MXN (del backend) + 10% (SINCRONIZADO)
        const precioMXNOriginal = normalizedProductPcard.precioMXN || normalizedProductPcard.precio || 0;
        const precioBaseCon10 = agregarPorcentajeAdicionalPcard(precioMXNOriginal);
        
        // ✅ DETECCIÓN DE PROMOCIONES - LÓGICA IDÉNTICA A QuickViewModal
        let precioPromoCon10 = null;
        let tienePromocionActivaPcard = false;
        let discountPercentagePcard = 0;

        // ✅ 1. VERIFICAR SI HAY PROMOCIONES EN EL ARRAY
        if (normalizedProductPcard.promociones && normalizedProductPcard.promociones.length > 0) {
            const promocionActiva = normalizedProductPcard.promociones[0];
            
            if (promocionActiva && promocionActiva.tipo === 'porcentaje') {
                // ✅ ES PORCENTAJE: calcular descuento porcentual
                const porcentajeDescuento = promocionActiva.promocion; // ej: 5 para 5%
                
                if (porcentajeDescuento > 0 && porcentajeDescuento < 100) {
                    const descuento = (precioMXNOriginal * porcentajeDescuento) / 100;
                    const precioConDescuento = precioMXNOriginal - descuento;
                    
                    // Aplicar 10% adicional al precio con descuento
                    precioPromoCon10 = agregarPorcentajeAdicionalPcard(precioConDescuento);
                    tienePromocionActivaPcard = precioPromoCon10 < precioBaseCon10;
                    
                    if (tienePromocionActivaPcard) {
                        discountPercentagePcard = Math.round(((precioBaseCon10 - precioPromoCon10) / precioBaseCon10) * 100);
                    }
                }
            } else if (promocionActiva && promocionActiva.promocion) {
                // Precio directo
                let precioPromoMXN = promocionActiva.promocion;
                if (normalizedProductPcard.moneda === 'USD') {
                    precioPromoMXN = promocionActiva.promocion * (normalizedProductPcard.tipo_cambio || 18.4);
                }
                precioPromoCon10 = agregarPorcentajeAdicionalPcard(precioPromoMXN);
            }
        } else if (normalizedProductPcard.precioPromocion) {
            // ✅ 2. VERIFICAR precioPromocion directo
            let precioPromoMXN = normalizedProductPcard.precioPromocion;
            if (normalizedProductPcard.moneda === 'USD') {
                precioPromoMXN = normalizedProductPcard.precioPromocion * (normalizedProductPcard.tipo_cambio || 18.4);
            }
            precioPromoCon10 = agregarPorcentajeAdicionalPcard(precioPromoMXN);
        } else if (normalizedProductPcard.precioPromocionMXN) {
            // ✅ 3. VERIFICAR precioPromocionMXN del backend
            precioPromoCon10 = agregarPorcentajeAdicionalPcard(normalizedProductPcard.precioPromocionMXN);
        }

        // ✅ Determinar si tiene promoción activa (misma lógica que QuickViewModal)
        tienePromocionActivaPcard = precioPromoCon10 !== null && precioPromoCon10 < precioBaseCon10;
        
        // ✅ Calcular porcentaje de descuento
        if (tienePromocionActivaPcard && precioBaseCon10 > 0) {
            discountPercentagePcard = Math.round(((precioBaseCon10 - precioPromoCon10) / precioBaseCon10) * 100);
        }

        // ✅ Formatear precios (mismo formato que QuickViewModal)
        const formatearPrecioPcard = (precio) => {
            if (typeof precio !== 'number' || isNaN(precio) || precio <= 0) return '0.00';
            return precio.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };

        // ✅ Calcular ahorro
        const ahorroMXNPcard = tienePromocionActivaPcard ? (precioBaseCon10 - precioPromoCon10) : 0;

        // ✅ Precio final numérico para el carrito
        const precioFinalNumericoValor = tienePromocionActivaPcard ? precioPromoCon10 : precioBaseCon10;

        return {
            tienePromocionActivaPcard,
            precioBaseMXNPcard: formatearPrecioPcard(precioBaseCon10),
            precioPromoMXNPcard: tienePromocionActivaPcard ? formatearPrecioPcard(precioPromoCon10) : null,
            discountPercentagePcard,
            precioFinalMXNPcard: formatearPrecioPcard(precioFinalNumericoValor),
            ahorroMXNPcard: formatearPrecioPcard(ahorroMXNPcard),
            // ✅ VALORES NUMÉRICOS PARA EL CARRITO (importante)
            precioBaseNumerico: precioBaseCon10,
            precioPromoNumerico: precioPromoCon10,
            precioFinalNumerico: precioFinalNumericoValor,
            porcentajeAdicional: PORCENTAJE_ADICIONAL,
            monedaOriginal: normalizedProductPcard.moneda || 'USD',
            // Para debug
            precioMXNOriginal: precioMXNOriginal,
            precioBaseCon10: precioBaseCon10,
            precioPromoCon10: precioPromoCon10
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
        
        const loadImages = async () => {
            try {
                const images = await fetchProductImages(normalizedProductPcard.codigo);
                
                if (images.length > 0) {
                    const firstImage = images[0];
                    const url = firstImage.url;
                    setCurrentImageUrlPcard(url);
                } else {
                    setImageStatusPcard('error');
                }
            } catch (error) {
                console.error('❌ ProductCard - Error cargando imágenes:', error);
                setImageStatusPcard('error');
            }
        };
        
        loadImages();
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
            
            if (retryCountRefPcard.current < 1) {
                retryCountRefPcard.current += 1;
                
                setTimeout(() => {
                    if (!isMountedPcard) return;
                    const fallbackUrl = getImageUrlPcard(normalizedProductPcard?.codigo);
                    setCurrentImageUrlPcard(fallbackUrl);
                    setImageStatusPcard('loading');
                }, 500);
            } else {
                setImageStatusPcard('error');
            }
        };

        img.addEventListener('load', handleLoadPcard);
        img.addEventListener('error', handleErrorPcard);

        img.src = currentImageUrlPcard;
        img.crossOrigin = "anonymous";
        img.loading = "lazy";

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

    // ✅ Manejo de ver detalles
    const handleViewDetailsPcard = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!normalizedProductPcard) return;
        
        const productCode = normalizedProductPcard.codigo;
        
        if (productCode && productCode !== 'N/A') {
            navigate(`/product/${productCode}`);
        } else {
            navigate(`/product/${normalizedProductPcard.id}`);
        }
    }, [normalizedProductPcard, navigate]);

    // ✅ Manejo de agregar al carrito - SINCronizado con QuickViewModal
    const handleAddToCartClickPcard = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!normalizedProductPcard) return;
        
        setIsAddingToCartPcard(true);
        
        try {
            // ✅ Preparar el producto con los precios CORRECTOS
            const productToAdd = {
                ...normalizedProductPcard,
                // ✅ ID único
                id: normalizedProductPcard.id || normalizedProductPcard.idProducto || normalizedProductPcard.codigo,
                idProducto: normalizedProductPcard.idProducto || normalizedProductPcard.id || normalizedProductPcard.codigo,
                // ✅ PRECIO FINAL CORRECTO (ya incluye 10% y descuentos si aplica)
                precioFinal: productCalculationsPcard.precioFinalNumerico,
                precio: productCalculationsPcard.precioFinalNumerico, // Para compatibilidad
                // ✅ PRECIO BASE (con 10%)
                precioBaseCon10: productCalculationsPcard.precioBaseNumerico,
                // ✅ PRECIO PROMO (con 10% si aplica)
                precioPromoCon10: productCalculationsPcard.precioPromoNumerico,
                // ✅ Información de promoción
                tienePromocion: productCalculationsPcard.tienePromocionActivaPcard,
                discountPercentage: productCalculationsPcard.discountPercentagePcard,
                porcentajeAdicional: PORCENTAJE_ADICIONAL,
                // ✅ Stock
                existencia: normalizedProductPcard.existencia || normalizedProductPcard.stock || 0,
                // ✅ Moneda original
                moneda: normalizedProductPcard.moneda || 'USD',
                precioMXN: normalizedProductPcard.precioMXN || normalizedProductPcard.precio || 0,
                // ✅ Precios originales para referencia
                precioMXNOriginal: productCalculationsPcard.precioMXNOriginal,
                precioOriginal: normalizedProductPcard.precio || 0
            };

            console.log('📦 ProductCard - Añadiendo al carrito:', {
                nombre: productToAdd.nombre,
                precioFinal: productToAdd.precioFinal,
                precioFinalMostrado: productCalculationsPcard.precioFinalMXNPcard,
                tienePromocion: productToAdd.tienePromocion,
                discountPercentage: productToAdd.discountPercentage
            });

            // ✅ Llamar a la función del contexto del carrito
            addToCart(productToAdd, 1);
            
            // ✅ Si hay una función onAddToCart pasada como prop
            if (onAddToCart) {
                onAddToCart(normalizedProductPcard);
            }
            
        } catch (error) {
            console.error('❌ ProductCard - Error al añadir al carrito:', error);
        } finally {
            setTimeout(() => {
                setIsAddingToCartPcard(false);
            }, 500);
        }
    }, [normalizedProductPcard, productCalculationsPcard, addToCart, onAddToCart]);

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
        porcentajeAdicional,
        precioBaseNumerico,
        precioPromoNumerico,
        precioFinalNumerico
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
            {/* ✅ Badge de promoción - SOLO SI HAY PROMOCIÓN REAL */}
            {tienePromocionActivaPcard && discountPercentagePcard > 0 && discountPercentagePcard < 99 && (
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

                {/* ✅ PRECIOS EN MXN CON 10% ADICIONAL - SINCronizado */}
                <div className="product-prices-pcard">
                    {tienePromocionActivaPcard && precioPromoMXNPcard ? (
                        <>
                            {/* PRECIO PROMOCIONAL CON 10% */}
                            <div className="price-promo-pcard">
                                <span className="current-price-pcard">${precioFinalMXNPcard}</span>
                                <span className="currency-pcard">MXN</span>
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
                        </div>
                    )}
                </div>

                {/* ✅ Existencia y botón de carrito */}
                <div className="product-stock-pcard">
                    <span className={`stock-badge-pcard ${normalizedProductPcard.stockBajo ? 'stock-low-pcard' : 'in-stock-pcard'}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                        {normalizedProductPcard.existencia > 10 ? 'Disponible' : `Últimas ${normalizedProductPcard.existencia} unidades`}
                    </span>
                    
                    {/* ✅ BOTÓN DE CARRITO AÑADIDO AL LADO */}
                    <button 
                        className="cart-btn-pcard"
                        onClick={handleAddToCartClickPcard}
                        disabled={isAddingToCartPcard}
                        title="Agregar al carrito"
                        aria-label="Agregar al carrito"
                    >
                        {isAddingToCartPcard ? (
                            <div className="cart-btn-spinner"></div>
                        ) : (
                            <svg className="cart-icon-pcard" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                    </button>
                </div>

                {/* ✅ Información adicional */}
                {normalizedProductPcard.modelo && (
                    <div className="product-model-pcard">
                        <small>Modelo: {normalizedProductPcard.modelo}</small>
                    </div>
                )}

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
                </div>
            </div>
        </div>
    );
};

export default React.memo(ProductCard);