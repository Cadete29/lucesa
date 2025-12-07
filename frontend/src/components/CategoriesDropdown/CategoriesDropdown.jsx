// components/CategoriesDropdown/CategoriesDropdown.js
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategoriasDinamicas, useTodosProductos } from '../../api/productosHooks';
import './CategoriesDropdown.css';

const CategoriesDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const dropdownRef = useRef(null);
  
  // Obtener categorías y productos
  const { data: categoriasResponse, loading } = useCategoriasDinamicas({
    ordenar: 'alfabetico',
    minProductos: 1
  });
  
  const { data: productosResponse } = useTodosProductos({ page: 1, limit: 20000 });

  // Procesar categorías con subcategorías
  const categoriasConSubcategorias = useMemo(() => {
    if (!categoriasResponse?.data || !productosResponse?.data) return [];

    return categoriasResponse.data
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
  }, [categoriasResponse, productosResponse]);

  // Manejar clic en categoría principal
  const handleCategoryClick = (category) => {
    if (category.subcategorias.length > 0) {
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

  // Manejar hover en categorías
  const handleCategoryHover = (categoryId) => {
    setHoveredCategory(categoryId);
    const category = categoriasConSubcategorias.find(c => c.id === categoryId);
    if (category && category.subcategorias.length > 0) {
      setActiveCategory(category);
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
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Resetear estados cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setActiveCategory(null);
      setHoveredCategory(null);
    }
  }, [isOpen]);

  if (!isOpen || loading) return null;

  return (
    <div className="categories-dropdown-container" ref={dropdownRef}>
      <div className="categories-dropdown">
        {/* Panel izquierdo - Categorías principales */}
        <div className="categories-main-panel">
          <div className="categories-panel-header">
            <h4>Todas las Categorías</h4>
            <span className="categories-count">
              {categoriasConSubcategorias.length} categorías
            </span>
          </div>
          
          <div className="categories-list">
            {categoriasConSubcategorias.map(categoria => {
              const hasSubcategories = categoria.subcategorias.length > 0;
              const isActive = activeCategory?.id === categoria.id;
              const isHovered = hoveredCategory === categoria.id;

              return (
                <div
                  key={categoria.id}
                  className={`category-item ${isActive ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                  onMouseEnter={() => handleCategoryHover(categoria.id)}
                  onClick={() => handleCategoryClick(categoria)}
                >
                  <div className="category-content">
                    <span className="category-name">{categoria.nombre}</span>
                    <div className="category-info">
                      <span className="category-product-count">
                        {categoria.productosCount} productos
                      </span>
                      {hasSubcategories && (
                        <span className="category-arrow">▶</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón ver todos */}
          <div className="categories-all-button">
            <button
              className="view-all-products-btn"
              onClick={() => {
                navigate('/products');
                onClose();
              }}
            >
              Ver todos los productos →
            </button>
          </div>
        </div>

        {/* Panel derecho - Subcategorías (solo se muestra si hay una categoría activa con subcategorías) */}
        {activeCategory && activeCategory.subcategorias.length > 0 && (
          <div className="subcategories-panel">
            <div className="subcategories-panel-header">
              <h4>
                <span 
                  className="back-to-categories"
                  onClick={() => setActiveCategory(null)}
                >
                  ←
                </span>
                {activeCategory.nombre}
              </h4>
              <span className="subcategories-count">
                {activeCategory.subcategorias.length} subcategorías
              </span>
            </div>

            <div className="subcategories-list">
              {activeCategory.subcategorias.map((subcategoria, index) => (
                <button
                  key={index}
                  className="subcategory-item"
                  onClick={() => handleSubcategoryClick(activeCategory.nombre, subcategoria)}
                >
                  <span className="subcategory-name">{subcategoria}</span>
                  <span className="subcategory-arrow">→</span>
                </button>
              ))}
            </div>

            {/* Ver todos los productos de esta categoría */}
            <div className="view-category-all">
              <button
                className="view-category-all-btn"
                onClick={() => {
                  navigate(activeCategory.ruta);
                  onClose();
                }}
              >
                Ver todos los productos de {activeCategory.nombre} →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesDropdown;