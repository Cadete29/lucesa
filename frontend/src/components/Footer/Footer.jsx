import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer-ftr">
      {/* Efectos de niebla MUY VISIBLES */}
      <div className="fog-particles-ftr">
        <div className="fog-particle-ftr"></div>
        <div className="fog-particle-ftr"></div>
        <div className="fog-particle-ftr"></div>
        <div className="fog-particle-ftr"></div>
        <div className="fog-particle-ftr"></div>
      </div>
      <div className="wind-effect-ftr"></div>
      <div className="ice-glow-ftr"></div>
      <div className="fog-overlay-ftr"></div>
      
      <div className="container-ftr">
        <div className="footer-content-ftr">
          {/* Logo y Descripción */}
          <div className="footer-section-ftr">
            <div className="logo-section-ftr">
              <img src="/LOGO_LUCESA.png" alt="Lucesa Logo" className="footer-logo-ftr" />
              <p className="footer-description-ftr">
                Tu tienda de tecnología de confianza. Productos de calidad con garantía y soporte técnico especializado.
              </p>
              {/* Redes Sociales */}
              <div className="social-links-ftr">
                <a href="#" aria-label="Facebook" className="social-link-ftr">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" aria-label="Instagram" className="social-link-ftr">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.22 14.815 3.73 13.664 3.73 12.367s.49-2.448 1.396-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.906.875 1.396 2.026 1.396 3.323s-.49 2.448-1.396 3.323c-.875.807-2.026 1.297-3.323 1.297z"/>
                  </svg>
                </a>
                <a href="#" aria-label="YouTube" className="social-link-ftr">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          {/* Enlaces Rápidos */}
          <div className="footer-section-ftr">
            <h4 className="footer-title-ftr">Enlaces Rápidos</h4>
            <ul className="footer-links-ftr">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/products">Productos</Link></li>
              <li><Link to="/categories">Categorías</Link></li>
            </ul>
          </div>
          
          {/* Soporte */}
          <div className="footer-section-ftr">
            <h4 className="footer-title-ftr">Soporte</h4>
            <ul className="footer-links-ftr">
              <li><a href="#garantia">Política de Garantía</a></li>
              <li><a href="#envios">Envíos & Devoluciones</a></li>
              <li><a href="#pagos">Métodos de Pago</a></li>
              <li><a href="#faq">Preguntas Frecuentes</a></li>
            </ul>
          </div>
          
          {/* Contacto */}
          <div className="footer-section-ftr">
            <h4 className="footer-title-ftr">Contacto</h4>
            <div className="contact-info-ftr">
              <div className="contact-item-ftr">
                <div className="contact-icon-ftr">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                </div>
                <span>+52 (56) 11 92 65 23 / +52(56) 27 39 14 55</span>
              </div>
              <div className="contact-item-ftr">
                <div className="contact-icon-ftr">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <span>luis.lucio@lucesademexico.com</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-divider-ftr"></div>
        
        <div className="footer-bottom-ftr">
          <div className="footer-bottom-content-ftr">
            <p>&copy; 2024 Lucesa Tech. Todos los derechos reservados.</p>
            <div className="development-credit-ftr">
              <span>Diseño y desarrollo por Syndmarq Monterrey Mx</span>
            </div>
            <div className="footer-legal-ftr">
              <a href="#privacy">Política de Privacidad</a>
              <a href="#terms">Términos de Servicio</a>
              <a href="#cookies">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer