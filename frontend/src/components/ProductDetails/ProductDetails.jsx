import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ProductDetails.css';

const ProductDetails = () => {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');

    // Datos de ejemplo - reemplazar con API real
    const sampleProduct = {
        "idProducto": 67660,
        "clave": "ACCPOL1210",
        "numParte": "875M4AA",
        "nombre": "Cable POLYCOM 875M4AA",
        "modelo": "875M4AA",
        "idMarca": 444,
        "marca": "POLYCOM",
        "idSubCategoria": 23,
        "subcategoria": "Accesorios de Telefonía",
        "idCategoria": 13,
        "categoria": "Telefonía y Video Vigilancia",
        "descripcion_corta": "Cable HP Poly extensor de microfono de expansion para poly studio X50/X52/X70/USB",
        "descripcion_larga": "Cable extensor de micrófono de expansión HP Poly diseñado específicamente para los modelos Poly Studio X50, X52 y X70. Este cable permite extender la funcionalidad del micrófono en sistemas de videoconferencia, proporcionando mayor flexibilidad en la configuración de salas de reuniones. Compatible con conexiones USB para una integración sencilla. Fabricado con materiales de alta calidad que garantizan durabilidad y un rendimiento óptimo en entornos profesionales.",
        "ean": "",
        "upc": "197497663853",
        "sustituto": "ACCPOL1210",
        "activo": 1,
        "protegido": 0,
        "existencia": {
            "QRO": 1,
            "CDMX": 3,
            "MTY": 2
        },
        "precio": 78.53,
        "moneda": "USD",
        "tipoCambio": 18.54,
        "especificaciones": {
            "Longitud": "3 metros",
            "Conector": "USB Type-A",
            "Color": "Negro",
            "Compatibilidad": "Poly Studio X50, X52, X70",
            "Tipo": "Cable extensor de micrófono",
            "Garantía": "1 año",
            "Material": "Nylon trenzado",
            "Certificaciones": "RoHS, CE, FCC"
        },
        "promociones": [
            {
                "tipo": "importe",
                "promocion": 64.89,
                "vigencia": {
                    "inicio": "2025-11-01T07:00:00.000Z",
                    "fin": "2025-11-30T07:00:00.000Z"
                }
            }
        ],
        "imagen": "https://static.ctonline.mx/imagenes/ACCPOL1210/ACCPOL1210_full.jpg",
        "imagenes_adicionales": [
            "https://static.ctonline.mx/imagenes/ACCPOL1210/ACCPOL1210_1.jpg",
            "https://static.ctonline.mx/imagenes/ACCPOL1210/ACCPOL1210_2.jpg",
            "https://static.ctonline.mx/imagenes/ACCPOL1210/ACCPOL1210_3.jpg"
        ]
    };

    useEffect(() => {
        // Simular carga de API
        const loadProduct = async () => {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Aquí iría la llamada real a la API:
            // const response = await fetch(`/api/products/${productId}`);
            // const data = await response.json();
            // setProduct(data);
            
            setProduct(sampleProduct);
            setLoading(false);
        };

        loadProduct();
    }, [productId]);

    // Cálculos de precios
    const hasActivePromotion = product?.promociones && product.promociones.length > 0;
    const currentPromotion = hasActivePromotion ? product.promociones[0] : null;
    
    const precioMXN = product?.moneda === 'USD' ? 
        (product.precio * product.tipoCambio).toFixed(2) : 
        product?.precio;

    const precioPromoMXN = currentPromotion && product?.moneda === 'USD' ?
        (currentPromotion.promocion * product.tipoCambio).toFixed(2) :
        currentPromotion?.promocion;

    const discountPercentage = currentPromotion ? 
        Math.round(((product.precio - currentPromotion.promocion) / product.precio) * 100) : 
        0;

    // Stock total
    const getTotalStock = () => {
        if (!product?.existencia) return 0;
        return Object.values(product.existencia).reduce((total, stock) => total + stock, 0);
    };

    const totalStock = getTotalStock();

    const handleQuantityChange = (value) => {
        if (value < 1) return;
        if (value > totalStock) return;
        setQuantity(value);
    };

    const handleAddToCart = () => {
        // Lógica para agregar al carrito
        console.log('Agregado al carrito:', { product, quantity });
        alert(`¡${quantity} x ${product.nombre} agregado al carrito!`);
    };

    const handleBuyNow = () => {
        // Lógica para compra inmediata
        console.log('Comprar ahora:', { product, quantity });
        alert(`Redirigiendo al checkout con ${quantity} x ${product.nombre}`);
    };

    if (loading) {
        return (
            <div className="product-details-loading">
                <div className="loading-spinner"></div>
                <p>Cargando producto...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="product-not-found">
                <h2>Producto no encontrado</h2>
                <p>El producto que buscas no está disponible.</p>
                <Link to="/products" className="btn-primary">
                    Volver a Productos
                </Link>
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
                    <Link to={`/products`}>
                        {product.categoria}
                    </Link>
                    <span> / </span>
                    <span className="current">{product.nombre}</span>
                </nav>

                <div className="product-details-content">
                    {/* Galería de imágenes */}
                    <div className="product-gallery">
                        <div className="main-image">
                            <img 
                                src={product.imagenes_adicionales?.[selectedImage] || product.imagen} 
                                alt={product.nombre}
                            />
                            {hasActivePromotion && (
                                <div className="promotion-badge-large">
                                    -{discountPercentage}% OFF
                                </div>
                            )}
                        </div>
                        
                        {product.imagenes_adicionales && product.imagenes_adicionales.length > 0 && (
                            <div className="image-thumbnails">
                                {[product.imagen, ...product.imagenes_adicionales].map((img, index) => (
                                    <button
                                        key={index}
                                        className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                                        onClick={() => setSelectedImage(index)}
                                    >
                                        <img src={img} alt={`${product.nombre} ${index + 1}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Información principal del producto */}
                    <div className="product-info-main">
                        <div className="product-header">
                            <span className="product-brand">{product.marca}</span>
                            <h1 className="product-title">{product.nombre}</h1>
                            <div className="product-codes">
                                <span><strong>Clave:</strong> {product.clave}</span>
                                <span><strong>Número de parte:</strong> {product.numParte}</span>
                                {product.upc && <span><strong>UPC:</strong> {product.upc}</span>}
                            </div>
                        </div>

                        <div className="product-pricing">
                            {hasActivePromotion ? (
                                <div className="pricing-with-promo">
                                    <div className="current-price">
                                        <span className="currency">MXN </span>
                                        <span className="price">${precioPromoMXN}</span>
                                    </div>
                                    <div className="original-price">
                                        <span className="price">${precioMXN}</span>
                                        <span className="discount">-{discountPercentage}%</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="pricing-normal">
                                    <span className="currency">{product.moneda === 'USD' ? 'MXN ' : ''}</span>
                                    <span className="price">${product.moneda === 'USD' ? precioMXN : product.precio}</span>
                                </div>
                            )}
                            
                            {product.moneda === 'USD' && (
                                <div className="exchange-info">
                                    <span>Tipo de cambio: ${product.tipoCambio} MXN/USD</span>
                                </div>
                            )}
                        </div>

                        <div className="product-description-short">
                            <p>{product.descripcion_corta}</p>
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
                            
                            {totalStock > 0 && (
                                <div className="stock-locations">
                                    <strong>Disponible en:</strong>
                                    <div className="locations-list">
                                        {Object.entries(product.existencia).map(([location, stock]) => (
                                            <div key={location} className="location-item">
                                                <span className="location-name">{location}:</span>
                                                <span className="location-stock">{stock} unidades</span>
                                            </div>
                                        ))}
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
                                        onClick={() => handleQuantityChange(quantity - 1)}
                                        disabled={quantity <= 1}
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number" 
                                        value={quantity}
                                        min="1"
                                        max={totalStock}
                                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                    />
                                    <button 
                                        onClick={() => handleQuantityChange(quantity + 1)}
                                        disabled={quantity >= totalStock}
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
                                    🛒 Agregar al Carrito
                                </button>
                                <button 
                                    className="btn-buy-now"
                                    onClick={handleBuyNow}
                                    disabled={totalStock === 0}
                                >
                                    ⚡ Comprar Ahora
                                </button>
                            </div>
                        </div>

                        {/* Información adicional */}
                        <div className="product-meta-info">
                            {product.sustituto && product.sustituto !== product.clave && (
                                <div className="substitute-info">
                                    <strong>Sustituto:</strong> {product.sustituto}
                                </div>
                            )}
                            
                            {hasActivePromotion && currentPromotion.vigencia && (
                                <div className="promotion-info">
                                    <strong>Oferta válida hasta:</strong>{' '}
                                    {new Date(currentPromotion.vigencia.fin).toLocaleDateString('es-MX', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                            )}
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
                                <p>{product.descripcion_larga || product.descripcion_corta}</p>
                                
                                <div className="features-list">
                                    <h4>Características principales:</h4>
                                    <ul>
                                        <li>Compatible con sistemas Poly Studio X50, X52 y X70</li>
                                        <li>Conexión USB para fácil instalación</li>
                                        <li>Extensión de micrófono para mayor flexibilidad</li>
                                        <li>Calidad de audio profesional</li>
                                        <li>Durabilidad y confiabilidad garantizadas</li>
                                        <li>Materiales de alta calidad para uso profesional</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="tab-panel">
                                <h3>Especificaciones Técnicas</h3>
                                <div className="specifications-grid">
                                    {product.especificaciones ? (
                                        Object.entries(product.especificaciones).map(([key, value]) => (
                                            <div key={key} className="spec-item">
                                                <span className="spec-label">{key}:</span>
                                                <span className="spec-value">{value}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-specifications">
                                            <p>No hay especificaciones disponibles para este producto.</p>
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
                                        </ul>
                                    </div>
                                    
                                    <div className="info-section">
                                        <h4>🛡️ Garantía</h4>
                                        <p>Este producto incluye garantía del fabricante de 1 año contra defectos de fabricación.</p>
                                    </div>
                                    
                                    <div className="info-section">
                                        <h4>📦 Política de Devoluciones</h4>
                                        <p>30 días para devoluciones. Producto debe estar en perfecto estado y en su empaque original.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;