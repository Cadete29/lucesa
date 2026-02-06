// src/pages/Home/Home.jsx

/**
 * Componente Home - Página principal del e-commerce
 * 
 * Componente principal que muestra:
 * - Carrusel automático de categorías destacadas
 * - Carrusel de productos destacados
 * - Carrusel de productos adicionales
 * - Sección de ofertas especiales
 * - Sección de beneficios
 * - Mosaico de marcas confiables
 * 
 * Responsabilidades:
 * 1. Mostrar contenido principal de la página de inicio
 * 2. Implementar carruseles interactivos
 * 3. Integrar múltiples fuentes de datos (productos, categorías, marcas)
 * 4. Manejar vistas rápidas de productos
 * 5. Adaptar diseño según sidebar
 * 6. Proporcionar experiencia de usuario fluida
 */

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

// ============================================
// COMPONENTE: CategoriasDestacadasHome
// ============================================

/**
 * Componente Categorías Destacadas con Carrusel Automático
 * @component
 * @description Muestra un carrusel automático de categorías principales
 * @returns {JSX.Element} Carrusel de categorías destacadas
 */
const CategoriasDestacadasHome = () => {
  /** @state {number} currentSlide - Índice del slide actual */
  const [currentSlide, setCurrentSlide] = useState(0);
  /** @ref {Object} carruselRef - Referencia al contenedor del carrusel */
  const carruselRef = useRef(null);
  /** @ref {Object} intervalRef - Referencia al intervalo de autoplay */
  const intervalRef = useRef(null);
  
  /**
   * Datos de categorías padre (hardcodeados)
   * @constant {Array} categoriasPadre
   * @description Lista de categorías principales con sus propiedades
   */
  const categoriasPadre = useMemo(() => [
    {
      id: 'Cómputo',
      nombre: 'Cómputo',
      imagen: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
      descripcion: 'Laptops, PCs, tablets y equipos de cómputo',
      ruta: '/products?category=Computación',
      productosCount: 300,
      color: '#4895CF'
    },
    {
      id: 'audio-video',
      nombre: 'Audio y Video',
      imagen: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
      descripcion: 'Parlantes, audífonos, micrófonos y sistemas de sonido',
      ruta: '/products?category=Audio%20y%20Video',
      productosCount: 150,
      color: '#7CCBDD'
    },
    {
      id: 'gaming',
      nombre: 'Gaming',
      imagen: '/gaming.avif',
      descripcion: 'Equipos y accesorios especializados para gamers',
      ruta: '/products?category=Gaming',
      productosCount: 1000,
      color: '#EF4444'
    },
    {
      id: 'apple',
      nombre: 'Apple',
      imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
      descripcion: 'Productos Apple originales y accesorios',
      ruta: '/products?category=Apple',
      productosCount: 50,
      color: '#000000'
    },
    {
      id: 'electronica',
      nombre: 'Electrónica',
      imagen: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
      descripcion: 'Componentes electrónicos y equipos especializados',
      ruta: '/products?category=Electrónica',
      productosCount: 500,
      color: '#10B981'
    }
  ], []);

  // ============================================
  // FUNCIONES DE NAVEGACIÓN DEL CARRUSEL
  // ============================================

  /**
   * Ir a un slide específico
   * @param {number} index - Índice del slide al que ir
   */
  const goToSlide = (index) => {
    setCurrentSlide(index);
    if (carruselRef.current) {
      carruselRef.current.style.transform = `translateX(-${index * 100}%)`;
    }
    
    // Reiniciar el autoplay
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      startAutoPlay();
    }
  };

  /**
   * Ir al siguiente slide
   */
  const nextSlide = () => {
    const nextIndex = (currentSlide + 1) % categoriasPadre.length;
    goToSlide(nextIndex);
  };

  /**
   * Ir al slide anterior
   */
  const prevSlide = () => {
    const prevIndex = currentSlide === 0 ? categoriasPadre.length - 1 : currentSlide - 1;
    goToSlide(prevIndex);
  };

  /**
   * Iniciar reproducción automática del carrusel
   * @function startAutoPlay
   * @callback useCallback
   */
  const startAutoPlay = useCallback(() => {
    intervalRef.current = setInterval(() => {
      nextSlide();
    }, 5000); // Cambia cada 5 segundos
  }, [currentSlide]);

  /**
   * Detener reproducción automática
   */
  const stopAutoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // ============================================
  // EFECTOS DE LIFECYCLE
  // ============================================

  /**
   * Efecto: Iniciar autoplay al montar y limpiar al desmontar
   */
  useEffect(() => {
    startAutoPlay();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startAutoPlay]);

  // ============================================
  // MANEJADORES DE EVENTOS
  // ============================================

  /**
   * Pausar autoplay al hacer hover
   */
  const handleMouseEnter = () => {
    stopAutoPlay();
  };

  /**
   * Reanudar autoplay al salir del hover
   */
  const handleMouseLeave = () => {
    startAutoPlay();
  };

  // ============================================
  // RENDERIZADO
  // ============================================

  return (
    <div className="categorias-carrusel-container-home">
      <div 
        className="categorias-carrusel-home"
        ref={carruselRef}
        style={{ 
          transform: `translateX(-${currentSlide * 100}%)`,
          transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {categoriasPadre.map((categoria) => (
          <div 
            key={categoria.id} 
            className="categoria-carrusel-item-home"
            style={{ 
              backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${categoria.imagen})`,
              borderLeft: `5px solid ${categoria.color}`
            }}
          >
            <div className="categoria-carrusel-content-home">
              <h3 className="categoria-carrusel-title-home">{categoria.nombre}</h3>
              <p className="categoria-carrusel-desc-home">{categoria.descripcion}</p>
              <div className="categoria-carrusel-info-home">
                <span className="categoria-carrusel-count-home">
                  {categoria.productosCount}+ productos
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* INDICADORES DEL CARRUSEL */}
      <div className="carrusel-indicators-categorias-home">
        {categoriasPadre.map((_, index) => (
          <button
            key={index}
            className={`carrusel-indicator-categoria-home ${index === currentSlide ? 'active-categoria' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Ir a categoría ${index + 1}`}
          >
            <span className="indicator-progress-categoria"></span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: CarruselProductosHome
// ============================================

/**
 * Componente Carrusel de Productos
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.productos - Lista de productos a mostrar
 * @param {string} props.titulo - Título del carrusel
 * @param {string} props.subtitulo - Subtítulo del carrusel
 * @param {Function} props.onQuickView - Función para vista rápida
 * @param {string} props.verTodosRuta - Ruta para "ver todos"
 * @returns {JSX.Element} Carrusel de productos interactivo
 */
const CarruselProductosHome = ({ 
  productos, 
  titulo, 
  subtitulo, 
  onQuickView,
  verTodosRuta = "/products" 
}) => {
  /** @ref {Object} carruselRef - Referencia al contenedor del carrusel */
  const carruselRef = useRef(null);
  /** @state {number} currentIndex - Índice actual del carrusel */
  const [currentIndex, setCurrentIndex] = useState(0);

  // ============================================
  // FUNCIONES DE NAVEGACIÓN
  // ============================================

  /**
   * Desplazarse a un índice específico
   * @param {number} index - Índice al que desplazarse
   */
  const scrollToIndex = (index) => {
    if (!carruselRef.current) return;
    
    const cardWidth = 300;
    const gap = 20;
    const scrollAmount = index * (cardWidth + gap);
    
    carruselRef.current.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  };

  /**
   * Ir al siguiente slide
   */
  const nextSlide = () => {
    const maxIndex = Math.ceil(productos.length / 1.5) - 1;
    const nextIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
    scrollToIndex(nextIndex);
  };

  /**
   * Ir al slide anterior
   */
  const prevSlide = () => {
    const maxIndex = Math.ceil(productos.length / 1.5) - 1;
    const prevIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
    scrollToIndex(prevIndex);
  };

  // ============================================
  // VALIDACIÓN Y ESTADOS VACÍOS
  // ============================================

  if (!productos || productos.length === 0) {
    return (
      <div className="no-products-carrusel">
        <div className="no-products-icon">📦</div>
        <h3>No hay productos disponibles</h3>
        <p>Estamos actualizando nuestro catálogo</p>
      </div>
    );
  }

  // ============================================
  // RENDERIZADO
  // ============================================

  return (
    <div className="carrusel-container-home carrusel-productos-home">
      {/* ENCABEZADO */}
      <div className="carrusel-header-home">
        <h2 className="carrusel-titulo-home">{titulo}</h2>
        {subtitulo && <p className="carrusel-subtitulo-home">{subtitulo}</p>}
      </div>
      
      {/* CONTENEDOR PRINCIPAL */}
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

      {/* INDICADORES */}
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
      
      {/* PIE DE PÁGINA */}
      <div className="carrusel-footer-home">
        <Link to={verTodosRuta} className="btn-view-all-home">
          Ver todos los productos ›
        </Link>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE: MarcasMosaicoSimpleHome
// ============================================

/**
 * Componente de Marcas en Mosaico Simple
 * @component
 * @description Muestra logos de marcas en un diseño de mosaico estático
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.marcas - Lista de nombres de marcas
 * @param {Function} props.getLogoUrlHome - Función para obtener URLs de logos
 * @returns {JSX.Element} Mosaico de marcas
 */
const MarcasMosaicoSimpleHome = ({ marcas, getLogoUrlHome }) => {
  // Validar datos
  if (!marcas || marcas.length === 0) {
    return (
      <div className="no-marcas-home">
        <p>No hay marcas disponibles en este momento.</p>
      </div>
    );
  }

  // Renderizar mosaico
  return (
    <div className="marcas-mosaico-simple-container-home">
      {marcas.map((marca, index) => {
        const logoUrl = getLogoUrlHome(marca);
        
        return (
          <div 
            key={`${marca}-${index}`} 
            className="marca-mosaico-simple-item-home"
          >
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={`Logo ${marca}`}
                className="marca-mosaico-simple-logo-home"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const textElement = e.target.nextSibling;
                  if (textElement) {
                    textElement.style.display = 'inline';
                  }
                }}
              />
            ) : null}
            <span className="marca-mosaico-simple-texto-home" style={{display: logoUrl ? 'none' : 'inline'}}>
              {marca}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL: Home
// ============================================

/**
 * Componente principal de la página de inicio
 * @component
 * @returns {JSX.Element} Página principal completa
 */
const Home = () => {
    // ============================================
    // ESTADOS DEL COMPONENTE
    // ============================================
    
    /** @state {Object|null} quickViewProductHome - Producto para vista rápida */
    const [quickViewProductHome, setQuickViewProductHome] = useState(null);
    /** @state {boolean} isQuickViewOpenHome - Controla visibilidad del modal */
    const [isQuickViewOpenHome, setIsQuickViewOpenHome] = useState(false);
    /** @state {boolean} hasSidebar - Indica si sidebar está visible */
    const [hasSidebar, setHasSidebar] = useState(false);

    // ============================================
    // EFECTOS DE LIFECYCLE
    // ============================================

    /**
     * Efecto: Detectar si el sidebar está visible
     * - Verifica periodicamente si existe un sidebar expandido
     * - Ajusta estilos del contenedor principal
     */
    useEffect(() => {
        const checkSidebar = () => {
            const sidebar = document.querySelector('.sidebar-categories.expanded');
            const isDesktop = window.innerWidth >= 1025;
            
            // Verificar si el sidebar existe y está expandido
            setHasSidebar(isDesktop && sidebar !== null);
        };

        // Verificar inicialmente
        checkSidebar();

        // Verificar en resize
        const handleResize = () => {
            checkSidebar();
        };
        
        window.addEventListener('resize', handleResize);
        
        // Verificar periódicamente
        const interval = setInterval(checkSidebar, 500);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // ============================================
    // HOOKS DE API
    // ============================================

    /** @hook useProductosDestacados - Obtiene productos destacados */
    const { data: productosDestacadosData, loading: destacadosLoading, error: destacadosError } = useProductosDestacados();
    
    /** @hook useProductos - Obtiene todos los productos (limitado) */
    const { data: todosProductosData, loading: productosLoading } = useProductos({ limit: 200 });
    
    /** @hook useCategoriasActualizadas - Obtiene categorías actualizadas */
    const { 
      data: categoriasResponse, 
      loading: categoriasLoading, 
      error: categoriasError 
    } = useCategoriasActualizadas(300000);
    
    /** @hook useTodosProductos - Obtiene todos los productos (sin límite) */
    const { data: productosCompletosData } = useTodosProductos({ page: 1, limit: 20000 });
    
    /** @hook useMarcas - Obtiene lista de marcas */
    const { data: marcasData, loading: marcasLoading } = useMarcas();
    
    /** @hook useEstadisticas - Obtiene estadísticas del sistema */
    const { data: estadisticasData } = useEstadisticas();

    // ============================================
    // DATOS PROCESADOS
    // ============================================

    /** @constant {Array} productosDestacados - Productos destacados procesados */
    const productosDestacados = productosDestacadosData?.data || [];
    
    /** @constant {Array} todosProductos - Productos limitados */
    const todosProductos = todosProductosData?.data || [];
    
    /** @constant {Array} productosCompletos - Productos completos */
    const productosCompletos = productosCompletosData?.data || [];
    
    /** @constant {Array} marcasReales - Lista de marcas */
    const marcasReales = marcasData?.data || [];
    
    /** @constant {Object} estadisticas - Estadísticas del sistema */
    const estadisticas = estadisticasData?.data || {};

    // ============================================
    // FUNCIONES DE PROCESAMIENTO DE DATOS
    // ============================================

    /**
     * Obtiene productos destacados con fallbacks
     * @function getProductosDestacadosHome
     * @returns {Array} Lista de productos destacados únicos
     */
    const getProductosDestacadosHome = useMemo(() => {
      // 1. Intentar con productos destacados de API
      if (Array.isArray(productosDestacados) && productosDestacados.length > 0) {
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
          
          return productosUnicos;
        }
      }
      
      // 2. Fallback: productos disponibles
      const productosDisponibles = Array.isArray(todosProductos) ? todosProductos : 
                                  Array.isArray(productosCompletos) ? productosCompletos : [];
      
      if (productosDisponibles.length === 0) {
        return [];
      }
      
      // 2.1 Filtrar productos con imagen y stock
      const productosConImagenYStock = productosDisponibles.filter(p => {
        const tieneImagen = p.imagen || p.imagenUrl || p.imagenPrincipal;
        const tieneStock = (p.existencia || p.existenciaTotal || 0) > 0;
        return tieneImagen && tieneStock;
      });
      
      if (productosConImagenYStock.length >= 3) {
        const productosUnicos = [...new Map(productosConImagenYStock.map(item => 
          [item.idProducto || item.codigo || item.id, item]
        )).values()].slice(0, 12);
        
        return productosUnicos;
      }
      
      // 2.2 Fallback: solo productos con imagen
      const productosConImagen = productosDisponibles.filter(p => 
        p.imagen || p.imagenUrl || p.imagenPrincipal
      );
      
      if (productosConImagen.length >= 3) {
        const productosUnicos = [...new Map(productosConImagen.map(item => 
          [item.idProducto || item.codigo || item.id, item]
        )).values()].slice(0, 12);
        
        return productosUnicos;
      }
      
      // 3. Fallback final: productos únicos
      const productosUnicos = [...new Map(productosDisponibles.map(item => 
        [item.idProducto || item.codigo || item.id, item]
      )).values()].slice(0, 12);
      
      return productosUnicos;
      
    }, [productosDestacados, todosProductos, productosCompletos]);

    /**
     * Obtiene productos adicionales (no destacados)
     * @function getMasProductosHome
     * @returns {Array} Lista de productos adicionales
     */
    const getMasProductosHome = useMemo(() => {
      const productosDestacadosIds = getProductosDestacadosHome.map(p => 
        p.idProducto || p.codigo || p.id
      );
      
      const productosDisponibles = Array.isArray(todosProductos) ? todosProductos : 
                                  Array.isArray(productosCompletos) ? productosCompletos : [];
      
      if (productosDisponibles.length === 0) return [];
      
      // Filtrar productos que no están en destacados
      const productosNoDestacados = productosDisponibles.filter(producto => {
        const productoId = producto.idProducto || producto.codigo || producto.id;
        return !productosDestacadosIds.includes(productoId);
      });
      
      if (productosNoDestacados.length >= 3) {
        return productosNoDestacados.slice(0, 12);
      }
      
      // Fallback: productos únicos
      const todosUnicos = [...new Map(productosDisponibles.map(item => 
        [item.idProducto || item.codigo || item.id, item]
      )).values()];
      
      return todosUnicos.slice(0, 12);
    }, [getProductosDestacadosHome, todosProductos, productosCompletos]);

    /**
     * Obtiene lista de marcas populares (hardcodeada)
     * @function getMarcasPopularesHome
     * @returns {Array} Lista de nombres de marcas
     */
    const getMarcasPopularesHome = () => {
      const marcasEspecificas = [
        '4GAMERS', 'ACER', 'ACTECK', 'ADATA', 'ADESSO', 'ALTER', 'AMD', 'AOC', 'APC', 'APPLE', 
        'ARUBA', 'ASPEL', 'ASUS', 'AUTODESK', 'AVAST', 'AZOR', 'ALLIED TELESIS', 
        'AMAZFIT', 'AMAZON', 'ANVIZ', 'CANON', 'EPSON', 'LENOVO', 'LEXMARK', 'LOGITECH', 'DELL', 'HP', 'SAMSUNG', 'KYOCERA', 
        'BROTHER', 'FORTINET', 'CISCO', 'SONY', 'SENTINEL', 'KASPERSKY', 'NORTON'
      ];
      
      return marcasEspecificas;
    };

    /**
     * Obtiene URL del logo de una marca
     * @function getLogoUrlHome
     * @param {string} marcaNombre - Nombre de la marca
     * @returns {string|null} URL del logo o null si no existe
     */
    const getLogoUrlHome = (marcaNombre) => {
      const logos = {
        '4GAMERS': '/logos/4gamers.jpeg',
        'ACER': '/logos/acer.jpg',
        'ACTECK': '/logos/AK.png',
        'ADATA': '/logos/ADATA.png',
        'ADESSO': '/logos/ades.png',
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
        'AMAZFIT': '/logos/ama.png',
        'AMAZON': '/logos/amazon.jpg',
        'ANVIZ': '/logos/anviz.png',
        'BROTHER': '/logos/brother.png',
        'CANON': '/logos/can.svg',
        'EPSON': '/logos/epson.png',
        'LENOVO': '/logos/lenovo.png',
        'LEXMARK': '/logos/lex.png',
        'LOGITECH': '/logos/logi.png',
        'DELL': '/logos/dell.png',
        'HP': '/logos/hp.png',
        'SAMSUNG': '/logos/samsung.png',
        'KYOCERA': '/logos/kyocera.png',
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

    // ============================================
    // DATOS PARA RENDERIZAR
    // ============================================

    /** @constant {Array} displayProductosDestacadosHome - Productos destacados a mostrar */
    const displayProductosDestacadosHome = getProductosDestacadosHome;
    
    /** @constant {Array} displayMasProductosHome - Productos adicionales a mostrar */
    const displayMasProductosHome = getMasProductosHome;
    
    /** @constant {Array} displayMarcasPopularesHome - Marcas populares a mostrar */
    const displayMarcasPopularesHome = getMarcasPopularesHome();

    // ============================================
    // MANEJADORES DE EVENTOS
    // ============================================

    /**
     * Abrir vista rápida de producto
     * @function handleQuickViewHome
     * @param {Object} product - Producto a mostrar
     */
    const handleQuickViewHome = useCallback((product) => {
      setQuickViewProductHome(product);
      setIsQuickViewOpenHome(true);
    }, []);

    /**
     * Cerrar vista rápida
     * @function handleCloseQuickViewHome
     */
    const handleCloseQuickViewHome = useCallback(() => {
      setIsQuickViewOpenHome(false);
      setQuickViewProductHome(null);
    }, []);

    /**
     * Agregar producto al carrito
     * @function handleAddToCartHome
     * @param {Object} product - Producto a agregar
     * @param {number} quantity - Cantidad a agregar
     */
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

    // ============================================
    // ESTADOS DE CARGA
    // ============================================

    /** @constant {boolean} isLoadingHome - Indica si hay carga en curso */
    const isLoadingHome = destacadosLoading || productosLoading || categoriasLoading || marcasLoading;

    // ============================================
    // RENDERIZADO PRINCIPAL
    // ============================================

    return (
        <div className={`home-container ${hasSidebar ? 'with-sidebar' : ''}`}>
            {/* OVERLAY DE CARGA */}
            {isLoadingHome && (
                <div className="loading-overlay-home">
                    <div className="loading-spinner-large-home"></div>
                    <p>Cargando contenido...</p>
                </div>
            )}

            {/* SECCIÓN 1: CATEGORÍAS DESTACADAS */}
            <section className="categorias-destacadas-seccion-home">
                <div className="container-home">
                    <div className="section-header-home">
                        <h2 className="section-title-home">Categorías Destacadas</h2>
                        <p className="section-subtitle-home">
                            Explora nuestras principales líneas de productos tecnológicos
                        </p>
                    </div>
                    
                    <CategoriasDestacadasHome />
                </div>
            </section>

            {/* SECCIÓN 2: PRODUCTOS DESTACADOS */}
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

            {/* SECCIÓN 3: OFERTAS ESPECIALES */}
            <section className="ofertas-compactas-home">
                <div className="ofertas-compactas-card-home">
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

            {/* SECCIÓN 4: MÁS PRODUCTOS */}
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

            {/* SECCIÓN 5: BENEFICIOS */}
            <section className="beneficios-compactos-home">
                <div className="container-home">
                    <div className="section-header-home">
                        <h2 className="section-title-home">¿Por qué elegirnos?</h2>
                        <p className="section-subtitle-home">Ofrecemos la mejor experiencia de compra en tecnología</p>
                    </div>
                    <div className="beneficios-compactos-content-home">
                        <div className="beneficio-compacto-home">
                            <h3>Envío Gratis</h3>
                            <p>En compras mayores a $1000 MXN</p>
                        </div>
                        <div className="beneficio-compacto-home">
                            <h3>Garantía</h3>
                            <p>Hasta 2 años en productos seleccionados</p>
                        </div>
                        <div className="beneficio-compacto-home">
                            <h3>Soporte 24/7</h3>
                            <p>Asistencia técnica especializada</p>
                        </div>
                        <div className="beneficio-compacto-home">
                            <h3>Pagos Seguros</h3>
                            <p>Transacciones protegidas SSL</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN 6: MARCAS CONFIABLES */}
            <section className="marcas-home">
                <div className="container-home">
                    <div className="section-header-home">
                        <h2 className="section-title-home">Marcas Confiables</h2>
                        <p className="section-subtitle-home">
                            Trabajamos con las mejores marcas del mercado tecnológico
                        </p>
                    </div>
                    {displayMarcasPopularesHome.length > 0 ? (
                        <MarcasMosaicoSimpleHome 
                            marcas={displayMarcasPopularesHome}
                            getLogoUrlHome={getLogoUrlHome}
                        />
                    ) : (
                        <div className="no-marcas-home">
                            <p>No hay marcas disponibles en este momento.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* MODAL DE VISTA RÁPIDA */}
            <QuickViewModal
                product={quickViewProductHome}
                isOpen={isQuickViewOpenHome}
                onClose={handleCloseQuickViewHome}
                onAddToCart={handleAddToCartHome}
            />
        </div>
    );
};

export default Home;