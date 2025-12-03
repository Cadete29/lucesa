import React, { useState } from 'react';
import './LegalPages.css';

const CookiePolicy = () => {
  const [showDetails, setShowDetails] = useState({
    essential: false,
    analytics: false,
    marketing: false
  });

  const toggleDetails = (cookieType) => {
    setShowDetails(prev => ({
      ...prev,
      [cookieType]: !prev[cookieType]
    }));
  };

  return (
    <div className="cookie-container">
      <div className="cookie-header">
        <h1 className="cookie-title">Política de Cookies</h1>
        <p className="cookie-subtitle">Última actualización: {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="cookie-content">
        <section className="cookie-section">
          <h2 className="cookie-section-title">¿Qué son las Cookies?</h2>
          <p className="cookie-text">
            Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web.
            Se utilizan ampliamente para hacer que los sitios web funcionen de manera más eficiente y para proporcionar
            información a los propietarios del sitio.
          </p>
        </section>
        
        <section className="cookie-section">
          <h2 className="cookie-section-title">Tipos de Cookies que Utilizamos</h2>
          
          <div className="cookie-type">
            <div className="cookie-type-header" onClick={() => toggleDetails('essential')}>
              <h3 className="cookie-type-title">Cookies Esenciales</h3>
              <span className="cookie-toggle">{showDetails.essential ? '−' : '+'}</span>
            </div>
            {showDetails.essential && (
              <div className="cookie-type-details">
                <p className="cookie-text">
                  Estas cookies son necesarias para que el sitio web funcione correctamente. 
                  No se pueden desactivar en nuestros sistemas.
                </p>
                <p className="cookie-text">
                  <strong>Ejemplos:</strong> Cookies que mantienen su sesión activa, cookies de seguridad.
                </p>
              </div>
            )}
          </div>
          
          <div className="cookie-type">
            <div className="cookie-type-header" onClick={() => toggleDetails('analytics')}>
              <h3 className="cookie-type-title">Cookies Analíticas</h3>
              <span className="cookie-toggle">{showDetails.analytics ? '−' : '+'}</span>
            </div>
            {showDetails.analytics && (
              <div className="cookie-type-details">
                <p className="cookie-text">
                  Estas cookies nos permiten contar visitas y fuentes de tráfico para poder medir y 
                  mejorar el rendimiento de nuestro sitio.
                </p>
                <p className="cookie-text">
                  <strong>Ejemplos:</strong> Cookies de Google Analytics, cookies de análisis de rendimiento.
                </p>
                <p className="cookie-text">
                  <strong>Duración:</strong> Estas cookies permanecen en su dispositivo entre 30 minutos y 2 años.
                </p>
              </div>
            )}
          </div>
          
          <div className="cookie-type">
            <div className="cookie-type-header" onClick={() => toggleDetails('marketing')}>
              <h3 className="cookie-type-title">Cookies de Marketing</h3>
              <span className="cookie-toggle">{showDetails.marketing ? '−' : '+'}</span>
            </div>
            {showDetails.marketing && (
              <div className="cookie-type-details">
                <p className="cookie-text">
                  Estas cookies se utilizan para rastrear a los visitantes en los sitios web. La intención es 
                  mostrar anuncios que sean relevantes y atractivos para el usuario individual.
                </p>
                <p className="cookie-text">
                  <strong>Ejemplos:</strong> Cookies de remarketing, cookies de redes sociales.
                </p>
                <p className="cookie-text">
                  <strong>Duración:</strong> Estas cookies pueden permanecer en su dispositivo hasta 2 años.
                </p>
              </div>
            )}
          </div>
        </section>
        
        <section className="cookie-section">
          <h2 className="cookie-section-title">Cómo Controlar las Cookies</h2>
          <p className="cookie-text">
            Puede controlar y/o eliminar las cookies según desee. Puede eliminar todas las cookies que ya están 
            en su dispositivo y puede configurar la mayoría de los navegadores para evitar que se coloquen.
          </p>
          <p className="cookie-text">
            Para obtener más información sobre cómo administrar cookies, consulte la sección de ayuda de su navegador.
          </p>
          
          <div className="cookie-browser-guide">
            <h4 className="cookie-browser-title">Guías por navegador:</h4>
            <ul className="cookie-browser-list">
              <li className="cookie-browser-item">
                <a 
                  href="https://support.google.com/chrome/answer/95647" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cookie-browser-link chrome"
                >
                  Chrome
                </a>
              </li>
              <li className="cookie-browser-item">
                <a 
                  href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cookie-browser-link firefox"
                >
                  Firefox
                </a>
              </li>
              <li className="cookie-browser-item">
                <a 
                  href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cookie-browser-link safari"
                >
                  Safari
                </a>
              </li>
              <li className="cookie-browser-item">
                <a 
                  href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cookie-browser-link edge"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
          </div>
        </section>
        
        <section className="cookie-section">
          <h2 className="cookie-section-title">Cambios en esta Política</h2>
          <p className="cookie-text">
            Podemos actualizar esta Política de Cookies de vez en cuando para reflejar cambios en nuestras 
            prácticas o por otros motivos operativos, legales o reglamentarios.
          </p>
        </section>
        
        <section className="cookie-section">
          <h2 className="cookie-section-title">Contacto</h2>
          <p className="cookie-contact">
            Si tiene preguntas sobre nuestra Política de Cookies, puede contactarnos en: 
          </p>
          <p className="cookie-contact-info">
            <strong>Correo electrónico:</strong> luis.lucio@lucesademexico.com<br />
            <strong>Asunto:</strong> Consulta sobre Política de Cookies
          </p>
        </section>
      </div>
      
      <div className="cookie-footer">
        <p className="cookie-footer-text">
          Al continuar utilizando nuestro sitio web, usted acepta el uso de cookies de acuerdo con esta política.
        </p>
      </div>
    </div>
  );
};

export default CookiePolicy;