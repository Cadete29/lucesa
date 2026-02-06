// components/SidebarCategories/SidebarCategories.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  useCategoriasDinamicas, 
  useProductosUnificados  // ✅ CAMBIADO: usar productos unificados (con existencia)
} from '../../api/productosHooks';
import { useCart } from '../../context/CartContext';
import './SidebarCategories.css';

const SidebarCategories = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCartOpen } = useCart();
  
  const [activeParentId, setActiveParentId] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  
  const leaveTimeoutRef = useRef(null);
  const sidebarRef = useRef(null);

  const { data: categoriasResponse, loading } = useCategoriasDinamicas({
    ordenar: 'alfabetico',
    minProductos: 1
  });
  
  // ✅ CAMBIADO: Usar productos unificados (solo con existencia)
  const { data: productosResponse } = useProductosUnificados({ 
    page: 1, 
    limit: 20000 
  });

  // ========== CONFIGURACIÓN DE VISIBILIDAD ==========
  const hiddenRoutes = useMemo(() => [
    '/checkout',
    '/login',
    '/register',
    '/profile',
    '/admin',
    '/cart',
    '/payment',
    '/success',
    '/failure',
    '/forgot-password',
    '/reset-password',
    '/order-confirmation',
    '/invoice',
    '/receipt',
    '/my-account',
    '/faq',
    '/privacy-policy',
    '/terms-of-service',
    '/cookie-policy'
  ], []);

  const collapsedRoutes = useMemo(() => [
    '/dashboard',
    '/analytics',
    '/settings',
    '/account',
    '/billing',
    '/notifications'
  ], []);

  const shouldHideSidebar = useMemo(() => {
    return hiddenRoutes.some(route => 
      location.pathname.startsWith(route)
    );
  }, [location.pathname, hiddenRoutes]);

  const shouldCollapseSidebar = useMemo(() => {
    return collapsedRoutes.some(route => 
      location.pathname.startsWith(route)
    );
  }, [location.pathname, collapsedRoutes]);

  // Efecto para manejar visibilidad según la ruta
  useEffect(() => {
    if (shouldHideSidebar) {
      closeAllPanels();
    } else if (shouldCollapseSidebar) {
      setIsExpanded(false);
      closeAllPanels();
    } else {
      setIsExpanded(true);
    }
  }, [location.pathname, shouldHideSidebar, shouldCollapseSidebar]);

  // DESACTIVAR SIDEBAR CUANDO EL CARRITO ESTÁ ABIERTO
  useEffect(() => {
    if (isCartOpen) {
      closeAllPanels();
    }
  }, [isCartOpen]);

  const categoriasPadre = useMemo(() => [
    { id: 'computacion', nombre: 'Computación', icon: '' },
    { id: 'electronica', nombre: 'Electrónica', icon: '' },
    { id: 'redes', nombre: 'Redes y Comunicaciones', icon: '' },
    { id: 'almacenamiento', nombre: 'Almacenamiento', icon: '' },
    { id: 'impresion', nombre: 'Impresión', icon: '' },
    { id: 'seguridad', nombre: 'Seguridad', icon: '' },
    { id: 'audio-video', nombre: 'Audio y Video', icon: '' },
    { id: 'energia', nombre: 'Energía y Respaldo', icon: '' },
    { id: 'oficina', nombre: 'Oficina', icon: '' },
    { id: 'gaming', nombre: 'Gaming', icon: '' },
    { id: 'apple', nombre: 'Apple', icon: '' },
    { id: 'domotica', nombre: 'Domótica', icon: '' },
    { id: 'pos', nombre: 'Sistemas POS', icon: '' },
    { id: 'servidores', nombre: 'Servidores y Datacenter', icon: '' },
    { id: 'accesorios', nombre: 'Accesorios', icon: '' }
  ], []);

  const categoriasEstructuradas = useMemo(() => {
    if (!categoriasResponse?.data || !productosResponse?.data) return {};

    // ✅ TODOS los productos ya tienen existencia (porque usamos useProductosUnificados)
    const productosConExistencia = productosResponse.data;

    console.log('📊 Productos con existencia para sidebar:', productosConExistencia.length);

    const categoriasDetalladas = categoriasResponse.data
      .map(categoria => {
        // Filtrar productos por categoría
        const productosEnCategoria = productosConExistencia.filter(
          p => p.categoria && p.categoria.trim() === categoria.nombre.trim()
        );

        // Si no hay productos en esta categoría, no mostrar
        if (productosEnCategoria.length === 0) {
          return null;
        }

        const subcategoriasSet = new Set();
        productosEnCategoria.forEach(p => {
          if (p.subcategoria && typeof p.subcategoria === 'string') {
            const subcat = p.subcategoria.trim();
            if (subcat && subcat !== 'N/A' && subcat !== 'null' && subcat !== '') {
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
          productosCount: productosEnCategoria.length, // Ya son solo productos con existencia
          ruta: `/products?category=${encodeURIComponent(categoria.nombre)}`,
          hasManySubcategories: subcategorias.length > 5
        };
      })
      .filter(categoria => categoria !== null) // Eliminar categorías sin productos
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));

    console.log('📊 Categorías con productos:', categoriasDetalladas.length);

    const asignarAPadre = (categoria) => {
      const nombreLower = categoria.nombre.toLowerCase();
      
      if (nombreLower.includes('apple')) return 'apple';
      if (nombreLower.includes('gaming')) return 'gaming';
      
      if (nombreLower.includes('accesorio') || 
          nombreLower.includes('fundas') || 
          nombreLower.includes('carcasas') ||
          nombreLower.includes('estuches') ||
          nombreLower.includes('protectores')) {
        return 'accesorios';
      }
      
      if (nombreLower.includes('seguridad') || 
          nombreLower.includes('vigilancia') || 
          nombreLower.includes('cámaras de seguridad') ||
          nombreLower.includes('sistema de seguridad')) {
        return 'seguridad';
      }
      
      if (nombreLower.includes('audio') || 
          nombreLower.includes('video') || 
          nombreLower.includes('parlante') ||
          nombreLower.includes('altavoz') ||
          nombreLower.includes('micrófono') ||
          nombreLower.includes('auricular')) {
        return 'audio-video';
      }
      
      if (nombreLower.includes('energía') || 
          nombreLower.includes('energia') || 
          nombreLower.includes('batería') ||
          nombreLower.includes('respaldo') || 
          nombreLower.includes('ups') ||
          nombreLower.includes('regulador')) {
        return 'energia';
      }
      
      if (nombreLower.includes('oficina') || 
          nombreLower.includes('papelería') || 
          nombreLower.includes('papeleria') || 
          nombreLower.includes('escritorio')) {
        return 'oficina';
      }
      
      if (nombreLower.includes('computador') || 
          nombreLower.includes('pc ') || 
          nombreLower.includes('workstation') || 
          nombreLower.includes('laptop') || 
          nombreLower.includes('portátil') ||
          nombreLower.includes('tablet')) {
        return 'computacion';
      }
      
      if (nombreLower.includes('almacenamiento') || 
          nombreLower.includes('disco') || 
          nombreLower.includes('ssd') || 
          nombreLower.includes('hdd')) {
        return 'almacenamiento';
      }
      
      if (nombreLower.includes('impresión') || 
          nombreLower.includes('impresion') ||
          nombreLower.includes('impresora') ||
          nombreLower.includes('multifuncional')) {
        return 'impresion';
      }
      
      if (nombreLower.includes('red') || 
          nombreLower.includes('conmutador') || 
          nombreLower.includes('telefon') || 
          nombreLower.includes('router') || 
          nombreLower.includes('switch')) {
        return 'redes';
      }
      
      if (nombreLower.includes('electrónica') || 
          nombreLower.includes('electronica') || 
          nombreLower.includes('tarjeta') || 
          nombreLower.includes('componente')) {
        return 'electronica';
      }
      
      if (nombreLower.includes('domotica') || 
          nombreLower.includes('domótica') || 
          nombreLower.includes('hogar inteligente')) {
        return 'domotica';
      }
      
      if (nombreLower.includes('pos') || 
          nombreLower.includes('consumible') || 
          nombreLower.includes('terminal')) {
        return 'pos';
      }
      
      if (nombreLower.includes('servidor') || 
          nombreLower.includes('datacenter') || 
          nombreLower.includes('centro de datos')) {
        return 'servidores';
      }
      
      return 'accesorios';
    };

    const categoriasPorPadre = {};
    categoriasPadre.forEach(padre => {
      categoriasPorPadre[padre.id] = {
        ...padre,
        categorias: []
      };
    });

    categoriasDetalladas.forEach(categoria => {
      const padreId = asignarAPadre(categoria);
      if (categoriasPorPadre[padreId]) {
        categoriasPorPadre[padreId].categorias.push(categoria);
      }
    });

    Object.keys(categoriasPorPadre).forEach(padreId => {
      categoriasPorPadre[padreId].categorias.sort((a, b) => 
        a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
      );
      
      // Calcular total de productos en este padre
      const totalProductos = categoriasPorPadre[padreId].categorias.reduce(
        (sum, cat) => sum + (cat.productosCount || 0), 0
      );
      categoriasPorPadre[padreId].productosCount = totalProductos;
      
      categoriasPorPadre[padreId].hasManyChildren = categoriasPorPadre[padreId].categorias.length > 5;
    });

    console.log('📊 Categorías por padre:', Object.keys(categoriasPorPadre).length);

    return categoriasPorPadre;
  }, [categoriasResponse, productosResponse, categoriasPadre]);

  // ✅ FUNCIÓN SIMPLIFICADA: Todos los productos ya tienen existencia
  const calcularProductosPorSubcategoria = useCallback((categoriaNombre, subcategoriaNombre) => {
  if (!productosResponse?.data) return 0;
  
  const productosFiltrados = productosResponse.data.filter(p => {
    // Verificar coincidencia de categoría y subcategoría
    const categoriaCoincide = p.categoria && 
      p.categoria.trim().toLowerCase() === categoriaNombre.trim().toLowerCase();
    
    const subcategoriaCoincide = p.subcategoria && 
      p.subcategoria.trim().toLowerCase() === subcategoriaNombre.trim().toLowerCase();
    
    return categoriaCoincide && subcategoriaCoincide;
  });
  
  console.log('🔍 DEBUG - Sidebar: calcularProductosPorSubcategoria', {
    categoriaNombre,
    subcategoriaNombre,
    totalProductos: productosResponse.data.length,
    productosFiltradosCount: productosFiltrados.length,
    productosFiltrados: productosFiltrados.map(p => ({
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      subcategoria: p.subcategoria,
      existencia: p.existencia
    }))
  });
  
  return productosFiltrados.length;
}, [productosResponse]);

  const getParentStairPosition = useCallback((parentIndex) => {
    if (parentIndex < 5) return 'down';
    if (parentIndex >= 5 && parentIndex < 10) return 'center';
    return 'up';
  }, []);

  const getChildStairPosition = useCallback((parentIndex) => {
    if (parentIndex < 5) return 'down';
    if (parentIndex >= 5 && parentIndex < 10) return 'center';
    return 'up';
  }, []);

  // POSICIONAR PANEL DE SUBCATEGORÍAS
  const positionSubcategoryPanel = useCallback(() => {
    if (!activeCategoryId || isCartOpen) return;
    
    const categoryItem = document.querySelector(`.sidebar-child-item.hovered[data-category-id="${activeCategoryId}"]`);
    const subPanel = document.querySelector(`.sidebar-subcategories-panel[data-category-id="${activeCategoryId}"]`);
    
    if (!categoryItem || !subPanel) return;
    
    const stairPosition = categoryItem.getAttribute('data-stair-position');
    const categoryRect = categoryItem.getBoundingClientRect();
    const childrenPanel = document.querySelector('.sidebar-parent-item.hovered .sidebar-children-panel');
    
    if (!childrenPanel) return;
    
    const childrenPanelRect = childrenPanel.getBoundingClientRect();
    
    const leftPosition = childrenPanelRect.right;
    let topPosition = categoryRect.top;
    const panelHeight = subPanel.offsetHeight || 300;
    const viewportHeight = window.innerHeight;
    
    if (stairPosition === 'center') {
      const itemCenter = categoryRect.top + (categoryRect.height / 2);
      topPosition = itemCenter - (panelHeight / 2);
    } else if (stairPosition === 'up') {
      topPosition = categoryRect.bottom - panelHeight;
    }
    
    const minTop = 80;
    const maxTop = viewportHeight - panelHeight - 20;
    
    if (topPosition < minTop) {
      topPosition = minTop;
    } else if (topPosition > maxTop) {
      topPosition = maxTop;
    }
    
    subPanel.style.left = `${leftPosition}px`;
    subPanel.style.top = `${topPosition}px`;
    
  }, [activeCategoryId, isCartOpen]);

  // FUNCIONES DE HOVER OPTIMIZADAS
  const handleParentEnter = useCallback((parentId, parentIndex) => {
    if (shouldHideSidebar || shouldCollapseSidebar || isCartOpen) return;
    
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    setActiveParentId(parentId);
    setActiveCategoryId(null);
  }, [shouldHideSidebar, shouldCollapseSidebar, isCartOpen]);

  const handleParentLeave = useCallback(() => {
    if (shouldHideSidebar || shouldCollapseSidebar || isCartOpen) return;
    
    leaveTimeoutRef.current = setTimeout(() => {
      const isOverPanel = document.querySelector('.sidebar-children-panel:hover');
      const isOverSubPanel = document.querySelector('.sidebar-subcategories-panel:hover');
      
      if (!isOverPanel && !isOverSubPanel) {
        setActiveParentId(null);
        setActiveCategoryId(null);
      }
    }, 150);
  }, [shouldHideSidebar, shouldCollapseSidebar, isCartOpen]);

  const handleCategoryEnter = useCallback((categoryId, parentId) => {
    if (shouldHideSidebar || shouldCollapseSidebar || isCartOpen) return;
    
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    setActiveCategoryId(categoryId);
    
    if (parentId && parentId !== activeParentId) {
      setActiveParentId(parentId);
    }
  }, [activeParentId, shouldHideSidebar, shouldCollapseSidebar, isCartOpen]);

  const handleCategoryLeave = useCallback(() => {
    if (shouldHideSidebar || shouldCollapseSidebar || isCartOpen) return;
    
    leaveTimeoutRef.current = setTimeout(() => {
      const isOverSubPanel = document.querySelector('.sidebar-subcategories-panel:hover');
      const isOverChildItem = document.querySelector('.sidebar-child-item.hovered');
      
      if (!isOverSubPanel && !isOverChildItem) {
        setActiveCategoryId(null);
      }
    }, 150);
  }, [shouldHideSidebar, shouldCollapseSidebar, isCartOpen]);

  // MANEJAR HOVER DEL PANEL DE HIJOS
  const handleChildrenPanelMouseEnter = useCallback(() => {
    if (shouldHideSidebar || shouldCollapseSidebar || isCartOpen) return;
    
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }, [shouldHideSidebar, shouldCollapseSidebar, isCartOpen]);

  const handleChildrenPanelMouseLeave = useCallback(() => {
    if (shouldHideSidebar || shouldCollapseSidebar || isCartOpen) return;
    
    leaveTimeoutRef.current = setTimeout(() => {
      const isOverAnyPanel = 
        document.querySelector('.sidebar-children-panel:hover') ||
        document.querySelector('.sidebar-subcategories-panel:hover');
      
      if (!isOverAnyPanel) {
        setActiveParentId(null);
        setActiveCategoryId(null);
      }
    }, 150);
  }, [shouldHideSidebar, shouldCollapseSidebar, isCartOpen]);

  // MANEJAR HOVER DEL PANEL DE SUBCATEGORÍAS
  const handleSubcategoryPanelMouseEnter = useCallback(() => {
    if (shouldHideSidebar || shouldCollapseSidebar || isCartOpen) return;
    
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }, [shouldHideSidebar, shouldCollapseSidebar, isCartOpen]);

  const handleSubcategoryPanelMouseLeave = useCallback(() => {
    if (shouldHideSidebar || shouldCollapseSidebar || isCartOpen) return;
    
    leaveTimeoutRef.current = setTimeout(() => {
      const isOverChildPanel = document.querySelector('.sidebar-children-panel:hover');
      const isOverChildItem = document.querySelector('.sidebar-child-item.hovered');
      
      if (!isOverChildPanel && !isOverChildItem) {
        setActiveCategoryId(null);
      }
    }, 150);
  }, [shouldHideSidebar, shouldCollapseSidebar, isCartOpen]);

  const handleParentClick = useCallback((parentId, e) => {
    if (e) e.stopPropagation();
    
    if (shouldHideSidebar || shouldCollapseSidebar || isCartOpen) return;
    
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    setActiveParentId(activeParentId === parentId ? null : parentId);
    setActiveCategoryId(null);
  }, [activeParentId, shouldHideSidebar, shouldCollapseSidebar, isCartOpen]);

  const handleCategoryClick = useCallback((category, parentIndex, e) => {
    if (e) e.stopPropagation();
    
    if (shouldHideSidebar || shouldCollapseSidebar || isCartOpen) return;
    
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    if (category.subcategorias.length > 0) {
      setActiveCategoryId(category.id);
      
      requestAnimationFrame(() => {
        positionSubcategoryPanel();
      });
    } else {
      navigate(category.ruta);
      setActiveParentId(null);
      setActiveCategoryId(null);
    }
  }, [navigate, positionSubcategoryPanel, shouldHideSidebar, shouldCollapseSidebar, isCartOpen]);

  const handleSubcategoryClick = useCallback((categoryName, subcategoryName, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (shouldHideSidebar || shouldCollapseSidebar || isCartOpen) return;
    
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    navigate(`/products?category=${encodeURIComponent(categoryName)}&subcategory=${encodeURIComponent(subcategoryName)}`);
    setActiveParentId(null);
    setActiveCategoryId(null);
  }, [navigate, shouldHideSidebar, shouldCollapseSidebar, isCartOpen]);

  const closeAllPanels = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    setActiveParentId(null);
    setActiveCategoryId(null);
  }, []);

  // LIMPIAR TIMEOUTS
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  // CERRAR PANELES AL CAMBIAR DE RUTA
  useEffect(() => {
    closeAllPanels();
  }, [location.pathname, closeAllPanels]);

  // ACTUALIZAR POSICIÓN DEL PANEL
  useEffect(() => {
    if (!activeCategoryId || shouldHideSidebar || shouldCollapseSidebar || isCartOpen) return;
    
    const updatePosition = () => {
      positionSubcategoryPanel();
    };
    
    updatePosition();
    
    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [activeCategoryId, positionSubcategoryPanel, shouldHideSidebar, shouldCollapseSidebar, isCartOpen]);

  // MANEJAR RESPONSIVE
  useEffect(() => {
    const handleResize = () => {
      if (shouldHideSidebar) return;
      
      if (window.innerWidth < 1024) {
        setIsExpanded(false);
      } else if (!shouldCollapseSidebar) {
        setIsExpanded(true);
      }
    };

    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [shouldHideSidebar, shouldCollapseSidebar]);

  // CERRAR AL HACER CLICK FUERA
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        const isOverSubPanel = document.querySelector('.sidebar-subcategories-panel:hover');
        const isOverChildPanel = document.querySelector('.sidebar-children-panel:hover');
        const isOverChildItem = document.querySelector('.sidebar-child-item:hover');
        
        if (!isOverSubPanel && !isOverChildPanel && !isOverChildItem) {
          closeAllPanels();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeAllPanels]);

  // ========== RENDER CONDICIONAL ==========
  if (shouldHideSidebar) {
    return null;
  }

  if (loading) {
    return (
      <div className={`sidebar-categories ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-loading">
          Cargando categorías...
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={sidebarRef}
        className={`sidebar-categories ${isExpanded ? 'expanded' : 'collapsed'} ${isCartOpen ? 'cart-open' : ''}`}
        data-cart-open={isCartOpen}
      >
        {isExpanded && (
          <div className="sidebar-content">
            <div className="sidebar-header">
              <h3>CATEGORÍAS</h3>
              {/* <div className="sidebar-header-subtitle">
                <small>Mostrando solo productos con stock</small>
              </div> */}
            </div>

            <div className="sidebar-parent-list">
              {categoriasPadre.map((parent, parentIndex) => {
                const isActive = activeParentId === parent.id;
                const categoriaData = categoriasEstructuradas[parent.id];
                const categoriasCount = categoriaData?.categorias?.length || 0;
                const productosCount = categoriaData?.productosCount || 0;
                const stairPosition = getParentStairPosition(parentIndex);
                const hasManyChildren = categoriaData?.hasManyChildren || false;

                // Si no hay categorías con productos, no mostrar el padre
                if (categoriasCount === 0) return null;

                return (
                  <div
                    key={parent.id}
                    className={`sidebar-parent-item ${isActive ? 'hovered' : ''} ${isCartOpen ? 'cart-open' : ''}`}
                    data-parent-id={parent.id}
                    data-parent-index={parentIndex}
                    data-stair-position={stairPosition}
                    onMouseEnter={() => handleParentEnter(parent.id, parentIndex)}
                    onMouseLeave={handleParentLeave}
                    onClick={(e) => handleParentClick(parent.id, e)}
                  >
                    <div className="sidebar-parent-content">
                      <span className="sidebar-parent-icon">{parent.icon}</span>
                      <span className="sidebar-parent-name">{parent.nombre}</span>
                      {productosCount > 0 && (
                        <span className="sidebar-parent-count">{productosCount}</span>
                      )}
                      {hasManyChildren && (
                        <span className="sidebar-many-categories-badge">+</span>
                      )}
                      <span className="sidebar-parent-arrow">›</span>
                    </div>

                    {isActive && categoriaData?.categorias && categoriaData.categorias.length > 0 && !isCartOpen ? (
                      <div 
                        className={`sidebar-children-panel ${hasManyChildren ? 'has-scroll' : ''}`}
                        data-stair-position={stairPosition}
                        onMouseEnter={handleChildrenPanelMouseEnter}
                        onMouseLeave={handleChildrenPanelMouseLeave}
                      >
                        <div className="sidebar-children-header">
                          <h4>{parent.nombre}</h4>
                          <div className="sidebar-children-stats">
                            <span className="stock-stats">
                              {productosCount} productos disponibles
                            </span>
                          </div>
                        </div>
                        
                        <div className={`sidebar-children-list ${hasManyChildren ? 'scrollable' : ''}`}>
                          {categoriaData.categorias.map((categoria, childIndex) => {
                            const hasSubcategories = categoria.subcategorias.length > 0;
                            const isCategoryActive = activeCategoryId === categoria.id;
                            const childStairPosition = getChildStairPosition(parentIndex);

                            return (
                              <div
                                key={categoria.id}
                                className={`sidebar-child-item ${isCategoryActive ? 'hovered' : ''} ${isCartOpen ? 'cart-open' : ''}`}
                                data-category-id={categoria.id}
                                data-parent-id={parent.id}
                                data-parent-index={parentIndex}
                                data-child-index={childIndex}
                                data-total-children={categoriaData.categorias.length}
                                data-stair-position={childStairPosition}
                                onMouseEnter={() => handleCategoryEnter(categoria.id, parent.id)}
                                onMouseLeave={handleCategoryLeave}
                                onClick={(e) => handleCategoryClick(categoria, parentIndex, e)}
                              >
                                <div className="sidebar-child-content">
                                  <span className="sidebar-child-name">
                                    {categoria.nombre}
                                  </span>
                                  <div className="sidebar-child-info">
                                    <span className="sidebar-child-count">
                                      ({categoria.productosCount})
                                    </span>
                                    {hasSubcategories && (
                                      <span className="sidebar-child-arrow">
                                        ›
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : isActive && categoriasCount === 0 && !isCartOpen ? (
                      <div 
                        className="sidebar-children-panel empty"
                        data-stair-position={stairPosition}
                        onMouseEnter={handleChildrenPanelMouseEnter}
                        onMouseLeave={handleChildrenPanelMouseLeave}
                      >
                        <div className="sidebar-children-header">
                          <h4>{parent.nombre}</h4>
                        </div>
                        <div className="sidebar-empty-message">
                          <p>No hay productos disponibles en esta sección.</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* PANEL DE SUBCATEGORÍAS SEPARADO - SOLO SI EL CARRITO NO ESTÁ ABIERTO */}
      {!isCartOpen && activeParentId && categoriasEstructuradas[activeParentId]?.categorias.map(categoria => {
        if (activeCategoryId !== categoria.id || categoria.subcategorias.length === 0) return null;
        
        const hasManySubcategories = categoria.hasManySubcategories;
        const parentIndex = categoriasPadre.findIndex(p => p.id === activeParentId);
        const stairPosition = getChildStairPosition(parentIndex);

        return (
          <div 
            key={`subpanel-${categoria.id}`}
            className={`sidebar-subcategories-panel active ${hasManySubcategories ? 'has-scroll' : ''}`}
            data-category-id={categoria.id}
            data-stair-position={stairPosition}
            onMouseEnter={handleSubcategoryPanelMouseEnter}
            onMouseLeave={handleSubcategoryPanelMouseLeave}
          >
            <div className="sidebar-subcategories-header">
              <h5>Subcategorías de {categoria.nombre}</h5>
              <div className="sidebar-subcategories-stats">
                <span className="subcategory-stats">
                  {categoria.productosCount} productos disponibles
                </span>
              </div>
              <button 
                className="sidebar-close-subcategories"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCategoryId(null);
                }}
              >
                ×
              </button>
            </div>
            <div className={`sidebar-subcategories-list ${hasManySubcategories ? 'scrollable' : ''}`}>
              {categoria.subcategorias.map((subcategoria, index) => {
                const productosEnSubcategoria = calcularProductosPorSubcategoria(categoria.nombre, subcategoria);
                
                // Solo mostrar subcategorías que tengan productos
                if (productosEnSubcategoria === 0) return null;
                
                return (
                  <button
                    key={index}
                    className="sidebar-subcategory-item"
                    onClick={(e) => handleSubcategoryClick(categoria.nombre, subcategoria, e)}
                  >
                    <div className="sidebar-subcategory-content">
                      <span className="sidebar-subcategory-name">
                        {subcategoria}
                      </span>
                      <div className="sidebar-subcategory-info">
                        <span className="sidebar-subcategory-count">
                          ({productosEnSubcategoria})
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default SidebarCategories;