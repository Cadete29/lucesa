import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/Product Card/ProductCard';
import QuickViewModal from '../components/QuickViewModal/QuickViewModal';
import { useSearch } from '../context/SearchContext';
import { 
  useProductos, 
  useBuscarProductos 
} from '../api/productosHooks';
import './Products.css';

// ✅ FUNCIONES OPTIMIZADAS
const generarIdDesdeNombre = (nombre) => {
    if (!nombre) return '';
    
    return nombre.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

const procesarProductos = (productosArray) => {
    if (!productosArray || !Array.isArray(productosArray)) return [];
    
    return productosArray.map(product => {
        let existenciaTotal = 0;
        
        if (product.existenciaTotal !== undefined && product.existenciaTotal !== null) {
            if (typeof product.existenciaTotal === 'number') {
                existenciaTotal = product.existenciaTotal;
            } else if (typeof product.existenciaTotal === 'string') {
                existenciaTotal = Number(product.existenciaTotal) || 0;
            }
        } else if (product.existencia !== undefined && product.existencia !== null) {
            if (typeof product.existencia === 'number') {
                existenciaTotal = product.existencia;
            } else if (typeof product.existencia === 'string') {
                existenciaTotal = Number(product.existencia) || 0;
            }
        }
        
        return {
            ...product,
            id: product.idProducto || product.id || product.codigo,
            codigo: product.codigo || 'N/A',
            nombre: product.nombre || 'Producto sin nombre',
            descripcion: product.descripcion_corta || '',
            precio: product.precio || 0,
            precioPromocion: product.precioPromocion || null,
            moneda: product.moneda || 'MXN',
            tipoCambio: product.tipoCambio || 20,
            marca: product.marca || 'Sin marca',
            categoria: product.categoria || 'General',
            subcategoria: product.subcategoria || '',
            existencia: existenciaTotal,
            promociones: product.promociones || [],
            disponible: existenciaTotal > 0
        };
    });
};

// ✅ FUNCIÓN CORREGIDA PARA FILTRAR CATEGORÍAS
const filtrarProductosPorCategoria = (productos, categoriaId) => {
    if (categoriaId === 'todos' || !categoriaId) {
        return productos;
    }

    if (categoriaId === 'otros') {
        return productos.filter(producto => {
            const tieneCategoriaValida = producto.categoria && 
                typeof producto.categoria === 'string' && 
                producto.categoria.trim() !== '' &&
                producto.categoria.trim() !== 'N/A';

            const tieneSubcategoriaValida = producto.subcategoria && 
                typeof producto.subcategoria === 'string' && 
                producto.subcategoria.trim() !== '' &&
                producto.subcategoria.trim() !== 'N/A';

            return !tieneCategoriaValida && !tieneSubcategoriaValida;
        });
    }

    return productos.filter(producto => {
        // ✅ CORRECCIÓN: Quitar el hash del ID de categoría para comparar
        const categoriaIdSinHash = categoriaId.split('-').slice(0, -1).join('-');
        
        if (producto.categoria && typeof producto.categoria === 'string') {
            const categoriaProducto = producto.categoria.trim();
            const idCategoriaProducto = generarIdDesdeNombre(categoriaProducto);
            
            // ✅ COMPARAR CON Y SIN HASH
            if (idCategoriaProducto === categoriaId || idCategoriaProducto === categoriaIdSinHash) {
                return true;
            }
        }

        if (producto.subcategoria && typeof producto.subcategoria === 'string') {
            const subcategoriaProducto = producto.subcategoria.trim();
            const idSubcategoriaProducto = generarIdDesdeNombre(subcategoriaProducto);
            
            // ✅ COMPARAR CON Y SIN HASH
            if (idSubcategoriaProducto === categoriaId || idSubcategoriaProducto === categoriaIdSinHash) {
                return true;
            }
        }

        return false;
    });
};

// ✅ NUEVA FUNCIÓN: Filtrar productos en promoción
const filtrarProductosEnPromocion = (productos) => {
    return productos.filter(producto => {
        // Verificar si tiene promociones activas
        const tienePromociones = producto.promociones && 
                                Array.isArray(producto.promociones) && 
                                producto.promociones.length > 0;
        
        // Verificar si tiene precio promocional
        const tienePrecioPromocion = producto.precioPromocion && 
                                    producto.precioPromocion > 0 && 
                                    producto.precioPromocion < producto.precio;
        
        return tienePromociones || tienePrecioPromocion;
    });
};

// ✅ NUEVA FUNCIÓN: Filtrar solo productos con existencia
const filtrarProductosConExistencia = (productos) => {
    return productos.filter(producto => {
        const existencia = producto.existencia || producto.existenciaTotal || 0;
        return existencia > 0;
    });
};

// ✅ FUNCIÓN CORREGIDA PARA OBTENER NOMBRE DE CATEGORÍA
const getCategoryDisplayName = (categoryId) => {
    if (categoryId === 'todos') return 'Todos los Productos';
    if (categoryId === 'otros') return 'Otros';
    
    // ✅ CORRECCIÓN: Quitar el hash y reconstruir el nombre
    const partes = categoryId.split('-');
    const nombrePartes = partes.slice(0, -1); // Quitar el hash final
    
    return nombrePartes.join(' ')
        .replace(/\b\w/g, l => l.toUpperCase()) || 'Categoría';
};

// ✅ COMPONENTE PRINCIPAL CORREGIDO
const Products = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('todos');
    const [sortBy, setSortBy] = useState('nombre');
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(48);

    const { searchTerm, setSearchTerm, clearSearch } = useSearch();
    const categoryFromUrl = searchParams.get('category');
    const promocionesFromUrl = searchParams.get('promociones');

    // ✅ HOOKS - VERIFICAR QUE NO CAUSEN RE-RENDERS
    const { data: productosResponse, loading, error } = useProductos({
      page: 1,
      limit: 20000
    });

    const { data: searchedProductsResponse, loading: searchLoading } = useBuscarProductos(searchTerm);

    // ✅ MEMOIZAR DATOS PARA EVITAR CAMBIOS REFERENCIALES
    const productos = useMemo(() => productosResponse?.data || [], [productosResponse]);
    const searchedProducts = useMemo(() => searchedProductsResponse?.data || [], [searchedProductsResponse]);

    // ✅ DETECTAR MODO PROMOCIONES
    const isModoPromociones = useMemo(() => {
        return promocionesFromUrl === 'true';
    }, [promocionesFromUrl]);

    // ✅ PROCESAMIENTO MEMOIZADO - INCLUYENDO FILTRO DE EXISTENCIA
    const productosFinales = useMemo(() => {
        const productsToDisplay = searchTerm ? searchedProducts : productos;
        
        if (!Array.isArray(productsToDisplay) || productsToDisplay.length === 0) {
            return [];
        }

        let filtered = productsToDisplay;

        // ✅ PRIMERO: Filtrar solo productos con existencia
        filtered = filtrarProductosConExistencia(filtered);

        // ✅ SEGUNDO: APLICAR FILTRO DE PROMOCIONES SI ESTÁ ACTIVO
        if (isModoPromociones) {
            filtered = filtrarProductosEnPromocion(filtered);
        }
        // ✅ TERCERO: APLICAR FILTRO DE CATEGORÍA SI NO ESTÁ EN MODO PROMOCIONES
        else if (selectedCategory !== 'todos') {
            filtered = filtrarProductosPorCategoria(filtered, selectedCategory);
        }

        const sortedProducts = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'precio':
                    return (a.precio || 0) - (b.precio || 0);
                case 'precio-desc':
                    return (b.precio || 0) - (a.precio || 0);
                case 'nombre':
                    return (a.nombre || '').localeCompare(b.nombre || '');
                case 'marca':
                    return (a.marca || '').localeCompare(b.marca || '');
                case 'existencia':
                    return (b.existencia || 0) - (a.existencia || 0);
                default:
                    return 0;
            }
        });

        return procesarProductos(sortedProducts);
    }, [productos, searchedProducts, selectedCategory, sortBy, searchTerm, isModoPromociones]);

    // ✅ CORREGIR: EVITAR BUCLE INFINITO
    useEffect(() => {
        // Solo actualizar si realmente hay cambios
        if (JSON.stringify(filteredProducts) !== JSON.stringify(productosFinales)) {
            setFilteredProducts(productosFinales);
            setCurrentPage(1);
        }
    }, [productosFinales]); // ✅ Solo dependencia de productosFinales

    // ✅ CORREGIR: SEPARAR EFECTOS
    useEffect(() => {
        if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
            setSelectedCategory(categoryFromUrl);
            setCurrentPage(1);
        }
    }, [categoryFromUrl]); // ✅ Solo dependencia de categoryFromUrl

    // ✅ EFECTO PARA LIMPIAR MODO PROMOCIONES AL BUSCAR
    useEffect(() => {
        if (searchTerm && isModoPromociones) {
            // Si hay búsqueda activa, navegar sin el parámetro de promociones
            navigate('/products', { replace: true });
        }
    }, [searchTerm, isModoPromociones, navigate]);

    // ✅ PAGINACIÓN CORREGIDA - Usar productosFinales que ya están filtrados
    const { productosPaginados, totalPages } = useMemo(() => {
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        
        // ✅ Asegurar que no excedamos el array
        const paginated = filteredProducts.slice(startIndex, Math.min(endIndex, filteredProducts.length));
        
        return {
            productosPaginados: paginated,
            totalPages: Math.ceil(filteredProducts.length / productsPerPage)
        };
    }, [filteredProducts, currentPage, productsPerPage]);

    // ✅ HANDLERS ESTABLES
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

    const handleCategoryChange = useCallback((category) => {
        if (category === selectedCategory) return;
        setSelectedCategory(category);
        setCurrentPage(1);
        if (searchTerm) clearSearch();
    }, [selectedCategory, searchTerm, clearSearch]);

    const handleGoBack = useCallback(() => navigate(-1), [navigate]);
    
    // ✅ NUEVO HANDLER: Salir del modo promociones
    const handleExitPromociones = useCallback(() => {
        navigate('/products');
    }, [navigate]);

    const handleAddToCart = useCallback((product) => {
        console.log('Agregando al carrito:', product);
    }, []);

    if (loading) {
        return (
            <div className="products-page">
                <div className="container">
                    <div className="loading-products">
                        <div className="loading-spinner"></div>
                        <p>Cargando productos...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="products-page">
                <div className="container">
                    <div className="error-products">
                        <div className="error-icon">⚠️</div>
                        <h3>Error al cargar productos</h3>
                        <p>{error.message || 'Ha ocurrido un error'}</p>
                        <button onClick={() => window.location.reload()} className="btn-retry">
                            Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="products-page">
            <div className="container">
                <div className="products-header">
                    <div className="header-top">
                        <button onClick={handleGoBack} className="back-button">← Volver</button>
                        <h1>
                            {isModoPromociones ? (
                                <>🎯 Ofertas Especiales</>
                            ) : searchTerm ? (
                                `Buscando: "${searchTerm}"`
                            ) : (
                                getCategoryDisplayName(selectedCategory)
                            )}
                        </h1>
                        
                        {/* ✅ BADGE DE MODO PROMOCIONES */}
                        {isModoPromociones && (
                            <div className="promociones-badge">
                                <span className="badge-icon">🔥</span>
                                <span>Productos en promoción</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="products-search">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="search-input"
                            />
                            {searchTerm && (
                                <button onClick={handleClearSearch} className="search-clear">×</button>
                            )}
                        </div>
                        
                        {/* ✅ BOTÓN PARA SALIR DEL MODO PROMOCIONES */}
                        {isModoPromociones && (
                            <button 
                                onClick={handleExitPromociones}
                                className="btn-exit-promociones"
                            >
                                🗙 Ver todos los productos
                            </button>
                        )}
                    </div>

                    <div className="products-count">
                        <span>Mostrando {productosPaginados.length} de {filteredProducts.length} productos disponibles</span>
                        {isModoPromociones ? (
                            <span className="promociones-indicator">en oferta especial</span>
                        ) : selectedCategory !== 'todos' && (
                            <span className="category-indicator">en {getCategoryDisplayName(selectedCategory)}</span>
                        )}
                    </div>
                </div>

                <div className="products-controls">
                    <div className="sort-filter">
                        <label htmlFor="sort">Ordenar por:</label>
                        <select 
                            id="sort"
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            <option value="nombre">Nombre A-Z</option>
                            <option value="precio">Precio: Menor a Mayor</option>
                            <option value="precio-desc">Precio: Mayor a Menor</option>
                            <option value="existencia">Disponibilidad</option>
                        </select>
                    </div>
                    
                    {/* ✅ CONTADOR DE DESCUENTOS EN MODO PROMOCIONES */}
                    {isModoPromociones && (
                        <div className="promociones-stats">
                            <span className="stats-icon">💰</span>
                            <span>
                                {filteredProducts.filter(p => 
                                    p.precioPromocion && p.precioPromocion < p.precio
                                ).length} productos con descuento
                            </span>
                        </div>
                    )}
                </div>

                <div className="products-grid">
                    {searchLoading ? (
                        <div className="loading-search">
                            <div className="loading-spinner"></div>
                            <p>Buscando productos...</p>
                        </div>
                    ) : productosPaginados.length > 0 ? (
                        productosPaginados.map(product => (
                            <ProductCard 
                                key={product.id} 
                                product={product}
                                onQuickView={handleQuickView}
                            />
                        ))
                    ) : (
                        <div className="no-products">
                            <div className="no-products-icon">
                                {isModoPromociones ? '💰' : '📦'}
                            </div>
                            <h3>
                                {isModoPromociones 
                                    ? 'No hay productos en promoción' 
                                    : 'No se encontraron productos'
                                }
                            </h3>
                            <p>
                                {isModoPromociones
                                    ? 'Actualmente no tenemos ofertas disponibles. Vuelve pronto para descubrir nuevas promociones.'
                                    : 'No hay productos disponibles en esta categoría o búsqueda.'
                                }
                            </p>
                            {isModoPromociones ? (
                                <button onClick={handleExitPromociones} className="btn-back">
                                    ← Ver todos los productos
                                </button>
                            ) : (
                                <button onClick={handleGoBack} className="btn-back">
                                    ← Volver Atrás
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ✅ PAGINACIÓN CORREGIDA - Mostrar solo si hay productos */}
                {totalPages > 1 && filteredProducts.length > 0 && (
                    <div className="products-pagination">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="pagination-btn"
                        >
                            ← Anterior
                        </button>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNumber;
                            
                            // Lógica para mostrar páginas alrededor de la página actual
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
                                    className={`pagination-btn ${currentPage === pageNumber ? 'active' : ''}`}
                                    onClick={() => handlePageChange(pageNumber)}
                                >
                                    {pageNumber}
                                </button>
                            );
                        })}

                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="pagination-btn"
                        >
                            Siguiente →
                        </button>
                    </div>
                )}
            </div>

            <QuickViewModal
                product={quickViewProduct}
                isOpen={isQuickViewOpen}
                onClose={handleCloseQuickView}
                onAddToCart={handleAddToCart}
            />
        </div>
    );
};

export default Products;