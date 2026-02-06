import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * SEARCH CONTEXT
 * 
 * Contexto de React para la gestión global del estado de búsqueda.
 * Proporciona un estado compartido para el término de búsqueda actual
 * y funcionalidades de navegación relacionadas con la búsqueda.
 * 
 * Características principales:
 * - Estado global del término de búsqueda
 * - Navegación automática a página de productos al buscar
 * - Limpieza sencilla del estado de búsqueda
 * - Integración con React Router para navegación
 * 
 * @module SearchContext
 */

/**
 * Crea el contexto de búsqueda
 * @constant {React.Context} SearchContext - Contexto para gestión de búsqueda
 */
const SearchContext = createContext();

/**
 * Hook personalizado para acceder al contexto de búsqueda
 * 
 * @function useSearch
 * @returns {Object} Contexto de búsqueda con estado y métodos
 * @throws {Error} Si se usa fuera de un SearchProvider
 * @example
 * // Uso en componentes
 * const { searchTerm, handleSearch } = useSearch();
 * 
 * // En un componente de búsqueda
 * <input 
 *   value={searchTerm}
 *   onChange={(e) => handleSearch(e.target.value)}
 *   placeholder="Buscar productos..."
 * />
 */
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch debe usarse dentro de un SearchProvider');
  }
  return context;
};

/**
 * Proveedor del contexto de búsqueda
 * 
 * @component SearchProvider
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos que tendrán acceso al contexto
 * @returns {JSX.Element} Proveedor del contexto de búsqueda
 * 
 * @description
 * Este componente provee:
 * 1. Estado global del término de búsqueda actual
 * 2. Función para ejecutar búsquedas con navegación automática
 * 3. Función para limpiar el término de búsqueda
 * 
 * @example
 * // Uso en App.jsx o index.jsx
 * <SearchProvider>
 *   <App />
 * </SearchProvider>
 */
export const SearchProvider = ({ children }) => {
  // ==========================================================================
  // ESTADOS DEL PROVIDER
  // ==========================================================================
  
  /**
   * @state {string} searchTerm - Término de búsqueda actual
   * @default '' - Cadena vacía inicialmente
   */
  const [searchTerm, setSearchTerm] = useState('');
  
  // ==========================================================================
  // HOOKS DE ROUTER
  // ==========================================================================
  
  /**
   * Hook de navegación de React Router
   * @const {function} navigate - Función para cambiar de ruta programáticamente
   */
  const navigate = useNavigate();

  // ==========================================================================
  // FUNCIONES DEL CONTEXTO
  // ==========================================================================
  
  /**
   * Maneja una nueva búsqueda:
   * 1. Actualiza el término de búsqueda en el estado
   * 2. Navega a la página de productos si no estamos ya allí
   * 
   * @function handleSearch
   * @param {string} term - Término de búsqueda ingresado por el usuario
   * 
   * @example
   * // En un componente de búsqueda
   * <input onChange={(e) => handleSearch(e.target.value)} />
   * 
   * @description
   * Esta función es típicamente llamada desde:
   * - Input de búsqueda en el header
   * - Botones de búsqueda rápida
   * - Historial de búsquedas
   */
  const handleSearch = (term) => {
    // Actualizar el término de búsqueda en el estado
    setSearchTerm(term);
    
    // Navegar a la página de productos si no estamos allí
    // Esto asegura que la búsqueda se realice en la página correcta
    if (window.location.pathname !== '/products') {
      navigate('/products');
    }
    
    // Nota: La lógica de filtrado real se maneja en el componente Products
    // que accede a searchTerm a través del contexto
  };

  /**
   * Limpia el término de búsqueda actual
   * 
   * @function clearSearch
   * 
   * @example
   * // En un botón de limpiar búsqueda
   * <button onClick={clearSearch}>Limpiar</button>
   * 
   * @description
   * Esta función es útil para:
   * - Botones de "X" en inputs de búsqueda
   * - Limpiar filtros después de una búsqueda
   * - Resetear el estado al cambiar de sección
   */
  const clearSearch = () => {
    setSearchTerm('');
  };

  // ==========================================================================
  // VALOR DEL CONTEXTO
  // ==========================================================================
  
  /**
   * Valor del contexto que se provee a los componentes hijos
   * @type {Object}
   * @property {string} searchTerm - Término de búsqueda actual
   * @property {Function} setSearchTerm - Función para actualizar searchTerm directamente
   * @property {Function} handleSearch - Función para ejecutar búsqueda con navegación
   * @property {Function} clearSearch - Función para limpiar el término de búsqueda
   */
  const value = {
    searchTerm,
    setSearchTerm, // Expuesto para casos especiales que requieran control directo
    handleSearch,
    clearSearch
  };

  // ==========================================================================
  // RENDERIZADO DEL PROVIDER
  // ==========================================================================
  
  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

/**
 * @exports
 * @property {React.Context} SearchContext - Contexto de búsqueda
 * @property {Function} useSearch - Hook para acceder al contexto
 * @property {Component} SearchProvider - Proveedor del contexto
 */
export default SearchContext;