import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/Product Card/ProductCard';
import QuickViewModal from '../components/QuickViewModal/QuickViewModal';
import './Products.css';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('todos');
    const [sortBy, setSortBy] = useState('nombre');
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    // Datos simulados en formato compatible con ProductCard
    const simulatedProducts = [
        {
            idProducto: 67660,
            clave: "ACCPOL1210",
            numParte: "875M4AA",
            nombre: "Cable POLYCOM 875M4AA",
            modelo: "875M4AA",
            idMarca: 444,
            marca: "POLYCOM",
            idSubCategoria: 23,
            subcategoria: "Accesorios de Telefonía",
            idCategoria: 13,
            categoria: "Telefonía y Video Vigilancia",
            descripcion_corta: "Cable HP Poly extensor de microfono de expansion para poly studio X50/X52/X70/USB",
            descripcion_larga: "Cable extensor de micrófono de expansión HP Poly diseñado específicamente para los modelos Poly Studio X50, X52 y X70. Este cable permite extender la funcionalidad del micrófono en sistemas de videoconferencia, proporcionando mayor flexibilidad en la configuración de salas de reuniones.",
            ean: "",
            upc: "197497663853",
            sustituto: "ACCPOL1210",
            activo: 1,
            protegido: 0,
            existencia: { "QRO": 1, "CDMX": 3 },
            precio: 78.53,
            moneda: "USD",
            tipoCambio: 18.54,
            especificaciones: {
                "Longitud": "3 metros",
                "Conector": "USB Type-A",
                "Color": "Negro",
                "Compatibilidad": "Poly Studio X50, X52, X70",
                "Tipo": "Cable extensor de micrófono",
                "Garantía": "1 año"
            },
            promociones: [
                {
                    tipo: "importe",
                    promocion: 64.89,
                    vigencia: {
                        inicio: "2025-11-01T07:00:00.000Z",
                        fin: "2025-11-30T07:00:00.000Z"
                    }
                }
            ],
            imagen: "https://static.ctonline.mx/imagenes/ACCPOL1210/ACCPOL1210_full.jpg",
            imagenes_adicionales: [
                "https://static.ctonline.mx/imagenes/ACCPOL1210/ACCPOL1210_1.jpg",
                "https://static.ctonline.mx/imagenes/ACCPOL1210/ACCPOL1210_2.jpg"
            ]
        },
        {
            idProducto: 1,
            clave: "LAPGAM001",
            numParte: "ROGSTRIX001",
            nombre: "Laptop Gaming ROG Strix",
            modelo: "G15",
            idMarca: 1,
            marca: "ASUS",
            idSubCategoria: 1,
            subcategoria: "Laptops Gaming",
            idCategoria: 1,
            categoria: "Laptops",
            descripcion_corta: "Laptop gaming de alto rendimiento con procesador Intel i9 y RTX 4070",
            descripcion_larga: "La Laptop Gaming ROG Strix ofrece un rendimiento excepcional para gaming y trabajo creativo. Equipada con el último procesador Intel i9-13900H y tarjeta gráfica NVIDIA RTX 4070.",
            ean: "1234567890123",
            upc: "123456789012",
            sustituto: "LAPGAM001",
            activo: 1,
            protegido: 0,
            existencia: { "CDMX": 5, "QRO": 3 },
            precio: 1899.99,
            moneda: "USD",
            tipoCambio: 18.54,
            especificaciones: {
                "Procesador": "Intel i9-13900H",
                "RAM": "32GB DDR5",
                "Almacenamiento": "1TB SSD NVMe",
                "Pantalla": '17.3" QHD 240Hz',
                "Gr�fica": "NVIDIA RTX 4070 8GB"
            },
            promociones: [
                {
                    tipo: "importe",
                    promocion: 1799.99,
                    vigencia: {
                        inicio: "2025-11-01T07:00:00.000Z",
                        fin: "2025-11-30T07:00:00.000Z"
                    }
                }
            ],
            imagen: "/products/laptop-gaming.jpg",
            imagenes_adicionales: [
                "/products/laptop-gaming-2.jpg",
                "/products/laptop-gaming-3.jpg"
            ]
        },
        {
            idProducto: 2,
            clave: "PHNFLG001",
            numParte: "S24ULTRA001",
            nombre: "Smartphone Galaxy S24 Ultra",
            modelo: "S24 Ultra",
            idMarca: 2,
            marca: "Samsung",
            idSubCategoria: 2,
            subcategoria: "Smartphones Flagship",
            idCategoria: 2,
            categoria: "Smartphones",
            descripcion_corta: "Smartphone flagship con cámara 200MP y S-Pen incluido",
            descripcion_larga: "El Galaxy S24 Ultra redefine la experiencia smartphone con su cámara de 200MP, procesador Snapdragon 8 Gen 3 y el revolucionario S-Pen integrado.",
            ean: "1234567890124",
            upc: "123456789013",
            sustituto: "PHNFLG001",
            activo: 1,
            protegido: 0,
            existencia: { "CDMX": 8, "MTY": 4 },
            precio: 1299.99,
            moneda: "USD",
            tipoCambio: 18.54,
            especificaciones: {
                "Pantalla": '6.8" Dynamic AMOLED 2X',
                "Almacenamiento": "512GB",
                "RAM": "12GB",
                "Cámara": "200MP + 12MP + 10MP + 10MP",
                "Procesador": "Snapdragon 8 Gen 3"
            },
            promociones: [
                {
                    tipo: "importe",
                    promocion: 1199.99,
                    vigencia: {
                        inicio: "2025-11-01T07:00:00.000Z",
                        fin: "2025-11-30T07:00:00.000Z"
                    }
                }
            ],
            imagen: "/products/galaxy-s24.jpg",
            imagenes_adicionales: [
                "/products/galaxy-s24-2.jpg",
                "/products/galaxy-s24-3.jpg"
            ]
        },
        {
            idProducto: 3,
            clave: "KEYMEC001",
            numParte: "K95PLAT001",
            nombre: "Teclado Mecánico RGB Corsair",
            modelo: "K95 RGB Platinum",
            idMarca: 3,
            marca: "Corsair",
            idSubCategoria: 3,
            subcategoria: "Teclados Mecánicos",
            idCategoria: 3,
            categoria: "Accesorios",
            descripcion_corta: "Teclado mecánico gaming con switches Cherry MX y iluminación RGB",
            descripcion_larga: "El teclado mecánico Corsair K95 RGB Platinum ofrece la mejor experiencia de escritura y gaming con switches Cherry MX Red, iluminación RGB dinámica y construcción premium.",
            ean: "1234567890125",
            upc: "123456789014",
            sustituto: "KEYMEC001",
            activo: 1,
            protegido: 0,
            existencia: { "CDMX": 15, "QRO": 10, "MTY": 8 },
            precio: 149.99,
            moneda: "USD",
            tipoCambio: 18.54,
            especificaciones: {
                "Switches": "Cherry MX Red",
                "Iluminación": "RGB LED dinámica",
                "Conectividad": "USB 2.0",
                "Teclas": "Teclado completo con macros",
                "Material": "Aluminio anodizado"
            },
            promociones: [
                {
                    tipo: "importe",
                    promocion: 129.99,
                    vigencia: {
                        inicio: "2025-11-01T07:00:00.000Z",
                        fin: "2025-11-30T07:00:00.000Z"
                    }
                }
            ],
            imagen: "/products/teclado-mecanico.jpg",
            imagenes_adicionales: [
                "/products/teclado-mecanico-2.jpg",
                "/products/teclado-mecanico-3.jpg"
            ]
        },
        {
            idProducto: 4,
            clave: "MON4K001",
            numParte: "27GN950001",
            nombre: "Monitor 4K 27\" LG UltraGear",
            modelo: "27GN950-B",
            idMarca: 4,
            marca: "LG",
            idSubCategoria: 4,
            subcategoria: "Monitores Gaming",
            idCategoria: 4,
            categoria: "Monitores",
            descripcion_corta: "Monitor gaming 4K UHD con 144Hz y NVIDIA G-SYNC",
            descripcion_larga: "El monitor LG UltraGear 27GN950 ofrece una experiencia gaming inmersiva con resolución 4K UHD, tasa de refresco de 144Hz y tecnología NVIDIA G-SYNC Compatible.",
            ean: "1234567890126",
            upc: "123456789015",
            sustituto: "MON4K001",
            activo: 1,
            protegido: 0,
            existencia: { "CDMX": 12, "QRO": 6 },
            precio: 399.99,
            moneda: "USD",
            tipoCambio: 18.54,
            especificaciones: {
                "Resolución": "4K UHD (3840 x 2160)",
                "Tasa de refresco": "144Hz",
                "Tiempo de respuesta": "1ms GTG",
                "Tecnología": "NVIDIA G-SYNC Compatible",
                "Panel": "IPS Nano Color"
            },
            promociones: [],
            imagen: "/products/monitor-gaming.jpg",
            imagenes_adicionales: [
                "/products/monitor-gaming-2.jpg"
            ]
        },
        {
            idProducto: 5,
            clave: "MOSWLS001",
            numParte: "GPROXSL001",
            nombre: "Mouse Inalámbrico Logitech Pro",
            modelo: "PRO X SUPERLIGHT",
            idMarca: 5,
            marca: "Logitech",
            idSubCategoria: 5,
            subcategoria: "Mouse Gaming",
            idCategoria: 3,
            categoria: "Accesorios",
            descripcion_corta: "Mouse gaming inalámbrico ultraligero con sensor HERO 25K",
            descripcion_larga: "El mouse gaming Logitech PRO X SUPERLIGHT combina un diseño ultraligero con el sensor HERO 25K más avanzado para un rendimiento competitivo excepcional.",
            ean: "1234567890127",
            upc: "123456789016",
            sustituto: "MOSWLS001",
            activo: 1,
            protegido: 0,
            existencia: { "CDMX": 20, "QRO": 15, "MTY": 10 },
            precio: 79.99,
            moneda: "USD",
            tipoCambio: 18.54,
            especificaciones: {
                "Sensor": "HERO 25K",
                "Peso": "Menos de 63 gramos",
                "Conectividad": "Lightspeed Wireless",
                "Batería": "Hasta 70 horas",
                "Botones": "5 programables"
            },
            promociones: [
                {
                    tipo: "importe",
                    promocion: 69.99,
                    vigencia: {
                        inicio: "2025-11-01T07:00:00.000Z",
                        fin: "2025-11-30T07:00:00.000Z"
                    }
                }
            ],
            imagen: "/products/mouse-inalambrico.jpg",
            imagenes_adicionales: [
                "/products/mouse-inalambrico-2.jpg"
            ]
        }
    ];

    const categories = [
        { id: 'todos', nombre: 'Todos los Productos', count: simulatedProducts.length },
        { id: 'laptops', nombre: 'Laptops & Computadoras', count: simulatedProducts.filter(p => p.categoria === 'Laptops').length },
        { id: 'smartphones', nombre: 'Smartphones', count: simulatedProducts.filter(p => p.categoria === 'Smartphones').length },
        { id: 'accesorios', nombre: 'Accesorios', count: simulatedProducts.filter(p => p.categoria === 'Accesorios').length },
        { id: 'monitores', nombre: 'Monitores', count: simulatedProducts.filter(p => p.categoria === 'Monitores').length },
        { id: 'telefonia', nombre: 'Telefonía', count: simulatedProducts.filter(p => p.categoria === 'Telefonía y Video Vigilancia').length }
    ];

    // Simular carga de API
    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setProducts(simulatedProducts);
            setFilteredProducts(simulatedProducts);
            setLoading(false);
        };

        loadProducts();
    }, []);

    // Filtrar productos por categoría
    useEffect(() => {
        if (selectedCategory === 'todos') {
            setFilteredProducts(products);
        } else {
            setFilteredProducts(products.filter(product => {
                if (selectedCategory === 'laptops') return product.categoria === 'Laptops';
                if (selectedCategory === 'smartphones') return product.categoria === 'Smartphones';
                if (selectedCategory === 'accesorios') return product.categoria === 'Accesorios';
                if (selectedCategory === 'monitores') return product.categoria === 'Monitores';
                if (selectedCategory === 'telefonia') return product.categoria === 'Telefonía y Video Vigilancia';
                return true;
            }));
        }
    }, [selectedCategory, products]);

    // Ordenar productos
    useEffect(() => {
        const sortedProducts = [...filteredProducts].sort((a, b) => {
            switch (sortBy) {
                case 'precio':
                    return a.precio - b.precio;
                case 'precio-desc':
                    return b.precio - a.precio;
                case 'nombre':
                    return a.nombre.localeCompare(b.nombre);
                default:
                    return 0;
            }
        });
        setFilteredProducts(sortedProducts);
    }, [sortBy]);

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
        alert(`¡${quantity} x ${product.nombre} agregado al carrito!`);
    };

    if (loading) {
        return (
            <div className="products-loading">
                <div className="loading-spinner"></div>
                <p>Cargando productos...</p>
            </div>
        );
    }

    return (
        <div className="products-page">
            <div className="container">
                {/* Header de la página */}
                <div className="products-header">
                    <h1>Nuestros Productos</h1>
                    <p>Descubre nuestra amplia gama de productos tecnológicos</p>
                </div>

                {/* Filtros y Ordenamiento */}
                <div className="products-controls">
                    <div className="categories-filter">
                        <h3>Categorías</h3>
                        <div className="categories-list">
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(category.id)}
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
                            <option value="precio">Precio: Menor a Mayor</option>
                            <option value="precio-desc">Precio: Mayor a Menor</option>
                        </select>
                    </div>
                </div>

                {/* Grid de Productos */}
                <div className="products-grid">
                    {filteredProducts.map(product => (
                        <ProductCard 
                            key={product.idProducto} 
                            product={product}
                            onQuickView={handleQuickView}
                        />
                    ))}
                </div>

                {/* Paginación (simulada) */}
                <div className="products-pagination">
                    <button className="pagination-btn active">1</button>
                    <button className="pagination-btn">2</button>
                    <button className="pagination-btn">3</button>
                    <span className="pagination-ellipsis">...</span>
                    <button className="pagination-btn">Siguiente</button>
                </div>
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