import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Categories.css';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Datos simulados de categorías
    const simulatedCategories = [
        {
            id: 'laptops',
            nombre: 'Laptops & Computadoras',
            descripcion: 'Las mejores laptops y computadoras para trabajo, gaming y creatividad',
            imagen: '/categories/laptops.jpg',
            cantidadProductos: 45
        },
        {
            id: 'smartphones',
            nombre: 'Smartphones',
            descripcion: 'Los últimos modelos de smartphones con tecnología de punta',
            imagen: '/categories/smartphones.jpg',
            cantidadProductos: 32
        },
        {
            id: 'tablets',
            nombre: 'Tablets',
            descripcion: 'Tablets para productividad y entretenimiento',
            imagen: '/categories/tablets.jpg',
            cantidadProductos: 18
        },
        {
            id: 'monitores',
            nombre: 'Monitores',
            descripcion: 'Monitores gaming, 4K y profesionales',
            imagen: '/categories/monitors.jpg',
            cantidadProductos: 27
        },
        {
            id: 'accesorios',
            nombre: 'Accesorios',
            descripcion: 'Teclados, mouse y periféricos para tu setup',
            imagen: '/categories/accessories.jpg',
            cantidadProductos: 89
        },
        {
            id: 'audio',
            nombre: 'Audio',
            descripcion: 'Auriculares, altavoces y equipos de sonido',
            imagen: '/categories/audio.jpg',
            cantidadProductos: 34
        }
    ];

    // Simular carga de API
    useEffect(() => {
        const loadCategories = async () => {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 800));
            
            setCategories(simulatedCategories);
            setLoading(false);
        };

        loadCategories();
    }, []);

    if (loading) {
        return (
            <div className="categories-loading">
                <div className="loading-spinner"></div>
                <p>Cargando categorías...</p>
            </div>
        );
    }

    return (
        <div className="categories-page">
            <div className="container">
                {/* Header de la página */}
                <div className="categories-header">
                    <h1>Explora por Categoría</h1>
                    <p>Encuentra exactamente lo que necesitas en nuestra amplia selección de productos tecnológicos</p>
                </div>

                {/* Grid de Categorías */}
                <div className="categories-grid">
                    {categories.map(category => (
                        <div key={category.id} className="category-card">
                            <div className="category-image">
                                <img src={category.imagen} alt={category.nombre} />
                                <div className="category-overlay">
                                    <Link 
                                        to="/products"
                                        className="btn-explore"
                                    >
                                        Explorar Categoría
                                    </Link>
                                </div>
                            </div>

                            <div className="category-info">
                                <h3 className="category-name">{category.nombre}</h3>
                                <p className="category-description">{category.descripcion}</p>
                                
                                <div className="category-stats">
                                    <span className="product-count">
                                        {category.cantidadProductos} productos
                                    </span>
                                </div>

                                <Link 
                                    to="/products"
                                    className="btn-view-all"
                                >
                                    Ver Todos los Productos →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Banner de ofertas */}
                <div className="categories-banner">
                    <div className="banner-content">
                        <h2>¿No encuentras lo que buscas?</h2>
                        <p>Explora todos nuestros productos o contáctanos para una recomendación personalizada</p>
                        <div className="banner-actions">
                            <Link to="/products" className="btn-banner-primary">
                                Ver Todos los Productos
                            </Link>
                            <Link to="/contacto" className="btn-banner-secondary">
                                Contactar Asesor
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Categories;