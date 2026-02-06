// components/CategoriesDropdown/CategoriesDropdown.js - Componente actualizado
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoriasDinamicas, useTodosProductos } from '../../api/productosHooks';
import './CategoriesDropdown.css';

const CategoriesDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeParentCategory, setActiveParentCategory] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef(null);
  const panelStackRef = useRef([]); // Para manejar navegación en móvil
  
  // Obtener categorías y productos
  const { data: categoriasResponse, loading } = useCategoriasDinamicas({
    ordenar: 'alfabetico',
    minProductos: 1
  });
  
  const { data: productosResponse } = useTodosProductos({ page: 1, limit: 20000 });

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Definir las 15 categorías padre
  const categoriasPadre = useMemo(() => [
    { id: 'computacion', nombre: 'Computación', icon: '💻' },
    { id: 'electronica', nombre: 'Electrónica', icon: '🔌' },
    { id: 'redes', nombre: 'Redes y Comunicaciones', icon: '🌐' },
    { id: 'almacenamiento', nombre: 'Almacenamiento', icon: '💾' },
    { id: 'impresion', nombre: 'Impresión', icon: '🖨️' },
    { id: 'seguridad', nombre: 'Seguridad', icon: '🔒' },
    { id: 'audio-video', nombre: 'Audio y Video', icon: '🎵' },
    { id: 'energia', nombre: 'Energía y Respaldo', icon: '⚡' },
    { id: 'oficina', nombre: 'Oficina', icon: '📎' },
    { id: 'gaming', nombre: 'Gaming', icon: '🎮' },
    { id: 'apple', nombre: 'Apple', icon: '🍎' },
    { id: 'domotica', nombre: 'Domótica', icon: '🏠' },
    { id: 'pos', nombre: 'Sistemas POS', icon: '💳' },
    { id: 'servidores', nombre: 'Servidores y Datacenter', icon: '🖥️' },
    { id: 'accesorios', nombre: 'Accesorios', icon: '🎧' }
  ], []);

  // Procesar categorías con estructura jerárquica
  const categoriasEstructuradas = useMemo(() => {
    if (!categoriasResponse?.data || !productosResponse?.data) return {};

    // Primero, mapear todas las categorías con sus productos y subcategorías
    const categoriasDetalladas = categoriasResponse.data
      .map(categoria => {
        // Filtrar productos de esta categoría
        const productosEnCategoria = productosResponse.data.filter(
          p => p.categoria && p.categoria.trim() === categoria.nombre.trim()
        );

        // Extraer subcategorías únicas
        const subcategoriasSet = new Set();
        productosEnCategoria.forEach(p => {
          if (p.subcategoria && typeof p.subcategoria === 'string') {
            const subcat = p.subcategoria.trim();
            if (subcat && subcat !== 'N/A' && subcat !== 'null') {
              subcategoriasSet.add(subcat);
            }
          }
        });

        const subcategorias = Array.from(subcategoriasSet).sort();

        return {
          ...categoria,
          nombre: categoria.nombre,
          id: categoria.id || `categoria-${categoria.nombre.toLowerCase().replace(/\s+/g, '-')}`,
          subcategorias,
          productosCount: productosEnCategoria.length,
          ruta: `/products?category=${encodeURIComponent(categoria.nombre)}`
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

    // Asignar categorías a sus categorías padre
    const asignarAPadre = (categoria) => {
      const nombreLower = categoria.nombre.toLowerCase();
      
      // Lógica de asignación
      if (nombreLower.includes('gaming')) return 'gaming';
      if (nombreLower.includes('apple')) return 'apple';
      if (nombreLower.includes('accesorio')) return 'accesorios';
      if (nombreLower.includes('computador') || nombreLower.includes('pc ') || nombreLower.includes('workstation')) 
        return 'computacion';
      if (nombreLower.includes('almacenamiento')) return 'almacenamiento';
      if (nombreLower.includes('impresión') || nombreLower.includes('impresion')) return 'impresion';
      if (nombreLower.includes('red') || nombreLower.includes('conmutador') || nombreLower.includes('telefon')) 
        return 'redes';
      if (nombreLower.includes('electrónica') || nombreLower.includes('electronica') || nombreLower.includes('tarjeta')) 
        return 'electronica';
      if (nombreLower.includes('audio') || nombreLower.includes('video')) return 'audio-video';
      if (nombreLower.includes('energía') || nombreLower.includes('energia') || nombreLower.includes('bateria') || nombreLower.includes('respaldo')) 
        return 'energia';
      if (nombreLower.includes('seguridad') || nombreLower.includes('vigilancia')) return 'seguridad';
      if (nombreLower.includes('oficina') || nombreLower.includes('papelería') || nombreLower.includes('papeleria')) 
        return 'oficina';
      if (nombreLower.includes('domotica') || nombreLower.includes('domótica')) return 'domotica';
      if (nombreLower.includes('pos') || nombreLower.includes('consumible')) return 'pos';
      if (nombreLower.includes('servidor') || nombreLower.includes('datacenter') || nombreLower.includes('centro de datos')) 
        return 'servidores';
      
      return 'accesorios';
    };

    // Estructurar categorías por padre
    const categoriasPorPadre = {};
    categoriasPadre.forEach(padre => {
      categoriasPorPadre[padre.id] = {
        ...padre,
        categorias: []
      };
    });

    // Agrupar categorías bajo sus padres
    categoriasDetalladas.forEach(categoria => {
      const padreId = asignarAPadre(categoria);
      if (categoriasPorPadre[padreId]) {
        categoriasPorPadre[padreId].categorias.push(categoria);
      }
    });

    return categoriasPorPadre;
  }, [categoriasResponse, productosResponse, categoriasPadre]);

  // Manejar navegación hacia atrás en móvil
  const handleBack = () => {
    if (panelStackRef.current.length > 1) {
      panelStackRef.current.pop();
      const prevState = panelStackRef.current[panelStackRef.current.length - 1];
      
      if (prevState.type === 'parent') {
        setActiveParentCategory(prevState.id);
        setActiveCategory(null);
      } else if (prevState.type === 'category') {
        setActiveCategory(prevState.category);
        setActiveParentCategory(prevState.parentId);
      }
    } else {
      setActiveParentCategory(null);
      setActiveCategory(null);
      setHoveredCategory(null);
    }
  };

  // Manejar clic en categoría padre
  const handleParentCategoryClick = (parentId) => {
    panelStackRef.current.push({ type: 'parent', id: parentId });
    setActiveParentCategory(parentId);
    setActiveCategory(null);
    setHoveredCategory(null);
  };

  // Manejar clic en categoría principal
  const handleCategoryClick = (category) => {
    if (category.subcategorias.length > 0) {
      panelStackRef.current.push({ 
        type: 'category', 
        category, 
        parentId: activeParentCategory 
      });
      setActiveCategory(activeCategory?.id === category.id ? null : category);
    } else {
      navigate(category.ruta);
      onClose();
    }
  };

  // Manejar clic en subcategoría
  const handleSubcategoryClick = (categoryName, subcategoryName) => {
    navigate(`/products?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`);
    onClose();
  };

  // Manejar hover en categorías (solo desktop)
  const handleCategoryHover = (categoryId) => {
    if (!isMobile) {
      setHoveredCategory(categoryId);
      Object.values(categoriasEstructuradas).forEach(parent => {
        const category = parent.categorias.find(c => c.id === categoryId);
        if (category && category.subcategorias.length > 0) {
          setActiveCategory(category);
        }
      });
    }
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && 
          !dropdownRef.current.contains(event.target) &&
          !event.target.closest('.categories-button-header')) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Resetear estados cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setActiveParentCategory(null);
      setActiveCategory(null);
      setHoveredCategory(null);
      panelStackRef.current = [];
    }
  }, [isOpen]);

  // Determinar qué panel mostrar en móvil
  const renderMobilePanels = () => {
    const isParentView = !activeParentCategory;
    const isCategoryView = activeParentCategory && !activeCategory;
    const isSubcategoryView = activeCategory && activeCategory.subcategorias.length > 0;

    return (
      <>
        {/* Header móvil */}
        <div className="mobile-header">
          {isCategoryView && (
            <button className="mobile-back-btn" onClick={handleBack}>
              ← Categorías
            </button>
          )}
          {isSubcategoryView && (
            <button className="mobile-back-btn" onClick={handleBack}>
              ← {categoriasEstructuradas[activeParentCategory]?.nombre}
            </button>
          )}
          {isParentView && (
            <h4 className="mobile-title">Todas las categorías</h4>
          )}
          <button className="mobile-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Contenido según la vista */}
        <div className="mobile-content">
          {isParentView && (
            <div className="mobile-parents-grid">
              {categoriasPadre.map(parent => {
                const categoriaData = categoriasEstructuradas[parent.id];
                const categoriasCount = categoriaData?.categorias?.length || 0;

                return (
                  <button
                    key={parent.id}
                    className="mobile-parent-card"
                    onClick={() => handleParentCategoryClick(parent.id)}
                  >
                    <div className="mobile-parent-icon">{parent.icon}</div>
                    <div className="mobile-parent-name">{parent.nombre}</div>
                    {categoriasCount > 0 && (
                      <div className="mobile-parent-count">{categoriasCount}</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {isCategoryView && activeParentCategory && categoriasEstructuradas[activeParentCategory] && (
            <div className="mobile-categories-list">
              <h5 className="mobile-section-title">
                {categoriasEstructuradas[activeParentCategory].nombre}
              </h5>
              {categoriasEstructuradas[activeParentCategory].categorias.map(categoria => (
                <button
                  key={categoria.id}
                  className="mobile-category-item"
                  onClick={() => handleCategoryClick(categoria)}
                >
                  <span className="mobile-category-name">{categoria.nombre}</span>
                  <div className="mobile-category-info">
                    <span className="mobile-product-count">{categoria.productosCount} productos</span>
                    {categoria.subcategorias.length > 0 && (
                      <span className="mobile-arrow">›</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {isSubcategoryView && activeCategory && (
            <div className="mobile-subcategories-list">
              <h5 className="mobile-section-title">{activeCategory.nombre}</h5>
              {activeCategory.subcategorias.map((subcategoria, index) => (
                <button
                  key={index}
                  className="mobile-subcategory-item"
                  onClick={() => handleSubcategoryClick(activeCategory.nombre, subcategoria)}
                >
                  {subcategoria}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer móvil */}
        <div className="mobile-footer">
          <button
            className="mobile-view-all-btn"
            onClick={() => {
              navigate('/products');
              onClose();
            }}
          >
            Ver todos los productos
          </button>
        </div>
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="categories-dropdown-container" ref={dropdownRef}>
      {isMobile ? (
        <div className="mobile-dropdown">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Cargando categorías...</p>
            </div>
          ) : (
            renderMobilePanels()
          )}
        </div>
      ) : (
        <div className="desktop-dropdown">
          {/* Panel izquierdo - Categorías padre */}
          <div className="desktop-parent-panel">
            <div className="desktop-panel-header">
              <h4>Todas las categorías</h4>
            </div>
            
            <div className="desktop-parents-list">
              {categoriasPadre.map(parent => {
                const isActive = activeParentCategory === parent.id;
                const categoriaData = categoriasEstructuradas[parent.id];
                const categoriasCount = categoriaData?.categorias?.length || 0;

                return (
                  <div
                    key={parent.id}
                    className={`desktop-parent-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleParentCategoryClick(parent.id)}
                    onMouseEnter={() => !isActive && handleCategoryHover(null)}
                  >
                    <div className="desktop-parent-content">
                      <span className="desktop-parent-icon">{parent.icon}</span>
                      <span className="desktop-parent-name">{parent.nombre}</span>
                      {categoriasCount > 0 && (
                        <span className="desktop-parent-count">
                          {categoriasCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel central - Categorías principales */}
          <div className="desktop-categories-panel">
            <div className="desktop-panel-header">
              {activeParentCategory && categoriasEstructuradas[activeParentCategory] ? (
                <>
                  <h4>{categoriasEstructuradas[activeParentCategory].nombre}</h4>
                  <span className="desktop-categories-count">
                    {categoriasEstructuradas[activeParentCategory].categorias.length} categorías
                  </span>
                </>
              ) : (
                <>
                  <h4>Selecciona una categoría</h4>
                  <p className="desktop-help-text">
                    Selecciona una categoría del panel izquierdo para ver sus productos
                  </p>
                </>
              )}
            </div>
            
            {activeParentCategory && categoriasEstructuradas[activeParentCategory] && (
              <div className="desktop-categories-list">
                {categoriasEstructuradas[activeParentCategory].categorias.map(categoria => {
                  const hasSubcategories = categoria.subcategorias.length > 0;
                  const isActive = activeCategory?.id === categoria.id;
                  const isHovered = hoveredCategory === categoria.id;

                  return (
                    <div
                      key={categoria.id}
                      className={`desktop-category-item ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                      onMouseEnter={() => handleCategoryHover(categoria.id)}
                      onClick={() => handleCategoryClick(categoria)}
                    >
                      <div className="desktop-category-content">
                        <span className="desktop-category-name">{categoria.nombre}</span>
                        <div className="desktop-category-info">
                          <span className="desktop-product-count">
                            {categoria.productosCount} productos
                          </span>
                          {hasSubcategories && (
                            <span className="desktop-arrow">›</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel derecho - Subcategorías */}
          <div className="desktop-subcategories-panel">
            {activeCategory && activeCategory.subcategorias.length > 0 ? (
              <>
                <div className="desktop-panel-header">
                  <h4>{activeCategory.nombre}</h4>
                  <span className="desktop-subcategories-count">
                    {activeCategory.subcategorias.length} subcategorías
                  </span>
                </div>
                
                <div className="desktop-subcategories-grid">
                  {activeCategory.subcategorias.map((subcategoria, index) => (
                    <button
                      key={index}
                      className="desktop-subcategory-card"
                      onClick={() => handleSubcategoryClick(activeCategory.nombre, subcategoria)}
                    >
                      <span className="desktop-subcategory-name">{subcategoria}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="desktop-empty-subcategories">
                <div className="desktop-placeholder-icon">📁</div>
                <h4>Subcategorías</h4>
                <p>Selecciona una categoría con subcategorías para verlas aquí</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesDropdown;