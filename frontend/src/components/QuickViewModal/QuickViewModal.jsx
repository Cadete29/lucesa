import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext'; // ✅ Importar el contexto del carrito
import './QuickViewModal.css';

// ✅ Configuración de URLs por entorno
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

// ✅ Función helper para obtener valores de especificaciones
const getSpecValue = (spec) => {
    if (typeof spec === 'object' && spec !== null && 'valor' in spec) {
        return spec.valor;
    }
    return spec;
};

const QuickViewModal = ({ product, isOpen, onClose }) => {
    const [quantityQvm, setQuantityQvm] = useState(1);
    const [selectedImageQvm, setSelectedImageQvm] = useState(0);
    const [addingToCart, setAddingToCart] = useState(false); // ✅ Estado para feedback visual

    // ✅ Usar el contexto del carrito
    const { addToCart, openCart } = useCart();

    if (!isOpen || !product) return null;

    // ✅ FUNCIÓN: Obtener URL de imagen usando la configuración por entorno
    const getImageUrlQvm = (codigo, size = 'full') => {
        return `${IMAGE_BASE_URL}/${codigo}?size=${size}`;
    };

    // ✅ USAR LA MISMA LÓGICA QUE PRODUCTCARD PARA PRECIOS CON 10% ADICIONAL
    const agregarDiezPorcientoQvm = (precio) => {
        if (!precio || typeof precio !== 'number') return 0;
        // Agregar 10% al precio original
        return precio * 1.10;
    };

    // Precio base en MXN CON 10% ADICIONAL
    const precioBaseOriginalQvm = product.precio || 0;
    const precioBaseMXNQvm = agregarDiezPorcientoQvm(precioBaseOriginalQvm);

    // ✅ PRECIO PROMOCIONAL EN MXN CON 10% ADICIONAL
    let precioPromoOriginalQvm = null;
    let precioPromoMXNQvm = null;

    if (product.promociones && product.promociones.length > 0) {
        // Si hay promoción activa, aplicar 10% al precio promocional
        precioPromoOriginalQvm = product.promociones[0].promocion;
        precioPromoMXNQvm = agregarDiezPorcientoQvm(precioPromoOriginalQvm);
    } else if (product.precioPromocion) {
        // Si hay precio promocional directo, aplicar 10%
        precioPromoOriginalQvm = product.precioPromocion;
        precioPromoMXNQvm = agregarDiezPorcientoQvm(precioPromoOriginalQvm);
    }

    // Determinar si tiene promoción activa (comparando precios con 10% incluido)
    const tienePromocionActivaQvm = precioPromoMXNQvm !== null && precioPromoMXNQvm < precioBaseMXNQvm;

    // Formatear a 2 decimales
    const formatearPrecioQvm = (precio) => {
        if (typeof precio !== 'number') return '0.00';
        return precio.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // ✅ CÁLCULO DE DESCUENTO CONSIDERANDO EL 10% ADICIONAL
    const discountPercentageQvm = tienePromocionActivaQvm ? 
        Math.round(((precioBaseMXNQvm - precioPromoMXNQvm) / precioBaseMXNQvm) * 100) : 
        0;

    // Calcular ahorro en MXN
    const ahorroMXNQvm = tienePromocionActivaQvm ? 
        (precioBaseMXNQvm - precioPromoMXNQvm) : 0;

    // Variables formateadas
    const precioBaseFormateadoQvm = formatearPrecioQvm(precioBaseMXNQvm);
    const precioPromoFormateadoQvm = tienePromocionActivaQvm ? formatearPrecioQvm(precioPromoMXNQvm) : null;
    const precioFinalFormateadoQvm = tienePromocionActivaQvm ? precioPromoFormateadoQvm : precioBaseFormateadoQvm;
    const ahorroFormateadoQvm = formatearPrecioQvm(ahorroMXNQvm);

    // ✅ CORRECCIÓN: Usar la misma lógica de stock que ProductDetail
    const getTotalStockQvm = () => {
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

    const totalStockQvm = getTotalStockQvm();

    const handleQuantityChangeQvm = (value) => {
        if (value < 1) return;
        if (value > totalStockQvm) return;
        setQuantityQvm(value);
    };

    // ✅ FUNCIÓN MEJORADA: Agregar al carrito con feedback visual
    const handleAddToCartQvm = async () => {
        if (totalStockQvm === 0) return;
        
        setAddingToCart(true);
        
        try {
            // ✅ Preparar el producto con todos los datos necesarios
            const productToAdd = {
                ...product,
                // Asegurar que tenemos un ID único
                id: product.id || product.idProducto || product.codigo,
                idProducto: product.idProducto || product.id || product.codigo,
                // Precio final calculado
                precioFinal: tienePromocionActivaQvm ? precioPromoMXNQvm : precioBaseMXNQvm,
                // Información de stock
                existencia: totalStockQvm,
                // Información de promoción
                tienePromocion: tienePromocionActivaQvm,
                discountPercentage: discountPercentageQvm
            };

            // ✅ Llamar a la función del contexto del carrito
            addToCart(productToAdd, quantityQvm);
            
            // ✅ Feedback visual breve antes de cerrar
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // ✅ Opcional: Abrir el carrito después de agregar
            openCart();
            
            // ✅ Cerrar el modal
            onClose();
            
        } catch (error) {
            console.error('Error al agregar al carrito:', error);
        } finally {
            setAddingToCart(false);
        }
    };

    // ✅ FUNCIÓN: Comprar ahora (redirige al carrito)
    const handleQuickBuyQvm = () => {
        if (totalStockQvm === 0) return;
        
        const productToAdd = {
            ...product,
            id: product.id || product.idProducto || product.codigo,
            idProducto: product.idProducto || product.id || product.codigo,
            precioFinal: tienePromocionActivaQvm ? precioPromoMXNQvm : precioBaseMXNQvm,
            existencia: totalStockQvm,
            tienePromocion: tienePromocionActivaQvm,
            discountPercentage: discountPercentageQvm
        };

        addToCart(productToAdd, quantityQvm);
        openCart();
        onClose();
        
        // Opcional: Redirigir al carrito
        // window.location.href = '/cart';
    };

    const imagesQvm = product.imagenes_adicionales && product.imagenes_adicionales.length > 0
        ? [getImageUrlQvm(product.codigo), ...product.imagenes_adicionales]
        : [getImageUrlQvm(product.codigo)];

    // ✅ CORRECCIÓN: Obtener el ID correcto para el enlace
    const getProductDetailUrlQvm = () => {
        const productId = product.idProducto || product.id || product.codigo;
        return `/product/${productId}`;
    };

    return (
        <div className="quickview-modal-qvm">
            <div className="modal-overlay-qvm" onClick={onClose}></div>
            <div className="modal-content-qvm">
                <button className="modal-close-qvm" onClick={onClose}>
                    ×
                </button>

                <div className="quickview-content-qvm">
                    {/* Galería de imágenes */}
                    <div className="quickview-gallery-qvm">
                        <div className="main-image-qvm">
                            <img 
                                src={imagesQvm[selectedImageQvm]} 
                                alt={product.nombre}
                                onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjAgMTIwSDE0MFYxNDBIMTIwVjEyMFpNMTYwIDEyMEgxODBWMTQwSDE2MFYxMjBaTTIwMCAxMjBIMjIwVjE0MEgyMDBWMTIwWk0xMjAgMTYwSDE0MFYxODBIMTIwVjE2MFpNMTYwIDE2MEgxODBWMTgwSDE2MFYxNjBaTTIwMCAxNjBIMjIwVjE4MEgyMDBWMTYwWk0xMjAgMjAwSDE0MFYyMjBIMTIwVjIwMFpNMTYwIDIwMEgxODBWMjIwSDE2MFYyMDBaTTIwMCAyMDBIMjIwVjIyMEgyMDBWMjAwWiIgZmlsbD0iI0RERURGMCIvPgo8dGV4dCB4PSIyMDAiIHk9IjI0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTY5Njk2IiB0ZXh0LWFuY2hvcj9taWRkbGUiPkltYWdlbiBObyBEaXNwb25pYmxlPC90ZXh0Pgo8L3N2Zz4=';
                                }}
                            />
                            {tienePromocionActivaQvm && (
                                <div className="promotion-badge-qvm">
                                    -{discountPercentageQvm}% OFF
                                </div>
                            )}
                        </div>
                        
                        {imagesQvm.length > 1 && (
                            <div className="image-thumbnails-qvm">
                                {imagesQvm.map((img, index) => (
                                    <button
                                        key={index}
                                        className={`thumbnail-qvm ${selectedImageQvm === index ? 'active-qvm' : ''}`}
                                        onClick={() => setSelectedImageQvm(index)}
                                    >
                                        <img src={img} alt={`${product.nombre} ${index + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Información del producto - Misma estructura que ProductDetail */}
                    <div className="quickview-info-qvm">
                        <div className="product-header-qvm">
                            <span className="product-brand-qvm">{product.marca}</span>
                            <h2 className="product-title-qvm">{product.nombre}</h2>
                            <div className="product-codes-qvm">
                                <span><strong>Clave:</strong> {product.codigo}</span>
                                {product.numParte && <span><strong>Número de parte:</strong> {product.numParte}</span>}
                            </div>
                        </div>

                        <div className="product-pricing-qvm">
                            {tienePromocionActivaQvm ? (
                                <div className="pricing-with-promo-qvm">
                                    <div className="current-price-qvm">
                                        <span className="currency-qvm">MXN </span>
                                        <span className="price-qvm">${precioPromoFormateadoQvm}</span>
                                    </div>
                                    <div className="original-price-qvm">
                                        <span className="price-qvm">${precioBaseFormateadoQvm}</span>
                                        <span className="discount-qvm">-{discountPercentageQvm}%</span>
                                    </div>
                                    <div className="savings-info-qvm">
                                        <span className="savings-amount-qvm">Ahorras ${ahorroFormateadoQvm} MXN</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="pricing-normal-qvm">
                                    <span className="currency-qvm">MXN </span>
                                    <span className="price-qvm">${precioFinalFormateadoQvm}</span>
                                </div>
                            )}
                            
                            {/* Información de precios originales para debug */}
                            {process.env.NODE_ENV === 'development' && (
                                <div className="debug-pricing-qvm">
                                    <small>
                                        Precio original: ${precioBaseOriginalQvm} | 
                                        {tienePromocionActivaQvm && ` Promo original: $${precioPromoOriginalQvm}`}
                                    </small>
                                </div>
                            )}
                        </div>

                        <div className="product-description-qvm">
                            <p>{product.descripcion}</p>
                        </div>

                        {/* Stock - Misma lógica que ProductDetail */}
                        <div className="product-stock-info-qvm">
                            {totalStockQvm > 0 ? (
                                <span className="in-stock-qvm">✓ En stock ({totalStockQvm} disponibles)</span>
                            ) : (
                                <span className="out-of-stock-qvm">✗ Agotado</span>
                            )}
                            
                            {totalStockQvm > 0 && product.existencia && typeof product.existencia === 'object' && (
                                <div className="stock-locations-quick-qvm">
                                    <strong>Disponible en:</strong>
                                    <div className="locations-list-qvm">
                                        {Object.entries(product.existencia).map(([location, stock]) => {
                                            const stockNum = Number(stock) || 0;
                                            return stockNum > 0 ? (
                                                <div key={location} className="location-item-qvm">
                                                    <span className="location-name-qvm">{location}:</span>
                                                    <span className="location-stock-qvm">{stockNum} unidades</span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cantidad y acciones */}
                        <div className="product-actions-qvm">
                            <div className="quantity-selector-qvm">
                                <label>Cantidad:</label>
                                <div className="quantity-controls-qvm">
                                    <button 
                                        onClick={() => handleQuantityChangeQvm(quantityQvm - 1)}
                                        disabled={quantityQvm <= 1 || totalStockQvm === 0}
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number" 
                                        value={quantityQvm}
                                        min="1"
                                        max={totalStockQvm}
                                        onChange={(e) => handleQuantityChangeQvm(parseInt(e.target.value) || 1)}
                                        disabled={totalStockQvm === 0}
                                    />
                                    <button 
                                        onClick={() => handleQuantityChangeQvm(quantityQvm + 1)}
                                        disabled={quantityQvm >= totalStockQvm || totalStockQvm === 0}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="action-buttons-qvm">
                                <button 
                                    className={`btn-add-cart-qvm ${addingToCart ? 'adding-to-cart' : ''}`}
                                    onClick={handleAddToCartQvm}
                                    disabled={totalStockQvm === 0 || addingToCart}
                                >
                                    {addingToCart ? (
                                        <>
                                            <div className="loading-spinner-qvm"></div>
                                            Agregando...
                                        </>
                                    ) : (
                                        '🛒 Agregar al Carrito'
                                    )}
                                </button>
                                
                                {/* <button 
                                    className="btn-buy-now-qvm"
                                    onClick={handleQuickBuyQvm}
                                    disabled={totalStockQvm === 0}
                                >
                                    ⚡ Comprar Ahora
                                </button> */}
                            </div>
                        </div>

                        {/* ✅ CORRECCIÓN: Enlace corregido */}
                        <div className="view-details-link-qvm">
                            <Link 
                                to={getProductDetailUrlQvm()} 
                                onClick={onClose}
                                className="details-link-qvm"
                            >
                                Ver detalles completos del producto →
                            </Link>
                        </div>

                        {/* ✅ CORREGIDO: Especificaciones principales - Accediendo correctamente a value.valor */}
                        {product.especificaciones && Object.keys(product.especificaciones).length > 0 && (
                            <div className="quick-specs-qvm">
                                <h4>Especificaciones principales:</h4>
                                <div className="specs-grid-qvm">
                                    {Object.entries(product.especificaciones)
                                        .slice(0, 4)
                                        .map(([key, value]) => {
                                            const displayValue = getSpecValue(value);
                                            return (
                                                <div key={key} className="spec-item-qvm">
                                                    <span className="spec-label-qvm">{key}:</span>
                                                    <span className="spec-value-qvm">
                                                        {displayValue || 'N/A'}
                                                    </span>
                                                </div>
                                            );
                                        })}
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