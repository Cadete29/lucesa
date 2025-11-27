import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Banner.css";

const Banner = () => {
    const bannerRefBnr = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            if (bannerRefBnr.current) {
                bannerRefBnr.current.classList.add('animate-in-bnr');
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const handleCatalogClickBnr = () => {
        navigate("/categories");
    };

    const handleAboutClickBnr = () => {
        window.open("https://lucesademexico.com/", "_blank");
    };

    return (
        <section 
            className="banner-bnr" 
            ref={bannerRefBnr}
            aria-labelledby="banner-title-bnr"
            role="banner"
        >
            <div className="banner-background-bnr" aria-hidden="true">
                <div className="banner-overlay-bnr"></div>
            </div>
            <div className="banner-container-bnr">
                <div className="banner-content-bnr">
                    <div className="banner-text-bnr">
                        {/* Nuevo banner animado para Precios Mayoristas */}
                        <div className="wholesale-banner-bnr">
                            <div className="wholesale-text-container-bnr">
                                <span className="wholesale-text-bnr">Precios Mayoristas</span>
                            </div>
                        </div>
                        
                        <h1 id="banner-title-bnr" className="banner-title-bnr">
                            Descubre Nuestra <span className="highlight-bnr">Colección Exclusiva</span>
                        </h1>
                        <p className="banner-description-bnr">
                            Encuentra los mejores productos con calidad garantizada 
                            y envío rápido a todo el país.
                        </p>
                        
                        <div className="banner-buttons-bnr">
                            <button 
                                className="cta-button-bnr primary-bnr"
                                onClick={handleCatalogClickBnr}
                            >
                                <span className="button-content-bnr">
                                    <span className="button-icon-bnr">📦</span>
                                    <span className="button-text-bnr">Ver Catálogo</span>
                                    <span className="button-arrow-bnr">→</span>
                                </span>
                            </button>
                            
                            <button 
                                className="cta-button-bnr secondary-bnr"
                                onClick={handleAboutClickBnr}
                            >
                                <span className="button-content-bnr">
                                    <span className="button-icon-bnr">🏢</span>
                                    <span className="button-text-bnr">Conócenos</span>
                                    <span className="button-arrow-bnr">↗</span>
                                </span>
                            </button>
                        </div>

                        <div className="banner-features-bnr">
                            <div className="feature-bnr">
                                <div className="feature-icon-bnr" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                        <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1v1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1h6" />
                                    </svg>
                                </div>
                                <span>Envío Gratis</span>
                            </div>
                            <div className="feature-bnr">
                                <div className="feature-icon-bnr" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <span>Garantía 30 Días</span>
                            </div>
                            <div className="feature-bnr">
                                <div className="feature-icon-bnr" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <span>Pago Seguro</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Banner;