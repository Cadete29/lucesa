import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategorias, useProductos } from '../api/productosHooks';
import './Categories.css';

const Categories = () => {
    const { data: categoriasResponse, loading, error, refetch } = useCategorias();
    const { data: productosResponse } = useProductos();
    
    const productos = productosResponse?.data || [];

    // **FUNCIÓN: Contar productos por categoría**
    const contarProductosPorCategoria = (nombreCategoria) => {
        if (!Array.isArray(productos)) return 0;
        
        return productos.filter(producto => {
            const categoriaProducto = producto.categoria || producto.subcategoria;
            return categoriaProducto === nombreCategoria;
        }).length;
    };

    // Procesar categorías - solo nombres
    const procesarCategorias = (data) => {
        if (!data || !Array.isArray(data)) return [];

        return data.map((item) => {
            // Si es un string, crear objeto básico
            if (typeof item === 'string') {
                const count = contarProductosPorCategoria(item);
                return {
                    id: generarIdDesdeNombre(item),
                    nombre: item,
                    descripcion: obtenerDescripcionCategoria(item),
                    color: generarColorCategoria(item),
                    count: count
                };
            }
            // Si ya es un objeto, usar directamente
            else if (typeof item === 'object') {
                const count = contarProductosPorCategoria(item.nombre || item);
                return {
                    id: item.id || generarIdDesdeNombre(item.nombre),
                    nombre: item.nombre || 'Sin nombre',
                    descripcion: item.descripcion || obtenerDescripcionCategoria(item.nombre),
                    color: generarColorCategoria(item.nombre),
                    count: count
                };
            }
            return null;
        }).filter(Boolean)
          .sort((a, b) => b.count - a.count); // Ordenar por cantidad de productos
    };

    // Generar ID único desde el nombre
    const generarIdDesdeNombre = (nombre) => {
        if (!nombre) return `categoria-${Math.random().toString(36).substr(2, 9)}`;
        return nombre.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };

    // Generar color único para cada categoría
    const generarColorCategoria = (nombre) => {
        const colors = [
            '#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f56565',
            '#38b2ac', '#ecc94b', '#667eea', '#ed64a6', '#4fd1c7',
            '#fc8181', '#68d391', '#f6ad55', '#d69e2e', '#63b3ed',
            '#b794f4', '#f687b3', '#4c51bf', '#3182ce', '#38a169'
        ];
        
        if (!nombre) return colors[0];
        
        let hash = 0;
        for (let i = 0; i < nombre.length; i++) {
            hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    };

    // Obtener descripción específica para cada categoría
    const obtenerDescripcionCategoria = (nombreCategoria) => {
        const descripciones = {
            'Accesorios Gaming': 'Accesorios especializados para gaming: mouse, teclados, headsets y más para gamers',
            'Accesorios para Componentes': 'Accesorios y complementos para componentes de computadora',
            'Accesorios para Cómputo': 'Accesorios esenciales para computación y oficina',
            'Accesorios para Electronica': 'Componentes y accesorios para proyectos electrónicos',
            'Accesorios para Energía': 'Accesorios para sistemas de energía y electricidad',
            'Accesorios para Impresión': 'Accesorios y consumibles para impresoras',
            'Accesorios para Servidores': 'Componentes y accesorios para servidores y data centers',
            'Accesorios y Consumibles POS': 'Accesorios y consumibles para sistemas Point of Sale',
            'Adaptadores': 'Adaptadores y convertidores para todo tipo de dispositivos',
            'Almacenamiento': 'Discos duros, SSDs y unidades de almacenamiento',
            'Almacenamiento Portatil': 'Unidades de almacenamiento portátiles y externas',
            'Apple': 'Productos y accesorios Apple: Mac, iPhone, iPad y más',
            'Audio': 'Equipos de audio, bocinas, audífonos y sistemas de sonido',
            'Baterías Banks': 'Bancos de baterías y power banks portátiles',
            'Cables': 'Cables de todo tipo: USB, HDMI, red, alimentación y más',
            'Centro de Datos': 'Equipos y soluciones para centros de datos',
            'Computadoras': 'Computadoras de escritorio, todo-en-uno y equipos completos',
            'Computadoras Gaming': 'Computadoras especializadas para gaming de alto rendimiento',
            'Conferencias': 'Equipos para videoconferencias y reuniones virtuales',
            'Conmutadores PBX': 'Sistemas de conmutación telefónica PBX',
            'Consumibles': 'Consumibles generales para oficina y tecnología',
            'Digitalización de Imágenes': 'Equipos para digitalización y escaneo de imágenes',
            'Domotica': 'Soluciones de domótica y casa inteligente',
            'Electrónica': 'Componentes electrónicos y equipos especializados',
            'Energia Solar y Eolica': 'Soluciones de energía solar y eólica',
            'Energía': 'Equipos de energía, UPS y reguladores de voltaje',
            'Ensamble': 'Componentes para ensamble de computadoras',
            'Impresión': 'Impresoras, plotters y equipos de impresión',
            'Línea Blanca': 'Electrodomésticos y línea blanca',
            'Modulos Supresores': 'Módulos supresores de picos y protectores',
            'Oficina': 'Equipos y suministros para oficina',
            'Papelería': 'Artículos de papelería y oficina',
            'Perifericos para POS': 'Periféricos para sistemas Point of Sale',
            'Red Activa': 'Equipos de red activa: routers, switches, firewalls',
            'Red Pasiva': 'Componentes de red pasiva: cables, conectores, racks',
            'Redes': 'Soluciones completas de networking y conectividad',
            'Respaldo y Regulación': 'Sistemas de respaldo de energía y regulación',
            'Salud': 'Equipos y tecnología para el sector salud',
            'Seguridad': 'Sistemas de seguridad física y electrónica',
            'Seguridad Inteligente': 'Soluciones de seguridad inteligente y conectada',
            'Servidores': 'Servidores y equipos para data centers',
            'Señalización Digital': 'Sistemas de señalización digital y displays',
            'Sistemas de Control': 'Sistemas de control y automatización',
            'Software': 'Software y licencias para diversos propósitos',
            'Solucion para servidores': 'Soluciones especializadas para servidores',
            'Tarjetas': 'Tarjetas de expansión y componentes',
            'Telefonía y Video Vigilancia': 'Sistemas integrados de telefonía y video vigilancia',
            'Teléfonos': 'Teléfonos fijos, inalámbricos y equipos de comunicación',
            'Video Vigilancia': 'Sistemas completos de video vigilancia y CCTV',
            'Workstations': 'Estaciones de trabajo profesionales de alto rendimiento'
        };

        return descripciones[nombreCategoria] || `Productos de ${nombreCategoria} para todas tus necesidades`;
    };

    // **FUNCIÓN: Obtener productos totales**
    const getTotalProductos = () => {
        return Array.isArray(productos) ? productos.length : 0;
    };

    // Datos para mostrar
    const categoriasData = categoriasResponse?.data || [];
    const displayCategories = procesarCategorias(categoriasData);
    const totalProductos = getTotalProductos();

    if (loading) {
        return (
            <div className="categories-loading">
                <div className="loading-spinner"></div>
                <p>Cargando categorías...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="categories-error">
                <div className="error-icon">⚠️</div>
                <h3>Error al cargar categorías</h3>
                <p>{error}</p>
                <button onClick={refetch} className="btn-retry">
                    Reintentar
                </button>
            </div>
        );
    }

    if (!categoriasResponse || !categoriasResponse.success || displayCategories.length === 0) {
        return (
            <div className="no-categories">
                <div className="no-categories-icon">📁</div>
                <h3>No se encontraron categorías</h3>
                <button onClick={refetch} className="btn-retry">
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="categories-page">
            <div className="container">
                {/* Header */}
                <div className="categories-header">
                    <h1>Explora por Categoría</h1>
                    <p>Descubre nuestras {displayCategories.length} categorías especializadas</p>
                    
                    <div className="categories-stats">
                        <div className="stat-item">
                            <span className="stat-number">{displayCategories.length}</span>
                            <span className="stat-label">Categorías</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{totalProductos}</span>
                            <span className="stat-label">Productos Totales</span>
                        </div>
                    </div>
                </div>

                {/* Grid de Categorías */}
                <div className="categories-grid">
                    {displayCategories.map((category) => (
                        <div key={category.id} className="category-card">
                            <div 
                                className="category-icon"
                                style={{ backgroundColor: category.color }}
                            >
                                <span className="category-initial">
                                    {category.nombre.charAt(0).toUpperCase()}
                                </span>
                            </div>

                            <div className="category-info">
                                <h3 className="category-name">{category.nombre}</h3>
                                <p className="category-description">{category.descripcion}</p>
                                
                                <div className="category-meta">
                                    <span className="category-count">
                                        {category.count} producto{category.count !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                
                                <div className="category-actions">
                                    <Link 
                                        to={`/products?category=${encodeURIComponent(category.nombre)}`} 
                                        className="btn-view-all"
                                    >
                                        Ver Productos →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Categories;