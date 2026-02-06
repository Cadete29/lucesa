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

// ================ CONFIGURACIÓN SIMPLIFICADA ================

// ✅ CONFIGURACIÓN DEL PORCENTAJE ADICIONAL
const PORCENTAJE_ADICIONAL = 10; // 10% adicional a todos los productos

// ✅ Función mejorada para normalizar producto
const normalizarProducto = (product) => {
  if (!product) return null;
  
  console.log('🔄 Normalizando producto:', {
    original: {
      id: product.id,
      idProducto: product.idProducto,
      codigo: product.codigo,
      precioMXN: product.precioMXN
    }
  });
  
  // Precios
  const precio = typeof product.precio === 'number' ? product.precio : 
                typeof product.precio === 'string' ? parseFloat(product.precio) || 0 : 0;
  
  const precioPromocion = typeof product.precioPromocion === 'number' ? product.precioPromocion : 
                         typeof product.precioPromocion === 'string' ? parseFloat(product.precioPromocion) || 0 : 0;
  
  // Existencia
  const existencia = typeof product.existencia === 'number' ? product.existencia : 
                    typeof product.existencia === 'string' ? parseInt(product.existencia) || 0 : 
                    typeof product.existenciaTotal === 'number' ? product.existenciaTotal : 
                    typeof product.existenciaTotal === 'string' ? parseInt(product.existenciaTotal) || 0 : 0;
  
  const existenciaTotal = product.existenciaTotal || existencia || 0;
  const tieneExistencia = existenciaTotal > 0;
  
  // Código procesado
  let codigoProcesado = product.codigo || 'N/A';
  if (codigoProcesado !== 'N/A') {
    codigoProcesado = codigoProcesado.toString().trim().toUpperCase();
  }
  
  // ID procesado
  const idProcesado = product.id || product.idProducto || product.codigo || `prod_${Date.now()}`;
  const idProductoProcesado = product.idProducto || product.id || product.codigo || idProcesado;
  
  // ✅ PRODUCTO NORMALIZADO COMPLETO
  const productoProcesado = {
    // ✅ IDENTIFICADORES (CRÍTICOS)
    id: idProcesado,
    idProducto: idProductoProcesado,
    
    // ✅ CÓDIGO E IMÁGENES (MÁS CRÍTICO)
    codigo: codigoProcesado,
    imagen: product.imagen || '',
    
    // ✅ INFORMACIÓN BÁSICA
    nombre: product.nombre || 'Producto sin nombre',
    modelo: product.modelo || product.numParte || product.no_parte || '',
    marca: product.marca || 'Sin marca',
    categoria: product.categoria || 'General',
    subcategoria: product.subcategoria || '',
    descripcion_corta: product.descripcion_corta || product.descripcion || '',
    descripcion: product.descripcion || product.descripcion_corta || '',
    
    // ✅ PRECIOS
    precio: precio,
    precioPromocion: precioPromocion,
    moneda: product.moneda || 'USD',
    precioMXN: product.precioMXN || 0,
    precioPromocionMXN: product.precioPromocionMXN || 0,
    
    // ✅ ESPECIFICACIONES
    especificaciones: Array.isArray(product.especificaciones) ? product.especificaciones : [],
    
    // ✅ EXISTENCIA
    existencia: existencia,
    existenciaTotal: existenciaTotal,
    disponible: product.disponible !== undefined ? Boolean(product.disponible) : tieneExistencia,
    stock: typeof product.stock === 'number' ? product.stock : existencia,
    tieneExistencia: tieneExistencia,
    
    // ✅ PROMOCIONES
    promociones: Array.isArray(product.promociones) ? product.promociones : [],
    
    // ✅ CAMPOS ADICIONALES
    tipo_cambio: product.tipo_cambio || product.tipoCambio || 18.4,
    imagenFecha: product.imagenFecha || '',
    upc: product.upc || '',
    ean: product.ean || '',
    sustituto: product.sustituto || '',
    status: product.status || (product.activo === 1 ? 'Activo' : 'Inactivo'),
    fuente: product.fuente || 'unknown',
    ultimaActualizacion: product.ultimaActualizacion || new Date().toISOString(),
    almacenes: product.almacenes || {},
    numParte: product.numParte || product.no_parte || '',
    
    // ✅ CAMPOS CALCULADOS
    sinStock: existenciaTotal === 0,
    stockBajo: existenciaTotal > 0 && existenciaTotal <= 5,
    stockSuficiente: existenciaTotal > 5
  };
  
  console.log('✅ Producto normalizado:', {
    id: productoProcesado.id,
    codigo: productoProcesado.codigo,
    tienePromociones: productoProcesado.promociones?.length > 0
  });
  
  return productoProcesado;
};

// ✅ Procesar productos en lote
const procesarProductos = (productosArray) => {
  if (!productosArray || !Array.isArray(productosArray)) return [];
  
  const procesados = [];
  for (let i = 0; i < productosArray.length; i++) {
    const producto = normalizarProducto(productosArray[i]);
    if (producto) {
      procesados.push(producto);
    }
  }
  
  console.log(`📊 Procesados ${procesados.length} productos`);
  return procesados;
};

// ✅ Filtros básicos
const filtrarProductosConExistencia = (productos) => {
  return productos.filter(producto => producto.disponible || producto.tieneExistencia);
};

const filtrarProductosEnPromocion = (productos) => {
  return productos.filter(producto => {
    const tienePrecioPromocion = 
      (producto.precioPromocion && producto.precioPromocion > 0) ||
      (producto.precioPromocionMXN && producto.precioPromocionMXN > 0);
    
    const tienePromocionesArray = 
      producto.promociones && 
      Array.isArray(producto.promociones) && 
      producto.promociones.length > 0;
    
    const tienePromocionValidaEnArray = tienePromocionesArray && 
      producto.promociones.some(promo => 
        promo.promocion && 
        (typeof promo.promocion === 'number' ? promo.promocion > 0 : parseFloat(promo.promocion) > 0)
      );
    
    return tienePrecioPromocion || tienePromocionValidaEnArray || tienePromocionesArray;
  });
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

// ================ COMPONENTE PRINCIPAL ================

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
  
  const { searchTerm, setSearchTerm, clearSearch } = useSearch();
  
  const categoryFromUrl = searchParams.get('category');
  const subcategoryFromUrl = searchParams.get('subcategory');
  const promocionesFromUrl = searchParams.get('promociones');

  // ✅ Obtener productos
  const { data: productosResponse, loading, error } = useProductos({
    page: 1,
    limit: 20000
  });

  const { data: searchedProductsResponse, loading: searchLoading } = useBuscarProductos(searchTerm);

  // ✅ Memoizar productos procesados
  const productos = useMemo(() => {
    if (!productosResponse?.data) {
      console.log('📭 No hay datos en productosResponse');
      return [];
    }
    
    console.log('📥 Recibidos productosResponse:', productosResponse.data.length, 'productos');
    
    const productosProcesados = procesarProductos(productosResponse.data);
    
    // Validar productos críticos
    const productosConCodigo = productosProcesados.filter(p => p.codigo && p.codigo !== 'N/A');
    console.log(`✅ ${productosConCodigo.length}/${productosProcesados.length} productos con código válido`);
    
    return productosProcesados;
  }, [productosResponse]);

  const searchedProducts = useMemo(() => {
    if (!searchedProductsResponse?.data) {
      console.log('📭 No hay datos en searchedProductsResponse');
      return [];
    }
    
    console.log('🔍 Recibidos searchedProducts:', searchedProductsResponse.data.length, 'productos');
    
    const productosProcesados = procesarProductos(searchedProductsResponse.data);
    
    const productosConCodigo = productosProcesados.filter(p => p.codigo && p.codigo !== 'N/A');
    console.log(`✅ ${productosConCodigo.length}/${productosProcesados.length} productos con código válido`);
    
    return productosProcesados;
  }, [searchedProductsResponse]);

  // ✅ Detectar modo promociones
  const isModoPromociones = useMemo(() => {
    return promocionesFromUrl === 'true';
  }, [promocionesFromUrl]);

  // ✅ Procesamiento final
  const productosFinales = useMemo(() => {
    console.log('🔄 Procesando productos finales...');
    const productsToDisplay = searchTerm ? searchedProducts : productos;
    
    if (!Array.isArray(productsToDisplay) || productsToDisplay.length === 0) {
      console.log('📭 No hay productos para mostrar');
      return [];
    }

    console.log(`📊 Productos iniciales: ${productsToDisplay.length}`);

    let filtered = productsToDisplay;

    // Filtrar por existencia
    filtered = filtrarProductosConExistencia(filtered);
    console.log(`📊 Después de filtrar por existencia: ${filtered.length}`);

    // Aplicar filtros según modo
    if (isModoPromociones) {
      filtered = filtrarProductosEnPromocion(filtered);
      console.log(`📊 Después de filtrar promociones: ${filtered.length}`);
    } else if (selectedCategory !== 'todos' || selectedSubcategory) {
      filtered = filtrarProductosPorCategoriaYSubcategoria(
        filtered, 
        selectedCategory, 
        selectedSubcategory
      );
      console.log(`📊 Después de filtrar categoría: ${filtered.length}`);
    }

    // Ordenar
    if (sortBy !== 'nombre') {
      const sortedProducts = [...filtered];
      
      sortedProducts.sort((a, b) => {
        switch (sortBy) {
          case 'precio': {
            const precioA = a.precioMXN || 0;
            const precioB = b.precioMXN || 0;
            return precioA - precioB;
          }
          case 'precio-desc': {
            const precioA = a.precioMXN || 0;
            const precioB = b.precioMXN || 0;
            return precioB - precioA;
          }
          case 'marca':
            return (a.marca || '').localeCompare(b.marca || '');
          case 'existencia':
            return (b.existencia || 0) - (a.existencia || 0);
          case 'precio-promocion': {
            const tienePromoA = a.precioPromocion > 0 || a.precioPromocionMXN > 0;
            const tienePromoB = b.precioPromocion > 0 || b.precioPromocionMXN > 0;
            if (tienePromoA && !tienePromoB) return -1;
            if (!tienePromoA && tienePromoB) return 1;
            const precioA = a.precioMXN || 0;
            const precioB = b.precioMXN || 0;
            return precioA - precioB;
          }
          default:
            return 0;
        }
      });
      
      console.log(`📊 Después de ordenar: ${sortedProducts.length}`);
      return sortedProducts;
    }

    console.log(`📊 Productos finales: ${filtered.length}`);
    return filtered;
  }, [productos, searchedProducts, selectedCategory, selectedSubcategory, sortBy, searchTerm, isModoPromociones]);

  // ✅ Actualizar productos filtrados
  useEffect(() => {
    console.log(`🎯 Estableciendo filteredProducts: ${productosFinales.length} productos`);
    setFilteredProducts(productosFinales);
    setCurrentPage(1);
  }, [productosFinales]);

  // ✅ Actualizar categoría desde URL
  useEffect(() => {
    if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
      console.log(`🏷️ Actualizando categoría desde URL: ${categoryFromUrl}`);
      setSelectedCategory(categoryFromUrl);
    }
    
    if (subcategoryFromUrl && subcategoryFromUrl !== selectedSubcategory) {
      console.log(`🏷️ Actualizando subcategoría desde URL: ${subcategoryFromUrl}`);
      setSelectedSubcategory(subcategoryFromUrl);
    }
    
    if (!subcategoryFromUrl && selectedSubcategory) {
      console.log(`🏷️ Limpiando subcategoría`);
      setSelectedSubcategory(null);
    }
    
    setCurrentPage(1);
  }, [categoryFromUrl, subcategoryFromUrl]);

  // ✅ Paginación
  const { productosPaginados, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    
    const paginados = filteredProducts.slice(startIndex, endIndex);
    
    console.log(`📄 Página ${currentPage}: Mostrando ${paginados.length} productos (${startIndex}-${endIndex})`);
    
    return {
      productosPaginados: paginados,
      totalPages: Math.ceil(filteredProducts.length / productsPerPage)
    };
  }, [filteredProducts, currentPage, productsPerPage]);

  // ✅ Handlers
  const handleSearch = useCallback((e) => {
    console.log(`🔍 Búsqueda: ${e.target.value}`);
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, [setSearchTerm]);

  const handleClearSearch = useCallback(() => {
    console.log(`🗑️ Limpiando búsqueda`);
    clearSearch();
    setCurrentPage(1);
  }, [clearSearch]);

  const handleQuickView = useCallback((product) => {
    console.log(`👁️ Vista rápida: ${product.nombre} (${product.codigo})`);
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  }, []);

  const handleCloseQuickView = useCallback(() => {
    console.log(`❌ Cerrando vista rápida`);
    setIsQuickViewOpen(false);
    setQuickViewProduct(null);
  }, []);

  const handlePageChange = useCallback((page) => {
    console.log(`📄 Cambiando a página: ${page}`);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCategoryChange = useCallback((category, subcategory = null) => {
    console.log(`🏷️ Cambiando categoría: ${category}, subcategoría: ${subcategory}`);
    
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
    
    console.log(`🌐 Navegando a: ${url}`);
    navigate(url, { replace: true });
  }, [selectedCategory, selectedSubcategory, searchTerm, clearSearch, navigate]);

  const handleGoBack = useCallback(() => {
    console.log(`🔙 Volviendo atrás`);
    navigate(-1);
  }, [navigate]);
  
  const handleExitPromociones = useCallback(() => {
    console.log(`🚪 Saliendo de promociones`);
    navigate('/products');
  }, [navigate]);

  const handleAddToCart = useCallback((product) => {
    console.log('🛒 Agregando al carrito desde Products:', {
      nombre: product.nombre,
      codigo: product.codigo,
      id: product.id
    });
  }, []);

  // ✅ Nombre de visualización
  const getDisplayName = useMemo(() => {
    if (isModoPromociones) return `Ofertas Especiales`;
    if (searchTerm) return `Buscando: "${searchTerm}"`;
    
    let displayName = selectedCategory === 'todos' ? 'Todos los Productos' : selectedCategory.replace(/-/g, ' ');
    if (selectedSubcategory) {
      const subcategoryName = decodeURIComponent(selectedSubcategory);
      displayName = `${displayName} > ${subcategoryName}`;
    }
    
    return displayName;
  }, [selectedCategory, selectedSubcategory, searchTerm, isModoPromociones]);

  // ✅ Loading
  if (loading) {
    return (
      <div className="lucesa-products-page products-with-sidebar">
        <div className="lucesa-products-container">
          <div className="lucesa-products-loading">
            <div className="lucesa-products-loading-spinner"></div>
            <p>Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lucesa-products-page products-with-sidebar">
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

  console.log('🎬 Renderizando Products con:', {
    totalProductos: productos.length,
    productosFiltrados: filteredProducts.length,
    productosPaginados: productosPaginados.length,
    currentPage,
    totalPages
  });

  return (
    <div className="lucesa-products-page products-with-sidebar">
      <div className="lucesa-products-container">
        {/* HEADER */}
        <div className="lucesa-products-header">
          <div className="lucesa-products-header-top">
            <button onClick={handleGoBack} className="lucesa-products-back-button">← Volver</button>
            <div className="lucesa-products-title-section">
              <h1>{getDisplayName}</h1>
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
            
            <div className="lucesa-products-info">
              <span className="lucesa-products-count">
                {filteredProducts.length} productos encontrados
              </span>
            </div>
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
            productosPaginados.map((product, index) => {
              // Solo mostrar log para primeros 3 productos
              if (index < 3) {
                console.log(`📦 ProductCard [${index}]:`, {
                  id: product.id,
                  idProducto: product.idProducto,
                  codigo: product.codigo,
                  nombre: product.nombre.substring(0, 20) + '...',
                  precioMXN: product.precioMXN,
                  tienePromociones: product.promociones?.length > 0,
                  moneda: product.moneda,
                  tipo_cambio: product.tipo_cambio
                });
              }
              
              return (
                <ProductCard 
                  key={`${product.id}_${index}_${Date.now()}`} 
                  product={product}
                  onQuickView={handleQuickView}
                  onAddToCart={handleAddToCart}
                />
              );
            })
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