import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../Product Card/ProductCard";
import QuickViewModal from "../QuickViewModal/QuickViewModal";
import { 
  useProductosDestacados, 
  useProductos, 
  useCategoriasActualizadas,
  useTodosProductos,
  useMarcas,
  useEstadisticas
} from "../../api/productosHooks";
import "./Home.css";

// Helper para generar ID desde nombre
const generarIdDesdeNombreHome = (nombre) => {
  if (!nombre) return `categoria-${Math.random().toString(36).substr(2, 9)}`;
  
  return nombre.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Helper para color de categoría
const getColorCategoriaHome = (nombre) => {
  const colors = [
    '#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f56565',
    '#38b2ac', '#ecc94b', '#667eea', '#ed64a6', '#4fd1c7',
    '#fc8181', '#68d391', '#f6ad55', '#d69e2e', '#63b3ed',
    '#b794f4', '#f687b3', '#4c51bf', '#3182ce', '#38a169',
    '#805ad5', '#e53e3e', '#dd6b20', '#0bc5ea', '#00b5d8'
  ];
  
  if (!nombre) return colors[0];
  
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Helper para descripción de categoría
const obtenerDescripcionCategoriaHome = (nombreCategoria) => {
  const descripciones = {
    'Consumibles': 'Materiales de oficina, tecnología y uso diario esencial',
    'Ensamble': 'Componentes para armar computadoras y equipos tecnológicos',
    'Cables': 'Cables USB, HDMI, red, alimentación y todo tipo de conectores',
    'Accesorios Gaming': 'Equipos especializados para gaming: mouse, teclados, headsets',
    'Video Vigilancia': 'Sistemas completos de CCTV y seguridad visual',
    'Red Activa': 'Routers, switches, firewalls y equipos de networking',
    'Electrónica': 'Componentes electrónicos y equipos especializados',
    'Computadoras': 'Computadoras de escritorio, todo-en-uno y equipos completos',
    'Impresión': 'Impresoras, plotters y equipos de impresión profesional',
    'Audio': 'Bocinas, audífonos, micrófonos y sistemas de sonido',
    'Almacenamiento': 'Discos duros, SSDs y unidades de almacenamiento',
    'Periféricos': 'Mouse, teclados, monitores y accesorios para computadora',
    'Software': 'Programas y aplicaciones para diversos usos',
    'Networking': 'Equipos y accesorios para redes informáticas',
    'Componentes': 'Partes individuales para ensamblar equipos',
  };
  
  return descripciones[nombreCategoria] || 
    `Productos de ${nombreCategoria} - Calidad y variedad para tus necesidades`;
};

// Componente Carrusel de Categorías
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
        <p>No hay categorías disponibles del backend.</p>
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
                  {categoria.nombre?.charAt(0)?.toUpperCase() || '📦'}
                </div>
                <h3>{categoria.nombre}</h3>
                <p>{categoria.descripcion}</p>
                <div className="categoria-count-small-home">
                  {categoria.productosRealesEnCategoria} productos
                  {categoria.productosConStock > 0 && (
                    <span className="categoria-stock-badge-small"> ✓ Stock</span>
                  )}
                </div>
                <Link 
                  to={categoria.ruta || `/products?category=${encodeURIComponent(categoria.nombre)}`} 
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

// Componente Carrusel de Productos - CON EL MISMO DISEÑO QUE CATEGORÍAS
const CarruselProductosHome = ({ 
  productos, 
  titulo, 
  subtitulo, 
  onQuickView,
  verTodosRuta = "/products" 
}) => {
  const carruselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollToIndex = (index) => {
    if (!carruselRef.current) return;
    
    const cardWidth = 300; // Ancho de las tarjetas de producto
    const gap = 20;
    const scrollAmount = index * (cardWidth + gap);
    
    carruselRef.current.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    const maxIndex = Math.ceil(productos.length / 1.5) - 1;
    const nextIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
    scrollToIndex(nextIndex);
  };

  const prevSlide = () => {
    const maxIndex = Math.ceil(productos.length / 1.5) - 1;
    const prevIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
    scrollToIndex(prevIndex);
  };

  if (!productos || productos.length === 0) {
    return (
      <div className="no-products-carrusel">
        <div className="no-products-icon">📦</div>
        <h3>No hay productos disponibles</h3>
        <p>Estamos actualizando nuestro catálogo</p>
      </div>
    );
  }

  return (
    <div className="carrusel-container-home carrusel-productos-home">
      <div className="carrusel-header-home">
        <h2 className="carrusel-titulo-home">{titulo}</h2>
        {subtitulo && <p className="carrusel-subtitulo-home">{subtitulo}</p>}
      </div>
      
      <div className="carrusel-wrapper-home">
        <button 
          className="carrusel-btn-home carrusel-btn-prev-home" 
          onClick={prevSlide}
          aria-label="Producto anterior"
        >
          ‹
        </button>
        
        <div className="carrusel-categorias-home" ref={carruselRef}>
          <div className="carrusel-track-home carrusel-productos-track-home">
            {productos.map((producto, index) => (
              <div key={producto.idProducto || producto.codigo || producto.id || index} className="producto-card-carrusel-home">
                <ProductCard 
                  product={producto}
                  onQuickView={onQuickView}
                  className="producto-card-carrusel-content-home"
                />
              </div>
            ))}
          </div>
        </div>

        <button 
          className="carrusel-btn-home carrusel-btn-next-home" 
          onClick={nextSlide}
          aria-label="Siguiente producto"
        >
          ›
        </button>
      </div>

      {productos.length > 3 && (
        <div className="carrusel-indicators-home">
          {Array.from({ length: Math.ceil(productos.length / 1.5) }).map((_, index) => (
            <button
              key={index}
              className={`carrusel-indicator-home ${index === currentIndex ? 'active-home' : ''}`}
              onClick={() => scrollToIndex(index)}
              aria-label={`Ir a página ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      <div className="carrusel-footer-home">
        <Link to={verTodosRuta} className="btn-view-all-home">
          Ver todos los productos ›
        </Link>
      </div>
    </div>
  );
};

const Home = () => {
    const [quickViewProductHome, setQuickViewProductHome] = useState(null);
    const [isQuickViewOpenHome, setIsQuickViewOpenHome] = useState(false);

    // HOOKS
    const { data: productosDestacadosData, loading: destacadosLoading, error: destacadosError } = useProductosDestacados();
    const { data: todosProductosData, loading: productosLoading } = useProductos({ limit: 200 });
    
    const { 
      data: categoriasResponse, 
      loading: categoriasLoading, 
      error: categoriasError 
    } = useCategoriasActualizadas(300000);
    
    const { data: productosCompletosData } = useTodosProductos({ page: 1, limit: 20000 });
    const { data: marcasData, loading: marcasLoading } = useMarcas();
    const { data: estadisticasData } = useEstadisticas();

    // Datos procesados
    const productosDestacados = productosDestacadosData?.data || [];
    const todosProductos = todosProductosData?.data || [];
    const productosCompletos = productosCompletosData?.data || [];
    const marcasReales = marcasData?.data || [];
    const estadisticas = estadisticasData?.data || {};

    // OBTENER CATEGORÍAS POPULARES
    const topCategoriasHome = useMemo(() => {
      if (!categoriasResponse?.data || !Array.isArray(categoriasResponse.data)) {
        return [];
      }

      const categoriasProcesadas = categoriasResponse.data.map(categoriaApi => {
        let productosEnCategoria = 0;
        let productosConStockEnCategoria = 0;
        
        if (productosCompletos && Array.isArray(productosCompletos)) {
          const productosFiltrados = productosCompletos.filter(p => 
            p.categoria && p.categoria.trim() === categoriaApi.nombre.trim()
          );
          
          productosEnCategoria = productosFiltrados.length;
          productosConStockEnCategoria = productosFiltrados.filter(p => 
            (p.existencia || p.existenciaTotal || 0) > 0
          ).length;
        }

        return {
          ...categoriaApi,
          nombre: categoriaApi.nombre,
          id: categoriaApi.id || generarIdDesdeNombreHome(categoriaApi.nombre),
          productosRealesEnCategoria: productosEnCategoria,
          productosConStock: productosConStockEnCategoria,
          color: getColorCategoriaHome(categoriaApi.nombre),
          descripcion: obtenerDescripcionCategoriaHome(categoriaApi.nombre),
          ruta: `/products?category=${encodeURIComponent(categoriaApi.nombre)}`
        };
      })
      .filter(cat => cat.productosRealesEnCategoria > 0)
      .sort((a, b) => b.productosRealesEnCategoria - a.productosRealesEnCategoria)
      .slice(0, 8);

      return categoriasProcesadas;
    }, [categoriasResponse, productosCompletos]);

    // FUNCIÓN PARA PRODUCTOS DESTACADOS
    const getProductosDestacadosHome = useMemo(() => {
      console.log('🔄 Procesando productos destacados...');
      
      if (Array.isArray(productosDestacados) && productosDestacados.length > 0) {
        console.log('✅ Usando productos destacados de la API:', productosDestacados.length);
        
        const productosFiltrados = productosDestacados.filter(p => {
          const tieneDatosMinimos = p.nombre && p.precio;
          const tieneStock = (p.existencia || p.existenciaTotal || 0) > 0;
          const tieneImagen = p.imagen || p.imagenUrl || p.imagenPrincipal;
          
          return tieneDatosMinimos && (tieneStock || !tieneStock);
        });
        
        if (productosFiltrados.length >= 3) {
          const productosUnicos = [...new Map(productosFiltrados.map(item => 
            [item.idProducto || item.codigo || item.id, item]
          )).values()].slice(0, 12);
          
          console.log('🎯 Productos destacados filtrados:', productosUnicos);
          return productosUnicos;
        }
      }
      
      console.log('⚠️ No hay productos destacados de la API, usando productos generales');
      
      const productosDisponibles = Array.isArray(todosProductos) ? todosProductos : 
                                  Array.isArray(productosCompletos) ? productosCompletos : [];
      
      if (productosDisponibles.length === 0) {
        console.log('❌ No hay productos disponibles');
        return [];
      }
      
      const productosConImagenYStock = productosDisponibles.filter(p => {
        const tieneImagen = p.imagen || p.imagenUrl || p.imagenPrincipal;
        const tieneStock = (p.existencia || p.existenciaTotal || 0) > 0;
        return tieneImagen && tieneStock;
      });
      
      if (productosConImagenYStock.length >= 3) {
        const productosUnicos = [...new Map(productosConImagenYStock.map(item => 
          [item.idProducto || item.codigo || item.id, item]
        )).values()].slice(0, 12);
        
        console.log('📸 Productos con imagen y stock:', productosUnicos.length);
        return productosUnicos;
      }
      
      const productosConImagen = productosDisponibles.filter(p => 
        p.imagen || p.imagenUrl || p.imagenPrincipal
      );
      
      if (productosConImagen.length >= 3) {
        const productosUnicos = [...new Map(productosConImagen.map(item => 
          [item.idProducto || item.codigo || item.id, item]
        )).values()].slice(0, 12);
        
        console.log('🖼️ Productos con imagen:', productosUnicos.length);
        return productosUnicos;
      }
      
      const productosUnicos = [...new Map(productosDisponibles.map(item => 
        [item.idProducto || item.codigo || item.id, item]
      )).values()].slice(0, 12);
      
      console.log('🎲 Productos generales:', productosUnicos.length);
      return productosUnicos;
      
    }, [productosDestacados, todosProductos, productosCompletos]);

    // FUNCIÓN PARA MÁS PRODUCTOS
    const getMasProductosHome = useMemo(() => {
      const productosDestacadosIds = getProductosDestacadosHome.map(p => 
        p.idProducto || p.codigo || p.id
      );
      
      const productosDisponibles = Array.isArray(todosProductos) ? todosProductos : 
                                  Array.isArray(productosCompletos) ? productosCompletos : [];
      
      if (productosDisponibles.length === 0) return [];
      
      const productosNoDestacados = productosDisponibles.filter(producto => {
        const productoId = producto.idProducto || producto.codigo || producto.id;
        return !productosDestacadosIds.includes(productoId);
      });
      
      if (productosNoDestacados.length >= 3) {
        return productosNoDestacados.slice(0, 12);
      }
      
      const todosUnicos = [...new Map(productosDisponibles.map(item => 
        [item.idProducto || item.codigo || item.id, item]
      )).values()];
      
      return todosUnicos.slice(0, 12);
    }, [getProductosDestacadosHome, todosProductos, productosCompletos]);

    const getMarcasPopularesHome = () => {
      const marcasEspecificas = [
        '4GAMERS', 'ACER', 'ACTECK', 'ADATA', 'ADESSO', 'ALTER', 'AMD', 'AOC', 'APC', 'APPLE', 
        'ARUBA', 'ASPEL', 'ASUS', 'AUTODESK', 'AVAST', 'AZOR', 'ALLIED TELESIS', 
        'AMAZFIT', 'AMAZON', 'ANVIZ', 'LENOVO', 'DELL', 'HP', 'SAMSUNG', 'KYOCERA', 
        'BROTHER', 'FORTINET', 'CISCO', 'SONY', 'SENTINEL', 'KASPERSKY', 'NORTON'
      ];
      
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

    const displayProductosDestacadosHome = getProductosDestacadosHome;
    const displayMasProductosHome = getMasProductosHome;
    const displayMarcasPopularesHome = getMarcasPopularesHome();

    const handleQuickViewHome = useCallback((product) => {
      setQuickViewProductHome(product);
      setIsQuickViewOpenHome(true);
    }, []);

    const handleCloseQuickViewHome = useCallback(() => {
      setIsQuickViewOpenHome(false);
      setQuickViewProductHome(null);
    }, []);

    const handleAddToCartHome = useCallback((product, quantity) => {
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
    }, []);

    const isLoadingHome = destacadosLoading || productosLoading || categoriasLoading || marcasLoading;

    // Estadísticas
    const totalProductos = productosCompletos?.length || estadisticas?.totals?.todos || 0;
    const totalCategorias = topCategoriasHome.length;

    // Log para debugging
    useEffect(() => {
      console.log('🏠 Home Component Debug:');
      console.log('- Productos destacados API:', productosDestacados?.length || 0);
      console.log('- Productos destacados procesados:', displayProductosDestacadosHome.length);
      console.log('- Productos totales:', totalProductos);
      console.log('- Categorías procesadas:', totalCategorias);
    }, [productosDestacados, displayProductosDestacadosHome, totalProductos, totalCategorias]);

    return (
        <main className="home-main">
            {isLoadingHome && (
                <div className="loading-overlay-home">
                    <div className="loading-spinner-large-home"></div>
                    <p>Cargando contenido...</p>
                </div>
            )}

            {/* SECCIÓN DE CATEGORÍAS */}
            <section className="categorias-home">
                <div className="container-home">
                    <div className="section-header-home">
                        <h2 className="section-title-home">Categorías Destacadas</h2>
                    </div>
                    
                    {categoriasError && (
                        <div className="error-message-home">
                            <p>⚠️ Error cargando categorías del backend.</p>
                        </div>
                    )}
                    
                    {topCategoriasHome.length > 0 ? (
                        <>
                            <CarruselCategoriasHome categorias={topCategoriasHome} />
                        </>
                    ) : (
                        <div className="no-categories-home">
                            <p>
                                {categoriasLoading 
                                    ? 'Cargando categorías del backend...' 
                                    : 'No hay categorías disponibles del backend.'}
                            </p>
                        </div>
                    )}
                    
                    <div className="view-all-container-home">
                        <Link to="/categories" className="btn-view-all-home">
                            Ver Todas las Categorías
                        </Link>
                    </div>
                </div>
            </section>

            {/* PRODUCTOS DESTACADOS - CON MISMO DISEÑO QUE CATEGORÍAS */}
            <section className="productos-destacados-home">
                <div className="container-home">
                    {destacadosError ? (
                        <div className="error-section-home">
                            <div className="error-icon-home">⚠️</div>
                            <h3>Error al cargar productos</h3>
                            <p>{destacadosError}</p>
                            <button onClick={() => window.location.reload()} className="btn-retry-home">
                                Reintentar
                            </button>
                        </div>
                    ) : displayProductosDestacadosHome.length > 0 ? (
                        <CarruselProductosHome
                            productos={displayProductosDestacadosHome}
                            titulo="Productos Destacados"
                            subtitulo="Los productos más populares y mejor valorados por nuestros clientes"
                            onQuickView={handleQuickViewHome}
                            verTodosRuta="/products"
                        />
                    ) : (
                        !isLoadingHome && (
                            <div className="no-products-home">
                                <div className="no-products-icon">📦</div>
                                <h3>No hay productos destacados disponibles</h3>
                                <p>Estamos actualizando nuestro catálogo. Por favor, intenta más tarde o explora todas las categorías.</p>
                                <Link to="/products" className="btn-explore-home">
                                    Explorar Catálogo Completo
                                </Link>
                            </div>
                        )
                    )}
                </div>
            </section>

            {/* OFERTAS ESPECIALES */}
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

            {/* DESCUBRE MÁS PRODUCTOS - CON MISMO DISEÑO QUE CATEGORÍAS */}
            {displayMasProductosHome.length > 0 && (
                <section className="mas-productos-home">
                    <div className="container-home">
                        <CarruselProductosHome
                            productos={displayMasProductosHome}
                            titulo="Descubre Más Productos"
                            subtitulo="Una selección cuidadosamente curada para tus necesidades tecnológicas"
                            onQuickView={handleQuickViewHome}
                            verTodosRuta="/products"
                        />
                    </div>
                </section>
            )}

            {/* BENEFICIOS */}
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

            {/* MARCAS */}
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
        </main>
    );
};

export default Home;