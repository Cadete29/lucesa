// src/components/Layout/MainLayout.jsx
import React from 'react';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  return (
    <div className="main-layout-container">
      <div className="main-layout-content">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;