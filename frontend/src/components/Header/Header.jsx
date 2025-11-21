import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "../Header/Header.css";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);

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

    const handleNavClick = () => {
        if (isMenuOpen) {
            setIsMenuOpen(false);
        }
    };

    return (
        <header className={`header-lucesa ${isScrolled ? 'scrolled' : ''} ${isMenuOpen ? 'menu-open' : ''}`}>
            <div className="container-lucesa">
                <div className="header-content-lucesa">
                    {/* Logo */}
                    <div className="logo">
                        <Link to="/">
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
                        </ul>
                    </nav>

                    {/* Acciones - Todos los elementos en línea */}
                    <div className="header-actions">
                        <div className="search-bar">
                            <input 
                                type="text" 
                                placeholder="Buscar productos..." 
                                className="search-input"
                            />
                            <button className="search-btn">
                                <span className="search-icon">🔍</span>
                            </button>
                        </div>
                        
                        <div className="header-icons">
                            <button className="icon-btn">
                                <span className="icon">❤️</span>
                            </button>
                            <button className="icon-btn cart-btn">
                                <span className="icon">🛒</span>
                                <span className="cart-count">3</span>
                            </button>
                            <button className="icon-btn">
                                <span className="icon">👤</span>
                            </button>
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
        </header>
    );
};

export default Header;