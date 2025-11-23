import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../Product Card/ProductCard";
import QuickViewModal from "../QuickViewModal/QuickViewModal";
import { useProductosDestacados, useProductos, useCategoriasReales } from "../../api/productosHooks";
import ImageDebug from '../ImageDebug/ImageDebug';

import "./Home.css";

// Mover las funciones auxiliares fuera del componente o usar useCallback
const generarIdDesdeNombre = (nombre) => {
  if (!nombre) return `categoria-${Math.random().toString(36).substr(2, 9)}`;
  
  const nombreNormalizado = nombre.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
      hash = ((hash << 5) - hash) + nombre.charCodeAt(i);
      hash = hash & hash;
  }
  
  return `${nombreNormalizado}-${Math.abs(hash).toString(36).substr(0, 6)}`;
};

const obtenerDescripcionCategoria = (nombreCategoria) => {
  const descripciones = {
      'Consumibles': 'Materiales de oficina, tecnología y uso diario esencial',
      'Ensamble': 'Componentes para armar computadoras y equipos tecnológicos',
      'Cables': 'Cables USB, HDMI, red, alimentación y todo tipo de conectores',
      'Accesorios Gaming': 'Equipos especializados para gaming: mouse, teclados, headsets',
      'Video Vigilancia': 'Sistemas completos de CCTV y seguridad visual',
      'Accesorios para Componentes': 'Complementos para componentes de computadora',
      'Red Activa': 'Routers, switches, firewalls y equipos de networking',
      'Accesorios para Electronica': 'Componentes y herramientas para proyectos electrónicos',
      'Accesorios para Cómputo': 'Accesorios esenciales para computación y oficina',
      'Electrónica': 'Componentes electrónicos y equipos especializados',
      'Respaldo y Regulación': 'Sistemas UPS, reguladores y protección de energía',
      'Perifericos para POS': 'Equipos especializados para sistemas Point of Sale',
      'Computadoras': 'Computadoras de escritorio, todo-en-uno y equipos completos',
      'Almacenamiento Portatil': 'Discos duros externos y unidades portátiles',
      'Tóners': 'Tóners y cartuchos de impresión para todas las marcas',
      'No Breaks y UPS': 'Sistemas de energía ininterrumpida y respaldo',
      'Impresión': 'Impresoras, plotters y equipos de impresión profesional',
      'Red Pasiva': 'Cables, conectores, racks e infraestructura de red',
      'Audio': 'Bocinas, audífonos, micrófonos y sistemas de sonido',
      'Telefonía y Video Vigilancia': 'Sistemas integrados de comunicación y seguridad'
  };

  return descripciones[nombreCategoria] || `Productos de ${nombreCategoria} - Calidad y variedad para tus necesidades`;
};

const obtenerIconoCategoria = (nombreCategoria) => {
  const iconos = {
      'Consumibles': '🖨️',
      'Ensamble': '⚙️',
      'Cables': '🔌',
      'Accesorios Gaming': '🎮',
      'Video Vigilancia': '📹',
      'Accesorios para Componentes': '💻',
      'Red Activa': '🌐',
      'Accesorios para Electronica': '🔧',
      'Accesorios para Cómputo': '💾',
      'Electrónica': '📟',
      'Respaldo y Regulación': '⚡',
      'Perifericos para POS': '💳',
      'Computadoras': '🖥️',
      'Almacenamiento Portatil': '💿',
      'Tóners': '🖋️',
      'No Breaks y UPS': '🔋',
      'Impresión': '🖨️',
      'Red Pasiva': '🔗',
      'Audio': '🔊',
      'Telefonía y Video Vigilancia': '📞'
  };

  return iconos[nombreCategoria] || '📦';
};

const Home = () => {
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    // Usar datos reales de la API con nuevos hooks
    const { data: productosDestacadosData, loading: destacadosLoading, error: destacadosError } = useProductosDestacados();
    const { data: todosProductosData } = useProductos();
    const { data: categoriasRealesResponse } = useCategoriasReales();

    // Extraer los arrays de productos de la respuesta
    const productosDestacados = productosDestacadosData?.data || [];
    const todosProductos = todosProductosData?.data || [];
    const categoriasReales = categoriasRealesResponse?.data || [];

    console.log('📦 Productos destacados:', productosDestacados);
    console.log('📦 Todos los productos:', todosProductos);
    console.log('🏷️ Categorías reales:', categoriasReales);

    // **FUNCIÓN: Obtener las 5 categorías con más productos**
    const obtenerTop5Categorias = useMemo(() => {
        if (!todosProductos || !Array.isArray(todosProductos) || todosProductos.length === 0) {
            console.log('📊 No hay productos para analizar categorías');
            return [];
        }

        if (!categoriasReales || !Array.isArray(categoriasReales) || categoriasReales.length === 0) {
            console.log('📊 No hay categorías reales disponibles');
            return [];
        }

        // Contar productos por categoría
        const categoriasMap = new Map();

        console.log(`🔍 Analizando ${todosProductos.length} productos para categorías...`);

        todosProductos.forEach(producto => {
            // PRIORIDAD 1: Usar categoría principal si existe y es válida
            if (producto.categoria && 
                typeof producto.categoria === 'string' && 
                producto.categoria.trim() !== '' &&
                producto.categoria.trim() !== 'N/A' &&
                producto.categoria.trim() !== 'null' &&
                producto.categoria.trim().length > 1) {
                
                const categoria = producto.categoria.trim();
                categoriasMap.set(categoria, (categoriasMap.get(categoria) || 0) + 1);
            }
            // PRIORIDAD 2: Si no tiene categoría principal, usar subcategoría
            else if (producto.subcategoria && 
                     typeof producto.subcategoria === 'string' && 
                     producto.subcategoria.trim() !== '' &&
                     producto.subcategoria.trim() !== 'N/A' &&
                     producto.subcategoria.trim() !== 'null' &&
                     producto.subcategoria.trim().length > 1) {
                
                const subcategoria = producto.subcategoria.trim();
                categoriasMap.set(subcategoria, (categoriasMap.get(subcategoria) || 0) + 1);
            }
        });

        // Convertir a array y ordenar por cantidad de productos (descendente)
        const categoriasConConteo = Array.from(categoriasMap.entries())
            .map(([nombre, count]) => ({
                nombre,
                count,
                id: generarIdDesdeNombre(nombre),
                descripcion: obtenerDescripcionCategoria(nombre),
                icon: obtenerIconoCategoria(nombre)
            }))
            .filter(cat => cat.count > 0) // Solo categorías con productos
            .sort((a, b) => b.count - a.count) // Ordenar por cantidad descendente
            .slice(0, 5); // Tomar solo las 5 primeras

        console.log('🏆 Top 5 categorías con más productos:', categoriasConConteo);

        return categoriasConConteo;

    }, [todosProductos, categoriasReales]);

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
    const top5Categorias = obtenerTop5Categorias;

    console.log('🎯 Display Productos Destacados:', displayProductosDestacados);
    console.log('📦 Display Más Productos:', displayMasProductos);
    console.log('🏆 Top 5 Categorías:', top5Categorias);

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
            {/* Sección de Categorías - ACTUALIZADA con Top 5 */}
            <section className="categorias">
                <div className="container">
                    <h2 className="section-title">Categorías Populares</h2>
                    <p className="section-subtitle">Las categorías con más productos disponibles</p>
                    
                    {top5Categorias.length > 0 ? (
                        <div className="categorias-grid">
                            {top5Categorias.map((categoria, index) => (
                                <div key={categoria.id} className="categoria-card">
                                    <div className="categoria-icon">
                                        {categoria.icon}
                                    </div>
                                    <h3>{categoria.nombre}</h3>
                                    <p>{categoria.descripcion}</p>
                                    <div className="categoria-count">
                                        {categoria.count} productos
                                    </div>
                                    <Link to={`/products?category=${categoria.id}`} className="btn-categoria">
                                        Ver Productos
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-categories">
                            <p>No hay categorías disponibles en este momento.</p>
                        </div>
                    )}
                    
                    {/* Enlace para ver todas las categorías */}
                    <div className="view-all-container" style={{ marginTop: '2rem' }}>
                        <Link to="/categories" className="btn-view-all">
                            Ver Todas las Categorías
                        </Link>
                    </div>
                </div>
            </section>

            {/* Resto del componente se mantiene igual */}
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