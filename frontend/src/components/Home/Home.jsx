import React, { useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../Product Card/ProductCard";
import QuickViewModal from "../QuickViewModal/QuickViewModal";
import "./Home.css";

const Home = () => {
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    const categoriasTecnologia = [
        {
            title: "Laptops & Computadoras",
            description: "Encuentra las mejores laptops y computadoras para trabajo, gaming y creatividad.",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
            )
        },
        {
            title: "Smartphones & Tablets",
            description: "Los últimos modelos de smartphones y tablets con tecnología de punta.",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
            )
        },
        {
            title: "Accesorios & Periféricos",
            description: "Teclados, mouse, audífonos y todo lo que necesitas para tu setup.",
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
            )
        }
    ];

    // Datos de productos en formato compatible con ProductCard
    const productosDestacados = [
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
            descripcion_larga: "La Laptop Gaming ROG Strix ofrece un rendimiento excepcional para gaming y trabajo creativo. Equipada con el último procesador Intel i9-13900H y tarjeta gráfica NVIDIA RTX 4070, es perfecta para jugadores y profesionales que demandan lo mejor.",
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
                "Gr�fica": "NVIDIA RTX 4070 8GB",
                "Sistema Operativo": "Windows 11 Pro"
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
            descripcion_larga: "El Galaxy S24 Ultra redefine la experiencia smartphone con su cámara de 200MP, procesador Snapdragon 8 Gen 3 y el revolucionario S-Pen integrado. Perfecto para productividad y creatividad.",
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
                "Procesador": "Snapdragon 8 Gen 3",
                "Batería": "5000mAh"
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
            descripcion_larga: "El teclado mecánico Corsair K95 RGB Platinum ofrece la mejor experiencia de escritura y gaming con switches Cherry MX Red, iluminación RGB dinámica y construcción premium en aluminio.",
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
                "Material": "Aluminio anodizado",
                "Teclas multimedia": "6 teclas dedicadas"
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
        }
    ];

    const masProductos = [
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
                "Panel": "IPS Nano Color",
                "Conectores": "HDMI, DisplayPort, USB"
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
                "Botones": "5 programables",
                "RGB": "No"
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
        },
        {
            idProducto: 6,
            clave: "TABPRO001",
            numParte: "IPADPR6GEN",
            nombre: "Tablet iPad Pro 12.9\"",
            modelo: "6th Generation",
            idMarca: 6,
            marca: "Apple",
            idSubCategoria: 6,
            subcategoria: "Tablets Pro",
            idCategoria: 6,
            categoria: "Tablets",
            descripcion_corta: "Tablet profesional con chip M2 y pantalla Liquid Retina XDR",
            descripcion_larga: "El iPad Pro con chip M2 ofrece un rendimiento revolucionario para profesionales creativos. Con pantalla Liquid Retina XDR y compatibilidad con Magic Keyboard.",
            ean: "1234567890128",
            upc: "123456789017",
            sustituto: "TABPRO001",
            activo: 1,
            protegido: 0,
            existencia: { "CDMX": 6, "MTY": 3 },
            precio: 1099.99,
            moneda: "USD",
            tipoCambio: 18.54,
            especificaciones: {
                "Pantalla": '12.9" Liquid Retina XDR',
                "Chip": "Apple M2",
                "Almacenamiento": "1TB",
                "RAM": "16GB",
                "Cámara": "12MP + 10MP + LiDAR",
                "Conectividad": "Wi-Fi 6E, Thunderbolt / USB 4"
            },
            promociones: [],
            imagen: "/products/ipad-pro.jpg",
            imagenes_adicionales: [
                "/products/ipad-pro-2.jpg",
                "/products/ipad-pro-3.jpg"
            ]
        }
    ];

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
        // Aquí puedes integrar con tu sistema de carrito
        alert(`¡${quantity} x ${product.nombre} agregado al carrito!`);
    };

    return (
        <main className="home">
            {/* Sección de Categorías */}
            <section className="categorias">
                <div className="container">
                    <h2 className="section-title">Explora por Categoría</h2>
                    <div className="categorias-grid">
                        {categoriasTecnologia.map((categoria, index) => (
                            <div key={index} className="categoria-card">
                                <div className="categoria-icon">
                                    {categoria.icon}
                                </div>
                                <h3>{categoria.title}</h3>
                                <p>{categoria.description}</p>
                                <Link to="/categories" className="btn-categoria">
                                    Ver Productos
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Sección de Productos Destacados */}
            <section className="productos-destacados">
                <div className="container">
                    <h2 className="section-title">Productos Destacados</h2>
                    <div className="productos-grid">
                        {productosDestacados.map((producto) => (
                            <ProductCard 
                                key={producto.idProducto} 
                                product={producto}
                                onQuickView={handleQuickView}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Sección de Más Productos */}
            <section className="mas-productos">
                <div className="container">
                    <h2 className="section-title">Más Productos</h2>
                    <div className="productos-grid">
                        {masProductos.map((producto) => (
                            <ProductCard 
                                key={producto.idProducto} 
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
                </div>
            </section>

            {/* Sección de Beneficios */}
            <section className="beneficios">
                <div className="container">
                    <div className="beneficios-content">
                        <div className="beneficio">
                            <div className="beneficio-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                </svg>
                            </div>
                            <h3>Envío Gratis</h3>
                            <p>En compras mayores a $500</p>
                        </div>
                        <div className="beneficio">
                            <div className="beneficio-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                </svg>
                            </div>
                            <h3>Garantía Extendida</h3>
                            <p>Hasta 2 años en productos seleccionados</p>
                        </div>
                        <div className="beneficio">
                            <div className="beneficio-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <h3>Soporte 24/7</h3>
                            <p>Asistencia técnica especializada</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal de Vista Rápida */}
            <QuickViewModal
                product={quickViewProduct}
                isOpen={isQuickViewOpen}
                onClose={handleCloseQuickView}
                onAddToCart={handleAddToCart}
            />
        </main>
    );
};

export default Home;