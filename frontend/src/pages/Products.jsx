import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/Product Card/ProductCard';
import QuickViewModal from '../components/QuickViewModal/QuickViewModal';
import { 
  useProductos, 
  useCategorias,
  useBuscarProductos 
} from '../api/productosHooks';
import './Products.css';

const Products = () => {
    const [searchParams] = useSearchParams();
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('todos');
    const [sortBy, setSortBy] = useState('nombre');
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Obtener categoría desde URL si existe
    const categoryFromUrl = searchParams.get('category');

    // Usar hooks de la API
    const { data: productosResponse, loading, error } = useProductos();
    const { data: categoriasResponse } = useCategorias();
    const { data: searchedProductsResponse, loading: searchLoading } = useBuscarProductos(searchTerm);

    const productos = productosResponse?.data || [];
    const categoriasData = categoriasResponse?.data || [];
    const searchedProducts = searchedProductsResponse?.data || [];

    // Configurar categoría inicial desde URL
    useEffect(() => {
        if (categoryFromUrl) {
            setSelectedCategory(categoryFromUrl);
        }
    }, [categoryFromUrl]);

    // **FUNCIÓN: Procesar categorías (igual que en Categories.jsx)**
    const procesarCategorias = (categoriasData, productos) => {
        if (!categoriasData || !Array.isArray(categoriasData)) return [];

        // Función para contar productos por categoría
        const contarProductosPorCategoria = (nombreCategoria) => {
            if (!Array.isArray(productos)) return 0;
            
            return productos.filter(producto => {
                const categoriaProducto = producto.categoria || producto.subcategoria;
                return categoriaProducto === nombreCategoria;
            }).length;
        };

        // Función para generar ID desde nombre
        const generarIdDesdeNombre = (nombre) => {
            if (!nombre) return `categoria-${Math.random().toString(36).substr(2, 9)}`;
            return nombre.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        };

        const categoriasProcesadas = categoriasData.map((item) => {
            // Si es un string, crear objeto básico
            if (typeof item === 'string') {
                const count = contarProductosPorCategoria(item);
                return {
                    id: generarIdDesdeNombre(item),
                    nombre: item,
                    count: count
                };
            }
            // Si ya es un objeto, usar directamente
            else if (typeof item === 'object') {
                const count = contarProductosPorCategoria(item.nombre || item);
                return {
                    id: item.id || generarIdDesdeNombre(item.nombre),
                    nombre: item.nombre || 'Sin nombre',
                    count: count
                };
            }
            return null;
        }).filter(Boolean)
          .sort((a, b) => b.count - a.count); // Ordenar por cantidad de productos

        // Agregar categoría "Todos los Productos" al inicio
        return [
            { 
                id: 'todos', 
                nombre: 'Todos los Productos', 
                count: Array.isArray(productos) ? productos.length : 0 
            },
            ...categoriasProcesadas
        ];
    };

    // Obtener categorías procesadas
    const categories = procesarCategorias(categoriasData, productos);

    // **FUNCIÓN: Procesar productos para normalizar estructura**
    const procesarProductos = (productosArray) => {
        if (!productosArray || !Array.isArray(productosArray)) return [];
        
        return productosArray.map(product => ({
            ...product,
            // Asegurar que tenga las propiedades necesarias para ProductCard
            id: product.idProducto || product.id,
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

    // Filtrar y ordenar productos
    useEffect(() => {
        let productsToDisplay = productos;

        // Usar productos buscados si hay término de búsqueda
        if (searchTerm && Array.isArray(searchedProducts)) {
            productsToDisplay = searchedProducts;
        }

        // Validar que productsToDisplay sea un array
        if (!productsToDisplay || !Array.isArray(productsToDisplay)) {
            setFilteredProducts([]);
            return;
        }

        let filtered = [...productsToDisplay];
        
        // Filtrar por categoría (usando nombres reales de categorías)
        if (selectedCategory !== 'todos') {
            // Encontrar la categoría seleccionada para obtener su nombre real
            const categoriaSeleccionada = categories.find(cat => cat.id === selectedCategory);
            
            if (categoriaSeleccionada) {
                filtered = productsToDisplay.filter(product => {
                    const categoriaProducto = product.categoria || product.subcategoria || '';
                    return categoriaProducto === categoriaSeleccionada.nombre;
                });
            }
        }

        // Ordenar productos
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

        // Procesar productos para normalizar estructura
        const productosProcesados = procesarProductos(sortedProducts);
        setFilteredProducts(productosProcesados);
    }, [selectedCategory, productos, sortBy, searchTerm, searchedProducts, categories]);

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

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    // **FUNCIÓN: Obtener nombre de categoría para mostrar**
    const getCategoryDisplayName = () => {
        if (selectedCategory === 'todos') return 'Todos los Productos';
        const categoria = categories.find(cat => cat.id === selectedCategory);
        return categoria ? categoria.nombre : 'Categoría';
    };

    if (loading) {
        return (
            <div className="products-loading">
                <div className="loading-spinner"></div>
                <p>Cargando productos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="products-error">
                <div className="error-icon">⚠️</div>
                <h3>Error al cargar productos</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="btn-retry">
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="products-page">
            <div className="container">
                {/* Header de la página */}
                <div className="products-header">
                    <h1>
                        {searchTerm ? `Buscando: "${searchTerm}"` : getCategoryDisplayName()}
                    </h1>
                    <p>
                        {searchTerm 
                            ? `Resultados de búsqueda para "${searchTerm}"`
                            : `Descubre nuestra amplia gama de productos ${selectedCategory !== 'todos' ? 'en ' + getCategoryDisplayName().toLowerCase() : 'tecnológicos'}`
                        }
                    </p>
                    
                    {/* Buscador */}
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
                                <button onClick={clearSearch} className="search-clear">
                                    ×
                                </button>
                            )}
                        </div>
                        {searchTerm && (
                            <div className="search-info">
                                {searchLoading ? (
                                    <span>Buscando...</span>
                                ) : (
                                    <span>{filteredProducts.length} resultados para "{searchTerm}"</span>
                                )}
                            </div>
                        )}
                    </div>

                    {Array.isArray(productos) && !searchTerm && (
                        <div className="products-count">
                            {filteredProducts.length} de {productos.length} productos encontrados
                            {selectedCategory !== 'todos' && (
                                <span className="category-indicator">
                                    en {getCategoryDisplayName()}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Filtros y Ordenamiento */}
                <div className="products-controls">
                    <div className="categories-filter">
                        <h3>Categorías ({categories.length - 1})</h3>
                        <div className="categories-list">
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedCategory(category.id);
                                        clearSearch();
                                    }}
                                >
                                    <span className="category-name">{category.nombre}</span>
                                    <span className="category-count">({category.count})</span>
                                </button>
                            ))}
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

                {/* Grid de Productos */}
                <div className="products-grid">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
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
                                    ? `No hay productos disponibles en ${getCategoryDisplayName()}.`
                                    : 'No hay productos disponibles en este momento.'
                                }
                            </p>
                            <div className="no-products-actions">
                                {searchTerm && (
                                    <button onClick={clearSearch} className="btn-clear-search">
                                        Limpiar búsqueda
                                    </button>
                                )}
                                {selectedCategory !== 'todos' && (
                                    <button 
                                        onClick={() => setSelectedCategory('todos')} 
                                        className="btn-view-all"
                                    >
                                        Ver Todos los Productos
                                    </button>
                                )}
                                <Link to="/categories" className="btn-browse-categories">
                                    Explorar Categorías
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* Paginación (placeholder) */}
                {filteredProducts.length > 0 && filteredProducts.length > 12 && (
                    <div className="products-pagination">
                        <button className="pagination-btn active">1</button>
                        <button className="pagination-btn">2</button>
                        <button className="pagination-btn">3</button>
                        <span className="pagination-ellipsis">...</span>
                        <button className="pagination-btn">Siguiente</button>
                    </div>
                )}
            </div>

            {/* Modal de Vista Rápida */}
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