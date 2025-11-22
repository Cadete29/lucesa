import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCategoriasReales, useEstadisticas, useProductos } from '../api/productosHooks';
import './Categories.css';

const Categories = () => {
    const { data: categoriasRealesResponse, loading, error, refetch } = useCategoriasReales();
    const { data: estadisticasResponse } = useEstadisticas();
    const { data: productosResponse } = useProductos({ page: 1, limit: 20000 });

    // **SOLUCIÓN: Un producto = Una categoría principal**
    const { categoriasConProductos, productosSinCategoria } = useMemo(() => {
        if (!productosResponse?.data || !Array.isArray(productosResponse.data)) {
            return { categoriasConProductos: {}, productosSinCategoria: 0 };
        }

        const productos = productosResponse.data;
        const categoriasMap = new Map();
        let sinCategoriaCount = 0;

        console.log(`🔍 Analizando ${productos.length} productos para categorías PRINCIPALES...`);

        productos.forEach(producto => {
            // PRIORIDAD 1: Usar categoría principal si existe y es válida
            if (producto.categoria && 
                typeof producto.categoria === 'string' && 
                producto.categoria.trim() !== '' &&
                producto.categoria.trim() !== 'N/A' &&
                producto.categoria.trim() !== 'null' &&
                producto.categoria.trim().length > 1) {
                
                const categoria = producto.categoria.trim();
                categoriasMap.set(categoria, (categoriasMap.get(categoria) || 0) + 1);
            }
            // PRIORIDAD 2: Si no tiene categoría principal, usar subcategoría
            else if (producto.subcategoria && 
                     typeof producto.subcategoria === 'string' && 
                     producto.subcategoria.trim() !== '' &&
                     producto.subcategoria.trim() !== 'N/A' &&
                     producto.subcategoria.trim() !== 'null' &&
                     producto.subcategoria.trim().length > 1) {
                
                const subcategoria = producto.subcategoria.trim();
                categoriasMap.set(subcategoria, (categoriasMap.get(subcategoria) || 0) + 1);
            }
            // PRIORIDAD 3: Si no tiene ninguna categoría válida
            else {
                sinCategoriaCount++;
            }
        });

        // Convertir Map a objeto
        const categoriasObj = {};
        categoriasMap.forEach((count, categoria) => {
            categoriasObj[categoria] = count;
        });

        const totalProductosEnCategorias = Object.values(categoriasObj).reduce((sum, count) => sum + count, 0);

        console.log('📊 ESTADÍSTICAS DEFINITIVAS:');
        console.log(`   📦 Productos totales: ${productos.length}`);
        console.log(`   ✅ Productos en categorías: ${totalProductosEnCategorias}`);
        console.log(`   ❌ Productos SIN categoría: ${sinCategoriaCount}`);
        console.log(`   🏷️ Categorías CON productos: ${categoriasMap.size}`);
        console.log(`   📈 Cobertura: ${((totalProductosEnCategorias / productos.length) * 100).toFixed(1)}%`);

        return {
            categoriasConProductos: categoriasObj,
            productosSinCategoria: sinCategoriaCount
        };

    }, [productosResponse]);

    // **FUNCIÓN CORREGIDA: Filtrar categorías sin productos**
    const procesarCategoriasReales = (categoriasData) => {
        if (!categoriasData || !Array.isArray(categoriasData)) {
            return [];
        }

        console.log(`🔄 Procesando ${categoriasData.length} categorías...`);

        // 1. Filtrar solo categorías que tienen productos
        const categoriasConProductosFiltradas = categoriasData
            .map((categoriaNombre) => {
                const id = generarIdDesdeNombre(categoriaNombre);
                const count = categoriasConProductos[categoriaNombre] || 0;

                return {
                    id: id,
                    nombre: categoriaNombre,
                    descripcion: obtenerDescripcionCategoria(categoriaNombre),
                    color: generarColorCategoria(categoriaNombre),
                    count: count,
                    esReal: true
                };
            })
            .filter(categoria => {
                // ✅ MOSTRAR SOLO SI TIENE PRODUCTOS
                return categoria.count > 0 && 
                       categoria.nombre && 
                       categoria.nombre.trim() !== '';
            })
            .sort((a, b) => {
                if (b.count !== a.count) {
                    return b.count - a.count;
                }
                return a.nombre.localeCompare(b.nombre);
            });

        console.log(`📊 Después de filtrar - Categorías con productos: ${categoriasConProductosFiltradas.length}`);

        // 2. AGREGAR CATEGORÍA "OTROS" SI HAY PRODUCTOS SIN CATEGORÍA
        let categoriasFinales = [...categoriasConProductosFiltradas];
        
        if (productosSinCategoria > 0) {
            const categoriaOtros = {
                id: 'otros',
                nombre: 'Otros',
                descripcion: 'Productos diversos que no tienen una categoría específica asignada',
                color: '#A0AEC0',
                count: productosSinCategoria,
                esReal: true,
                esCategoriaOtros: true
            };
            
            // Insertar "Otros" después del top 5
            const insertIndex = Math.min(5, categoriasFinales.length);
            categoriasFinales.splice(insertIndex, 0, categoriaOtros);
            
            console.log(`✅ Categoría "Otros" agregada con ${productosSinCategoria} productos`);
        }

        // Calcular estadísticas finales
        const totalProductosEnCategorias = categoriasFinales.reduce((sum, cat) => sum + cat.count, 0);
        const categoriasFiltradas = categoriasData.length - categoriasConProductosFiltradas.length;
        
        console.log('📊 ESTADÍSTICAS FINALES CON FILTRO:');
        console.log(`   ✅ Categorías mostradas: ${categoriasFinales.length}`);
        console.log(`   🚫 Categorías ocultas (sin productos): ${categoriasFiltradas}`);
        console.log(`   📦 Productos en categorías: ${totalProductosEnCategorias}`);
        console.log(`   🔄 Incluye categoría "Otros": ${productosSinCategoria > 0}`);

        // Mostrar categorías ocultas (para debug)
        if (categoriasFiltradas > 0) {
            const categoriasOcultas = categoriasData
                .filter(cat => !categoriasConProductosFiltradas.find(c => c.nombre === cat))
                .slice(0, 10);
            console.log('🚫 Ejemplos de categorías ocultas:', categoriasOcultas);
        }

        return categoriasFinales;
    };

    // Generar ID único
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

    // Generar color único para cada categoría
    const generarColorCategoria = (nombre) => {
        const colors = [
            '#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f56565',
            '#38b2ac', '#ecc94b', '#667eea', '#ed64a6', '#4fd1c7',
            '#fc8181', '#68d391', '#f6ad55', '#d69e2e', '#63b3ed',
            '#b794f4', '#f687b3', '#4c51bf', '#3182ce', '#38a169',
            '#805ad5', '#e53e3e', '#dd6b20', '#0bc5ea', '#00b5d8'
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
            'Consumibles': 'Materiales de oficina, tecnología y uso diario esencial',
            'Ensamble': 'Componentes para armar computadoras y equipos tecnológicos',
            'Cables': 'Cables USB, HDMI, red, alimentación y todo tipo de conectores',
            'Accesorios Gaming': 'Equipos especializados para gaming: mouse, teclados, headsets',
            'Video Vigilancia': 'Sistemas completos de CCTV y seguridad visual',
            'Accesorios para Componentes': 'Complementos para componentes de computadora',
            'Red Activa': 'Routers, switches, firewalls y equipos de networking',
            'Accesorios para Electronica': 'Componentes y herramientas para proyectos electrónicos',
            'Accesorios para Cómputo': 'Accesorios esenciales para computación y oficina',
            'Electrónica': 'Componentes electrónicos y equipos especializados',
            'Respaldo y Regulación': 'Sistemas UPS, reguladores y protección de energía',
            'Perifericos para POS': 'Equipos especializados para sistemas Point of Sale',
            'Computadoras': 'Computadoras de escritorio, todo-en-uno y equipos completos',
            'Almacenamiento Portatil': 'Discos duros externos y unidades portátiles',
            'Tóners': 'Tóners y cartuchos de impresión para todas las marcas',
            'No Breaks y UPS': 'Sistemas de energía ininterrumpida y respaldo',
            'Impresión': 'Impresoras, plotters y equipos de impresión profesional',
            'Red Pasiva': 'Cables, conectores, racks e infraestructura de red',
            'Audio': 'Bocinas, audífonos, micrófonos y sistemas de sonido',
            'Telefonía y Video Vigilancia': 'Sistemas integrados de comunicación y seguridad',
            'Otros': 'Productos diversos que no tienen una categoría específica asignada'
        };

        return descripciones[nombreCategoria] || `Productos de ${nombreCategoria} - Calidad y variedad para tus necesidades`;
    };

    // Obtener totales reales
    const getTotalProductos = () => {
        return productosResponse?.data?.length || estadisticasResponse?.data?.totals?.todos || 0;
    };

    // Datos para mostrar
    const categoriasReales = categoriasRealesResponse?.data || [];
    const displayCategories = procesarCategoriasReales(categoriasReales);
    const totalProductos = getTotalProductos();
    const totalProductosEnCategorias = displayCategories.reduce((sum, cat) => sum + cat.count, 0);
    const categoriasConProductosCount = displayCategories.filter(cat => !cat.esCategoriaOtros).length;

    // DEBUG: Verificar números finales
    useEffect(() => {
        if (displayCategories.length > 0 && totalProductos > 0) {
            console.log('🎯 RESUMEN FINAL CON FILTRO:');
            console.log(`   📦 Productos totales: ${totalProductos}`);
            console.log(`   🏷️ Categorías mostradas: ${displayCategories.length}`);
            console.log(`   ✅ Categorías CON productos: ${categoriasConProductosCount}`);
            console.log(`   🔄 Categoría "Otros": ${displayCategories.find(cat => cat.esCategoriaOtros) ? 'SÍ' : 'NO'}`);
            console.log(`   📦 Productos organizados: ${totalProductosEnCategorias}`);
            console.log(`   📈 Cobertura: ${((totalProductosEnCategorias / totalProductos) * 100).toFixed(1)}%`);

            // Verificar que no haya duplicados
            if (totalProductosEnCategorias !== totalProductos) {
                console.warn('❌ DIFERENCIA EN CONTEO:', {
                    productosTotales: totalProductos,
                    productosEnCategorias: totalProductosEnCategorias,
                    diferencia: totalProductos - totalProductosEnCategorias
                });
            } else {
                console.log('✅ CONTEO PERFECTO - Sin duplicados');
            }
        }
    }, [displayCategories, totalProductos, totalProductosEnCategorias, categoriasConProductosCount]);

    // Loading state
    if (loading) {
        return (
            <div className="categories-loading">
                <div className="loading-spinner"></div>
                <p>Organizando productos por categorías...</p>
                <p>Filtrando categorías con productos...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="categories-error">
                <div className="error-icon">⚠️</div>
                <h3>Error al cargar categorías</h3>
                <p>{error}</p>
                <button onClick={refetch} className="btn-retry">Reintentar</button>
            </div>
        );
    }

    // No categories state
    if (!categoriasRealesResponse || !categoriasRealesResponse.success || displayCategories.length === 0) {
        return (
            <div className="no-categories">
                <div className="no-categories-icon">📁</div>
                <h3>No se encontraron categorías con productos</h3>
                <p>Se analizaron {productosResponse?.data?.length || 0} productos</p>
                <button onClick={refetch} className="btn-retry">Buscar Nuevamente</button>
            </div>
        );
    }

    return (
        <div className="categories-page">
            <div className="container">
                <div className="categories-header">
                    <h1>Explora por Categoría</h1>
                    <p>
                        {displayCategories.length} categorías organizando {totalProductos.toLocaleString()} productos
                    </p>
                    
                    <div className="categories-stats">
                        <div className="stat-item">
                            <span className="stat-number">{displayCategories.length}</span>
                            <span className="stat-label">Categorías</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">
                                {categoriasConProductosCount}
                            </span>
                            <span className="stat-label">Con Productos</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{totalProductos.toLocaleString()}</span>
                            <span className="stat-label">Productos Totales</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">{totalProductosEnCategorias.toLocaleString()}</span>
                            <span className="stat-label">Productos Organizados</span>
                        </div>
                    </div>

                    {/* Información de filtrado */}
                    <div style={{ 
                        marginTop: '1rem', 
                        padding: '1rem',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <p style={{ margin: 0, color: 'white', fontSize: '0.9rem' }}>
                            <strong>🎯 Filtrado automático:</strong> Mostrando solo categorías con productos
                            {productosSinCategoria > 0 && (
                                <span> + categoría "Otros" con <strong>{productosSinCategoria} productos</strong></span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Grid de Categorías - SOLO LAS QUE TIENEN PRODUCTOS */}
                <div className="categories-grid">
                    {displayCategories.map((category) => (
                        <div 
                            key={category.id} 
                            className={`category-card ${category.esCategoriaOtros ? 'category-otros' : ''}`}
                        >
                            <div 
                                className="category-icon"
                                style={{ backgroundColor: category.color }}
                            >
                                <span className="category-initial">
                                    {category.nombre.charAt(0).toUpperCase()}
                                </span>
                                {category.esReal && !category.esCategoriaOtros && (
                                    <span className="real-badge">REAL</span>
                                )}
                                {category.esCategoriaOtros && (
                                    <span className="otros-badge">OTROS</span>
                                )}
                            </div>

                            <div className="category-info">
                                <h3 className="category-name">
                                    {category.nombre}
                                    {category.esCategoriaOtros && (
                                        <span style={{ fontSize: '0.7em', marginLeft: '0.5rem', opacity: 0.7 }}>
                                            (Sin categoría)
                                        </span>
                                    )}
                                </h3>
                                <p className="category-description">{category.descripcion}</p>
                                
                                <div className="category-meta">
                                    <span className={`category-count ${category.esCategoriaOtros ? 'count-otros' : ''}`}>
                                        {category.count.toLocaleString()} productos
                                        {category.esCategoriaOtros && ' sin categoría'}
                                    </span>
                                </div>
                                
                                <div className="category-actions">
                                    <Link 
                                        to={`/products?category=${category.id}`} 
                                        className={`btn-view-all ${category.esCategoriaOtros ? 'btn-otros' : ''}`}
                                    >
                                        Ver Productos →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Información adicional */}
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '3rem', 
                    padding: '2rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px'
                }}>
                    <h3>Organización Optimizada de Productos</h3>
                    <p>
                        <strong>{totalProductosEnCategorias.toLocaleString()} productos</strong> organizados en 
                        {' '}<strong>{displayCategories.length} categorías activas</strong>
                    </p>
                    {productosSinCategoria > 0 ? (
                        <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>
                            Incluyendo <strong>{productosSinCategoria} productos</strong> en la categoría "Otros" para máxima cobertura
                        </p>
                    ) : (
                        <p style={{ fontSize: '0.9rem', color: '#718096', marginTop: '0.5rem' }}>
                            ✅ 100% de productos categorizados correctamente
                        </p>
                    )}
                    <p style={{ fontSize: '0.8rem', color: '#A0AEC0', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        Las categorías sin productos se ocultan automáticamente
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Categories;