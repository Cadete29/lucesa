import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ProductCard from '../Product Card/ProductCard';
import { useProductoPorId, useProductos } from '../../api/productosHooks';
import { useCart } from '../../context/CartContext';
import './ProductDetails.css';

// ✅ Configuración de URLs por entorno
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

const ProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [imageErrors, setImageErrors] = useState(new Set());
    const [showCartNotification, setShowCartNotification] = useState(false);

    // Usar el contexto del carrito
    const { addToCart, openCart } = useCart();

    // Usar datos reales de la API con los nuevos hooks
    const { data: productResponse, loading, error } = useProductoPorId(productId);
    const { data: allProductsResponse } = useProductos();

    // ✅ FUNCIÓN: Obtener URL de imagen usando la configuración por entorno
    const getImageUrl = (codigo, size = 'full') => {
        if (!codigo) {
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjAgMTIwSDE0MFYxNDBIMTIwVjEyMFpNMTYwIDEyMEgxODBWMTQwSDE2MFYxMjBaTTIwMCAxMjBIMjIwVjE0MEgyMDBWMTIwWk0xMjAgMTYwSDE0MFYxODBIMTIwVjE2MFpNMTYwIDE2MEgxODBWMTgwSDE2MFYxNjBaTTIwMCAxNjBIMjIwVjE4MEgyMDBWMTYwWk0xMjAgMjAwSDE0MFYyMjBIMTIwVjIwMFpNMTYwIDIwMEgxODBWMjIwSDE2MFYyMDBaTTIwMCAyMDBIMjIwVjIyMEgyMDBWMjAwWiIgZmlsbD0iI0RERURGMCIvPgo8dGV4dCB4PSIyMDAiIHk9IjI0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTY5Njk2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZW4gTm8gRGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+';
        }
        return `${IMAGE_BASE_URL}/${codigo}?size=${size}`;
    };

    // **FUNCIÓN: Procesar producto para normalizar estructura**
    const procesarProducto = (producto) => {
        if (!producto) return null;
        
        return {
            ...producto,
            id: producto.idProducto || producto.id,
            codigo: producto.codigo || producto.clave,
            nombre: producto.nombre,
            descripcion: producto.descripcion_corta || producto.descripcion,
            precio: producto.precio,
            moneda: producto.moneda,
            tipoCambio: producto.tipoCambio || 20,
            marca: producto.marca,
            categoria: producto.categoria,
            subcategoria: producto.subcategoria,
            existencia: producto.existencia,
            promociones: producto.promociones,
            imagen: producto.imagen,
            // Propiedades adicionales para detalles
            descripcion_larga: producto.descripcion_larga || producto.descripcion,
            especificaciones: producto.especificaciones,
            imagenes_adicionales: producto.imagenes_adicionales || []
        };
    };

    // ✅ USAR useMemo PARA EVITAR RECÁLCULOS INNECESARIOS
    const productoProcesado = useMemo(() => {
        return procesarProducto(productResponse?.data);
    }, [productResponse?.data]);

    const allProducts = allProductsResponse?.data || [];

    // ✅ CORRECCIÓN MEJORADA: Productos relacionados
    useEffect(() => {
        if (!productoProcesado || !Array.isArray(allProducts) || allProducts.length === 0) {
            setRelatedProducts([]);
            return;
        }

        const currentProductId = productoProcesado.idProducto || productoProcesado.id;
        console.log('🔍 Buscando productos relacionados para:', productoProcesado.nombre);
        console.log('📊 Total de productos disponibles:', allProducts.length);
        
        const related = allProducts
            .filter(p => {
                const pId = p.idProducto || p.id;
                const isSameProduct = pId.toString() === currentProductId.toString();
                
                if (isSameProduct) return false;
                
                // ✅ CRITERIOS MÁS FLEXIBLES
                const sameCategory = p.categoria && productoProcesado.categoria && 
                                   p.categoria === productoProcesado.categoria;
                const sameBrand = p.marca && productoProcesado.marca && 
                                p.marca === productoProcesado.marca;
                const sameSubcategory = p.subcategoria && productoProcesado.subcategoria && 
                                      p.subcategoria === productoProcesado.subcategoria;
                
                return sameCategory || sameBrand || sameSubcategory;
            })
            .slice(0, 4)
            .map(p => procesarProducto(p));
        
        console.log('🎯 Productos relacionados encontrados:', related.length);
        console.log('📦 Productos:', related);
        
        setRelatedProducts(related);
    }, [productoProcesado, allProducts]);

    const handleImageError = (e, imageIndex) => {
        console.log('❌ Error cargando imagen via proxy:', e.target.src);
        
        setImageErrors(prev => {
            const newErrors = new Set(prev);
            newErrors.add(imageIndex);
            return newErrors;
        });
        
        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjAgMTIwSDE0MFYxNDBIMTIwVjEyMFpNMTYwIDEyMEgxODBWMTQwSDE2MFYxMjBaTTIwMCAxMjBIMjIwVjE0MEgyMDBWMTIwWk0xMjAgMTYwSDE0MFYxODBIMTIwVjE2MFpNMTYwIDE2MEgxODBWMTgwSDE2MFYxNjBaTTIwMCAxNjBIMjIwVjE4MEgyMDBWMTYwWk0xMjAgMjAwSDE0MFYyMjBIMTIwVjIwMFpNMTYwIDIwMEgxODBWMjIwSDE2MFYyMDBaTTIwMCAyMDBIMjIwVjIyMEgyMDBWMjAwWiIgZmlsbD0iI0RERURGMCIvPgo8dGV4dCB4PSIyMDAiIHk9IjI0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTY5Njk2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZW4gTm8gRGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+';
        e.target.onerror = null;
    };

    // ✅ USAR LA MISMA LÓGICA QUE PRODUCTCARD PARA PRECIOS CON 10% ADICIONAL
    const productCalculations = useMemo(() => {
        if (!productoProcesado) return {
            tienePromocionActiva: false,
            currentPromotion: null,
            precioBaseMXN: '0.00',
            precioPromoMXN: null,
            discountPercentage: 0,
            precioFinalMXN: '0.00',
            precioOriginalBase: 0,
            precioOriginalPromo: null
        };

        const hasActivePromotion = productoProcesado.promociones && productoProcesado.promociones.length > 0;
        const currentPromotion = hasActivePromotion ? productoProcesado.promociones[0] : null;
        
        // ✅ FUNCIÓN PARA AGREGAR 10% AL PRECIO (APLICA PARA BASE Y PROMOCIONES)
        const agregarDiezPorciento = (precio) => {
            if (!precio || typeof precio !== 'number') return 0;
            // Agregar 10% al precio original
            return precio * 1.10;
        };

        // Precio base en MXN CON 10% ADICIONAL
        const precioBaseOriginal = productoProcesado.precio || 0;
        const precioBaseMXN = agregarDiezPorciento(precioBaseOriginal);
        
        // ✅ PRECIO PROMOCIONAL EN MXN CON 10% ADICIONAL
        let precioPromoOriginal = null;
        let precioPromoMXN = null;

        if (currentPromotion) {
            // Si hay promoción activa, aplicar 10% al precio promocional
            precioPromoOriginal = currentPromotion.promocion;
            precioPromoMXN = agregarDiezPorciento(precioPromoOriginal);
        } else if (productoProcesado.precioPromocion) {
            // Si hay precio promocional directo, aplicar 10%
            precioPromoOriginal = productoProcesado.precioPromocion;
            precioPromoMXN = agregarDiezPorciento(precioPromoOriginal);
        }

        // Determinar si tiene promoción activa (comparando precios con 10% incluido)
        const tienePromocionActiva = precioPromoMXN !== null && precioPromoMXN < precioBaseMXN;

        // Formatear a 2 decimales
        const formatearPrecio = (precio) => {
            if (typeof precio !== 'number') return '0.00';
            return precio.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };

        // ✅ CÁLCULO DE DESCUENTO CONSIDERANDO EL 10% ADICIONAL
        const discountPercentage = tienePromocionActiva ? 
            Math.round(((precioBaseMXN - precioPromoMXN) / precioBaseMXN) * 100) : 
            0;

        // Calcular ahorro en MXN
        const ahorroMXN = tienePromocionActiva ? 
            (precioBaseMXN - precioPromoMXN) : 0;

        return {
            tienePromocionActiva,
            currentPromotion,
            precioBaseMXN: formatearPrecio(precioBaseMXN),
            precioPromoMXN: tienePromocionActiva ? formatearPrecio(precioPromoMXN) : null,
            discountPercentage,
            precioFinalMXN: tienePromocionActiva ? formatearPrecio(precioPromoMXN) : formatearPrecio(precioBaseMXN),
            ahorroMXN: formatearPrecio(ahorroMXN),
            // Precios originales para referencia
            precioOriginalBase: precioBaseOriginal,
            precioOriginalPromo: precioPromoOriginal,
            // Precios con 10% para cálculos internos
            precioBaseConIncremento: precioBaseMXN,
            precioPromoConIncremento: precioPromoMXN
        };
    }, [productoProcesado]);

    // ✅ DESESTRUCTURAR LOS CÁLCULOS
    const {
        tienePromocionActiva,
        precioBaseMXN,
        precioPromoMXN,
        discountPercentage,
        precioFinalMXN,
        ahorroMXN,
        precioOriginalBase,
        precioOriginalPromo
    } = productCalculations;

    // ✅ STOCK TOTAL MEJORADO - MANEJA MEJOR LOS CASOS BORDES
    const getTotalStock = () => {
        if (!productoProcesado) return 0;

        if (productoProcesado.existencia === undefined || 
            productoProcesado.existencia === null || 
            productoProcesado.existencia === '') {
            return 0;
        }

        if (productoProcesado.existencia === 0 || productoProcesado.existencia === '0') {
            return 0;
        }

        let stockCalculado = 0;

        try {
            if (typeof productoProcesado.existencia === 'object' && productoProcesado.existencia !== null) {
                const valores = Object.values(productoProcesado.existencia);
                stockCalculado = valores.reduce((total, stock) => {
                    const stockNum = Number(stock);
                    return total + (isNaN(stockNum) ? 0 : stockNum);
                }, 0);
            }
            else if (typeof productoProcesado.existencia === 'number') {
                stockCalculado = productoProcesado.existencia;
            }
            else if (typeof productoProcesado.existencia === 'string') {
                stockCalculado = Number(productoProcesado.existencia) || 0;
            }
            else {
                stockCalculado = 0;
            }
        } catch (error) {
            console.error('💥 Error calculando stock:', error);
            stockCalculado = 0;
        }

        return stockCalculado;
    };

    const totalStock = getTotalStock();

    // ✅ CORRECCIÓN MEJORADA: Selector de cantidad
    const handleQuantityChange = (value) => {
        console.log('🔄 Cambiando cantidad de:', quantity, 'a:', value);
        
        if (value < 1) {
            setQuantity(1);
            return;
        }
        
        if (totalStock > 0 && value > totalStock) {
            setQuantity(totalStock);
            return;
        }
        
        // ✅ Asegurar que sea un número válido
        const newQuantity = Math.max(1, Math.min(value, totalStock || 1));
        setQuantity(newQuantity);
    };

    // ✅ CORRECCIÓN: Input change handler mejorado
    const handleInputChange = (e) => {
        const value = parseInt(e.target.value) || 1;
        console.log('📝 Input cambiado a:', value);
        handleQuantityChange(value);
    };

    // ✅ CORRECCIÓN: Manejo directo de los botones
    const handleDecrement = () => {
        const newQuantity = Math.max(1, quantity - 1);
        setQuantity(newQuantity);
    };

    const handleIncrement = () => {
        const newQuantity = totalStock > 0 ? Math.min(quantity + 1, totalStock) : quantity + 1;
        setQuantity(newQuantity);
    };

    const handleQuickView = (relatedProduct) => {
        navigate(`/product/${relatedProduct.idProducto || relatedProduct.id}`);
    };

    // Función para formatear fechas
    const formatDate = (dateString) => {
        if (!dateString) return 'Fecha no disponible';
        try {
            return new Date(dateString).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Fecha no disponible';
        }
    };

    // ✅ FUNCIÓN MEJORADA: Agregar al carrito
    const handleAddToCart = () => {
        if (!productoProcesado) return;
        
        const precioFinalNumerico = tienePromocionActiva ? 
            parseFloat(precioPromoMXN.replace(/,/g, '')) : 
            parseFloat(precioFinalMXN.replace(/,/g, ''));
        
        const cartItem = {
            ...productoProcesado,
            quantity,
            precioFinal: precioFinalNumerico
        };
        
        console.log('🛒 Agregando al carrito:', cartItem);
        
        // Usar la función del contexto
        addToCart(cartItem, quantity);
        
        // Mostrar notificación
        setShowCartNotification(true);
        
        // Ocultar notificación después de 3 segundos
        setTimeout(() => {
            setShowCartNotification(false);
        }, 3000);
    };

    // ✅ FUNCIÓN MEJORADA: Comprar ahora
    const handleBuyNow = () => {
        handleAddToCart();
        navigate('/cart');
    };

    // Verificar si la promoción está activa
    const isPromotionActive = () => {
        if (!productCalculations.currentPromotion || !productCalculations.currentPromotion.vigencia) return false;
        
        try {
            const now = new Date();
            const start = new Date(productCalculations.currentPromotion.vigencia.inicio);
            const end = new Date(productCalculations.currentPromotion.vigencia.fin);
            
            return now >= start && now <= end;
        } catch {
            return false;
        }
    };

    const activePromotion = isPromotionActive() ? productCalculations.currentPromotion : null;

    // ✅ CREAR ARRAY DE IMÁGENES USANDO EL PROXY (IGUAL QUE PRODUCTCARD)
    const images = productoProcesado?.imagenes_adicionales && productoProcesado.imagenes_adicionales.length > 0
        ? [getImageUrl(productoProcesado.codigo), ...productoProcesado.imagenes_adicionales.map(img => 
            img.startsWith('http') ? img : getImageUrl(productoProcesado.codigo)
          )]
        : [getImageUrl(productoProcesado?.codigo)];

    // Agregar console.log para debug
    console.log('📦 Stock total:', totalStock);
    console.log('🔢 Cantidad actual:', quantity);
    console.log('🛒 Producto procesado:', productoProcesado);
    console.log('🌐 Entorno actual:', process.env.NODE_ENV);
    console.log('🖼️ URL base de imágenes:', IMAGE_BASE_URL);
    console.log('💰 Precios calculados:', productCalculations);

    // ✅ RENDERIZADO CONDICIONAL - DEBE IR DESPUÉS DE TODOS LOS HOOKS
    if (loading) {
        return (
            <div className="productdetails-loading">
                <div className="productdetails-loading-spinner"></div>
                <p>Cargando producto...</p>
            </div>
        );
    }

    if (error || !productoProcesado) {
        return (
            <div className="productdetails-not-found">
                <div className="productdetails-error-icon">❌</div>
                <h2>Producto no encontrado</h2>
                <p>{error || 'El producto que buscas no está disponible.'}</p>
                <div className="productdetails-not-found-actions">
                    <Link to="/products" className="productdetails-btn-primary">
                        Volver a Productos
                    </Link>
                    <button onClick={() => window.location.reload()} className="productdetails-btn-secondary">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="productdetails-page">
            {/* Notificación de carrito */}
            {showCartNotification && (
                <div className="cart-notification">
                    <div className="cart-notification-content">
                        <span className="cart-notification-icon">✅</span>
                        <div className="cart-notification-text">
                            <strong>¡Producto agregado!</strong>
                            <span>{quantity} x {productoProcesado.nombre} agregado al carrito</span>
                        </div>
                        <button 
                            className="cart-notification-view"
                            onClick={() => {
                                openCart();
                                setShowCartNotification(false);
                            }}
                        >
                            Ver Carrito
                        </button>
                        <button 
                            className="cart-notification-close"
                            onClick={() => setShowCartNotification(false)}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className="productdetails-container">
                {/* Migas de pan */}
                <nav className="productdetails-breadcrumb">
                    <Link to="/">Inicio</Link>
                    <span> / </span>
                    <Link to="/products">Productos</Link>
                    <span> / </span>
                    <Link to={`/products?category=${encodeURIComponent(productoProcesado.categoria || 'todos')}`}>
                        {productoProcesado.categoria || 'Categoría'}
                    </Link>
                    <span> / </span>
                    <span className="productdetails-current">{productoProcesado.nombre}</span>
                </nav>

                <div className="productdetails-content">
                    {/* Galería de imágenes */}
                    <div className="productdetails-gallery">
                        <div className="productdetails-main-image">
                            <img 
                                src={images[selectedImage]} 
                                alt={productoProcesado.nombre}
                                onError={(e) => handleImageError(e, selectedImage)}
                                crossOrigin="anonymous"
                            />
                            {tienePromocionActiva && (
                                <div className="productdetails-promotion-badge-large">
                                    -{discountPercentage}% OFF
                                </div>
                            )}
                            {totalStock <= 0 ? (
                                <div className="productdetails-out-of-stock-badge">
                                    AGOTADO
                                </div>
                            ) : null}
                        </div>
                        
                        {images.length > 1 && (
                            <div className="productdetails-image-thumbnails">
                                {images.map((img, index) => (
                                    <button
                                        key={index}
                                        className={`productdetails-thumbnail ${selectedImage === index ? 'productdetails-thumbnail-active' : ''} ${imageErrors.has(index) ? 'productdetails-thumbnail-error' : ''}`}
                                        onClick={() => setSelectedImage(index)}
                                        disabled={imageErrors.has(index)}
                                    >
                                        <img 
                                            src={img} 
                                            alt={`${productoProcesado.nombre} ${index + 1}`}
                                            onError={(e) => handleImageError(e, index)}
                                            crossOrigin="anonymous"
                                        />
                                        {imageErrors.has(index) && (
                                            <div className="productdetails-thumbnail-error-icon">❌</div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Información principal del producto */}
                    <div className="productdetails-info-main">
                        <div className="productdetails-header">
                            <span className="productdetails-brand">{productoProcesado.marca}</span>
                            <h1 className="productdetails-title">{productoProcesado.nombre}</h1>
                            <div className="productdetails-codes">
                                <span><strong>Clave:</strong> {productoProcesado.codigo}</span>
                                {productoProcesado.numParte && (
                                    <span><strong>Número de parte:</strong> {productoProcesado.numParte}</span>
                                )}
                            </div>
                        </div>

                        <div className="productdetails-pricing">
                            {tienePromocionActiva ? (
                                <div className="productdetails-pricing-with-promo">
                                    <div className="productdetails-current-price">
                                        <span className="productdetails-currency">MXN </span>
                                        <span className="productdetails-price">${precioPromoMXN}</span>
                                    </div>
                                    <div className="productdetails-original-price">
                                        <span className="productdetails-price">${precioBaseMXN}</span>
                                        <span className="productdetails-discount">-{discountPercentage}%</span>
                                    </div>
                                    <div className="productdetails-savings-info">
                                        <span className="productdetails-savings-amount">Ahorras ${ahorroMXN} MXN</span>
                                    </div>
                                    {activePromotion && activePromotion.vigencia && (
                                        <div className="productdetails-promotion-timer">
                                            <span>🔥 Oferta termina {formatDate(activePromotion.vigencia.fin)}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="productdetails-pricing-normal">
                                    <span className="productdetails-currency">MXN </span>
                                    <span className="productdetails-price">${precioFinalMXN}</span>
                                </div>
                            )}
                            
                            {/* Información de debug */}
                            {process.env.NODE_ENV === 'development' && (
                                <div className="productdetails-debug-pricing">
                                    <small>
                                        Precio original: ${precioOriginalBase} | 
                                        {tienePromocionActiva && ` Promo original: $${precioOriginalPromo}`}
                                    </small>
                                </div>
                            )}
                        </div>

                        <div className="productdetails-description-short">
                            <p>{productoProcesado.descripcion}</p>
                        </div>

                        {/* Stock y ubicaciones */}
                        <div className="productdetails-stock-info">
                            <div className="productdetails-stock-status">
                                {totalStock > 0 ? (
                                    <span className="productdetails-in-stock">✓ En stock ({totalStock} disponibles)</span>
                                ) : (
                                    <span className="productdetails-out-of-stock">✗ Agotado</span>
                                )}
                            </div>
                            
                            {totalStock > 0 && productoProcesado.existencia && typeof productoProcesado.existencia === 'object' && (
                                <div className="productdetails-stock-locations">
                                    <strong>Disponible en:</strong>
                                    <div className="productdetails-locations-list">
                                        {Object.entries(productoProcesado.existencia).map(([location, stock]) => {
                                            const stockNum = Number(stock) || 0;
                                            return stockNum > 0 ? (
                                                <div key={location} className="productdetails-location-item">
                                                    <span className="productdetails-location-name">{location}:</span>
                                                    <span className="productdetails-location-stock">{stockNum} unidades</span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cantidad y acciones */}
                        <div className="productdetails-actions">
                            <div className="productdetails-quantity-selector">
                                <label>Cantidad:</label>
                                <div className="productdetails-quantity-controls">
                                    <button 
                                        onClick={handleDecrement}
                                        disabled={quantity <= 1 || totalStock === 0}
                                        className="productdetails-quantity-btn"
                                        type="button"
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number" 
                                        value={quantity}
                                        min="1"
                                        max={totalStock}
                                        onChange={handleInputChange}
                                        onBlur={(e) => {
                                            const value = parseInt(e.target.value) || 1;
                                            handleQuantityChange(value);
                                        }}
                                        disabled={totalStock === 0}
                                        className="productdetails-quantity-input"
                                    />
                                    <button 
                                        onClick={handleIncrement}
                                        disabled={quantity >= totalStock || totalStock === 0}
                                        className="productdetails-quantity-btn"
                                        type="button"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="productdetails-action-buttons">
                                <button 
                                    className="productdetails-btn-add-cart"
                                    onClick={handleAddToCart}
                                    disabled={totalStock === 0}
                                >
                                    <span className="productdetails-btn-icon">🛒</span>
                                    Agregar al Carrito
                                </button>
                                <button 
                                    className="productdetails-btn-buy-now"
                                    onClick={handleBuyNow}
                                    disabled={totalStock === 0}
                                >
                                    <span className="productdetails-btn-icon">⚡</span>
                                    Comprar Ahora
                                </button>
                            </div>
                        </div>

                        {/* Información adicional */}
                        <div className="productdetails-meta-info">
                            {productoProcesado.sustituto && productoProcesado.sustituto !== productoProcesado.codigo && (
                                <div className="productdetails-substitute-info">
                                    <strong>Sustituto:</strong> {productoProcesado.sustituto}
                                </div>
                            )}
                            
                            {activePromotion && activePromotion.vigencia && (
                                <div className="productdetails-promotion-info">
                                    <strong>Oferta válida hasta:</strong>{' '}
                                    {formatDate(activePromotion.vigencia.fin)}
                                </div>
                            )}
                        </div>

                        {/* Envío y devoluciones */}
                        <div className="productdetails-shipping-preview">
                            <div className="productdetails-shipping-item">
                                <span className="productdetails-shipping-icon">🚚</span>
                                <div>
                                    <strong>Envío gratis</strong> en la compra minima de $1000 MXN
                                </div>
                            </div>
                            <div className="productdetails-shipping-item">
                                <span className="productdetails-shipping-icon">↩️</span>
                                <div>
                                    <strong>30 días</strong> para devoluciones
                                </div>
                            </div>
                            <div className="productdetails-shipping-item">
                                <span className="productdetails-shipping-icon">🛡️</span>
                                <div>
                                    <strong>Garantía</strong> incluida
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs de información detallada */}
                <div className="productdetails-tabs">
                    <div className="productdetails-tab-headers">
                        <button 
                            className={`productdetails-tab-header ${activeTab === 'description' ? 'productdetails-tab-header-active' : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            Descripción
                        </button>
                        <button 
                            className={`productdetails-tab-header ${activeTab === 'specifications' ? 'productdetails-tab-header-active' : ''}`}
                            onClick={() => setActiveTab('specifications')}
                        >
                            Especificaciones
                        </button>
                        <button 
                            className={`productdetails-tab-header ${activeTab === 'shipping' ? 'productdetails-tab-header-active' : ''}`}
                            onClick={() => setActiveTab('shipping')}
                        >
                            Envío y Garantía
                        </button>
                    </div>

                    <div className="productdetails-tab-content">
                        {activeTab === 'description' && (
                            <div className="productdetails-tab-panel">
                                <h3>Descripción del Producto</h3>
                                <p>{productoProcesado.descripcion_larga || productoProcesado.descripcion}</p>
                                
                                <div className="productdetails-features-list">
                                    <h4>Características principales:</h4>
                                    <ul>
                                        {productoProcesado.descripcion_larga ? (
                                            productoProcesado.descripcion_larga.split('. ').map((feature, index) => (
                                                feature.trim() && (
                                                    <li key={index}>{feature.trim()}.</li>
                                                )
                                            ))
                                        ) : (
                                            <>
                                                <li>Alta calidad y durabilidad garantizada</li>
                                                <li>Compatibilidad con sistemas estándar de la industria</li>
                                                <li>Fácil instalación y configuración</li>
                                                <li>Soporte técnico especializado</li>
                                                <li>Materiales de primera calidad</li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="productdetails-tab-panel">
                                <h3>Especificaciones Técnicas</h3>
                                <div className="productdetails-specifications-grid">
                                    {productoProcesado.especificaciones ? (
                                        Object.entries(productoProcesado.especificaciones).map(([key, value]) => (
                                            <div key={key} className="productdetails-spec-item">
                                                <span className="productdetails-spec-label">{key}:</span>
                                                <span className="productdetails-spec-value">{value}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="productdetails-no-specifications">
                                            <p>No hay especificaciones técnicas disponibles para este producto.</p>
                                            <div className="productdetails-default-specs">
                                                <div className="productdetails-spec-item">
                                                    <span className="productdetails-spec-label">Marca:</span>
                                                    <span className="productdetails-spec-value">{productoProcesado.marca}</span>
                                                </div>
                                                <div className="productdetails-spec-item">
                                                    <span className="productdetails-spec-label">Categoría:</span>
                                                    <span className="productdetails-spec-value">{productoProcesado.categoria}</span>
                                                </div>
                                                <div className="productdetails-spec-item">
                                                    <span className="productdetails-spec-label">Subcategoría:</span>
                                                    <span className="productdetails-spec-value">{productoProcesado.subcategoria}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'shipping' && (
                            <div className="productdetails-tab-panel">
                                <h3>Envío y Garantía</h3>
                                <div className="productdetails-shipping-info">
                                    <div className="productdetails-info-section">
                                        <h4>🚚 Opciones de Envío</h4>
                                        <ul>
                                            <li><strong>Compra minima de $1000:</strong> (Disponible en CDMX, QRO, MTY)</li>
                                            <li><strong>Envío gratis:</strong> En compras mayores a $1000 MXN</li>
                                        </ul>
                                    </div>
                                    
                                    <div className="productdetails-info-section">
                                        <h4>🛡️ Garantía</h4>
                                        <p>Este producto incluye garantía del fabricante de 1 año contra defectos de fabricación.</p>
                                        <ul>
                                            <li>Cobertura: Defectos de fabricación y materiales</li>
                                            <li>Duración: 12 meses a partir de la fecha de compra</li>
                                            <li>Proceso: Presentar ticket de compra y producto</li>
                                            <li>Exclusiones: Daño por mal uso o modificaciones</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Productos relacionados */}
                {relatedProducts.length > 0 && (
                    <div className="productdetails-related-products">
                        <h2>Productos Relacionados</h2>
                        <div className="productdetails-related-products-grid">
                            {relatedProducts.map(relatedProduct => (
                                <ProductCard 
                                    key={relatedProduct.idProducto || relatedProduct.id} 
                                    product={relatedProduct}
                                    onQuickView={handleQuickView}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetails;