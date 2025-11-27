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

    const handleMyAccountClick = () => {
        navigate('/my-account');
        setUserMenuOpen(false);
        closeMobileMenu();
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
            if (userMenuOpen && !event.target.closest('.user-menu-hdr')) {
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

                    {/* Navegación Desktop */}
                    <nav className="desktop-nav-hdr">
                        <ul className="nav-list-hdr">
                            <li>
                                <Link to="/" className="nav-link-hdr">Inicio</Link>
                            </li>
                            <li>
                                <Link to="/products" className="nav-link-hdr">Productos</Link>
                            </li>
                            <li>
                                <Link to="/categories" className="nav-link-hdr">Categorías</Link>
                            </li>
                        </ul>
                    </nav>

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
                            <button type="submit" className="search-btn-hdr">
                                <span className="search-icon-hdr">🔍</span>
                            </button>
                        </form>
                        
                        <div className="header-icons-hdr">
                            {/* <button onClick={handleFavoritesClick} className="icon-btn-hdr favorites-btn-hdr" title="Favoritos">
                                <span className="icon-hdr">❤️</span>
                                {favoritesCount > 0 && (
                                    <span className="favorites-count-hdr">{favoritesCount}</span>
                                )}
                            </button> */}

                            <button onClick={handleCartClick} className="icon-btn-hdr cart-btn-hdr" title="Carrito">
                                <span className="icon-hdr">🛒</span>
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
                                        <span className="icon-hdr">👤</span>
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
                                                <span className="dropdown-icon-hdr">👤</span>
                                                Mi Cuenta
                                            </button>
                                            <Link to="/favorites" className="dropdown-item-hdr" onClick={() => setUserMenuOpen(false)}>
                                                <span className="dropdown-icon-hdr">❤️</span>
                                                Mis Favoritos
                                            </Link>
                                            <div className="dropdown-divider-hdr"></div>
                                            <button onClick={handleLogout} className="dropdown-item-hdr logout-btn-hdr">
                                                <span className="dropdown-icon-hdr">🚪</span>
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
                                    <span className="login-icon-hdr">👤</span>
                                    Iniciar Sesión
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
                    </div>

                    <nav className="mobile-nav-hdr">
                        <ul className="mobile-nav-list-hdr">
                            <li>
                                <Link to="/" className="mobile-nav-link-hdr" onClick={handleNavClick}>
                                    <span className="nav-icon-hdr">🏠</span>
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link to="/products" className="mobile-nav-link-hdr" onClick={handleNavClick}>
                                    <span className="nav-icon-hdr">📦</span>
                                    Productos
                                </Link>
                            </li>
                            <li>
                                <Link to="/categories" className="mobile-nav-link-hdr" onClick={handleNavClick}>
                                    <span className="nav-icon-hdr">📑</span>
                                    Categorías
                                </Link>
                            </li>
                            {/* <li>
                                {<Link to="/favorites" className="mobile-nav-link-hdr" onClick={handleNavClick}>
                                    <span className="nav-icon-hdr">❤️</span>
                                    Favoritos
                                    {favoritesCount > 0 && (
                                        <span className="mobile-badge-hdr">{favoritesCount}</span>
                                    )}
                                </Link>}
                            </li> */}
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
                                        <span className="link-icon-hdr">👤</span>
                                        Mi Cuenta
                                    </button>
                                    <Link to="/favorites" className="mobile-user-link-hdr" onClick={handleNavClick}>
                                        <span className="link-icon-hdr">❤️</span>
                                        Mis Favoritos
                                    </Link>
                                    <button onClick={handleLogout} className="mobile-logout-btn-hdr">
                                        <span className="link-icon-hdr">🚪</span>
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        )}

                        {!user && (
                            <div className="mobile-login-section-hdr">
                                <button onClick={handleLoginClick} className="mobile-login-btn-hdr">
                                    <span className="login-icon-hdr">👤</span>
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