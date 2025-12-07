import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/Product Card/ProductCard';
import QuickViewModal from '../components/QuickViewModal/QuickViewModal';
import { useSearch } from '../context/SearchContext';
import { 
  useProductos, 
  useBuscarProductos 
} from '../api/productosHooks';
import './Products.css';

// ================ OPTIMIZACIONES CRÍTICAS ================

// ✅ CONFIGURACIÓN DEL PORCENTAJE ADICIONAL
const PORCENTAJE_ADICIONAL = 10; // 10% adicional a todos los productos

// ✅ Función para agregar el porcentaje adicional
const agregarPorcentajeAdicional = (precio) => {
  if (!precio || typeof precio !== 'number' || isNaN(precio) || precio <= 0) {
    return 0;
  }
  return precio * (1 + (PORCENTAJE_ADICIONAL / 100));
};

// ✅ ELIMINAR TODOS LOS console.log EN PRODUCCIÓN
const isDevelopment = process.env.NODE_ENV === 'development';
const log = (...args) => isDevelopment && console.log(...args);
const warn = (...args) => isDevelopment && console.warn(...args);

// ✅ CACHE GLOBAL PARA EVITAR CÁLCULOS REPETIDOS
const precioCache = new Map();
const promocionCache = new Map();
const procesamientoCache = new Map();

// ✅ FUNCIONES OPTIMIZADAS CON MEMOIZACIÓN
const decodeCategoryFromId = (categoryId) => {
  if (categoryId === 'todos') return 'Todos los Productos';
  if (categoryId === 'otros') return 'Otros';
  if (!categoryId) return 'Categoría';
  
  try {
    return decodeURIComponent(categoryId);
  } catch (error) {
    warn('Error decodificando categoryId:', categoryId, error);
    return categoryId.replace(/-/g, ' ');
  }
};

// ✅ OPTIMIZAR: Usar fecha estática durante la sesión
const fechaActual = new Date();
const esPromocionVigente = (promocion) => {
  if (!promocion || !promocion.vigencia) return false;
  
  const inicio = new Date(promocion.vigencia.inicio);
  const fin = new Date(promocion.vigencia.fin);
  
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    return false;
  }
  
  return fechaActual >= inicio && fechaActual <= fin;
};

// ✅ OPTIMIZAR: Función rápida para obtener precio con descuento
const obtenerPrecioConDescuento = (producto, promocion) => {
  const cacheKey = `descuento_${producto.codigo}_${JSON.stringify(promocion)}`;
  if (precioCache.has(cacheKey)) {
    return precioCache.get(cacheKey);
  }
  
  if (!promocion) {
    precioCache.set(cacheKey, null);
    return null;
  }
  
  const precioOriginal = producto.precio || 0;
  let precioConDescuento = null;
  
  // Precio directo
  if (promocion.promocion !== undefined && promocion.promocion !== null) {
    const precioPromocional = parseFloat(promocion.promocion);
    if (!isNaN(precioPromocional) && precioPromocional > 0 && precioPromocional < precioOriginal) {
      precioConDescuento = precioPromocional;
    }
  }
  
  // Porcentaje
  if (!precioConDescuento && promocion.tipo === 'porcentaje' && promocion.porcentaje) {
    const porcentaje = parseFloat(promocion.porcentaje);
    if (!isNaN(porcentaje) && porcentaje > 0 && porcentaje < 100) {
      const descuento = (precioOriginal * porcentaje) / 100;
      precioConDescuento = precioOriginal - descuento;
    }
  }
  
  precioCache.set(cacheKey, precioConDescuento);
  return precioConDescuento;
};

// ✅ OPTIMIZAR: Formateador memoizado
const formatearPrecio = (precio) => {
  if (typeof precio !== 'number' || isNaN(precio)) return '0.00';
  return precio.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// ✅ OPTIMIZAR: Función de cálculo de precios ultra-rápida CON 10% ADICIONAL
const calcularPreciosConDescuento = (producto) => {
  const cacheKey = `calculo_${producto.codigo}_${producto.precio}_${producto.precioPromocion}_${producto.promociones?.length || 0}_${PORCENTAJE_ADICIONAL}`;
  
  if (promocionCache.has(cacheKey)) {
    return promocionCache.get(cacheKey);
  }
  
  if (!producto) {
    const resultado = {
      tienePromocionActiva: false,
      currentPromotion: null,
      precioBaseMXN: '0.00',
      precioPromoMXN: null,
      discountPercentage: 0,
      precioFinalMXN: '0.00',
      ahorroMXN: '0.00',
      tipoPromocion: null,
      porcentajeAdicional: PORCENTAJE_ADICIONAL,
      precioOriginalBase: 0,
      precioOriginalPromo: null
    };
    promocionCache.set(cacheKey, resultado);
    return resultado;
  }

  let promocionActiva = null;
  let mejorDescuento = 0;
  let precioConDescuento = null;
  let tipoPromocion = null;

  // Verificar promociones en array (solo si existe)
  if (producto.promociones && Array.isArray(producto.promociones)) {
    // Usar for loop en lugar de forEach para mejor performance
    for (let i = 0; i < producto.promociones.length; i++) {
      const promocion = producto.promociones[i];
      if (esPromocionVigente(promocion)) {
        const precioDesc = obtenerPrecioConDescuento(producto, promocion);
        if (precioDesc !== null) {
          const descuento = ((producto.precio - precioDesc) / producto.precio) * 100;
          if (descuento > mejorDescuento) {
            mejorDescuento = descuento;
            promocionActiva = promocion;
            precioConDescuento = precioDesc;
            tipoPromocion = promocion.tipo || 'directo';
          }
        }
      }
    }
  }

  // Precio promocional directo
  if (!promocionActiva && producto.precioPromocion && producto.precioPromocion > 0) {
    if (producto.precioPromocion < producto.precio) {
      promocionActiva = { tipo: 'directo' };
      precioConDescuento = producto.precioPromocion;
      mejorDescuento = ((producto.precio - producto.precioPromocion) / producto.precio) * 100;
      tipoPromocion = 'directo';
    }
  }

  const tienePromocionActiva = precioConDescuento !== null && precioConDescuento < producto.precio;
  
  // ✅ CALCULAR PRECIOS EN MXN CON 10% ADICIONAL
  // Usar precioMXN del backend si está disponible, si no usar precio original
  const precioBaseOriginalMXN = producto.precioMXN || producto.precio || 0;
  const precioBaseMXN = agregarPorcentajeAdicional(precioBaseOriginalMXN);
  
  // Calcular precio promocional con 10% adicional
  const precioPromoOriginalMXN = tienePromocionActiva ? precioConDescuento : null;
  const precioPromoMXN = tienePromocionActiva ? agregarPorcentajeAdicional(precioPromoOriginalMXN) : null;
  
  const discountPercentage = tienePromocionActiva ? Math.round(mejorDescuento) : 0;
  const ahorroMXN = tienePromocionActiva ? (precioBaseMXN - precioPromoMXN) : 0;

  const resultado = {
    tienePromocionActiva,
    currentPromotion: promocionActiva,
    precioBaseMXN: formatearPrecio(precioBaseMXN),
    precioPromoMXN: tienePromocionActiva ? formatearPrecio(precioPromoMXN) : null,
    discountPercentage,
    precioFinalMXN: tienePromocionActiva ? formatearPrecio(precioPromoMXN) : formatearPrecio(precioBaseMXN),
    ahorroMXN: formatearPrecio(ahorroMXN),
    tipoPromocion,
    porcentajeAdicional: PORCENTAJE_ADICIONAL,
    precioOriginalBase: precioBaseOriginalMXN,
    precioOriginalPromo: precioPromoOriginalMXN,
    precioBaseConIncremento: precioBaseMXN,
    precioPromoConIncremento: precioPromoMXN
  };
  
  promocionCache.set(cacheKey, resultado);
  return resultado;
};

// ✅ OPTIMIZAR: Procesamiento de producto ultra-rápido CON 10% ADICIONAL
const procesarProducto = (product) => {
  if (!product) return null;
  
  const cacheKey = `producto_${product.codigo}_${product.precio}_${product.precioPromocion}_${PORCENTAJE_ADICIONAL}`;
  if (procesamientoCache.has(cacheKey)) {
    return procesamientoCache.get(cacheKey);
  }
  
  // Extraer valores una sola vez
  const precio = typeof product.precio === 'number' ? product.precio : 
                typeof product.precio === 'string' ? parseFloat(product.precio) || 0 : 0;
  
  const precioPromocion = typeof product.precioPromocion === 'number' ? product.precioPromocion : 
                         typeof product.precioPromocion === 'string' ? parseFloat(product.precioPromocion) || 0 : 0;
  
  const existencia = typeof product.existencia === 'number' ? product.existencia : 
                    typeof product.existencia === 'string' ? parseInt(product.existencia) || 0 : 
                    typeof product.existenciaTotal === 'number' ? product.existenciaTotal : 
                    typeof product.existenciaTotal === 'string' ? parseInt(product.existenciaTotal) || 0 : 0;
  
  const existenciaTotal = product.existenciaTotal || existencia || 0;
  const tieneExistencia = existenciaTotal > 0;
  
  // ✅ CALCULAR PRECIO MXN CON 10% ADICIONAL
  const precioMXNOriginal = product.precioMXN || (product.precio || 0) * (product.tipo_cambio || product.tipoCambio || 18.4);
  const precioMXNCon10 = agregarPorcentajeAdicional(precioMXNOriginal);
  
  const productoProcesado = {
    id: product.id || product.idProducto || product.codigo || `prod_${Date.now()}`,
    codigo: product.codigo || 'N/A',
    nombre: product.nombre || 'Producto sin nombre',
    modelo: product.modelo || product.numParte || product.no_parte || '',
    marca: product.marca || 'Sin marca',
    categoria: product.categoria || 'General',
    subcategoria: product.subcategoria || '',
    descripcion_corta: product.descripcion_corta || product.descripcion || '',
    imagen: product.imagen || '',
    precio,
    precioPromocion,
    moneda: product.moneda || 'USD',
    // ✅ PRECIO MXN YA CON 10% ADICIONAL APLICADO
    precioMXN: precioMXNCon10,
    precioMXNOriginal: precioMXNOriginal, // Para referencia
    especificaciones: Array.isArray(product.especificaciones) ? product.especificaciones : [],
    existencia,
    disponible: product.disponible !== undefined ? Boolean(product.disponible) : tieneExistencia,
    stock: typeof product.stock === 'number' ? product.stock : existencia,
    promociones: Array.isArray(product.promociones) ? product.promociones : [],
    existenciaTotal,
    tieneExistencia,
    tipo_cambio: product.tipo_cambio || product.tipoCambio || 0,
    imagenFecha: product.imagenFecha || '',
    upc: product.upc || '',
    ean: product.ean || '',
    sustituto: product.sustituto || '',
    status: product.status || (product.activo === 1 ? 'Activo' : 'Inactivo'),
    fuente: product.fuente || 'unknown',
    ultimaActualizacion: product.ultimaActualizacion || new Date().toISOString(),
    almacenes: product.almacenes || {},
    sinStock: existenciaTotal === 0,
    stockBajo: existenciaTotal > 0 && existenciaTotal <= 5,
    stockSuficiente: existenciaTotal > 5,
    porcentajeAdicional: PORCENTAJE_ADICIONAL
  };
  
  // Calcular promoción (ya incluye 10% en precioMXN)
  const calculosPromocion = calcularPreciosConDescuento(productoProcesado);
  
  productoProcesado.tienePromocion = calculosPromocion.tienePromocionActiva;
  productoProcesado.porcentajeDescuento = calculosPromocion.discountPercentage;
  productoProcesado.precioFinal = calculosPromocion.tienePromocionActiva ? 
    parseFloat(calculosPromocion.precioFinalMXN.replace(/,/g, '')) : precioMXNCon10;
  
  procesamientoCache.set(cacheKey, productoProcesado);
  return productoProcesado;
};

// ✅ OPTIMIZAR: Procesar productos en lotes para no bloquear el hilo principal
const procesarProductos = (productosArray) => {
  if (!productosArray || !Array.isArray(productosArray)) return [];
  
  const procesados = [];
  const batchSize = 100; // Procesar en lotes de 100
  let batchCount = 0;
  
  for (let i = 0; i < productosArray.length; i++) {
    const producto = procesarProducto(productosArray[i]);
    if (producto) {
      procesados.push(producto);
    }
    
    // Liberar el hilo principal cada 100 productos
    batchCount++;
    if (batchCount >= batchSize) {
      batchCount = 0;
      // Pequeña pausa para permitir que la UI se actualice
      if (i < productosArray.length - 1) {
        const promise = new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }
  
  log(`📦 Procesados ${procesados.length} productos con ${PORCENTAJE_ADICIONAL}% adicional`);
  return procesados;
};

// ✅ OPTIMIZAR: Filtros con algoritmos eficientes
const filtrarProductosConExistencia = (productos) => {
  const resultado = [];
  for (let i = 0; i < productos.length; i++) {
    const producto = productos[i];
    if (producto.disponible || producto.tieneExistencia) {
      resultado.push(producto);
    }
  }
  return resultado;
};

const filtrarProductosEnPromocion = (productos) => {
  const resultado = [];
  for (let i = 0; i < productos.length; i++) {
    const producto = productos[i];
    if (producto.tienePromocion) {
      resultado.push(producto);
    }
  }
  return resultado;
};

const filtrarProductosPorCategoriaYSubcategoria = (productos, categoriaNombre, subcategoriaNombre = null) => {
  if (categoriaNombre === 'todos' || !categoriaNombre) {
    return productos;
  }
  
  if (categoriaNombre === 'otros') {
    return productos.filter(producto => {
      const tieneCategoria = producto.categoria && 
          typeof producto.categoria === 'string' && 
          producto.categoria.trim() !== '' &&
          producto.categoria.trim() !== 'N/A' &&
          producto.categoria.trim() !== 'null';
      
      const tieneSubcategoria = producto.subcategoria && 
          typeof producto.subcategoria === 'string' && 
          producto.subcategoria.trim() !== '' &&
          producto.subcategoria.trim() !== 'N/A' &&
          producto.subcategoria.trim() !== 'null';
      
      return !tieneCategoria && !tieneSubcategoria;
    });
  }
  
  const categoriaBuscada = decodeURIComponent(categoriaNombre).trim().toLowerCase();
  
  let productosFiltrados = productos.filter(producto => {
    const categoriaProducto = (producto.categoria?.trim() || '').toLowerCase();
    return categoriaProducto === categoriaBuscada;
  });
  
  if (subcategoriaNombre && subcategoriaNombre.trim() !== '') {
    const subcategoriaBuscada = decodeURIComponent(subcategoriaNombre).trim().toLowerCase();
    productosFiltrados = productosFiltrados.filter(producto => {
      const subcategoriaProducto = (producto.subcategoria?.trim() || '').toLowerCase();
      return subcategoriaProducto === subcategoriaBuscada;
    });
  }
  
  return productosFiltrados;
};

// ================ COMPONENTE PRINCIPAL OPTIMIZADO ================

const Products = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [sortBy, setSortBy] = useState('nombre');
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(48);
  
  // ✅ OPTIMIZAR: Reducir estado innecesario
  const [productosStats] = useState({
    total: 0,
    conExistencia: 0,
    enPromocion: 0,
    categorias: 0
  });

  const { searchTerm, setSearchTerm, clearSearch } = useSearch();
  
  // ✅ OBTENER PARÁMETROS DE URL
  const categoryFromUrl = searchParams.get('category');
  const subcategoryFromUrl = searchParams.get('subcategory');
  const promocionesFromUrl = searchParams.get('promociones');

  // ✅ OPTIMIZAR: Limitar cantidad de productos iniciales
  const { data: productosResponse, loading, error } = useProductos({
    page: 1,
    limit: 2000 // Reducir para carga inicial más rápida
  });

  const { data: searchedProductsResponse, loading: searchLoading } = useBuscarProductos(searchTerm);

  // ✅ OPTIMIZAR CRÍTICO: Memoizar productos con caché
  const productos = useMemo(() => {
    if (!productosResponse?.data) return [];
    
    const startTime = performance.now();
    const rawData = productosResponse.data;
    const procesados = procesarProductos(rawData);
    
    const stats = {
      total: procesados.length,
      conExistencia: procesados.filter(p => p.disponible).length,
      enPromocion: procesados.filter(p => p.tienePromocion).length,
      categorias: new Set(procesados.map(p => p.categoria).filter(Boolean)).size
    };
    
    const endTime = performance.now();
    log(`⏱️ Tiempo de procesamiento: ${(endTime - startTime).toFixed(2)}ms`);
    log(`📊 Estadísticas: ${stats.total} total, ${stats.conExistencia} con existencia, ${stats.enPromocion} en promoción`);
    
    return procesados;
  }, [productosResponse]);

  const searchedProducts = useMemo(() => {
    if (!searchedProductsResponse?.data) return [];
    return procesarProductos(searchedProductsResponse.data);
  }, [searchedProductsResponse]);

  // ✅ DETECTAR MODO PROMOCIONES
  const isModoPromociones = useMemo(() => {
    return promocionesFromUrl === 'true';
  }, [promocionesFromUrl]);

  // ✅ OPTIMIZAR CRÍTICO: Procesamiento final optimizado
  const productosFinales = useMemo(() => {
    const productsToDisplay = searchTerm ? searchedProducts : productos;
    
    if (!Array.isArray(productsToDisplay) || productsToDisplay.length === 0) {
      return [];
    }

    let filtered = productsToDisplay;

    // Filtrar por existencia
    filtered = filtrarProductosConExistencia(filtered);

    // Aplicar filtros según modo
    if (isModoPromociones) {
      filtered = filtrarProductosEnPromocion(filtered);
    } else if (selectedCategory !== 'todos' || selectedSubcategory) {
      filtered = filtrarProductosPorCategoriaYSubcategoria(
        filtered, 
        selectedCategory, 
        selectedSubcategory
      );
    }

    // Ordenar solo si es necesario
    if (sortBy !== 'nombre') {
      const sortedProducts = [...filtered];
      
      // Función de comparación optimizada
      const compararProductos = (a, b) => {
        switch (sortBy) {
          case 'precio': {
            const precioA = a.precioFinal || a.precioMXN || 0;
            const precioB = b.precioFinal || b.precioMXN || 0;
            return precioA - precioB;
          }
          case 'precio-desc': {
            const precioA = a.precioFinal || a.precioMXN || 0;
            const precioB = b.precioFinal || b.precioMXN || 0;
            return precioB - precioA;
          }
          case 'marca':
            return (a.marca || '').localeCompare(b.marca || '');
          case 'existencia':
            return (b.existencia || 0) - (a.existencia || 0);
          case 'precio-promocion': {
            if (a.tienePromocion && !b.tienePromocion) return -1;
            if (!a.tienePromocion && b.tienePromocion) return 1;
            const precioA = a.precioFinal || a.precioMXN || 0;
            const precioB = b.precioFinal || b.precioMXN || 0;
            return precioA - precioB;
          }
          default:
            return 0;
        }
      };
      
      sortedProducts.sort(compararProductos);
      return sortedProducts;
    }

    return filtered;
  }, [productos, searchedProducts, selectedCategory, selectedSubcategory, sortBy, searchTerm, isModoPromociones]);

  // ✅ OPTIMIZAR: Actualizar productos filtrados solo cuando cambian
  useEffect(() => {
    if (filteredProducts.length !== productosFinales.length || 
        JSON.stringify(filteredProducts.slice(0, 10)) !== JSON.stringify(productosFinales.slice(0, 10))) {
      setFilteredProducts(productosFinales);
    }
    setCurrentPage(1);
  }, [productosFinales]);

  // ✅ ACTUALIZAR CATEGORÍA DESDE URL
  useEffect(() => {
    if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
    }
    
    if (subcategoryFromUrl && subcategoryFromUrl !== selectedSubcategory) {
      setSelectedSubcategory(subcategoryFromUrl);
    }
    
    if (!subcategoryFromUrl && selectedSubcategory) {
      setSelectedSubcategory(null);
    }
    
    setCurrentPage(1);
  }, [categoryFromUrl, subcategoryFromUrl]);

  // ✅ PAGINACIÓN OPTIMIZADA
  const { productosPaginados, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    
    return {
      productosPaginados: filteredProducts.slice(startIndex, endIndex),
      totalPages: Math.ceil(filteredProducts.length / productsPerPage)
    };
  }, [filteredProducts, currentPage, productsPerPage]);

  // ✅ HANDLERS OPTIMIZADOS
  const handleSearch = useCallback((e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, [setSearchTerm]);

  const handleClearSearch = useCallback(() => {
    clearSearch();
    setCurrentPage(1);
  }, [clearSearch]);

  const handleQuickView = useCallback((product) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  }, []);

  const handleCloseQuickView = useCallback(() => {
    setIsQuickViewOpen(false);
    setQuickViewProduct(null);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCategoryChange = useCallback((category, subcategory = null) => {
    if (category === selectedCategory && subcategory === selectedSubcategory) {
      return;
    }
    
    if (category !== selectedCategory) {
      setSelectedSubcategory(null);
    }
    
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setCurrentPage(1);
    
    if (searchTerm) {
      clearSearch();
    }
    
    let url = '/products';
    if (category && category !== 'todos') {
      url += `?category=${encodeURIComponent(category)}`;
      if (subcategory) {
        url += `&subcategory=${encodeURIComponent(subcategory)}`;
      }
    }
    
    navigate(url, { replace: true });
  }, [selectedCategory, selectedSubcategory, searchTerm, clearSearch, navigate]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  
  const handleExitPromociones = useCallback(() => {
    navigate('/products');
  }, [navigate]);

  const handleClearSubcategory = useCallback(() => {
    if (selectedSubcategory) {
      setSelectedSubcategory(null);
      setCurrentPage(1);
      
      if (categoryFromUrl) {
        navigate(`/products?category=${categoryFromUrl}`);
      }
    }
  }, [selectedSubcategory, categoryFromUrl, navigate]);

  const handleAddToCart = useCallback((product) => {
    // Lógica para agregar al carrito
    console.log('🛒 Agregando al carrito:', product.nombre);
    // Aquí iría la lógica de tu carrito
  }, []);

  // ✅ OPTIMIZAR: Memoizar nombre de visualización
  const getDisplayName = useMemo(() => {
    if (isModoPromociones) return `🎯 Ofertas Especiales `;
    if (searchTerm) return `Buscando: "${searchTerm}"`;
    
    let displayName = decodeCategoryFromId(selectedCategory);
    if (selectedSubcategory) {
      const subcategoryName = decodeURIComponent(selectedSubcategory);
      displayName = `${displayName} > ${subcategoryName}`;
    }
    
    return `${displayName} `;
  }, [selectedCategory, selectedSubcategory, searchTerm, isModoPromociones]);

  // ✅ OPCIONAL: Información sobre el porcentaje adicional
  const percentageInfo = useMemo(() => {
    if (filteredProducts.length > 0) {
      const precioEjemplo = filteredProducts[0]?.precioMXN || 0;
      const precioOriginal = filteredProducts[0]?.precioMXNOriginal || 0;
      
      if (precioOriginal > 0) {
        const aumento = ((precioEjemplo - precioOriginal) / precioOriginal) * 100;
        return {
          aumentoPorcentaje: aumento.toFixed(1),
          precioEjemplo,
          precioOriginal
        };
      }
    }
    return null;
  }, [filteredProducts]);

  // ✅ Loading simplificado
  if (loading) {
    return (
      <div className="lucesa-products-page">
        <div className="lucesa-products-container">
          <div className="lucesa-products-loading">
            <div className="lucesa-products-loading-spinner"></div>
            <p>Cargando productos...</p>
            <small>Aplicando {PORCENTAJE_ADICIONAL}% adicional a todos los precios</small>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lucesa-products-page">
        <div className="lucesa-products-container">
          <div className="lucesa-products-error">
            <div className="lucesa-products-error-icon">⚠️</div>
            <h3>Error al cargar productos</h3>
            <p>{error.message || 'Error de conexión'}</p>
            <button onClick={() => window.location.reload()} className="lucesa-products-btn-retry">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lucesa-products-page">
      <div className="lucesa-products-container">
        {/* HEADER CON INFORMACIÓN DE 10% */}
        <div className="lucesa-products-header">
          <div className="lucesa-products-header-top">
            <button onClick={handleGoBack} className="lucesa-products-back-button">← Volver</button>
            <div className="lucesa-products-title-section">
              <h1>{getDisplayName}</h1>
              {/* <div className="lucesa-products-additional-info">
                <span className="lucesa-products-percentage-badge">+{PORCENTAJE_ADICIONAL}%</span>
                <small>Todos los precios incluyen {PORCENTAJE_ADICIONAL}% adicional</small>
              </div> */}
            </div>
          </div>
          
          {/* BÚSQUEDA */}
          <div className="lucesa-products-search">
            <div className="lucesa-products-search-box">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={handleSearch}
                className="lucesa-products-search-input"
              />
              {searchTerm && (
                <button onClick={handleClearSearch} className="lucesa-products-search-clear">×</button>
              )}
            </div>
            
            {isModoPromociones && (
              <button 
                onClick={handleExitPromociones}
                className="lucesa-products-btn-exit-promociones"
              >
                🗙 Ver todos
              </button>
            )}
          </div>
        </div>

        {/* CONTROLES */}
        <div className="lucesa-products-controls">
          <div className="lucesa-products-sort-filter">
            <div className="lucesa-products-sort-filter-container">
              <label htmlFor="sort">Ordenar por:</label>
              <select 
                id="sort"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="lucesa-products-sort-select"
              >
                <option value="nombre">Nombre A-Z</option>
                <option value="precio">Precio: Menor a Mayor</option>
                <option value="precio-desc">Precio: Mayor a Menor</option>
                <option value="precio-promocion">Precio con descuento</option>
                <option value="marca">Marca</option>
                <option value="existencia">Disponibilidad</option>
              </select>
            </div>
            
            {/* INFORMACIÓN DE PRODUCTOS */}
            {/* <div className="lucesa-products-info">
              <span className="lucesa-products-count">
                {filteredProducts.length} productos encontrados
              </span>
              {percentageInfo && (
                <span className="lucesa-products-price-note">
                  (Precios con {PORCENTAJE_ADICIONAL}% adicional)
                </span>
              )}
            </div> */}
          </div>
        </div>

        {/* GRILLA DE PRODUCTOS */}
        <div className="lucesa-products-grid">
          {searchLoading ? (
            <div className="lucesa-products-loading-search">
              <div className="lucesa-products-loading-spinner"></div>
              <p>Buscando...</p>
            </div>
          ) : productosPaginados.length > 0 ? (
            productosPaginados.map((product, index) => (
              <ProductCard 
                key={`${product.id}_${index}_${PORCENTAJE_ADICIONAL}`} 
                product={product}
                onQuickView={handleQuickView}
                onAddToCart={handleAddToCart}
              />
            ))
          ) : (
            <div className="lucesa-products-no-products">
              <div className="lucesa-products-no-products-icon">
                {isModoPromociones ? '💰' : '📦'}
              </div>
              <h3>No se encontraron productos</h3>
              <p>Intenta con otros filtros o términos de búsqueda</p>
            </div>
          )}
        </div>

        {/* PAGINACIÓN */}
        {totalPages > 1 && filteredProducts.length > 0 && (
          <div className="lucesa-products-pagination">
            <button 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="lucesa-products-pagination-btn"
            >
              ← Anterior
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNumber}
                  className={`lucesa-products-pagination-btn ${currentPage === pageNumber ? 'lucesa-products-pagination-active' : ''}`}
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </button>
              );
            })}

            {totalPages > 5 && (
              <>
                <span className="lucesa-products-pagination-ellipsis">...</span>
                <button
                  className={`lucesa-products-pagination-btn ${currentPage === totalPages ? 'lucesa-products-pagination-active' : ''}`}
                  onClick={() => handlePageChange(totalPages)}
                >
                  {totalPages}
                </button>
              </>
            )}

            <button 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="lucesa-products-pagination-btn"
            >
              Siguiente →
            </button>
          </div>
        )}
        
        {/* INFORMACIÓN ADICIONAL SOBRE PRECIOS */}
        {/* {filteredProducts.length > 0 && (
          <div className="lucesa-products-price-info">
            <div className="lucesa-products-price-info-content">
              <h4>💡 Información sobre precios</h4>
              <ul>
                <li>Todos los precios están en <strong>Pesos Mexicanos (MXN)</strong></li>
                <li>Se aplica un <strong>{PORCENTAJE_ADICIONAL}% adicional</strong> sobre el precio base</li>
                <li>Los descuentos se calculan sobre el precio con el {PORCENTAJE_ADICIONAL}% incluido</li>
                <li>Productos en USD se convierten a MXN usando el tipo de cambio actual</li>
              </ul>
            </div>
          </div>
        )} */}
      </div>

      {/* MODAL DE VISTA RÁPIDA */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};

export default React.memo(Products);