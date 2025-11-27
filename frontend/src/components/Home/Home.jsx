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
import ImageDebug from '../ImageDebug/ImageDebug';
import Compo from '../compo'

const generarIdDesdeNombreHome = (nombre) => {
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

const obtenerIdCategoriaParaURLHome = (categoriaNombre) => {
  if (!categoriaNombre) return '';
  
  return categoriaNombre.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
};

const obtenerDescripcionCategoriaHome = (nombreCategoria) => {
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

const obtenerIconoCategoriaHome = (nombreCategoria) => {
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

const CarruselCategoriasHome = ({ categorias }) => {
  const carruselRefHome = useRef(null);
  const [currentIndexHome, setCurrentIndexHome] = useState(0);

  const scrollToIndexHome = (index) => {
    if (!carruselRefHome.current) return;
    
    const cardWidth = 280;
    const gap = 16;
    const scrollAmount = index * (cardWidth + gap);
    
    carruselRefHome.current.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
    setCurrentIndexHome(index);
  };

  const nextSlideHome = () => {
    const maxIndex = Math.ceil(categorias.length / 1.5) - 1;
    const nextIndex = currentIndexHome >= maxIndex ? 0 : currentIndexHome + 1;
    scrollToIndexHome(nextIndex);
  };

  const prevSlideHome = () => {
    const maxIndex = Math.ceil(categorias.length / 1.5) - 1;
    const prevIndex = currentIndexHome <= 0 ? maxIndex : currentIndexHome - 1;
    scrollToIndexHome(prevIndex);
  };

  if (!categorias || categorias.length === 0) {
    return (
      <div className="no-categories-home">
        <p>No hay categorías disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div className="carrusel-container-home">
      <div className="carrusel-wrapper-home">
        <button 
          className="carrusel-btn-home carrusel-btn-prev-home" 
          onClick={prevSlideHome}
          aria-label="Categoría anterior"
        >
          ‹
        </button>
        
        <div className="carrusel-categorias-home" ref={carruselRefHome}>
          <div className="carrusel-track-home">
            {categorias.map((categoria, index) => (
              <div key={categoria.id || index} className="categoria-card-small-home">
                <div className="categoria-icon-small-home">
                  {categoria.icon}
                </div>
                <h3>{categoria.nombre}</h3>
                <p>{categoria.descripcion}</p>
                <div className="categoria-count-small-home">
                  {categoria.count} productos
                </div>
                <Link 
                  to={`/products?category=${obtenerIdCategoriaParaURLHome(categoria.nombre)}`} 
                  className="btn-categoria-small-home"
                >
                  Explorar
                </Link>
              </div>
            ))}
          </div>
        </div>

        <button 
          className="carrusel-btn-home carrusel-btn-next-home" 
          onClick={nextSlideHome}
          aria-label="Siguiente categoría"
        >
          ›
        </button>
      </div>

      {categorias.length > 3 && (
        <div className="carrusel-indicators-home">
          {Array.from({ length: Math.ceil(categorias.length / 1.5) }).map((_, index) => (
            <button
              key={index}
              className={`carrusel-indicator-home ${index === currentIndexHome ? 'active-home' : ''}`}
              onClick={() => scrollToIndexHome(index)}
              aria-label={`Ir a página ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Home = () => {
    const [quickViewProductHome, setQuickViewProductHome] = useState(null);
    const [isQuickViewOpenHome, setIsQuickViewOpenHome] = useState(false);

    const { data: productosDestacadosData, loading: destacadosLoading, error: destacadosError } = useProductosDestacados();
    const { data: todosProductosData, loading: productosLoading } = useProductos({ limit: 200 });
    const { data: categoriasRealesResponse, loading: categoriasLoading } = useCategoriasReales();
    const { data: marcasData, loading: marcasLoading } = useMarcas();

    const productosDestacados = productosDestacadosData?.data || [];
    const todosProductos = todosProductosData?.data || [];
    const categoriasReales = categoriasRealesResponse?.data || [];
    const marcasReales = marcasData?.data || [];

    const topCategoriasHome = useMemo(() => {
        if (!todosProductos || !Array.isArray(todosProductos) || todosProductos.length === 0) {
            return [];
        }

        const categoriasMap = new Map();

        todosProductos.forEach(producto => {
            if (producto.categoria && 
                typeof producto.categoria === 'string' && 
                producto.categoria.trim() !== '' &&
                producto.categoria.trim() !== 'N/A' &&
                producto.categoria.trim() !== 'null' &&
                producto.categoria.trim().length > 1) {
                
                const categoria = producto.categoria.trim();
                categoriasMap.set(categoria, (categoriasMap.get(categoria) || 0) + 1);
            }
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

        const categoriasConConteo = Array.from(categoriasMap.entries())
            .map(([nombre, count]) => ({
                nombre,
                count,
                id: generarIdDesdeNombreHome(nombre),
                idParaURL: obtenerIdCategoriaParaURLHome(nombre),
                descripcion: obtenerDescripcionCategoriaHome(nombre),
                icon: obtenerIconoCategoriaHome(nombre)
            }))
            .filter(cat => cat.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);

        return categoriasConConteo;

    }, [todosProductos]);

    const getProductosDestacadosHome = () => {
        if (Array.isArray(productosDestacados) && productosDestacados.length > 0) {
            return productosDestacados.slice(0, 3);
        }
        
        if (Array.isArray(todosProductos) && todosProductos.length > 0) {
            const productosConImagen = todosProductos.filter(p => 
                p.imagen && (p.existencia || p.existenciaTotal || 0) > 0
            );
            
            if (productosConImagen.length >= 3) {
                const shuffled = [...productosConImagen].sort(() => 0.5 - Math.random());
                return shuffled.slice(0, 3);
            }
            
            const productosConExistencia = todosProductos.filter(p => 
                (p.existencia || p.existenciaTotal || 0) > 0
            );
            
            if (productosConExistencia.length >= 3) {
                const shuffled = [...productosConExistencia].sort(() => 0.5 - Math.random());
                return shuffled.slice(0, 3);
            }
            
            return todosProductos.slice(0, 3);
        }
        
        return [];
    };

    const getMasProductosHome = () => {
        if (!Array.isArray(todosProductos) || todosProductos.length === 0) {
            return [];
        }
        
        return todosProductos.slice(3, 6);
    };

    const getMarcasPopularesHome = () => {
        // SOLO usar las marcas específicas, ignorar completamente la API
        const marcasEspecificas = [
            '4GAMERS', 'ACER', 'ACTECK', 'ADATA', 'ADESSO', 'ALTER', 'AMD', 'AOC', 'APC', 'APPLE', 
            'ARUBA', 'ASPEL', 'ASUS', 'AUTODESK', 'AVAST', 'AZOR', 'ALLIED TELESIS', 
            'AMAZFIT', 'AMAZON', 'ANVIZ', 'LENOVO', 'DELL', 'HP', 'SAMSUNG', 'KYOCERA', 
            'BROTHER', 'FORTINET', 'CISCO', 'SONY', 'SENTINEL', 'KASPERSKY', 'NORTON'
        ];
        
        console.log('🎯 USANDO SOLO MARCAS ESPECÍFICAS:', marcasEspecificas);
        return marcasEspecificas;
    };

    const getLogoUrlHome = (marcaNombre) => {
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
            'ANVIZ': '/logos/anviz.png',
            // NUEVAS MARCAS AGREGADAS - TODAS EN MAYÚSCULAS
            'LENOVO': '/logos/lenovo.png',
            'DELL': '/logos/dell.png',
            'HP': '/logos/hp.png',
            'SAMSUNG': '/logos/samsung.png',
            'KYOCERA': '/logos/kyocera.png',
            'BROTHER': '/logos/brother.png',
            'FORTINET': '/logos/fortinet.png',
            'CISCO': '/logos/cisco.png',
            'SONY': '/logos/sony.png',
            'SENTINEL': '/logos/sentinel.svg',
            'KASPERSKY': '/logos/kaspersky.png',
            'NORTON': '/logos/norton.avif'
        };
        
        const marcaKey = marcaNombre.toUpperCase();
        return logos[marcaKey];
    };

    const displayProductosDestacadosHome = getProductosDestacadosHome();
    const displayMasProductosHome = getMasProductosHome();
    const displayMarcasPopularesHome = getMarcasPopularesHome();

    const handleQuickViewHome = (product) => {
        setQuickViewProductHome(product);
        setIsQuickViewOpenHome(true);
    };

    const handleCloseQuickViewHome = () => {
        setIsQuickViewOpenHome(false);
        setQuickViewProductHome(null);
    };

    const handleAddToCartHome = (product, quantity) => {
        console.log('Agregado al carrito:', product, 'Cantidad:', quantity);
        
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

    const isLoadingHome = destacadosLoading || productosLoading || categoriasLoading || marcasLoading;

    return (
        <main className="home-main">
            {isLoadingHome && (
                <div className="loading-overlay-home">
                    <div className="loading-spinner-large-home"></div>
                    <p>Cargando contenido...</p>
                </div>
            )}

            <section className="categorias-home">
                <div className="container-home">
                    <div className="section-header-home">
                        <h2 className="section-title-home">Categorías Populares</h2>
                        <p className="section-subtitle-home">Descubre nuestras categorías con mayor variedad de productos</p>
                    </div>
                    
                    {topCategoriasHome.length > 0 ? (
                        <CarruselCategoriasHome categorias={topCategoriasHome} />
                    ) : (
                        <div className="no-categories-home">
                            <p>{categoriasLoading ? 'Cargando categorías...' : 'No hay categorías disponibles en este momento.'}</p>
                        </div>
                    )}
                    
                    <div className="view-all-container-home">
                        <Link to="/categories" className="btn-view-all-home">
                            Ver Todas las Categorías
                        </Link>
                    </div>
                </div>
            </section>

            <section className="productos-destacados-home">
                <div className="container-home">
                    <div className="section-header-home">
                        <h2 className="section-title-home">Productos Destacados</h2>
                        <p className="section-subtitle-home">Los productos más populares y mejor valorados por nuestros clientes</p>
                    </div>
                    
                    {destacadosError && (
                        <div className="error-section-home">
                            <div className="error-icon-home">⚠️</div>
                            <h3>Error al cargar productos</h3>
                            <p>{destacadosError}</p>
                            <button onClick={() => window.location.reload()} className="btn-retry-home">
                                Reintentar
                            </button>
                        </div>
                    )}

                    {displayProductosDestacadosHome.length > 0 ? (
                        <>
                            <div className="productos-grid-home">
                                {displayProductosDestacadosHome.map((producto) => (
                                    <ProductCard 
                                        key={producto.idProducto || producto.codigo} 
                                        product={producto}
                                        onQuickView={handleQuickViewHome}
                                    />
                                ))}
                            </div>
                            
                            <div className="view-all-container-home">
                                <Link to="/products" className="btn-view-all-home">
                                    Ver Todos los Productos
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="no-products-home">
                            <p>No hay productos destacados disponibles en este momento.</p>
                        </div>
                    )}
                </div>
            </section>

            <section className="ofertas-compactas-home">
                <div className="container-home">
                    <div className="ofertas-compactas-content-home">
                        <div className="ofertas-compactas-text-home">
                            <h2>Ofertas Especiales</h2>
                            <p>Descuentos exclusivos en productos seleccionados</p>
                            <Link to="/products?promociones=true" className="btn-ofertas-compactas-home">
                                Ver Ofertas
                            </Link>
                        </div>
                        <div className="ofertas-compactas-badge-home">
                            <span className="badge-compacta-text-home">Hasta</span>
                            <span className="badge-compacta-percent-home">50% OFF</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mas-productos-home">
                <div className="container-home">
                    <div className="section-header-home">
                        <h2 className="section-title-home">Descubre Más Productos</h2>
                        <p className="section-subtitle-home">Una selección cuidadosamente curada para tus necesidades tecnológicas</p>
                    </div>
                    
                    {displayMasProductosHome.length > 0 ? (
                        <>
                            <div className="productos-grid-home">
                                {displayMasProductosHome.map((producto) => (
                                    <ProductCard 
                                        key={producto.idProducto || producto.codigo} 
                                        product={producto}
                                        onQuickView={handleQuickViewHome}
                                    />
                                ))}
                            </div>
                            
                            <div className="view-all-container-home">
                                <Link to="/products" className="btn-view-all-home">
                                    Explorar Catálogo Completo
                                </Link>
                            </div>
                        </>
                    ) : (
                        <div className="no-products-home">
                            <p>No hay productos disponibles en este momento.</p>
                        </div>
                    )}
                </div>
            </section>

            <section className="beneficios-compactos-home">
                <div className="container-home">
                    <div className="section-header-home">
                        <h2 className="section-title-home">¿Por qué elegirnos?</h2>
                        <p className="section-subtitle-home">Ofrecemos la mejor experiencia de compra en tecnología</p>
                    </div>
                    <div className="beneficios-compactos-content-home">
                        <div className="beneficio-compacto-home">
                            <div className="beneficio-compacto-icon-home">🚚</div>
                            <h3>Envío Gratis</h3>
                            <p>En compras mayores a $500 MXN</p>
                        </div>
                        <div className="beneficio-compacto-home">
                            <div className="beneficio-compacto-icon-home">🛡️</div>
                            <h3>Garantía</h3>
                            <p>Hasta 2 años en productos seleccionados</p>
                        </div>
                        <div className="beneficio-compacto-home">
                            <div className="beneficio-compacto-icon-home">⏰</div>
                            <h3>Soporte 24/7</h3>
                            <p>Asistencia técnica especializada</p>
                        </div>
                        <div className="beneficio-compacto-home">
                            <div className="beneficio-compacto-icon-home">💳</div>
                            <h3>Pagos Seguros</h3>
                            <p>Transacciones protegidas SSL</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="marcas-home">
                <div className="container-home">
                    <div className="section-header-home">
                        <h2 className="section-title-home">Marcas Confiables</h2>
                        <p className="section-subtitle-home">Trabajamos con las mejores marcas del mercado tecnológico</p>
                    </div>
                    {displayMarcasPopularesHome.length > 0 ? (
                        <div className="marcas-grid-home">
                            {displayMarcasPopularesHome.map((marca, index) => {
                                const logoUrl = getLogoUrlHome(marca);
                                
                                return (
                                    <div key={index} className="marca-item-home">
                                        {logoUrl ? (
                                            <>
                                                <img 
                                                    src={logoUrl} 
                                                    alt={`Logo ${marca}`}
                                                    className="marca-logo-home"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        const textElement = e.target.nextSibling;
                                                        if (textElement) {
                                                            textElement.style.display = 'block';
                                                        }
                                                    }}
                                                />
                                                <span className="marca-texto-home" style={{display: 'none'}}>
                                                    {marca}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="marca-texto-home">{marca}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-marcas-home">
                            <p>No hay marcas disponibles en este momento.</p>
                        </div>
                    )}
                </div>
            </section>

            <QuickViewModal
                product={quickViewProductHome}
                isOpen={isQuickViewOpenHome}
                onClose={handleCloseQuickViewHome}
                onAddToCart={handleAddToCartHome}
            />

            {/* {process.env.NODE_ENV === 'development' &&  <ImageDebug /> } */}
        </main>
    );
};

export default Home;