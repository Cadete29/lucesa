import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ProductCard from '../Product Card/ProductCard';
import { useProductoPorId, useProductos } from '../../api/productosHooks';
import './ProductDetails.css';

const ProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [imageErrors, setImageErrors] = useState(new Set());

    // Usar datos reales de la API con los nuevos hooks
    const { data: productResponse, loading, error } = useProductoPorId(productId);
    const { data: allProductsResponse } = useProductos();

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

    // ✅ MISMO SISTEMA DE IMÁGENES QUE PRODUCTCARD
    const getImageUrl = (codigo, size = 'full') => {
        return `http://localhost:4004/api/images/code/${codigo}?size=${size}`;
    };

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

    // ✅ USAR LA MISMA LÓGICA QUE PRODUCTCARD PARA PRECIOS
    const productCalculations = useMemo(() => {
        if (!productoProcesado) return {
            tienePromocionActiva: false,
            currentPromotion: null,
            precioBaseMXN: '0.00',
            precioPromoMXN: null,
            discountPercentage: 0,
            precioFinalMXN: '0.00',
            precioOriginalUSD: 0,
            tipoCambioUsado: 20
        };

        const hasActivePromotion = productoProcesado.promociones && productoProcesado.promociones.length > 0;
        const currentPromotion = hasActivePromotion ? productoProcesado.promociones[0] : null;
        
        // ✅ MISMA CONVERSIÓN QUE PRODUCTCARD
        const convertirAMXN = (precio) => {
            if (!precio) return 0;
            return precio * (productoProcesado.tipoCambio || 20);
        };

        // Precio base en MXN (SIEMPRE convertir)
        const precioBaseMXN = convertirAMXN(productoProcesado.precio);
        
        // Precio promocional en MXN (si existe promoción o precioPromocion)
        const precioPromoMXN = currentPromotion ? 
            convertirAMXN(currentPromotion.promocion) : 
            (productoProcesado.precioPromocion ? convertirAMXN(productoProcesado.precioPromocion) : null);

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
            precioOriginalUSD: productoProcesado.precio,
            tipoCambioUsado: productoProcesado.tipoCambio || 20
        };
    }, [productoProcesado]);

    // ✅ DESESTRUCTURAR LOS CÁLCULOS
    const {
        tienePromocionActiva,
        precioBaseMXN,
        precioPromoMXN,
        discountPercentage,
        precioFinalMXN,
        precioOriginalUSD,
        tipoCambioUsado
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

    const handleAddToCart = () => {
        const cartItem = {
            ...productoProcesado,
            quantity,
            precioFinal: tienePromocionActiva ? precioPromoMXN : precioFinalMXN
        };
        
        console.log('🛒 Agregado al carrito:', cartItem);
        
        const existingCart = JSON.parse(localStorage.getItem('ctonline_cart') || '[]');
        const existingItemIndex = existingCart.findIndex(item => 
            item.id === productoProcesado.id || item.idProducto === productoProcesado.idProducto
        );
        
        if (existingItemIndex >= 0) {
            existingCart[existingItemIndex].quantity += quantity;
        } else {
            existingCart.push(cartItem);
        }
        
        localStorage.setItem('ctonline_cart', JSON.stringify(existingCart));
        
        alert(`¡${quantity} x ${productoProcesado.nombre} agregado al carrito!`);
    };

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

    // ✅ RENDERIZADO CONDICIONAL - DEBE IR DESPUÉS DE TODOS LOS HOOKS
    if (loading) {
        return (
            <div className="product-details-loading">
                <div className="loading-spinner"></div>
                <p>Cargando producto...</p>
            </div>
        );
    }

    if (error || !productoProcesado) {
        return (
            <div className="product-not-found">
                <div className="error-icon">❌</div>
                <h2>Producto no encontrado</h2>
                <p>{error || 'El producto que buscas no está disponible.'}</p>
                <div className="not-found-actions">
                    <Link to="/products" className="btn-primary">
                        Volver a Productos
                    </Link>
                    <button onClick={() => window.location.reload()} className="btn-secondary">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="product-details">
            <div className="container">
                {/* Migas de pan */}
                <nav className="breadcrumb">
                    <Link to="/">Inicio</Link>
                    <span> / </span>
                    <Link to="/products">Productos</Link>
                    <span> / </span>
                    <Link to={`/products?category=${encodeURIComponent(productoProcesado.categoria || 'todos')}`}>
                        {productoProcesado.categoria || 'Categoría'}
                    </Link>
                    <span> / </span>
                    <span className="current">{productoProcesado.nombre}</span>
                </nav>

                <div className="product-details-content">
                    {/* Galería de imágenes */}
                    <div className="product-gallery">
                        <div className="main-image">
                            <img 
                                src={images[selectedImage]} 
                                alt={productoProcesado.nombre}
                                onError={(e) => handleImageError(e, selectedImage)}
                                crossOrigin="anonymous"
                            />
                            {tienePromocionActiva && (
                                <div className="promotion-badge-large">
                                    -{discountPercentage}% OFF
                                </div>
                            )}
                            {totalStock <= 0 ? (
                                <div className="out-of-stock-badge">
                                    AGOTADO
                                </div>
                            ) : null}
                        </div>
                        
                        {images.length > 1 && (
                            <div className="image-thumbnails">
                                {images.map((img, index) => (
                                    <button
                                        key={index}
                                        className={`thumbnail ${selectedImage === index ? 'active' : ''} ${imageErrors.has(index) ? 'error' : ''}`}
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
                                            <div className="thumbnail-error">❌</div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Información principal del producto */}
                    <div className="product-info-main">
                        <div className="product-header">
                            <span className="product-brand">{productoProcesado.marca}</span>
                            <h1 className="product-title">{productoProcesado.nombre}</h1>
                            <div className="product-codes">
                                <span><strong>Clave:</strong> {productoProcesado.codigo}</span>
                                {productoProcesado.numParte && (
                                    <span><strong>Número de parte:</strong> {productoProcesado.numParte}</span>
                                )}
                            </div>
                        </div>

                        <div className="product-pricing">
                            {tienePromocionActiva ? (
                                <div className="pricing-with-promo">
                                    <div className="current-price">
                                        <span className="currency">MXN </span>
                                        <span className="price">${precioPromoMXN}</span>
                                    </div>
                                    <div className="original-price">
                                        <span className="price">${precioBaseMXN}</span>
                                        <span className="discount">-{discountPercentage}%</span>
                                    </div>
                                    {activePromotion && activePromotion.vigencia && (
                                        <div className="promotion-timer">
                                            <span>🔥 Oferta termina {formatDate(activePromotion.vigencia.fin)}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="pricing-normal">
                                    <span className="currency">MXN </span>
                                    <span className="price">${precioFinalMXN}</span>
                                </div>
                            )}
                            
                            {productoProcesado.moneda === 'USD' && (
                                <div className="exchange-info">
                                    <span>Tipo de cambio: ${tipoCambioUsado} MXN/USD</span>
                                </div>
                            )}
                        </div>

                        <div className="product-description-short">
                            <p>{productoProcesado.descripcion}</p>
                        </div>

                        {/* Stock y ubicaciones */}
                        <div className="product-stock-info">
                            <div className="stock-status">
                                {totalStock > 0 ? (
                                    <span className="in-stock">✓ En stock ({totalStock} disponibles)</span>
                                ) : (
                                    <span className="out-of-stock">✗ Agotado</span>
                                )}
                            </div>
                            
                            {totalStock > 0 && productoProcesado.existencia && typeof productoProcesado.existencia === 'object' && (
                                <div className="stock-locations">
                                    <strong>Disponible en:</strong>
                                    <div className="locations-list">
                                        {Object.entries(productoProcesado.existencia).map(([location, stock]) => {
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
                                        onClick={handleDecrement}
                                        disabled={quantity <= 1 || totalStock === 0}
                                        className="quantity-btn"
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
                                            // ✅ Corrección adicional para cuando el usuario escribe manualmente
                                            const value = parseInt(e.target.value) || 1;
                                            handleQuantityChange(value);
                                        }}
                                        disabled={totalStock === 0}
                                        className="quantity-input"
                                    />
                                    <button 
                                        onClick={handleIncrement}
                                        disabled={quantity >= totalStock || totalStock === 0}
                                        className="quantity-btn"
                                        type="button"
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
                                    <span className="btn-icon">🛒</span>
                                    Agregar al Carrito
                                </button>
                                <button 
                                    className="btn-buy-now"
                                    onClick={handleBuyNow}
                                    disabled={totalStock === 0}
                                >
                                    <span className="btn-icon">⚡</span>
                                    Comprar Ahora
                                </button>
                            </div>
                        </div>

                        {/* Información adicional */}
                        <div className="product-meta-info">
                            {productoProcesado.sustituto && productoProcesado.sustituto !== productoProcesado.codigo && (
                                <div className="substitute-info">
                                    <strong>Sustituto:</strong> {productoProcesado.sustituto}
                                </div>
                            )}
                            
                            {activePromotion && activePromotion.vigencia && (
                                <div className="promotion-info">
                                    <strong>Oferta válida hasta:</strong>{' '}
                                    {formatDate(activePromotion.vigencia.fin)}
                                </div>
                            )}
                        </div>

                        {/* Envío y devoluciones */}
                        <div className="shipping-preview">
                            <div className="shipping-item">
                                <span className="shipping-icon">🚚</span>
                                <div>
                                    <strong>Envío gratis</strong> en pedidos mayores a $500 MXN
                                </div>
                            </div>
                            <div className="shipping-item">
                                <span className="shipping-icon">↩️</span>
                                <div>
                                    <strong>30 días</strong> para devoluciones
                                </div>
                            </div>
                            <div className="shipping-item">
                                <span className="shipping-icon">🛡️</span>
                                <div>
                                    <strong>Garantía</strong> incluida
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs de información detallada */}
                <div className="product-tabs">
                    <div className="tab-headers">
                        <button 
                            className={`tab-header ${activeTab === 'description' ? 'active' : ''}`}
                            onClick={() => setActiveTab('description')}
                        >
                            Descripción
                        </button>
                        <button 
                            className={`tab-header ${activeTab === 'specifications' ? 'active' : ''}`}
                            onClick={() => setActiveTab('specifications')}
                        >
                            Especificaciones
                        </button>
                        <button 
                            className={`tab-header ${activeTab === 'shipping' ? 'active' : ''}`}
                            onClick={() => setActiveTab('shipping')}
                        >
                            Envío y Garantía
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'description' && (
                            <div className="tab-panel">
                                <h3>Descripción del Producto</h3>
                                <p>{productoProcesado.descripcion_larga || productoProcesado.descripcion}</p>
                                
                                <div className="features-list">
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
                            <div className="tab-panel">
                                <h3>Especificaciones Técnicas</h3>
                                <div className="specifications-grid">
                                    {productoProcesado.especificaciones ? (
                                        Object.entries(productoProcesado.especificaciones).map(([key, value]) => (
                                            <div key={key} className="spec-item">
                                                <span className="spec-label">{key}:</span>
                                                <span className="spec-value">{value}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-specifications">
                                            <p>No hay especificaciones técnicas disponibles para este producto.</p>
                                            <div className="default-specs">
                                                <div className="spec-item">
                                                    <span className="spec-label">Marca:</span>
                                                    <span className="spec-value">{productoProcesado.marca}</span>
                                                </div>
                                                <div className="spec-item">
                                                    <span className="spec-label">Categoría:</span>
                                                    <span className="spec-value">{productoProcesado.categoria}</span>
                                                </div>
                                                <div className="spec-item">
                                                    <span className="spec-label">Subcategoría:</span>
                                                    <span className="spec-value">{productoProcesado.subcategoria}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'shipping' && (
                            <div className="tab-panel">
                                <h3>Envío y Garantía</h3>
                                <div className="shipping-info">
                                    <div className="info-section">
                                        <h4>🚚 Opciones de Envío</h4>
                                        <ul>
                                            <li><strong>Envío estándar:</strong> 3-5 días hábiles - $99 MXN</li>
                                            <li><strong>Envío express:</strong> 1-2 días hábiles - $199 MXN</li>
                                            <li><strong>Recoge en tienda:</strong> Gratis (Disponible en CDMX, QRO, MTY)</li>
                                            <li><strong>Envío gratis:</strong> En compras mayores a $500 MXN</li>
                                        </ul>
                                    </div>
                                    
                                    <div className="info-section">
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
                    <div className="related-products">
                        <h2>Productos Relacionados</h2>
                        <div className="related-products-grid">
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