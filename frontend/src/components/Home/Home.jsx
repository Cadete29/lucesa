import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../Product Card/ProductCard";
import QuickViewModal from "../QuickViewModal/QuickViewModal";
import { 
  useProductosDestacados, 
  useProductos, 
  useCategoriasReales, 
  useMarcas 
} from "../../api/productosHooks";
import "./Home.css";
/* import ImageDebug from '../ImageDebug/ImageDebug'; */



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

// Componente de Carrusel integrado en Home
const CarruselCategorias = ({ categorias }) => {
  const carruselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(280);

  // Calcular ancho de card basado en el viewport
  useEffect(() => {
    const updateCardWidth = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setCardWidth(180);
      } else if (width < 640) {
        setCardWidth(200);
      } else if (width < 768) {
        setCardWidth(220);
      } else if (width < 992) {
        setCardWidth(240);
      } else if (width < 1200) {
        setCardWidth(260);
      } else {
        setCardWidth(280);
      }
    };

    updateCardWidth();
    window.addEventListener('resize', updateCardWidth);
    
    return () => window.removeEventListener('resize', updateCardWidth);
  }, []);

  const scrollToIndex = (index) => {
    if (!carruselRef.current) return;
    
    const gap = window.innerWidth < 480 ? 8 : 16;
    const scrollAmount = index * (cardWidth + gap);
    
    carruselRef.current.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    const maxIndex = Math.ceil(categorias.length / 1.5) - 1;
    const nextIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
    scrollToIndex(nextIndex);
  };

  const prevSlide = () => {
    const maxIndex = Math.ceil(categorias.length / 1.5) - 1;
    const prevIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
    scrollToIndex(prevIndex);
  };

  // Efecto para detectar scroll en móviles
  useEffect(() => {
    const carrusel = carruselRef.current;
    if (!carrusel) return;

    const handleScroll = () => {
      if (window.innerWidth >= 768) return;
      
      const scrollLeft = carrusel.scrollLeft;
      const gap = window.innerWidth < 480 ? 8 : 16;
      const newIndex = Math.round(scrollLeft / (cardWidth + gap));
      
      setCurrentIndex(Math.max(0, Math.min(newIndex, Math.ceil(categorias.length / 1.5) - 1)));
    };

    carrusel.addEventListener('scroll', handleScroll);
    return () => carrusel.removeEventListener('scroll', handleScroll);
  }, [cardWidth, categorias.length]);

  if (!categorias || categorias.length === 0) {
    return (
      <div className="no-categories">
        <p>No hay categorías disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div className="carrusel-container">
      <div className="carrusel-wrapper">
        <button 
          className="carrusel-btn carrusel-btn-prev" 
          onClick={prevSlide}
          aria-label="Categoría anterior"
        >
          ‹
        </button>
        
        <div className="carrusel-categorias" ref={carruselRef}>
          <div className="carrusel-track">
            {categorias.map((categoria, index) => (
              <div key={categoria.id || index} className="categoria-card-small">
                <div className="categoria-icon-small">
                  {categoria.icon}
                </div>
                <h3>{categoria.nombre}</h3>
                <p>{categoria.descripcion}</p>
                <div className="categoria-count-small">
                  {categoria.count} productos
                </div>
                <Link 
                  to={`/products?category=${encodeURIComponent(categoria.nombre)}`} 
                  className="btn-categoria-small"
                >
                  Explorar
                </Link>
              </div>
            ))}
          </div>
        </div>

        <button 
          className="carrusel-btn carrusel-btn-next" 
          onClick={nextSlide}
          aria-label="Siguiente categoría"
        >
          ›
        </button>
      </div>

      {/* Indicadores - solo mostrar si hay más de una página */}
      {categorias.length > 3 && (
        <div className="carrusel-indicators">
          {Array.from({ length: Math.ceil(categorias.length / 1.5) }).map((_, index) => (
            <button
              key={index}
              className={`carrusel-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => scrollToIndex(index)}
              aria-label={`Ir a página ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Home = () => {
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    // Usar datos reales de la API con hooks
    const { data: productosDestacadosData, loading: destacadosLoading, error: destacadosError } = useProductosDestacados();
    const { data: todosProductosData, loading: productosLoading } = useProductos({ limit: 50 });
    const { data: categoriasRealesResponse, loading: categoriasLoading } = useCategoriasReales();
    const { data: marcasData, loading: marcasLoading } = useMarcas();

    // Extraer los arrays de datos de la respuesta
    const productosDestacados = productosDestacadosData?.data || [];
    const todosProductos = todosProductosData?.data || [];
    const categoriasReales = categoriasRealesResponse?.data || [];
    const marcasReales = marcasData?.data || [];

    console.log('📦 Productos destacados:', productosDestacados);
    console.log('📦 Todos los productos:', todosProductos);
    console.log('🏷️ Categorías reales:', categoriasReales);
    console.log('🏷️ Marcas reales:', marcasReales);

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

    // Obtener marcas populares REALES de la API
    const getMarcasPopulares = () => {
        // Si hay marcas de la API, usarlas
        if (Array.isArray(marcasReales) && marcasReales.length > 0) {
            console.log('🏷️ Usando marcas reales de API:', marcasReales.slice(0, 20));
            return marcasReales.slice(0, 20);
        }
        
        // Si no hay marcas de la API, usar las marcas específicas proporcionadas
        const marcasEspecificas = [
            '4Gamers', 'ACER', 'ACTECK', 'ADATA', 'ADESSO',
            'ALTER', 'AMD', 'AOC', 'APC', 'APPLE',
            'ARUBA', 'ASPEL', 'ASUS', 'AUTODESK', 'AVAST',
            'AZOR', 'Allied Telesis', 'Amazfit', 'Amazon', 'Anviz'
        ];
        
        console.log('🏷️ Usando marcas específicas:', marcasEspecificas);
        return marcasEspecificas;
    };

    // Función para obtener la URL del logo de la marca
    const getLogoUrl = (marcaNombre) => {
        const logos = {
            '4GAMERS': '/logos/4gamers.jpeg',
            'ACER': '/logos/acer.jpg',
            'ACTECK': '/logos/acteck.png',
            'ADATA': '/logos/ADATA.png',
            'ADESSO': '/logos/adesso.svg',
            'ALTER': '/logos/alter.png',
            'AMD': '/logos/amd.png',
            'AOC': '/logos/aoc.svg',
            'APC': '/logos/apc.png',
            'APPLE': '/logos/apple.svg',
            'ARUBA': '/logos/aruba.png',
            'ASPEL': '/logos/aspel.webp',
            'ASUS': '/logos/asus.png',
            'AUTODESK': '/logos/autodesk.png',
            'AVAST': '/logos/avast.png',
            'AZOR': '/logos/azor.png',
            'ALLIED TELESIS': '/logos/allied.webp',
            'AMAZFIT': '/logos/amazfit.jpeg',
            'AMAZON': '/logos/amazon.jpg',
            'ANVIZ': '/logos/anviz.png'
        };
        return logos[marcaNombre.toUpperCase()];
    };

    const displayProductosDestacados = getProductosDestacados();
    const displayMasProductos = getMasProductos();
    const top5Categorias = obtenerTop5Categorias;
    const displayMarcasPopulares = getMarcasPopulares();

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

    // Estados de carga combinados
    const isLoading = destacadosLoading || productosLoading || categoriasLoading || marcasLoading;

    return (
        <main className="home">
            {/* Loading general */}
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner-large"></div>
                    <p>Cargando contenido...</p>
                </div>
            )}

            {/* Sección de Categorías con Carrusel */}
            <section className="categorias">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Categorías Populares</h2>
                        <p className="section-subtitle">Descubre nuestras categorías con mayor variedad de productos</p>
                    </div>
                    
                    {top5Categorias.length > 0 ? (
                        <CarruselCategorias categorias={top5Categorias} />
                    ) : (
                        <div className="no-categories">
                            <p>{categoriasLoading ? 'Cargando categorías...' : 'No hay categorías disponibles en este momento.'}</p>
                        </div>
                    )}
                    
                    <div className="view-all-container">
                        <Link to="/categories" className="btn-view-all">
                            Ver Todas las Categorías
                        </Link>
                    </div>
                </div>
            </section>

            {/* Sección de Productos Destacados */}
            <section className="productos-destacados">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Productos Destacados</h2>
                        <p className="section-subtitle">Los productos más populares y mejor valorados por nuestros clientes</p>
                    </div>
                    
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
                </div>
            </section>

            {/* Sección de Ofertas Especiales - COMPACTA */}
            <section className="ofertas-compactas">
                <div className="container">
                    <div className="ofertas-compactas-content">
                        <div className="ofertas-compactas-text">
                            <h2>Ofertas Especiales</h2>
                            <p>Descuentos exclusivos en productos seleccionados</p>
                            <Link to="/products?promociones=true" className="btn-ofertas-compactas">
                                Ver Ofertas
                            </Link>
                        </div>
                        <div className="ofertas-compactas-badge">
                            <span className="badge-compacta-text">Hasta</span>
                            <span className="badge-compacta-percent">50% OFF</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sección de Más Productos */}
            <section className="mas-productos">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Descubre Más Productos</h2>
                        <p className="section-subtitle">Una selección cuidadosamente curada para tus necesidades tecnológicas</p>
                    </div>
                    
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

            {/* Sección de Beneficios - COMPACTA */}
            <section className="beneficios-compactos">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">¿Por qué elegirnos?</h2>
                        <p className="section-subtitle">Ofrecemos la mejor experiencia de compra en tecnología</p>
                    </div>
                    <div className="beneficios-compactos-content">
                        <div className="beneficio-compacto">
                            <div className="beneficio-compacto-icon">🚚</div>
                            <h3>Envío Gratis</h3>
                            <p>En compras mayores a $500 MXN</p>
                        </div>
                        <div className="beneficio-compacto">
                            <div className="beneficio-compacto-icon">🛡️</div>
                            <h3>Garantía</h3>
                            <p>Hasta 2 años en productos seleccionados</p>
                        </div>
                        <div className="beneficio-compacto">
                            <div className="beneficio-compacto-icon">⏰</div>
                            <h3>Soporte 24/7</h3>
                            <p>Asistencia técnica especializada</p>
                        </div>
                        <div className="beneficio-compacto">
                            <div className="beneficio-compacto-icon">💳</div>
                            <h3>Pagos Seguros</h3>
                            <p>Transacciones protegidas SSL</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sección de Marcas REALES */}
            <section className="marcas">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Marcas Confiables</h2>
                        <p className="section-subtitle">Trabajamos con las mejores marcas del mercado tecnológico</p>
                    </div>
                    {displayMarcasPopulares.length > 0 ? (
                        <div className="marcas-grid">
                            {displayMarcasPopulares.map((marca, index) => {
                                const logoUrl = getLogoUrl(marca);
                                
                                return (
                                    <div key={index} className="marca-item">
                                        {logoUrl ? (
                                            <>
                                                <img 
                                                    src={logoUrl} 
                                                    alt={`Logo ${marca}`}
                                                    className="marca-logo"
                                                    onError={(e) => {
                                                        // Si el logo no carga, mostrar texto
                                                        e.target.style.display = 'none';
                                                        const textElement = e.target.nextSibling;
                                                        if (textElement) {
                                                            textElement.style.display = 'block';
                                                        }
                                                    }}
                                                />
                                                <span className="marca-texto" style={{display: 'none'}}>
                                                    {marca}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="marca-texto">{marca}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-marcas">
                            <p>{marcasLoading ? 'Cargando marcas...' : 'No hay marcas disponibles en este momento.'}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Modal de Vista Rápida */}
            <QuickViewModal
                product={quickViewProduct}
                isOpen={isQuickViewOpen}
                onClose={handleCloseQuickView}
                onAddToCart={handleAddToCart}
            />

            {/* Debug solo en desarrollo
            {process.env.NODE_ENV === 'development' && <ImageDebug />} */}
        </main>
    );
};

export default Home;