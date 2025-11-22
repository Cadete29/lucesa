import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch debe usarse dentro de un SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (term) => {
    setSearchTerm(term);
    
    // Navegar a la página de productos si no estamos allí
    if (window.location.pathname !== '/products') {
      navigate('/products');
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const value = {
    searchTerm,
    setSearchTerm,
    handleSearch,
    clearSearch
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};