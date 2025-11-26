import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './QuickViewModal.css';

// ✅ Configuración de URLs por entorno
const IMAGE_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://testpaginaweb.shop/api/images/code'
  : 'http://localhost:4004/api/images/code';

const QuickViewModal = ({ product, isOpen, onClose, onAddToCart }) => {
    const [quantityQvm, setQuantityQvm] = useState(1);
    const [selectedImageQvm, setSelectedImageQvm] = useState(0);

    if (!isOpen || !product) return null;

    // ✅ FUNCIÓN: Obtener URL de imagen usando la configuración por entorno
    const getImageUrlQvm = (codigo, size = 'full') => {
        return `${IMAGE_BASE_URL}/${codigo}?size=${size}`;
    };

    // ✅ USAR LA MISMA LÓGICA QUE PRODUCTCARD PARA PRECIOS
    const convertirAMXNQvm = (precio) => {
        if (!precio) return 0;
        return precio * (product.tipoCambio || 20);
    };

    // Precio base en MXN (SIEMPRE convertir)
    const precioBaseMXNQvm = convertirAMXNQvm(product.precio);

    // Precio promocional en MXN (si existe promoción o precioPromocion)
    const precioPromoMXNQvm = product.promociones && product.promociones.length > 0 ? 
        convertirAMXNQvm(product.promociones[0].promocion) : 
        (product.precioPromocion ? convertirAMXNQvm(product.precioPromocion) : null);

    // Determinar si tiene promoción activa
    const tienePromocionActivaQvm = precioPromoMXNQvm !== null && precioPromoMXNQvm < precioBaseMXNQvm;

    // Formatear a 2 decimales
    const formatearPrecioQvm = (precio) => {
        if (typeof precio !== 'number') return '0.00';
        return precio.toLocaleString('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const discountPercentageQvm = tienePromocionActivaQvm ? 
        Math.round(((precioBaseMXNQvm - precioPromoMXNQvm) / precioBaseMXNQvm) * 100) : 
        0;

    // Variables formateadas
    const precioBaseFormateadoQvm = formatearPrecioQvm(precioBaseMXNQvm);
    const precioPromoFormateadoQvm = tienePromocionActivaQvm ? formatearPrecioQvm(precioPromoMXNQvm) : null;
    const precioFinalFormateadoQvm = tienePromocionActivaQvm ? precioPromoFormateadoQvm : precioBaseFormateadoQvm;

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

    const handleAddToCartQvm = () => {
        onAddToCart(product, quantityQvm);
        onClose();
    };

    const handleQuickBuyQvm = () => {
        onAddToCart(product, quantityQvm);
        onClose();
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
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMjAgMTIwSDE0MFYxNDBIMTIwVjEyMFpNMTYwIDEyMEgxODBWMTQwSDE2MFYxMjBaTTIwMCAxMjBIMjIwVjE0MEgyMDBWMTIwWk0xMjAgMTYwSDE0MFYxODBIMTIwVjE2MFpNMTYwIDE2MEgxODBWMTgwSDE2MFYxNjBaTTIwMCAxNjBIMjIwVjE4MEgyMDBWMTYwWk0xMjAgMjAwSDE0MFYyMjBIMTIwVjIwMFpNMTYwIDIwMEgxODBWMjIwSDE2MFYyMDBaTTIwMCAyMDBIMjIwVjIyMEgyMDBWMjAwWiIgZmlsbD0iI0RERURGMCIvPgo8dGV4dCB4PSIyMDAiIHk9IjI0MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTY5Njk2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZW4gTm8gRGlzcG9uaWJsZTwvdGV4dD4KPC9zdmc+';
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
                                </div>
                            ) : (
                                <div className="pricing-normal-qvm">
                                    <span className="currency-qvm">MXN </span>
                                    <span className="price-qvm">${precioFinalFormateadoQvm}</span>
                                </div>
                            )}
                            
                            {product.moneda === 'USD' && (
                                <div className="exchange-info-qvm">
                                    <span>Tipo de cambio: ${product.tipoCambio || 20} MXN/USD</span>
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
                                    className="btn-add-cart-qvm"
                                    onClick={handleAddToCartQvm}
                                    disabled={totalStockQvm === 0}
                                >
                                    🛒 Agregar al Carrito
                                </button>
                                <button 
                                    className="btn-buy-now-qvm"
                                    onClick={handleQuickBuyQvm}
                                    disabled={totalStockQvm === 0}
                                >
                                    ⚡ Comprar Ahora
                                </button>
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

                        {/* Especificaciones rápidas */}
                        {product.especificaciones && (
                            <div className="quick-specs-qvm">
                                <h4>Especificaciones principales:</h4>
                                <div className="specs-grid-qvm">
                                    {Object.entries(product.especificaciones).slice(0, 4).map(([key, value]) => (
                                        <div key={key} className="spec-item-qvm">
                                            <span className="spec-label-qvm">{key}:</span>
                                            <span className="spec-value-qvm">{value}</span>
                                        </div>
                                    ))}
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