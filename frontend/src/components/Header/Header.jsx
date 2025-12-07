// src/components/Header/Header.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSearch } from "../../context/SearchContext";
import { useFavorites } from "../../context/FavoritesContext";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import CartDropdown from "../CartDropdown/CartDropdown";
import CategoriesDropdown from "../CategoriesDropdown/CategoriesDropdown";
import "../Header/Header.css";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState("");
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    const { handleSearch, searchTerm } = useSearch();
    const { favoritesCount } = useFavorites();
    const { user, logout } = useAuth();
    const { getCartItemsCount, openCart, isCartOpen, closeCart } = useCart();
    const navigate = useNavigate();

    // Detectar si es móvil
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleCategoriesDropdown = () => {
        setCategoriesDropdownOpen(!categoriesDropdownOpen);
        // Solo cerrar otros menús si están abiertos, pero NO el carrito
        if (isMenuOpen) setIsMenuOpen(false);
        if (userMenuOpen) setUserMenuOpen(false);
    };

    const closeOtherMenus = (excludeCart = false) => {
        setIsMenuOpen(false);
        setUserMenuOpen(false);
        setCategoriesDropdownOpen(false);
    };

    const closeMobileMenu = () => {
        setIsMenuOpen(false);
    };

    useEffect(() => {
        const handleScroll = () => {
            const scrolled = window.scrollY > 50;
            setIsScrolled(scrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setLocalSearchTerm(searchTerm);
    }, [searchTerm]);

    const handleNavClick = () => {
        closeOtherMenus(); // Cerrar todo excepto carrito
    };

    const handleSearchInputChange = (e) => {
        setLocalSearchTerm(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (localSearchTerm.trim()) {
            handleSearch(localSearchTerm.trim());
            closeOtherMenus();
            closeMobileMenu();
            navigate('/products');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit(e);
        }
    };

    const handleFavoritesClick = () => {
        navigate('/favorites');
        closeOtherMenus();
        closeMobileMenu();
    };

    const handleCartClick = () => {
        console.log('🛒 Header - Alternando carrito:', !isCartOpen);
        
        if (isCartOpen) {
            closeCart();
        } else {
            openCart();
        }
        
        // Cerrar solo otros menús, no tocar el carrito
        closeOtherMenus();
        closeMobileMenu();
    };

    const handleLoginClick = () => {
        navigate('/login');
        closeOtherMenus();
        closeMobileMenu();
    };

    const handleMyAccountClick = () => {
        navigate('/my-account');
        closeOtherMenus();
        closeMobileMenu();
    };

    const handleLogout = () => {
        logout();
        closeOtherMenus();
        closeMobileMenu();
        navigate('/');
    };

    // Cerrar menús al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Para menú de usuario
            if (userMenuOpen && !event.target.closest('.user-menu-hdr')) {
                setUserMenuOpen(false);
            }
            
            // Para dropdown de categorías - desktop
            if (categoriesDropdownOpen && !isMobile && 
                !event.target.closest('.categories-dropdown-container') && 
                !event.target.closest('.categories-button-header')) {
                setCategoriesDropdownOpen(false);
            }
            
            // Para dropdown de categorías - móvil (global container)
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
    }, [userMenuOpen, categoriesDropdownOpen, isMobile]);

    // Prevenir scroll cuando el menú está abierto
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

    // Cerrar menú móvil al cambiar de tamaño de pantalla
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768 && isMenuOpen) {
                closeMobileMenu();
            }
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMenuOpen]);

    return (
        <header className={`header-hdr ${isScrolled ? 'scrolled-hdr' : ''}`}>
            <div className="container-hdr">
                <div className="header-content-hdr">
                    {/* Logo */}
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
                        {/* BOTÓN DE CATEGORÍAS - DESKTOP */}
                        {!isMobile && (
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

                        {/* Navegación Desktop */}
                        <nav className="desktop-nav-hdr">
                            <ul className="nav-list-hdr">
                                <li>
                                    <Link to="/" className="nav-link-hdr" onClick={handleNavClick}>Inicio</Link>
                                </li>
                                <li>
                                    <Link to="/products" className="nav-link-hdr" onClick={handleNavClick}>Productos</Link>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    {/* Acciones */}
                    <div className="header-actions-hdr">
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
                        
                        <div className="header-icons-hdr">
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

                    {/* Menú Hamburguesa */}
                    <button
                        className={`menu-toggle-hdr ${isMenuOpen ? 'active-hdr' : ''}`}
                        onClick={toggleMenu}
                        aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>

            {/* Menú Móvil */}
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
                        </ul>

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

            {/* DROPDOWN DE CATEGORÍAS - GLOBAL (para móvil) */}
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

            {/* DROPDOWN DE CATEGORÍAS - DESKTOP */}
            {categoriesDropdownOpen && !isMobile && (
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

            {/* Carrito Desplegable */}
            <CartDropdown />
        </header>
    );
};

export default Header;