import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Banner.css";

const Banner = () => {
    const bannerRefBnr = useRef(null);
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (bannerRefBnr.current) {
                bannerRefBnr.current.classList.add('animate-in-bnr');
            }
        }, 100);

        // Detectar tamaño de pantalla
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    const handleCatalogClickBnr = () => {
        navigate("/products");
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
                        {/* Banner de Precios Mayoristas - CON TEXTO REPETIDO */}
                        <div className={`wholesale-banner-bnr ${isMobile ? 'static' : ''}`}>
                            <div className="wholesale-text-container-bnr">
                                {/* Texto repetido múltiples veces para efecto continuo */}
                                <span className="wholesale-text-bnr">
                                    {isMobile ? "💰 Precios Mayoristas 💰" : "💰 Precios Mayoristas 💰".repeat(4)}
                                </span>
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

                        {/* ELIMINADO: banner-features-bnr se movió al footer */}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Banner;