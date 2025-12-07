import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCategoriasDinamicas, useEstadisticas, useTodosProductos } from '../api/productosHooks';
import './Categories.css';

const Categories = () => {
  const { 
    data: categoriasResponse, 
    loading, 
    error, 
    refetch 
  } = useCategoriasDinamicas({
    ordenar: 'alfabetico',
    minProductos: 1
  });
  
  const { data: estadisticasResponse } = useEstadisticas();
  const { data: productosResponse } = useTodosProductos({ page: 1, limit: 20000 });

  // Procesar categorías del backend
  const categoriasProcesadas = useMemo(() => {
    if (!categoriasResponse?.data || !Array.isArray(categoriasResponse.data)) {
      return [];
    }

    console.log('📊 Categorías del backend:', categoriasResponse.data);

    return categoriasResponse.data.map(categoriaApi => {
      // Obtener subcategorías reales de los productos
      let subcategoriasDeEstaCategoria = [];
      let productosEnCategoria = 0;
      let productosConStockEnCategoria = 0;
      
      if (productosResponse?.data) {
        const productosFiltrados = productosResponse.data.filter(p => 
          p.categoria && p.categoria.trim() === categoriaApi.nombre.trim()
        );
        
        productosEnCategoria = productosFiltrados.length;
        productosConStockEnCategoria = productosFiltrados.filter(p => 
          (p.existencia || p.existenciaTotal || 0) > 0
        ).length;
        
        // Extraer subcategorías únicas
        const subcategoriasSet = new Set();
        productosFiltrados.forEach(p => {
          if (p.subcategoria && typeof p.subcategoria === 'string') {
            const subcat = p.subcategoria.trim();
            if (subcat && subcat !== 'N/A' && subcat !== 'null') {
              subcategoriasSet.add(subcat);
            }
          }
        });
        subcategoriasDeEstaCategoria = Array.from(subcategoriasSet).sort();
      }

      // Generar color único
      const getColorCategoria = (nombre) => {
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

      // Obtener descripción
      const getDescripcionCategoria = (nombre) => {
        const descripciones = {
          'Consumibles': 'Materiales de oficina, tecnología y uso diario esencial',
          'Ensamble': 'Componentes para armar computadoras y equipos tecnológicos',
          'Cables': 'Cables USB, HDMI, red, alimentación y todo tipo de conectores',
          'Accesorios Gaming': 'Equipos especializados para gaming: mouse, teclados, headsets',
          'Video Vigilancia': 'Sistemas completos de CCTV y seguridad visual',
          'Red Activa': 'Routers, switches, firewalls y equipos de networking',
          'Electrónica': 'Componentes electrónicos y equipos especializados',
          'Computadoras': 'Computadoras de escritorio, todo-en-uno y equipos completos',
          'Impresión': 'Impresoras, plotters y equipos de impresión profesional',
          'Audio': 'Bocinas, audífonos, micrófonos y sistemas de sonido',
          'Almacenamiento': 'Discos duros, SSDs y unidades de almacenamiento',
          'Periféricos': 'Mouse, teclados, monitores y accesorios para computadora',
          'Software': 'Programas y aplicaciones para diversos usos',
          'Networking': 'Equipos y accesorios para redes informáticas',
          'Componentes': 'Partes individuales para ensamblar equipos',
        };
        
        return descripciones[nombre] || `Productos de ${nombre} - Calidad y variedad para tus necesidades`;
      };

      return {
        ...categoriaApi,
        // Asegurar datos básicos
        nombre: categoriaApi.nombre,
        id: categoriaApi.id || `categoria-${categoriaApi.nombre.toLowerCase().replace(/\s+/g, '-')}`,
        // Datos reales de productos
        productosRealesEnCategoria: productosEnCategoria,
        productosConStock: productosConStockEnCategoria,
        porcentajeDisponible: productosEnCategoria > 0 ? 
          Math.round((productosConStockEnCategoria / productosEnCategoria) * 100) : 0,
        // Subcategorías reales
        subcategorias: subcategoriasDeEstaCategoria,
        subcategoriasCount: subcategoriasDeEstaCategoria.length,
        // UI
        color: getColorCategoria(categoriaApi.nombre),
        descripcion: getDescripcionCategoria(categoriaApi.nombre),
        ruta: `/products?category=${encodeURIComponent(categoriaApi.nombre)}`
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

  }, [categoriasResponse, productosResponse]);

  // Componente para mostrar subcategorías
  const SubcategoriasAccordion = ({ categoria, color }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (categoria.subcategoriasCount === 0) {
      return (
        <div className="subcategorias-accordion">
          <button 
            className="subcategorias-toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
            style={{ backgroundColor: color }}
            disabled={categoria.subcategoriasCount === 0}
          >
            <span className="subcategorias-toggle-text">
              Sin subcategorías específicas
            </span>
          </button>
          
          {isOpen && (
            <div className="subcategorias-content">
              <div className="no-subcategorias-message">
                <p>Esta categoría no tiene subcategorías específicas definidas en los productos.</p>
                <p>Puedes explorar todos los productos directamente:</p>
                <Link 
                  to={categoria.ruta}
                  className="explorar-todos-btn"
                  style={{ 
                    backgroundColor: color,
                    borderColor: color 
                  }}
                >
                  Explorar todos los productos
                </Link>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="subcategorias-accordion">
        <button 
          className="subcategorias-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          style={{ backgroundColor: color }}
        >
          <span className="subcategorias-toggle-text">
            Ver Subcategorías ({categoria.subcategoriasCount})
          </span>
          <span className="subcategorias-toggle-icon">
            {isOpen ? '▼' : '▶'}
          </span>
        </button>
        
        {isOpen && (
          <div className="subcategorias-content">
            <div className="subcategorias-grid">
              {categoria.subcategorias.map((subcategoria, index) => (
                <div key={index} className="subcategoria-item">
                  <div className="subcategoria-info">
                    <h4 className="subcategoria-name">{subcategoria}</h4>
                    <p className="subcategoria-description">
                      Productos especializados en {subcategoria.toLowerCase()}
                    </p>
                  </div>
                  <Link 
                    to={`/products?category=${encodeURIComponent(categoria.nombre)}&subcategory=${encodeURIComponent(subcategoria)}`}
                    className="subcategoria-ver-productos-btn"
                    style={{ 
                      backgroundColor: color,
                      borderColor: color 
                    }}
                  >
                    Ver Productos
                  </Link>
                </div>
              ))}
            </div>
            
            <div className="ver-todos-container">
              <Link 
                to={categoria.ruta}
                className="ver-todos-btn"
                style={{ 
                  backgroundColor: color + '20',
                  color: color,
                  borderColor: color 
                }}
              >
                Ver Todos los Productos de {categoria.nombre} ({categoria.productosRealesEnCategoria})
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Obtener totales
  const getTotalProductos = () => {
    return productosResponse?.data?.length || estadisticasResponse?.data?.totals?.todos || 0;
  };

  // Datos para mostrar
  const categorias = categoriasProcesadas;
  const totalProductos = getTotalProductos();
  const totalProductosEnCategorias = categorias.reduce((sum, cat) => sum + (cat.productosRealesEnCategoria || 0), 0);
  const totalSubcategorias = categorias.reduce((sum, cat) => sum + (cat.subcategoriasCount || 0), 0);

  // Debug
  useEffect(() => {
    if (categorias.length > 0 && totalProductos > 0) {
      console.log('🎯 RESUMEN FINAL CATEGORÍAS:');
      console.log(`   📦 Productos totales en API: ${totalProductos}`);
      console.log(`   🏷️ Categorías del backend: ${categorias.length}`);
      console.log(`   📋 Subcategorías encontradas: ${totalSubcategorias}`);
      console.log(`   📦 Productos en categorías: ${totalProductosEnCategorias}`);
    }
  }, [categorias, totalProductos, totalProductosEnCategorias, totalSubcategorias]);

  // Loading state
  if (loading) {
    return (
      <div className="categories-page">
        <div className="categories-container">
          <div className="categories-loading">
            <div className="categories-loading-spinner"></div>
            <p>Cargando categorías desde el backend...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="categories-page">
        <div className="categories-container">
          <div className="categories-error">
            <div className="categories-error-icon">⚠️</div>
            <h3>Error al cargar categorías</h3>
            <p>{error}</p>
            <button onClick={refetch} className="categories-btn-retry">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No categories state
  if (!categoriasResponse || !categoriasResponse.success || categorias.length === 0) {
    return (
      <div className="categories-page">
        <div className="categories-container">
          <div className="categories-no-categories">
            <div className="categories-no-categories-icon">📁</div>
            <h3>No se encontraron categorías</h3>
            <p>No hay categorías disponibles en la API</p>
            <button onClick={refetch} className="categories-btn-retry">
              Buscar Nuevamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="categories-page">
      <div className="categories-container">
        {/* Encabezado */}
        <div className="categories-header">
          <h1>Catálogo Organizado</h1>
          <p className="categories-subtitle">
            {categorias.length} categorías del backend con {totalSubcategorias} subcategorías reales
            <span className="categories-update-info">
              (Datos reales de la API)
            </span>
          </p>
          
          {/* Estadísticas rápidas */}
          <div className="categories-stats">
            <div className="categories-stat-item">
              <span className="categories-stat-number">{categorias.length}</span>
              <span className="categories-stat-label">Categorías</span>
            </div>
            <div className="categories-stat-item">
              <span className="categories-stat-number">{totalSubcategorias}</span>
              <span className="categories-stat-label">Subcategorías</span>
            </div>
            <div className="categories-stat-item">
              <span className="categories-stat-number">{totalProductos.toLocaleString()}</span>
              <span className="categories-stat-label">Productos</span>
            </div>
            <div className="categories-stat-item">
              <span className="categories-stat-number">
                {categorias.filter(c => c.productosConStock > 0).length}
              </span>
              <span className="categories-stat-label">Con Stock</span>
            </div>
          </div>

          {/* Información */}
          <div className="categories-dynamic-info">
            <div className="categories-update-status">
              <span className="categories-update-dot"></span>
              <span>Categorías del backend con datos reales</span>
            </div>
            <button onClick={refetch} className="categories-btn-refresh">
              🔄 Actualizar Catálogo
            </button>
          </div>
        </div>

        {/* Todas las Categorías */}
        <div className="categories-section">
          <h2 className="categories-section-title">
            <span className="categories-section-icon">📚</span>
            Categorías del Backend ({categorias.length})
          </h2>
          
          <div className="categories-controls">
            <span className="categories-sort-info">
              Subcategorías reales extraídas de {totalProductos.toLocaleString()} productos
            </span>
          </div>

          {/* Grid de Categorías */}
          <div className="categories-grid">
            {categorias.map((categoria) => (
              <div 
                key={categoria.id} 
                className="categories-card"
                style={{ borderColor: categoria.color + '40' }}
              >
                {/* Encabezado */}
                <div className="categories-card-header">
                  <div 
                    className="categories-card-icon"
                    style={{ backgroundColor: categoria.color }}
                  >
                    <span className="categories-card-initial">
                      {categoria.nombre.charAt(0).toUpperCase()}
                    </span>
                    {categoria.subcategoriasCount > 0 && (
                      <span className="categories-subcategorias-badge">
                        {categoria.subcategoriasCount}
                      </span>
                    )}
                  </div>
                  
                  <div className="categories-card-badges">
                    {categoria.productosConStock > 0 && (
                      <span className="categories-badge-stock">Disponible</span>
                    )}
                    <span className="categories-badge-count">
                      {categoria.productosRealesEnCategoria} productos
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="categories-card-content">
                  <h3 className="categories-card-name">
                    {categoria.nombre}
                  </h3>
                  <p className="categories-card-description">
                    {categoria.descripcion}
                  </p>
                  
                  {/* Estadísticas */}
                  <div className="categories-card-meta">
                    <div className="categories-meta-item">
                      <span className="categories-meta-icon">📦</span>
                      <span>{categoria.productosRealesEnCategoria} productos reales</span>
                    </div>
                    <div className="categories-meta-item">
                      <span className="categories-meta-icon">🔧</span>
                      <span>{categoria.subcategoriasCount} subcategorías reales</span>
                    </div>
                    <div className="categories-meta-item">
                      <span className="categories-meta-icon">✓</span>
                      <span>{categoria.porcentajeDisponible}% disponible</span>
                    </div>
                  </div>

                  {/* Subcategorías */}
                  <SubcategoriasAccordion 
                    categoria={categoria} 
                    color={categoria.color} 
                  />

                  {/* Acción principal */}
                  <div className="categories-card-actions">
                    <Link 
                      to={categoria.ruta}
                      className="categories-btn-view-all"
                      style={{ 
                        backgroundColor: categoria.color + '20',
                        color: categoria.color,
                        borderColor: categoria.color
                      }}
                    >
                      Explorar {categoria.productosRealesEnCategoria} productos
                    </Link>
                  </div>
                </div>

                {/* Footer - CORREGIDO: Usar categoriasResponse en lugar de categoriaApi */}
                <div className="categories-card-footer">
                  <span className="categories-source-info">
                    Datos del backend - {categoriasResponse?.metadata?.procesamiento?.fechaProcesamiento || 'Actual'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie de página - CORREGIDO */}
        <div className="categories-footer">
          <div className="categories-footer-content">
            <h3>Categorías Dinámicas del Backend</h3>
            <p>
              Las categorías se generan automáticamente desde los productos en el servidor FTP.
              Este sistema garantiza que solo se muestren categorías que realmente contienen productos.
            </p>
            
            <div className="categories-footer-stats">
              <div className="categories-footer-stat">
                <strong>Productos analizados:</strong>
                <span>{totalProductos.toLocaleString()}</span>
              </div>
              <div className="categories-footer-stat">
                <strong>Categorías activas:</strong>
                <span>{categorias.length}</span>
              </div>
              <div className="categories-footer-stat">
                <strong>Subcategorías encontradas:</strong>
                <span>{totalSubcategorias}</span>
              </div>
              <div className="categories-footer-stat">
                <strong>Cobertura del catálogo:</strong>
                <span>{totalProductosEnCategorias === totalProductos ? '100%' : 
                  `${Math.round((totalProductosEnCategorias / totalProductos) * 100)}%`}
                </span>
              </div>
            </div>
            
            {/* Tips informativos - CORREGIDO */}
            <div className="categories-footer-tips">
              <div className="categories-tip">
                <span className="categories-tip-icon">🎯</span>
                <div>
                  <strong>Categorías Reales</strong>
                  <p>Solo se muestran categorías que tienen productos en la base de datos</p>
                </div>
              </div>
              <div className="categories-tip">
                <span className="categories-tip-icon">📊</span>
                <div>
                  <strong>Subcategorías Extraídas</strong>
                  <p>Las subcategorías se obtienen directamente de los productos</p>
                </div>
              </div>
              <div className="categories-tip">
                <span className="categories-tip-icon">🔄</span>
                <div>
                  <strong>Actualización Automática</strong>
                  <p>Nuevos productos = nuevas categorías automáticamente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;