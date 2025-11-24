import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSearch } from "../../context/SearchContext";
import { useFavorites } from "../../context/FavoritesContext";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import CartDropdown from "../CartDropdown/CartDropdown";
import "../Header/Header.css";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState("");
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    
    const { handleSearch, searchTerm } = useSearch();
    const { favoritesCount } = useFavorites();
    const { user, logout } = useAuth();
    const { getCartItemsCount, openCart, isCartOpen, closeCart } = useCart();
    const navigate = useNavigate();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
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
        closeMobileMenu();
        setUserMenuOpen(false);
        closeCart();
    };

    const handleSearchInputChange = (e) => {
        setLocalSearchTerm(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (localSearchTerm.trim()) {
            handleSearch(localSearchTerm.trim());
            closeMobileMenu();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit(e);
        }
    };

    const handleFavoritesClick = () => {
        navigate('/favorites');
        closeMobileMenu();
        setUserMenuOpen(false);
        closeCart();
    };

    const handleCartClick = () => {
        openCart();
        setUserMenuOpen(false);
        closeMobileMenu();
    };

    const handleLoginClick = () => {
        navigate('/login');
        closeMobileMenu();
        setUserMenuOpen(false);
        closeCart();
    };

    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
        closeMobileMenu();
        closeCart();
        navigate('/');
    };

    // Cerrar menús al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuOpen && !event.target.closest('.user-menu')) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [userMenuOpen]);

    // Prevenir scroll cuando el menú está abierto
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMenuOpen]);

    return (
        <header className={`header-lucesa ${isScrolled ? 'scrolled' : ''}`}>
            <div className="container-lucesa">
                <div className="header-content-lucesa">
                    {/* Logo */}
                    <div className="logo">
                        <Link to="/" onClick={handleNavClick}>
                            <img 
                                src="/LOGO_LUCESA.png" 
                                alt="Lucesa Ecommerce" 
                                className="logo-image"
                            />
                        </Link>
                    </div>

                    {/* Navegación Desktop */}
                    <nav className="desktop-nav">
                        <ul className="nav-list-lucesa">
                            <li>
                                <Link to="/" className="nav-link">Inicio</Link>
                            </li>
                            <li>
                                <Link to="/products" className="nav-link">Productos</Link>
                            </li>
                            <li>
                                <Link to="/categories" className="nav-link">Categorías</Link>
                            </li>
                            <li>
                                <Link to="/favorites" className="nav-link">Favoritos</Link>
                            </li>
                        </ul>
                    </nav>

                    {/* Acciones */}
                    <div className="header-actions">
                        <form className="search-bar" onSubmit={handleSearchSubmit}>
                            <input 
                                type="text" 
                                placeholder="Buscar productos..." 
                                className="search-input"
                                value={localSearchTerm}
                                onChange={handleSearchInputChange}
                                onKeyPress={handleKeyPress}
                            />
                            <button type="submit" className="search-btn">
                                <span className="search-icon">🔍</span>
                            </button>
                        </form>
                        
                        <div className="header-icons">
                            <button onClick={handleFavoritesClick} className="icon-btn favorites-btn" title="Favoritos">
                                <span className="icon">❤️</span>
                                {favoritesCount > 0 && (
                                    <span className="favorites-count">{favoritesCount}</span>
                                )}
                            </button>

                            <button onClick={handleCartClick} className="icon-btn cart-btn" title="Carrito">
                                <span className="icon">🛒</span>
                                {getCartItemsCount() > 0 && (
                                    <span className="cart-count">{getCartItemsCount()}</span>
                                )}
                            </button>

                            {user ? (
                                <div className="user-menu">
                                    <button 
                                        className="icon-btn user-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUserMenuOpen(!userMenuOpen);
                                        }}
                                        title="Mi Cuenta"
                                    >
                                        <span className="icon">👤</span>
                                    </button>
                                    
                                    {userMenuOpen && (
                                        <div className="user-dropdown">
                                            <div className="user-info">
                                                <strong>{user.name}</strong>
                                                <span>{user.email}</span>
                                            </div>
                                            <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                                <span className="dropdown-icon">👤</span>
                                                Mi Perfil
                                            </Link>
                                            <Link to="/orders" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                                <span className="dropdown-icon">📦</span>
                                                Mis Pedidos
                                            </Link>
                                            <Link to="/favorites" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                                <span className="dropdown-icon">❤️</span>
                                                Mis Favoritos
                                            </Link>
                                            <div className="dropdown-divider"></div>
                                            <button onClick={handleLogout} className="dropdown-item logout-btn">
                                                <span className="dropdown-icon">🚪</span>
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button onClick={handleLoginClick} className="icon-btn login-btn" title="Iniciar Sesión">
                                    <span className="icon">👤</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Menú Hamburguesa */}
                    <button
                        className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
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
            <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
                <div className="mobile-menu-content">
                    <div className="mobile-menu-header">
                        <div className="mobile-logo">
                            <img src="/LOGO_LUCESA.png" alt="Lucesa" className="mobile-logo-image" />
                        </div>
                    </div>

                    <nav className="mobile-nav">
                        <ul className="mobile-nav-list">
                            <li>
                                <Link to="/" className="mobile-nav-link" onClick={handleNavClick}>
                                    <span className="nav-icon">🏠</span>
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link to="/products" className="mobile-nav-link" onClick={handleNavClick}>
                                    <span className="nav-icon">📦</span>
                                    Productos
                                </Link>
                            </li>
                            <li>
                                <Link to="/categories" className="mobile-nav-link" onClick={handleNavClick}>
                                    <span className="nav-icon">📑</span>
                                    Categorías
                                </Link>
                            </li>
                            <li>
                                <Link to="/favorites" className="mobile-nav-link" onClick={handleNavClick}>
                                    <span className="nav-icon">❤️</span>
                                    Favoritos
                                    {favoritesCount > 0 && (
                                        <span className="mobile-badge">{favoritesCount}</span>
                                    )}
                                </Link>
                            </li>
                        </ul>

                        {user && (
                            <div className="mobile-user-section">
                                <div className="user-info-mobile">
                                    <span className="user-greeting">Hola, {user.name}</span>
                                    <span className="user-email">{user.email}</span>
                                </div>
                                <div className="mobile-user-links">
                                    <Link to="/profile" className="mobile-user-link" onClick={handleNavClick}>
                                        <span className="link-icon">👤</span>
                                        Mi Perfil
                                    </Link>
                                    <Link to="/orders" className="mobile-user-link" onClick={handleNavClick}>
                                        <span className="link-icon">📦</span>
                                        Mis Pedidos
                                    </Link>
                                    <button onClick={handleLogout} className="mobile-logout-btn">
                                        <span className="link-icon">🚪</span>
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        )}

                        {!user && (
                            <div className="mobile-login-section">
                                <button onClick={handleLoginClick} className="mobile-login-btn">
                                    <span className="login-icon">👤</span>
                                    Iniciar Sesión
                                </button>
                            </div>
                        )}
                    </nav>
                </div>
            </div>

            {/* Carrito Desplegable */}
            {isCartOpen && <CartDropdown />}
        </header>
    );
};

export default Header;