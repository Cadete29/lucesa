import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer-footer">
      {/* Efectos de niebla MUY VISIBLES */}
      <div className="fog-particles-footer">
        <div className="fog-particle-footer"></div>
        <div className="fog-particle-footer"></div>
        <div className="fog-particle-footer"></div>
        <div className="fog-particle-footer"></div>
        <div className="fog-particle-footer"></div>
      </div>
      <div className="wind-effect-footer"></div>
      <div className="ice-glow-footer"></div>
      <div className="fog-overlay-footer"></div>
      
      {/* CARACTERÍSTICAS COMPACTAS COMO REDES SOCIALES */}
      <div className="footer-features-footer">
        <div className="footer-features-container-footer">
          <div className="features-grid-compact-footer">
            {/* Característica 1: Envío Gratis */}
            <div className="feature-compact-footer">
              <div className="feature-compact-icon-footer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1v1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1h6" />
                </svg>
              </div>
              <div className="feature-compact-text-footer">
                <span className="feature-compact-title-footer">Envío Gratis</span>
              </div>
            </div>
            
            {/* Característica 2: Garantía */}
            <div className="feature-compact-footer">
              <div className="feature-compact-icon-footer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="feature-compact-text-footer">
                <span className="feature-compact-title-footer">Garantía 30 Días</span>
              </div>
            </div>
            
            {/* Característica 3: Pago Seguro */}
            <div className="feature-compact-footer">
              <div className="feature-compact-icon-footer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="feature-compact-text-footer">
                <span className="feature-compact-title-footer">Pago Seguro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container-footer">
        <div className="footer-content-footer">
          {/* Logo y Descripción */}
          <div className="footer-section-footer">
            <div className="logo-section-footer">
              <img src="/LOGO_LUCESA.png" alt="Lucesa Logo" className="footer-logo-footer" />
              <p className="footer-description-footer">
                Tu tienda de tecnología de confianza. Productos de calidad con garantía y soporte técnico especializado.
              </p>
              {/* Redes Sociales */}
              <div className="social-links-footer">
                <a href="https://www.facebook.com/" aria-label="Facebook" className="social-link-footer">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://www.instagram.com/" aria-label="Instagram" className="social-link-footer">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.22 14.815 3.73 13.664 3.73 12.367s.49-2.448 1.396-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.906.875 1.396 2.026 1.396 3.323s-.49 2.448-1.396 3.323c-.875.807-2.026 1.297-3.323 1.297z"/>
                  </svg>
                </a>
                <a href="https://www.youtube.com/" aria-label="YouTube" className="social-link-footer">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          {/* Enlaces Rápidos */}
          <div className="footer-section-footer">
            <h4 className="footer-title-footer">Enlaces Rápidos</h4>
            <ul className="footer-links-footer">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/products">Productos</Link></li>
              <li><Link to="/categories">Categorías</Link></li>
            </ul>
          </div>
          
          {/* Soporte */}
          <div className="footer-section-footer">
            <h4 className="footer-title-footer">Soporte</h4>
            <ul className="footer-links-footer">
              <li><a href="/faq">Preguntas Frecuentes</a></li>
            </ul>
          </div>
          
          {/* Contacto */}
          <div className="footer-section-footer">
            <h4 className="footer-title-footer">Contacto</h4>
            <div className="contact-info-footer">
              <div className="contact-item-footer">
                <div className="contact-icon-footer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                </div>
                <span>+52 (56) 1017 7596 / +52 (56) 2739 1455</span>
              </div>
              <div className="contact-item-footer">
                <div className="contact-icon-footer">
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
        
        <div className="footer-divider-footer"></div>
        
        <div className="footer-bottom-footer">
          <div className="footer-bottom-content-footer">
            <p>&copy; 2024 Lucesa Distribucion. Todos los derechos reservados.</p>
            <div className="development-credit-footer">
              <span>Diseño y desarrollo por Syndmarq Monterrey Mx</span>
            </div>
            <div className="footer-legal-footer">
              <a href="/privacy-policy">Política de Privacidad</a>
              <a href="/terms-of-service">Términos de Servicio</a>
              <a href="/cookie-policy">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer