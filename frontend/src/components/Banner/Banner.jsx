// src/components/Banner/Banner.jsx

/**
 * Componente Banner
 * 
 * Componente principal de banner/carrusel hero que incluye:
 * - Carrusel automático de slides
 * - Contenido promocional y llamados a la acción
 * - Navegación manual y automática
 * - Banner de precio de mayoreo
 * - Adaptación responsiva para móviles
 * 
 * Responsabilidades:
 * 1. Mostrar contenido promocional principal
 * 2. Implementar carrusel automático con temporizador
 * 3. Manejar navegación entre slides
 * 4. Adaptar diseño para diferentes dispositivos
 * 5. Proporcionar animaciones de entrada
 * 6. Gestionar estados de carga
 * 
 * Características:
 * - 3 slides predefinidos con contenido promocional
 * - Autoplay cada 6 segundos
 * - Navegación manual por botones e indicadores
 * - Banner de "Precio de Mayoreo" posicionado estratégicamente
 * - Estados de carga con skeleton screen
 * - Animaciones CSS para transiciones suaves
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Banner.css';

/**
 * Componente funcional Banner
 * @returns {JSX.Element} Componente de banner/carrusel renderizado
 */
const Banner = () => {
    // ============================================
    // REFERENCIAS Y HOOKS
    // ============================================
    
    /** 
     * @ref {Object} bannerRefBnr
     * @description Referencia al elemento DOM del primer slide para animaciones
     */
    const bannerRefBnr = useRef(null);
    
    /** 
     * @hook useNavigate
     * @description Hook de React Router para navegación programática
     */
    const navigate = useNavigate();

    // ============================================
    // ESTADOS DEL COMPONENTE
    // ============================================
    
    /** 
     * @state {number} currentSlide
     * @description Índice del slide actualmente visible (0-based)
     * @default 0
     */
    const [currentSlide, setCurrentSlide] = useState(0);
    
    /** 
     * @state {boolean} isMobile
     * @description Indica si el viewport es móvil (≤ 768px)
     * @default false
     */
    const [isMobile, setIsMobile] = useState(false);
    
    /** 
     * @state {boolean} isLoading
     * @description Controla el estado de carga inicial
     * @default true
     */
    const [isLoading, setIsLoading] = useState(true);

    // ============================================
    // DATOS: SLIDES DEL CARRUSEL
    // ============================================

    /**
     * Array de slides configurados
     * @constant {Array} slides
     * @description Configuración completa de cada slide del carrusel
     * @type {Array<Object>}
     * @property {number} id - Identificador único del slide
     * @property {string} title - Título principal del slide
     * @property {string} subtitle - Subtítulo del slide
     * @property {string} description - Descripción detallada
     * @property {string} buttonText - Texto del botón principal
     * @property {string} buttonLink - Ruta/URL para el botón principal
     * @property {string} imageClass - Clase CSS para imagen de fondo
     */
    const slides = [
        {
            id: 1,
            title: "Descubre lo mejor en tecnología",
            subtitle: "Soluciones Innovadoras",
            description: "Encuentra los mejores productos tecnológicos para tu hogar, oficina o negocio.",
            buttonText: "Explorar Productos",
            buttonLink: "/products",
            imageClass: "slide-1", // Imagen de fondo configurada en CSS
        },
        {
            id: 2,
            title: "Ofertas Especiales",
            subtitle: "Hasta 50% de descuento",
            description: "Aprovecha nuestras promociones en tecnología de última generación.",
            buttonText: "Ver Ofertas",
            buttonLink: "/products?promociones=true",
            imageClass: "slide-2",
        },
        {
            id: 3,
            title: "Envio Gratis",
            subtitle: "En compras mayores",
            description: "Recibe tus productos en la puerta de tu casa sin costo adicional.",
            buttonText: "Comprar Ahora",
            buttonLink: "/products?filter=envio_gratis",
            imageClass: "slide-3",
        }
    ];

    // ============================================
    // EFECTOS DE LIFECYCLE
    // ============================================

    /**
     * Efecto: Inicialización del componente
     * - Aplica animación de entrada después de 100ms
     * - Detecta tamaño de pantalla inicial
     * - Configura listener para cambios de tamaño
     * - Simula tiempo de carga (500ms)
     * 
     * @effect
     * @dependencies [] - Se ejecuta solo al montar
     */
    useEffect(() => {
        // Temporizador para animación de entrada
        const timer = setTimeout(() => {
            if (bannerRefBnr.current) {
                bannerRefBnr.current.classList.add('animate-in-bnr');
            }
        }, 100);

        /**
         * Verificar si el dispositivo es móvil
         * @function checkMobile
         */
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
        };
        
        // Verificación inicial
        checkMobile();
        
        // Listener para cambios de tamaño
        window.addEventListener('resize', checkMobile);

        // Temporizador para estado de carga
        const loadTimer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        /**
         * Función de limpieza
         * @returns {void} Limpia temporizadores y listeners
         */
        return () => {
            clearTimeout(timer);
            clearTimeout(loadTimer);
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    /**
     * Efecto: Autoplay del carrusel
     * - Cambia automáticamente de slide cada 6 segundos
     * - Reinicia el ciclo al llegar al último slide
     * 
     * @effect
     * @dependencies [slides.length] - Se ejecuta cuando cambia la cantidad de slides
     */
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
        }, 6000); // 6 segundos por slide

        /**
         * Función de limpieza
         * @returns {void} Detiene el intervalo de autoplay
         */
        return () => clearInterval(interval);
    }, [slides.length]);

    // ============================================
    // MANEJADORES DE NAVEGACIÓN DEL CARRUSEL
    // ============================================

    /**
     * Ir a un slide específico
     * @function goToSlide
     * @param {number} index - Índice del slide al que navegar
     */
    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    /**
     * Ir al siguiente slide
     * @function nextSlide
     * @description Avanza al siguiente slide, vuelve al primero si es el último
     */
    const nextSlide = () => {
        setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    };

    /**
     * Ir al slide anterior
     * @function prevSlide
     * @description Retrocede al slide anterior, va al último si es el primero
     */
    const prevSlide = () => {
        setCurrentSlide((prevSlide) => 
            prevSlide === 0 ? slides.length - 1 : prevSlide - 1
        );
    };

    // ============================================
    // MANEJADORES DE EVENTOS DE BOTONES
    // ============================================

    /**
     * Manejar clic en "Conócenos"
     * @function handleAboutClickBnr
     * @description Abre el sitio principal de Lucesa en nueva pestaña
     */
    const handleAboutClickBnr = () => {
        window.open("https://lucesademexico.com/", "_blank");
    };

    /**
     * Manejar clic en botón de slide
     * @function handleSlideButtonClick
     * @param {string} link - Ruta a la que navegar
     */
    const handleSlideButtonClick = (link) => {
        navigate(link);
    };

    // ============================================
    // ESTADO DE CARGA: SKELETON SCREEN
    // ============================================

    /**
     * Renderizar estado de carga
     * @returns {JSX.Element} Skeleton screen mientras carga
     */
    if (isLoading) {
        return (
            <div className="banner-container">
                <div className="banner-skeleton">
                    <div className="skeleton-content"></div>
                </div>
            </div>
        );
    }

    // ============================================
    // RENDERIZADO PRINCIPAL
    // ============================================

    return (
        <div className="banner-container">
            <div className="banner-wrapper">
                {/* ============================================
                // CONTENEDOR DE SLIDES
                // ============================================ */}
                <div 
                    className="banner-slides"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    aria-live="polite" // Para lectores de pantalla
                    aria-atomic="true"
                >
                    {slides.map((slide, index) => (
                        <section 
                            key={slide.id}
                            className={`banner-slide ${slide.imageClass}`}
                            ref={index === 0 ? bannerRefBnr : null}
                            aria-labelledby={`banner-title-${slide.id}`}
                            role="banner"
                            aria-hidden={index !== currentSlide} // Ocultar slides no visibles
                        >
                            {/* OVERLAY PARA MEJOR LEGIBILIDAD */}
                            <div className="banner-overlay-bnr"></div>
                            
                            <div className="banner-container-bnr">
                                <div className="banner-content-bnr">
                                    {/* ============================================
                                    // BANNER DE PRECIO DE MAYOREO
                                    // ============================================ */}
                                    <div 
                                        className={`wholesale-banner-bnr fixed-wholesale ${isMobile ? 'static' : ''}`}
                                        role="complementary"
                                    >
                                        <div className="wholesale-text-container-bnr">
                                            <span className="wholesale-text-bnr">
                                                Precio de Mayoreo 
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* ============================================
                                    // CONTENIDO DE TEXTO DEL SLIDE
                                    // ============================================ */}
                                    <div className="banner-text-bnr">
                                        {/* TÍTULO PRINCIPAL */}
                                        <h1 
                                            id={`banner-title-${slide.id}`} 
                                            className="banner-title-bnr"
                                        >
                                            {slide.title}
                                        </h1>
                                        
                                        {/* SUBTÍTULO */}
                                        <p className="banner-subtitle-bnr">
                                            {slide.subtitle}
                                        </p>
                                        
                                        {/* DESCRIPCIÓN */}
                                        <p className="banner-description-bnr">
                                            {slide.description}
                                        </p>
                                        
                                        {/* ============================================
                                        // BOTONES DE ACCIÓN
                                        // ============================================ */}
                                        <div className="banner-buttons-bnr">
                                            {/* BOTÓN PRIMARIO (ACCESIBLE POR TECLADO) */}
                                            <button 
                                                className="cta-button-bnr primary-bnr"
                                                onClick={() => handleSlideButtonClick(slide.buttonLink)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        handleSlideButtonClick(slide.buttonLink);
                                                    }
                                                }}
                                                tabIndex={index === currentSlide ? 0 : -1}
                                            >
                                                <span className="button-content-bnr">
                                                    <span className="button-text-bnr">{slide.buttonText}</span>
                                                    <span className="button-arrow-bnr">→</span>
                                                </span>
                                            </button>
                                            
                                            {/* BOTÓN SECUNDARIO (ENLACE EXTERNO) */}
                                            <button 
                                                className="cta-button-bnr secondary-bnr"
                                                onClick={handleAboutClickBnr}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        handleAboutClickBnr();
                                                    }
                                                }}
                                                tabIndex={index === currentSlide ? 0 : -1}
                                            >
                                                <span className="button-content-bnr">
                                                    <span className="button-text-bnr">Conócenos</span>
                                                    <span className="button-arrow-bnr">↗</span>
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                {/* ============================================
                // INDICADORES DE SLIDE
                // ============================================ */}
                <div 
                    className="banner-indicators"
                    role="tablist"
                    aria-label="Seleccionar slide del carrusel"
                >
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    goToSlide(index);
                                }
                            }}
                            aria-label={`Ir al slide ${index + 1}`}
                            role="tab"
                            aria-selected={index === currentSlide}
                            aria-controls={`slide-${index}`}
                            tabIndex={0}
                        />
                    ))}
                </div>
                
                {/* ============================================
                // BOTONES DE NAVEGACIÓN (OPCIONAL - COMENTADOS)
                // ============================================
                
                <button 
                    className="banner-nav-btn prev-btn"
                    onClick={prevSlide}
                    aria-label="Slide anterior"
                >
                    ‹
                </button>
                
                <button 
                    className="banner-nav-btn next-btn"
                    onClick={nextSlide}
                    aria-label="Siguiente slide"
                >
                    ›
                </button>
                */}
            </div>
        </div>
    );
};

export default Banner;