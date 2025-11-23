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

// FUNCIONES MOVIDAS FUERA DEL COMPONENTE
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

const procesarProductos = (productosArray) => {
    if (!productosArray || !Array.isArray(productosArray)) return [];
    
    return productosArray.map(product => ({
        ...product,
        id: product.idProducto || product.id || product.codigo,
        codigo: product.codigo || product.clave,
        nombre: product.nombre,
        descripcion: product.descripcion_corta || product.descripcion,
        precio: product.precio,
        moneda: product.moneda,
        tipoCambio: product.tipoCambio || 20,
        marca: product.marca,
        categoria: product.categoria,
        subcategoria: product.subcategoria,
        existencia: product.existencia,
        promociones: product.promociones,
        imagen: product.imagen
    }));
};

const filtrarProductosPorCategoria = (productos, categoriaId) => {
    if (categoriaId === 'todos' || !categoriaId) {
        return productos;
    }

    console.log(`🎯 Filtrando productos para categoría ID: ${categoriaId}`);

    if (categoriaId === 'otros') {
        return productos.filter(producto => {
            const tieneCategoriaValida = producto.categoria && 
                typeof producto.categoria === 'string' && 
                producto.categoria.trim() !== '' &&
                producto.categoria.trim() !== 'N/A' &&
                producto.categoria.trim() !== 'null' &&
                producto.categoria.trim().length > 1;

            const tieneSubcategoriaValida = producto.subcategoria && 
                typeof producto.subcategoria === 'string' && 
                producto.subcategoria.trim() !== '' &&
                producto.subcategoria.trim() !== 'N/A' &&
                producto.subcategoria.trim() !== 'null' &&
                producto.subcategoria.trim().length > 1;

            return !tieneCategoriaValida && !tieneSubcategoriaValida;
        });
    }

    return productos.filter(producto => {
        if (producto.categoria && 
            typeof producto.categoria === 'string' && 
            producto.categoria.trim() !== '' &&
            producto.categoria.trim() !== 'N/A' &&
            producto.categoria.trim() !== 'null' &&
            producto.categoria.trim().length > 1) {
            
            const categoriaProducto = producto.categoria.trim();
            const idCategoriaProducto = generarIdDesdeNombre(categoriaProducto);
            
            if (idCategoriaProducto === categoriaId) {
                return true;
            }
        }

        if (producto.subcategoria && 
            typeof producto.subcategoria === 'string' && 
            producto.subcategoria.trim() !== '' &&
            producto.subcategoria.trim() !== 'N/A' &&
            producto.subcategoria.trim() !== 'null' &&
            producto.subcategoria.trim().length > 1) {
            
            const subcategoriaProducto = producto.subcategoria.trim();
            const idSubcategoriaProducto = generarIdDesdeNombre(subcategoriaProducto);
            
            if (idSubcategoriaProducto === categoriaId) {
                return true;
            }
        }

        return false;
    });
};

const getCategoryDisplayName = (categoryId) => {
    if (categoryId === 'todos') return 'Todos los Productos';
    if (categoryId === 'otros') return 'Otros';
    
    const partes = categoryId.split('-');
    const nombrePartes = partes.slice(0, -1);
    const nombre = nombrePartes.join(' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    
    return nombre || 'Categoría';
};

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

    const { data: productosResponse, loading, error } = useProductos({
      page: 1,
      limit: 20000
    });

    const { data: searchedProductsResponse, loading: searchLoading } = useBuscarProductos(searchTerm);

    const productos = productosResponse?.data || [];
    const searchedProducts = searchedProductsResponse?.data || [];

    const handleAddToCart = useCallback((product) => {
        console.log('Agregando al carrito:', product);
    }, []);

    const handleGoBack = () => {
        navigate(-1);
    };

    useEffect(() => {
        console.log('🔄 Effect principal ejecutado', {
            selectedCategory,
            productosCount: productos.length,
            searchTerm
        });

        let productsToDisplay = productos;

        if (selectedCategory !== 'todos') {
            productsToDisplay = filtrarProductosPorCategoria(productsToDisplay, selectedCategory);
        }

        // SOLUCIÓN: Usar searchTerm para determinar cuándo mostrar productos buscados
        if (searchTerm) {
            // Si hay término de búsqueda, usar searchedProducts si está disponible
            if (Array.isArray(searchedProducts) && searchedProducts.length > 0) {
                productsToDisplay = searchedProducts;
            } else {
                // Si no hay resultados de búsqueda aún, mantener los productos filtrados
                productsToDisplay = [];
            }
        }

        if (!productsToDisplay || !Array.isArray(productsToDisplay)) {
            setFilteredProducts([]);
            return;
        }

        const sortedProducts = [...productsToDisplay].sort((a, b) => {
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
                    const stockA = typeof a.existencia === 'object' ? 
                        Object.values(a.existencia).reduce((total, stock) => total + stock, 0) : 
                        (a.existencia || 0);
                    const stockB = typeof b.existencia === 'object' ? 
                        Object.values(b.existencia).reduce((total, stock) => total + stock, 0) : 
                        (b.existencia || 0);
                    return stockB - stockA;
                default:
                    return 0;
            }
        });

        const productosProcesados = procesarProductos(sortedProducts);
        setFilteredProducts(productosProcesados);

    }, [productos, selectedCategory, searchTerm, sortBy]); // SOLUCIÓN: Remover searchedProducts de las dependencias

    useEffect(() => {
        if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
            setSelectedCategory(categoryFromUrl);
            setCurrentPage(1);
            if (searchTerm) {
                clearSearch();
            }
        }
    }, [categoryFromUrl]);

    const { productosPaginados, totalPages } = useMemo(() => {
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const paginados = filteredProducts.slice(startIndex, endIndex);
        const pages = Math.ceil(filteredProducts.length / productsPerPage);
        
        return {
            productosPaginados: paginados,
            totalPages: pages
        };
    }, [filteredProducts, currentPage, productsPerPage]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleClearSearch = () => {
        clearSearch();
        setCurrentPage(1);
    };

    const handleQuickView = (product) => {
        setQuickViewProduct(product);
        setIsQuickViewOpen(true);
    };

    const handleCloseQuickView = () => {
        setIsQuickViewOpen(false);
        setQuickViewProduct(null);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCategoryChange = (category) => {
        if (category === selectedCategory) return;
        
        setSelectedCategory(category);
        setCurrentPage(1);
        if (searchTerm) {
            clearSearch();
        }
    };

    if (loading) {
        return (
            <div className="products-page">
                <div className="container">
                    <div className="loading-products">
                        <div className="loading-spinner"></div>
                        <p>Cargando productos...</p>
                        <button onClick={handleGoBack} className="btn-back" style={{marginTop: '20px'}}>
                            ← Volver Atrás
                        </button>
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
                        <div className="error-actions">
                            <button onClick={() => window.location.reload()} className="btn-retry">
                                Reintentar
                            </button>
                            <button onClick={handleGoBack} className="btn-back">
                                ← Volver Atrás
                            </button>
                        </div>
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
                        <button onClick={handleGoBack} className="back-button">
                            ← Volver
                        </button>
                        <h1>
                            {searchTerm ? `Buscando: "${searchTerm}"` : getCategoryDisplayName(selectedCategory)}
                        </h1>
                    </div>
                    
                    <p>
                        {searchTerm 
                            ? `Resultados de búsqueda para "${searchTerm}"`
                            : selectedCategory !== 'todos'
                            ? `Explorando productos de ${getCategoryDisplayName(selectedCategory).toLowerCase()}`
                            : 'Descubre nuestra amplia gama de productos tecnológicos'
                        }
                    </p>
                    
                    <div className="products-search">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Buscar productos por nombre, marca o categoría..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="search-input"
                            />
                            {searchTerm && (
                                <button onClick={handleClearSearch} className="search-clear">
                                    ×
                                </button>
                            )}
                        </div>
                        {searchTerm && (
                            <div className="search-info">
                                {searchLoading ? (
                                    <span>Buscando...</span>
                                ) : (
                                    <span>{searchedProducts.length} resultados para "{searchTerm}"</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="products-count">
                        {searchTerm ? (
                            <span>
                                {searchLoading ? 'Buscando...' : `${searchedProducts.length} productos encontrados`}
                            </span>
                        ) : (
                            <>
                                <span>Mostrando {productosPaginados.length} de {filteredProducts.length} productos</span>
                                {selectedCategory !== 'todos' && (
                                    <span className="category-indicator">
                                        en {getCategoryDisplayName(selectedCategory)}
                                    </span>
                                )}
                                <span className="page-indicator">
                                    - Página {currentPage} de {totalPages}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="products-controls">
                    <div className="categories-navigation">
                        <div className="categories-header">
                            <h3>Navegación</h3>
                        </div>
                        <div className="categories-actions">
                            <button
                                className={`category-nav-btn ${selectedCategory === 'todos' ? 'active' : ''}`}
                                onClick={() => handleCategoryChange('todos')}
                            >
                                ← Todas las Categorías
                            </button>
                            <Link to="/categories" className="category-nav-btn browse-categories">
                                📁 Explorar Categorías
                            </Link>
                        </div>
                    </div>

                    <div className="sort-filter">
                        <label htmlFor="sort">Ordenar por:</label>
                        <select 
                            id="sort"
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="sort-select"
                        >
                            <option value="nombre">Nombre A-Z</option>
                            <option value="marca">Marca</option>
                            <option value="precio">Precio: Menor a Mayor</option>
                            <option value="precio-desc">Precio: Mayor a Menor</option>
                            <option value="existencia">Disponibilidad</option>
                        </select>
                    </div>
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
                                key={product.idProducto || product.id || product.codigo} 
                                product={product}
                                onQuickView={handleQuickView}
                            />
                        ))
                    ) : (
                        <div className="no-products">
                            <div className="no-products-icon">📦</div>
                            <h3>No se encontraron productos</h3>
                            <p>
                                {searchTerm 
                                    ? `No hay resultados para "${searchTerm}". Intenta con otros términos.`
                                    : selectedCategory !== 'todos'
                                    ? `No hay productos disponibles en ${getCategoryDisplayName(selectedCategory)}.`
                                    : 'No hay productos disponibles en este momento.'
                                }
                            </p>
                            <div className="no-products-actions">
                                {searchTerm && (
                                    <button onClick={handleClearSearch} className="btn-clear-search">
                                        Limpiar búsqueda
                                    </button>
                                )}
                                {selectedCategory !== 'todos' && (
                                    <button 
                                        onClick={() => handleCategoryChange('todos')} 
                                        className="btn-view-all"
                                    >
                                        Ver Todos los Productos
                                    </button>
                                )}
                                <Link to="/categories" className="btn-browse-categories">
                                    Explorar Categorías
                                </Link>
                                <button onClick={handleGoBack} className="btn-back">
                                    ← Volver Atrás
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {!searchTerm && totalPages > 1 && (
                    <div className="products-pagination">
                        <button 
                            className="pagination-btn"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
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
                                    className={`pagination-btn ${currentPage === pageNumber ? 'active' : ''}`}
                                    onClick={() => handlePageChange(pageNumber)}
                                >
                                    {pageNumber}
                                </button>
                            );
                        })}

                        {totalPages > 5 && currentPage < totalPages - 2 && (
                            <>
                                <span className="pagination-ellipsis">...</span>
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(totalPages)}
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}

                        <button 
                            className="pagination-btn"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
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