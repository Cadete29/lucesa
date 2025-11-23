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
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
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
            if (isMenuOpen) {
                setIsMenuOpen(false);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit(e);
        }
    };

    const handleFavoritesClick = () => {
        navigate('/favorites');
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
        setUserMenuOpen(false);
        closeCart();
    };

    const handleCartClick = () => {
        openCart();
        setUserMenuOpen(false);
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
    };

    const handleLoginClick = () => {
        navigate('/login');
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
        setUserMenuOpen(false);
        closeCart();
    };

    const handleLogout = () => {
        logout();
        setUserMenuOpen(false);
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
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

    // Cerrar menú móvil al hacer clic en un enlace
    useEffect(() => {
        const handleRouteChange = () => {
            if (isMenuOpen) {
                setIsMenuOpen(false);
            }
        };

        // Escuchar cambios de ruta
        window.addEventListener('popstate', handleRouteChange);
        return () => {
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, [isMenuOpen]);

    return (
        <header className={`header-lucesa ${isScrolled ? 'scrolled' : ''} ${isMenuOpen ? 'menu-open' : ''}`}>
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

                    {/* Navegación */}
                    <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
                        <ul className="nav-list-lucesa">
                            <li>
                                <Link 
                                    to="/" 
                                    className="nav-link"
                                    onClick={handleNavClick}
                                >
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to="/products" 
                                    className="nav-link"
                                    onClick={handleNavClick}
                                >
                                    Productos
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to="/categories" 
                                    className="nav-link"
                                    onClick={handleNavClick}
                                >
                                    Categorías
                                </Link>
                            </li>
                            <li>
                                <Link 
                                    to="/favorites" 
                                    className="nav-link"
                                    onClick={handleNavClick}
                                >
                                    Favoritos
                                </Link>
                            </li>
                            {user && (
                                <li className="nav-user-mobile">
                                    <div className="user-info-mobile">
                                        <span>Hola, {user.name}</span>
                                    </div>
                                    <Link 
                                        to="/profile" 
                                        className="nav-link"
                                        onClick={handleNavClick}
                                    >
                                        Mi Perfil
                                    </Link>
                                    <Link 
                                        to="/orders" 
                                        className="nav-link"
                                        onClick={handleNavClick}
                                    >
                                        Mis Pedidos
                                    </Link>
                                    <button 
                                        onClick={handleLogout}
                                        className="nav-link logout-btn-mobile"
                                    >
                                        Cerrar Sesión
                                    </button>
                                </li>
                            )}
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
                            <button 
                                type="submit" 
                                className="search-btn"
                                disabled={!localSearchTerm.trim()}
                            >
                                <span className="search-icon">🔍</span>
                            </button>
                        </form>
                        
                        <div className="header-icons">
                            {/* Botón de Favoritos */}
                            <button 
                                onClick={handleFavoritesClick}
                                className="icon-btn favorites-btn"
                                title="Favoritos"
                            >
                                <span className="icon">❤️</span>
                                {favoritesCount > 0 && (
                                    <span className="favorites-count">{favoritesCount}</span>
                                )}
                            </button>

                            {/* Botón de Carrito */}
                            <button 
                                onClick={handleCartClick}
                                className="icon-btn cart-btn"
                                title="Carrito"
                            >
                                <span className="icon">🛒</span>
                                {getCartItemsCount() > 0 && (
                                    <span className="cart-count">{getCartItemsCount()}</span>
                                )}
                            </button>

                            {/* Usuario */}
                            {user ? (
                                <div className="user-menu">
                                    <button 
                                        className="icon-btn user-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUserMenuOpen(!userMenuOpen);
                                        }}
                                        aria-label="Menú de usuario"
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
                                            <Link 
                                                to="/profile" 
                                                className="dropdown-item"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <span className="dropdown-icon">👤</span>
                                                Mi Perfil
                                            </Link>
                                            <Link 
                                                to="/orders" 
                                                className="dropdown-item"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <span className="dropdown-icon">📦</span>
                                                Mis Pedidos
                                            </Link>
                                            <Link 
                                                to="/favorites" 
                                                className="dropdown-item"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <span className="dropdown-icon">❤️</span>
                                                Mis Favoritos
                                            </Link>
                                            <div className="dropdown-divider"></div>
                                            <button 
                                                onClick={handleLogout}
                                                className="dropdown-item logout-btn"
                                            >
                                                <span className="dropdown-icon">🚪</span>
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button 
                                    onClick={handleLoginClick}
                                    className="icon-btn login-btn"
                                    title="Iniciar Sesión"
                                >
                                    <span className="icon">👤</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Menú Hamburguesa */}
                    <button
                        className={`menu-toggle ${isMenuOpen ? 'menu-open' : ''}`}
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>

            {/* Overlay para móvil */}
            {isMenuOpen && (
                <div 
                    className="menu-overlay"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Carrito Desplegable */}
            {isCartOpen && <CartDropdown />}
        </header>
    );
};

export default Header;