import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../Product Card/ProductCard";
import QuickViewModal from "../QuickViewModal/QuickViewModal";
import { useProductosDestacados, useProductos } from "../../api/productosHooks";
import ImageDebug from '../ImageDebug/ImageDebug';

import "./Home.css";

const Home = () => {
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    // Usar datos reales de la API con nuevos hooks
    const { data: productosDestacadosData, loading: destacadosLoading, error: destacadosError } = useProductosDestacados();
    const { data: todosProductosData } = useProductos();

    // Extraer los arrays de productos de la respuesta
    const productosDestacados = productosDestacadosData?.data || [];
    const todosProductos = todosProductosData?.data || [];

    console.log('📦 Productos destacados:', productosDestacados);
    console.log('📦 Todos los productos:', todosProductos);

    const categoriasTecnologia = [
        {
            title: "Laptops & Computadoras",
            description: "Encuentra las mejores laptops y computadoras para trabajo, gaming y creatividad.",
            icon: "💻",
            link: "/products?category=laptops"
        },
        {
            title: "Smartphones & Tablets",
            description: "Los últimos modelos de smartphones y tablets con tecnología de punta.",
            icon: "📱",
            link: "/products?category=smartphones"
        },
        {
            title: "Accesorios & Periféricos",
            description: "Teclados, mouse, audífonos y todo lo que necesitas para tu setup.",
            icon: "🎧",
            link: "/products?category=accesorios"
        },
        {
            title: "Monitores",
            description: "Monitores gaming, 4K y profesionales para tu oficina o setup gaming.",
            icon: "🖥️",
            link: "/products?category=monitores"
        },
        {
            title: "Telefonía",
            description: "Sistemas de videoconferencia y equipos de telefonía empresarial.",
            icon: "📞",
            link: "/products?category=telefonia"
        },
        {
            title: "Audio Profesional",
            description: "Equipos de audio, micrófonos y sistemas de sonido profesional.",
            icon: "🔊",
            link: "/products?category=audio"
        }
    ];

    // Obtener productos destacados REALES de la API
    const getProductosDestacados = () => {
        // Si hay productos destacados de la API, usarlos
        if (Array.isArray(productosDestacados) && productosDestacados.length > 0) {
            console.log('🎯 Usando productos destacados de API:', productosDestacados.slice(0, 3));
            return productosDestacados.slice(0, 3);
        }
        
        // Si no, usar productos aleatorios con existencia de todos los productos
        if (Array.isArray(todosProductos) && todosProductos.length > 0) {
            console.log('🎯 Usando productos aleatorios de todos los productos');
            
            // Filtrar productos que tienen imágenes y existencia
            const productosConImagen = todosProductos.filter(p => 
                p.imagen && (p.existencia || p.existenciaTotal || 0) > 0
            );
            
            if (productosConImagen.length >= 3) {
                const shuffled = [...productosConImagen].sort(() => 0.5 - Math.random());
                console.log('🎯 Productos con imagen encontrados:', shuffled.slice(0, 3));
                return shuffled.slice(0, 3);
            }
            
            // Si no hay suficientes con imagen, usar cualquier producto con existencia
            const productosConExistencia = todosProductos.filter(p => 
                (p.existencia || p.existenciaTotal || 0) > 0
            );
            
            if (productosConExistencia.length >= 3) {
                const shuffled = [...productosConExistencia].sort(() => 0.5 - Math.random());
                console.log('🎯 Productos con existencia encontrados:', shuffled.slice(0, 3));
                return shuffled.slice(0, 3);
            }
            
            // Último recurso: primeros 3 productos
            console.log('🎯 Usando primeros 3 productos:', todosProductos.slice(0, 3));
            return todosProductos.slice(0, 3);
        }
        
        console.log('❌ No hay productos disponibles');
        return [];
    };

    // Obtener más productos REALES
    const getMasProductos = () => {
        if (!Array.isArray(todosProductos) || todosProductos.length === 0) {
            return [];
        }
        
        // Tomar productos del 3 al 6 para evitar duplicados con los destacados
        const masProductos = todosProductos.slice(3, 6);
        console.log('📦 Más productos:', masProductos);
        return masProductos;
    };

    const displayProductosDestacados = getProductosDestacados();
    const displayMasProductos = getMasProductos();

    console.log('🎯 Display Productos Destacados:', displayProductosDestacados);
    console.log('📦 Display Más Productos:', displayMasProductos);

    const handleQuickView = (product) => {
        setQuickViewProduct(product);
        setIsQuickViewOpen(true);
    };

    const handleCloseQuickView = () => {
        setIsQuickViewOpen(false);
        setQuickViewProduct(null);
    };

    const handleAddToCart = (product, quantity) => {
        console.log('Agregado al carrito:', product, 'Cantidad:', quantity);
        
        // Guardar en localStorage
        const cartItem = {
            ...product,
            quantity,
            precioFinal: product.precio
        };
        
        const existingCart = JSON.parse(localStorage.getItem('ctonline_cart') || '[]');
        const existingItemIndex = existingCart.findIndex(item => item.id === product.id);
        
        if (existingItemIndex >= 0) {
            existingCart[existingItemIndex].quantity += quantity;
        } else {
            existingCart.push(cartItem);
        }
        
        localStorage.setItem('ctonline_cart', JSON.stringify(existingCart));
        
        alert(`¡${quantity} x ${product.nombre} agregado al carrito!`);
    };

    return (
        <main className="home">
            {/* Sección de Categorías */}
            <section className="categorias">
                <div className="container">
                    <h2 className="section-title">Explora por Categoría</h2>
                    <p className="section-subtitle">Encuentra exactamente lo que necesitas en nuestra amplia selección</p>
                    <div className="categorias-grid">
                        {categoriasTecnologia.map((categoria, index) => (
                            <div key={index} className="categoria-card">
                                <div className="categoria-icon">
                                    {categoria.icon}
                                </div>
                                <h3>{categoria.title}</h3>
                                <p>{categoria.description}</p>
                                <Link to={categoria.link} className="btn-categoria">
                                    Ver Productos
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Sección de Productos Destacados */}
            <section className="productos-destacados">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Productos Destacados</h2>
                        <p className="section-subtitle">Los productos más populares y mejor valorados</p>
                    </div>
                    
                    {destacadosLoading && (
                        <div className="loading-section">
                            <div className="loading-spinner"></div>
                            <p>Cargando productos destacados...</p>
                        </div>
                    )}
                    
                    {destacadosError && (
                        <div className="error-section">
                            <div className="error-icon">⚠️</div>
                            <h3>Error al cargar productos</h3>
                            <p>{destacadosError}</p>
                            <button onClick={() => window.location.reload()} className="btn-retry">
                                Reintentar
                            </button>
                        </div>
                    )}

                    {!destacadosLoading && !destacadosError && (
                        <>
                            {displayProductosDestacados.length > 0 ? (
                                <>
                                    <div className="productos-grid">
                                        {displayProductosDestacados.map((producto) => (
                                            <ProductCard 
                                                key={producto.idProducto || producto.codigo} 
                                                product={producto}
                                                onQuickView={handleQuickView}
                                            />
                                        ))}
                                    </div>
                                    
                                    <div className="view-all-container">
                                        <Link to="/products" className="btn-view-all">
                                            Ver Todos los Productos
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <div className="no-products">
                                    <p>No hay productos destacados disponibles en este momento.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Sección de Ofertas Especiales */}
            <section className="ofertas-especiales">
                <div className="container">
                    <div className="ofertas-content">
                        <div className="ofertas-text">
                            <h2>Ofertas Especiales</h2>
                            <p>Descuentos exclusivos en productos seleccionados. Aprovecha estas oportunidades únicas.</p>
                            <Link to="/products?promociones=true" className="btn-ofertas">
                                Ver Ofertas
                            </Link>
                        </div>
                        <div className="ofertas-badge">
                            <span className="badge-text">Hasta</span>
                            <span className="badge-percent">50% OFF</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sección de Más Productos */}
            <section className="mas-productos">
                <div className="container">
                    <h2 className="section-title">Descubre Más Productos</h2>
                    <p className="section-subtitle">Una selección cuidadosamente curada para ti</p>
                    
                    {displayMasProductos.length > 0 ? (
                        <>
                            <div className="productos-grid">
                                {displayMasProductos.map((producto) => (
                                    <ProductCard 
                                        key={producto.idProducto || producto.codigo} 
                                        product={producto}
                                        onQuickView={handleQuickView}
                                    />
                                ))}
                            </div>
                            
                            <div className="view-all-container">
                                <Link to="/products" className="btn-view-all">
                                    Explorar Catálogo Completo
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="no-products">
                            <p>No hay productos disponibles en este momento.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Sección de Beneficios */}
            <section className="beneficios">
                <div className="container">
                    <h2 className="section-title">¿Por qué elegirnos?</h2>
                    <div className="beneficios-content">
                        <div className="beneficio">
                            <div className="beneficio-icon">🚚</div>
                            <h3>Envío Gratis</h3>
                            <p>En compras mayores a $500 MXN a todo el país</p>
                        </div>
                        <div className="beneficio">
                            <div className="beneficio-icon">🛡️</div>
                            <h3>Garantía Extendida</h3>
                            <p>Hasta 2 años en productos seleccionados con soporte especializado</p>
                        </div>
                        <div className="beneficio">
                            <div className="beneficio-icon">⏰</div>
                            <h3>Soporte 24/7</h3>
                            <p>Asistencia técnica especializada cuando la necesites</p>
                        </div>
                        <div className="beneficio">
                            <div className="beneficio-icon">💳</div>
                            <h3>Pagos Seguros</h3>
                            <p>Transacciones protegidas con encriptación de última generación</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sección de Marcas */}
            <section className="marcas">
                <div className="container">
                    <h2 className="section-title">Marcas Confiables</h2>
                    <div className="marcas-grid">
                        <div className="marca-item">ASUS</div>
                        <div className="marca-item">SAMSUNG</div>
                        <div className="marca-item">CORSAIR</div>
                        <div className="marca-item">LOGITECH</div>
                        <div className="marca-item">POLYCOM</div>
                        <div className="marca-item">LG</div>
                    </div>
                </div>
            </section>

            {/* Modal de Vista Rápida */}
            <QuickViewModal
                product={quickViewProduct}
                isOpen={isQuickViewOpen}
                onClose={handleCloseQuickView}
                onAddToCart={handleAddToCart}
            />

            {/* Debug solo en desarrollo */}
            {process.env.NODE_ENV === 'development' && <ImageDebug />}
        </main>
    );
};

export default Home;