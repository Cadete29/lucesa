import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSearch } from "../../context/SearchContext";
import "../Header/Header.css";

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [localSearchTerm, setLocalSearchTerm] = useState("");
    
    const { handleSearch, searchTerm } = useSearch();

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
    };

    const handleSearchInputChange = (e) => {
        setLocalSearchTerm(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (localSearchTerm.trim()) {
            handleSearch(localSearchTerm.trim());
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit(e);
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