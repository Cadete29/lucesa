// src/components/Header/Header.jsx

/**
 * Componente Header
 * 
 * Componente principal de navegación que incluye:
 * - Logo y navegación principal
 * - Barra de búsqueda
 * - Gestión de carrito
 * - Gestión de usuario (login/logout)
 * - Menús responsivos para móvil, tablet y desktop
 * - Dropdown de categorías
 * 
 * Responsabilidades:
 * 1. Proporcionar navegación principal de la aplicación
 * 2. Manejar la búsqueda de productos
 * 3. Mostrar el estado del carrito y favoritos
 * 4. Gestionar la autenticación del usuario
 * 5. Adaptar la interfaz según el tamaño de pantalla
 * 6. Coordinar la apertura/cierre de menús desplegables
 */

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSearch } from "../../context/SearchContext";
import { useFavorites } from "../../context/FavoritesContext";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import CartDropdown from "../CartDropdown/CartDropdown";
import CategoriesDropdown from "../CategoriesDropdown/CategoriesDropdown";
import "../Header/Header.css";

/**
 * Componente funcional Header
 * @returns {JSX.Element} Componente de encabezado renderizado
 */
const Header = () => {
    // ============================================
    // ESTADOS DEL COMPONENTE
    // ============================================
    
    /** @state {boolean} isMenuOpen - Controla visibilidad del menú móvil */
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    /** @state {boolean} isScrolled - Indica si la página ha sido desplazada */
    const [isScrolled, setIsScrolled] = useState(false);
    
    /** @state {string} localSearchTerm - Término de búsqueda local (no controlado por contexto) */
    const [localSearchTerm, setLocalSearchTerm] = useState("");
    
    /** @state {boolean} userMenuOpen - Controla visibilidad del menú de usuario */
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    
    /** @state {boolean} categoriesDropdownOpen - Controla visibilidad del dropdown de categorías */
    const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
    
    /** @state {boolean} isMobile - Indica si el viewport es móvil (≤ 768px) */
    const [isMobile, setIsMobile] = useState(false);
    
    /** @state {boolean} isTablet - Indica si el viewport es tablet (769px - 1024px) */
    const [isTablet, setIsTablet] = useState(false);
    
    // ============================================
    // CONTEXTOS
    // ============================================
    
    /** @context {Object} useSearch - Contexto para búsqueda de productos */
    const { handleSearch, searchTerm } = useSearch();
    
    /** @context {Object} useFavorites - Contexto para productos favoritos */
    const { favoritesCount } = useFavorites();
    
    /** @context {Object} useAuth - Contexto de autenticación */
    const { user, logout } = useAuth();
    
    /** @context {Object} useCart - Contexto del carrito de compras */
    const { getCartItemsCount, openCart, isCartOpen, closeCart } = useCart();
    
    /** @hook {Function} useNavigate - Hook para navegación programática */
    const navigate = useNavigate();

    // ============================================
    // EFECTOS
    // ============================================

    /**
     * Efecto: Detectar tamaño de pantalla
     * - Determina si el dispositivo es móvil (≤ 768px) o tablet (769px - 1024px)
     * - Escucha cambios en el tamaño de la ventana
     */
    useEffect(() => {
        const checkViewport = () => {
            const width = window.innerWidth;
            setIsMobile(width <= 768);
            setIsTablet(width > 768 && width <= 1024);
        };
        
        checkViewport();
        window.addEventListener('resize', checkViewport);
        return () => window.removeEventListener('resize', checkViewport);
    }, []);

    /**
     * Efecto: Manejar scroll de página
     * - Actualiza estado `isScrolled` cuando el usuario desplaza más de 50px
     * - Permite estilos diferentes para header con scroll
     */
    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 50;
            setIsScrolled(scrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    /**
     * Efecto: Sincronizar término de búsqueda local con contexto
     * - Mantiene el input de búsqueda sincronizado con el término global
     */
    useEffect(() => {
        setLocalSearchTerm(searchTerm);
    }, [searchTerm]);

    /**
     * Efecto: Cerrar menús al hacer clic fuera
     * - Maneja cierre del menú de usuario al hacer clic fuera
     * - Maneja cierre del dropdown de categorías en tablet/móvil
     */
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Cerrar menú de usuario
            if (userMenuOpen && !event.target.closest('.user-menu-hdr')) {
                setUserMenuOpen(false);
            }
            
            // Cerrar dropdown de categorías en tablet
            if (categoriesDropdownOpen && isTablet && 
                !event.target.closest('.categories-dropdown-container') && 
                !event.target.closest('.categories-button-header')) {
                setCategoriesDropdownOpen(false);
            }
            
            // Cerrar dropdown de categorías en móvil
            if (categoriesDropdownOpen && isMobile &&
                !event.target.closest('.categories-dropdown-global-container') &&
                !event.target.closest('.mobile-categories-button-hdr') &&
                !event.target.closest('.categories-button-header')) {
                setCategoriesDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [userMenuOpen, categoriesDropdownOpen, isMobile, isTablet]);

    /**
     * Efecto: Controlar scroll del body
     * - Previene scroll cuando algún menú está abierto
     * - Restaura scroll cuando todos los menús están cerrados
     */
    useEffect(() => {
        if (isMenuOpen || categoriesDropdownOpen || isCartOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen, categoriesDropdownOpen, isCartOpen]);

    /**
     * Efecto: Cerrar menú móvil en cambio de tamaño de pantalla
     * - Cierra menú móvil si se redimensiona a desktop
     * - Actualiza estados de detección de viewport
     */
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768 && isMenuOpen) {
                closeMobileMenu();
            }
            const width = window.innerWidth;
            setIsMobile(width <= 768);
            setIsTablet(width > 768 && width <= 1024);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMenuOpen]);

    // ============================================
    // MANEJADORES DE EVENTOS
    // ============================================

    /**
     * Alternar visibilidad del menú móvil
     */
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    /**
     * Alternar visibilidad del dropdown de categorías
     * - Cierra otros menús abiertos (excepto carrito)
     */
    const toggleCategoriesDropdown = () => {
        setCategoriesDropdownOpen(!categoriesDropdownOpen);
        if (isMenuOpen) setIsMenuOpen(false);
        if (userMenuOpen) setUserMenuOpen(false);
    };

    /**
     * Cerrar todos los menús excepto opcionalmente el carrito
     * @param {boolean} excludeCart - Si es true, no cierra el carrito
     */
    const closeOtherMenus = (excludeCart = false) => {
        setIsMenuOpen(false);
        setUserMenuOpen(false);
        setCategoriesDropdownOpen(false);
    };

    /**
     * Cerrar menú móvil
     */
    const closeMobileMenu = () => {
        setIsMenuOpen(false);
    };

    /**
     * Manejador para clics en navegación
     * - Cierra otros menús al navegar
     */
    const handleNavClick = () => {
        closeOtherMenus();
    };

    /**
     * Actualizar término de búsqueda local
     * @param {Event} e - Evento de cambio en input
     */
    const handleSearchInputChange = (e) => {
        setLocalSearchTerm(e.target.value);
    };

    /**
     * Enviar búsqueda de productos
     * @param {Event} e - Evento de submit del formulario
     */
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (localSearchTerm.trim()) {
            handleSearch(localSearchTerm.trim());
            closeOtherMenus();
            closeMobileMenu();
            navigate('/products');
        }
    };

    /**
     * Manejar tecla Enter en búsqueda
     * @param {Event} e - Evento de teclado
     */
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit(e);
        }
    };

    /**
     * Navegar a página de favoritos
     */
    const handleFavoritesClick = () => {
        navigate('/favorites');
        closeOtherMenus();
        closeMobileMenu();
    };

    /**
     * Alternar visibilidad del carrito
     * - Abre/cierra el carrito desplegable
     * - Cierra otros menús
     */
    const handleCartClick = () => {
        console.log('🛒 Header - Alternando carrito:', !isCartOpen);
        
        if (isCartOpen) {
            closeCart();
        } else {
            openCart();
        }
        
        closeOtherMenus();
        closeMobileMenu();
    };

    /**
     * Navegar a página de login
     */
    const handleLoginClick = () => {
        navigate('/login');
        closeOtherMenus();
        closeMobileMenu();
    };

    /**
     * Navegar a página de mi cuenta
     */
    const handleMyAccountClick = () => {
        navigate('/my-account');
        closeOtherMenus();
        closeMobileMenu();
    };

    /**
     * Cerrar sesión de usuario
     * - Ejecuta logout del contexto
     * - Cierra menús
     * - Redirige a página principal
     */
    const handleLogout = () => {
        logout();
        closeOtherMenus();
        closeMobileMenu();
        navigate('/');
    };

    // ============================================
    // VARIABLES DERIVADAS Y CONSTANTES
    // ============================================

    /**
     * Determinar si mostrar botón de categorías
     * @constant {boolean} shouldShowCategoriesButton
     * @description Solo se muestra en vista tablet
     */
    const shouldShowCategoriesButton = isTablet;

    /**
     * URL externa para "Quienes somos"
     * @constant {string} urlExterna
     */
    const urlExterna = "https://lucesademexico.com/";

    // ============================================
    // RENDERIZADO
    // ============================================

    return (
        <header className={`header-hdr ${isScrolled ? 'scrolled-hdr' : ''}`}>
            <div className="container-hdr">
                <div className="header-content-hdr">
                    
                    {/* LOGO */}
                    <div className="logo-hdr">
                        <Link to="/" onClick={handleNavClick}>
                            <img 
                                src="/LOGO_LUCESA.png" 
                                alt="Lucesa Ecommerce" 
                                className="logo-image-hdr"
                            />
                        </Link>
                    </div>

                    {/* CONTENEDOR PRINCIPAL DE NAVEGACIÓN */}
                    <div className="header-nav-main">
                        
                        {/* BOTÓN DE CATEGORÍAS - SOLO TABLET */}
                        {shouldShowCategoriesButton && (
                            <div className="categories-button-container-hdr">
                                <button 
                                    className={`categories-button-header ${categoriesDropdownOpen ? 'active' : ''}`}
                                    onClick={toggleCategoriesDropdown}
                                    aria-label="Ver categorías"
                                    title="Explorar categorías"
                                    data-categories-button="true"
                                >
                                    <svg className="categories-icon-header" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M8 6H21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M8 12H21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M8 18H21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M3 6H3.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M3 12H3.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M3 18H3.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span className="categories-button-text">Categorías</span>
                                    <span className="categories-button-arrow">
                                        {categoriesDropdownOpen ? '▲' : '▼'}
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* NAVEGACIÓN DESKTOP Y TABLET */}
                        <nav className="desktop-nav-hdr">
                            <ul className="nav-list-hdr">
                                <li>
                                    <Link to="/" className="nav-link-hdr" onClick={handleNavClick}>Inicio</Link>
                                </li>
                                <li>
                                    <Link to="/products" className="nav-link-hdr" onClick={handleNavClick}>Productos</Link>
                                </li>
                                <a href={urlExterna} className="nav-link-hdr">Quienes somos</a>
                            </ul>
                        </nav>
                    </div>

                    {/* ACCIONES (Búsqueda, Carrito, Usuario) */}
                    <div className="header-actions-hdr">
                        {/* BARRA DE BÚSQUEDA */}
                        <form className="search-bar-hdr" onSubmit={handleSearchSubmit}>
                            <input 
                                type="text" 
                                placeholder="Buscar productos..." 
                                className="search-input-hdr"
                                value={localSearchTerm}
                                onChange={handleSearchInputChange}
                                onKeyPress={handleKeyPress}
                            />
                            <button type="submit" className="search-btn-hdr" aria-label="Buscar">
                                <svg className="search-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="11" cy="11" r="7" strokeWidth="2"/>
                                    <path d="M20 20L17 17" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </form>
                        
                        {/* ICONOS DE ACCIÓN */}
                        <div className="header-icons-hdr">
                            {/* BOTÓN DEL CARRITO */}
                            <button 
                                onClick={handleCartClick} 
                                className="icon-btn-hdr cart-btn-hdr" 
                                title="Carrito"
                                data-cart-button="true"
                            >
                                <svg className="cart-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {getCartItemsCount() > 0 && (
                                    <span className="cart-count-hdr">{getCartItemsCount()}</span>
                                )}
                            </button>

                            {/* MENÚ DE USUARIO O BOTÓN DE LOGIN */}
                            {user ? (
                                <div className="user-menu-hdr">
                                    <button 
                                        className="icon-btn-hdr user-btn-hdr"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUserMenuOpen(!userMenuOpen);
                                        }}
                                        title="Mi Cuenta"
                                    >
                                        <svg className="user-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                    
                                    {/* DROPDOWN DE USUARIO */}
                                    {userMenuOpen && (
                                        <div className="user-dropdown-hdr">
                                            <div className="user-info-hdr">
                                                <strong>{user.nombre || user.username}</strong>
                                                <span>{user.email}</span>
                                            </div>
                                            <button 
                                                onClick={handleMyAccountClick} 
                                                className="dropdown-item-hdr"
                                            >
                                                <svg className="dropdown-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                Mi Cuenta
                                            </button>
                                            <div className="dropdown-divider-hdr"></div>
                                            <button onClick={handleLogout} className="dropdown-item-hdr logout-btn-hdr">
                                                <svg className="dropdown-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                    <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M16 17L21 12L16 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    <path d="M21 12H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button 
                                    onClick={handleLoginClick} 
                                    className="login-button-hdr"
                                    title="Iniciar Sesión"
                                >
                                    <svg className="login-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M10 17L15 12L10 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M15 12H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    <span className="login-text-hdr">Iniciar Sesión</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* MENÚ HAMBURGUESA - SOLO MÓVIL */}
                    {isMobile && (
                        <button
                            className={`menu-toggle-hdr ${isMenuOpen ? 'active-hdr' : ''}`}
                            onClick={toggleMenu}
                            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    )}
                </div>
            </div>

            {/* MENÚ MÓVIL - SOLO MÓVIL */}
            {isMobile && (
                <div className={`mobile-menu-hdr ${isMenuOpen ? 'active-hdr' : ''}`}>
                    <div className="mobile-menu-content-hdr">
                        <div className="mobile-menu-header-hdr">
                            <div className="mobile-logo-hdr">
                                <img src="/LOGO_LUCESA.png" alt="Lucesa" className="mobile-logo-image-hdr" />
                            </div>
                            <button className="mobile-close-btn" onClick={closeMobileMenu}></button>
                        </div>

                        {/* BARRA DE BÚSQUEDA MÓVIL */}
                        <div className="mobile-search-container">
                            <form className="mobile-search-bar-hdr" onSubmit={handleSearchSubmit}>
                                <input 
                                    type="text" 
                                    placeholder="Buscar productos..." 
                                    className="mobile-search-input-hdr"
                                    value={localSearchTerm}
                                    onChange={handleSearchInputChange}
                                    onKeyPress={handleKeyPress}
                                />
                                <button type="submit" className="mobile-search-btn-hdr" aria-label="Buscar">
                                    <svg className="search-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <circle cx="11" cy="11" r="7" strokeWidth="2"/>
                                        <path d="M20 20L17 17" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                </button>
                            </form>
                        </div>

                        {/* NAVEGACIÓN MÓVIL */}
                        <nav className="mobile-nav-hdr">
                            {/* BOTÓN DE CATEGORÍAS EN MÓVIL */}
                            <button
                                className="mobile-categories-button-hdr"
                                onClick={() => {
                                    setCategoriesDropdownOpen(true);
                                    setIsMenuOpen(false);
                                }}
                            >
                                <svg className="nav-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M8 6H21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8 12H21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M8 18H21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M3 6H3.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M3 12H3.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M3 18H3.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Explorar Categorías
                            </button>

                            <ul className="mobile-nav-list-hdr">
                                <li>
                                    <Link to="/" className="mobile-nav-link-hdr" onClick={handleNavClick}>
                                        <svg className="nav-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M9 22V12H15V22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Inicio
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/products" className="mobile-nav-link-hdr" onClick={handleNavClick}>
                                        <svg className="nav-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <rect x="3" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <rect x="14" y="3" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <rect x="14" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <rect x="3" y="14" width="7" height="7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                        Productos
                                    </Link>
                                </li>
                                <li>
                                    <button 
                                        onClick={handleFavoritesClick} 
                                        className="mobile-nav-link-hdr"
                                    >
                                        <svg className="nav-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Favoritos
                                        {favoritesCount > 0 && (
                                            <span className="mobile-fav-count-hdr">{favoritesCount}</span>
                                        )}
                                    </button>
                                </li>
                                <li>
                                    <a 
                                        href="https://lucesademexico.com/" 
                                        className="mobile-nav-link-hdr" 
                                        onClick={handleNavClick}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                    >
                                        <svg className="nav-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" 
                                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" 
                                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" 
                                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" 
                                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Quiénes somos
                                    </a>
                                </li>
                                                            </ul>

                            {/* SECCIÓN DE USUARIO EN MÓVIL */}
                            {user && (
                                <div className="mobile-user-section-hdr">
                                    <div className="user-info-mobile-hdr">
                                        <span className="user-greeting-hdr">Hola, {user.nombre || user.username}</span>
                                        <span className="user-email-hdr">{user.email}</span>
                                    </div>
                                    <div className="mobile-user-links-hdr">
                                        <button 
                                            onClick={handleMyAccountClick} 
                                            className="mobile-user-link-hdr"
                                        >
                                            <svg className="link-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Mi Cuenta
                                        </button>
                                        <button onClick={handleLogout} className="mobile-logout-btn-hdr">
                                            <svg className="link-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M16 17L21 12L16 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M21 12H9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* BOTÓN DE LOGIN EN MÓVIL (cuando no hay usuario) */}
                            {!user && (
                                <div className="mobile-login-section-hdr">
                                    <button onClick={handleLoginClick} className="mobile-login-btn-hdr">
                                        <svg className="login-icon-hdr" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M10 17L15 12L10 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M15 12H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Iniciar Sesión
                                    </button>
                                </div>
                            )}
                        </nav>
                    </div>
                </div>
            )}

            {/* DROPDOWN DE CATEGORÍAS - MÓVIL */}
            {categoriesDropdownOpen && isMobile && (
                <div className="categories-dropdown-global-container active" onClick={() => setCategoriesDropdownOpen(false)}>
                    <div className="categories-dropdown-mobile-wrapper" onClick={(e) => e.stopPropagation()}>
                        <CategoriesDropdown 
                            isOpen={categoriesDropdownOpen}
                            onClose={() => {
                                setCategoriesDropdownOpen(false);
                            }}
                            isMobile={true}
                        />
                    </div>
                </div>
            )}

            {/* DROPDOWN DE CATEGORÍAS - TABLET */}
            {categoriesDropdownOpen && isTablet && (
                <div className="categories-dropdown-desktop-overlay" onClick={() => setCategoriesDropdownOpen(false)}>
                    <div className="categories-dropdown-desktop-wrapper" onClick={(e) => e.stopPropagation()}>
                        <CategoriesDropdown 
                            isOpen={categoriesDropdownOpen}
                            onClose={() => setCategoriesDropdownOpen(false)}
                            isMobile={false}
                        />
                    </div>
                </div>
            )}

            {/* CARRITO DESPLEGABLE */}
            <CartDropdown />
        </header>
    );
};

export default Header;