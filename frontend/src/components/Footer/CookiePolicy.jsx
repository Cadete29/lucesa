import React, { useState, useEffect } from 'react';
import './Cok.css';

const CookiePolicy = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [headerHeight, setHeaderHeight] = useState('70px');

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (window.innerWidth <= 480) {
        setHeaderHeight('55px');
      } else if (window.innerWidth <= 768) {
        setHeaderHeight('60px');
      } else {
        setHeaderHeight('70px');
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  const cookieSections = [
    {
      id: 'definicion',
      title: "1. ¿Qué son las Cookies?",
      content: (
        <>
          <p>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web. Se utilizan ampliamente para hacer que los sitios web funcionen de manera más eficiente y para proporcionar información a los propietarios del sitio.</p>
          
          <div className="cookie-answer-table">
            <table>
              <thead>
                <tr>
                  <th>Característica</th>
                  <th>Descripción</th>
                  <th>Propósito</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>📁 Archivos Pequeños</td>
                  <td>Archivos de texto de hasta 4KB</td>
                  <td>Almacenamiento local en dispositivo</td>
                </tr>
                <tr>
                  <td>🔗 Vinculación</td>
                  <td>Asociadas al dominio del sitio</td>
                  <td>Identificación única del usuario</td>
                </tr>
                <tr>
                  <td>⏱️ Temporalidad</td>
                  <td>Sesión o persistentes</td>
                  <td>Duración variable según tipo</td>
                </tr>
                <tr>
                  <td>🛡️ Seguridad</td>
                  <td>Encriptadas y seguras</td>
                  <td>Protección de datos del usuario</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="cookie-answer-highlight">
            <p className="cookie-answer-highlight-text">
              💡 <strong>Información Técnica:</strong> Las cookies NO son programas ejecutables, NO pueden contener virus y NO pueden acceder a otros archivos en su dispositivo. Son simplemente archivos de texto que contienen información sobre su interacción con el sitio web.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'tipos',
      title: "2. Tipos de Cookies que Utilizamos",
      content: (
        <>
          <p>Utilizamos diferentes tipos de cookies según su funcionalidad y propósito:</p>
          
          <div className="cookie-types-grid">
            <div className="cookie-type-card essential">
              <div className="cookie-type-icon">🔐</div>
              <h4 className="cookie-type-title">Cookies Esenciales</h4>
              <p className="cookie-type-desc">Necesarias para el funcionamiento básico del sitio</p>
              <div className="cookie-type-details">
                <div className="cookie-detail-item">
                  <strong>Duración:</strong> Sesión o hasta 2 años
                </div>
                <div className="cookie-detail-item">
                  <strong>Control:</strong> No se pueden desactivar
                </div>
                <div className="cookie-detail-item">
                  <strong>Ejemplos:</strong> Autenticación, seguridad, preferencias básicas
                </div>
              </div>
            </div>

            <div className="cookie-type-card analytics">
              <div className="cookie-type-icon">📊</div>
              <h4 className="cookie-type-title">Cookies Analíticas</h4>
              <p className="cookie-type-desc">Miden y analizan el uso del sitio</p>
              <div className="cookie-type-details">
                <div className="cookie-detail-item">
                  <strong>Duración:</strong> 30 minutos a 2 años
                </div>
                <div className="cookie-detail-item">
                  <strong>Control:</strong> Puede desactivarlas
                </div>
                <div className="cookie-detail-item">
                  <strong>Ejemplos:</strong> Google Analytics, análisis de rendimiento
                </div>
              </div>
            </div>

            <div className="cookie-type-card marketing">
              <div className="cookie-type-icon">🎯</div>
              <h4 className="cookie-type-title">Cookies de Marketing</h4>
              <p className="cookie-type-desc">Personalizan anuncios y contenido</p>
              <div className="cookie-type-details">
                <div className="cookie-detail-item">
                  <strong>Duración:</strong> Hasta 2 años
                </div>
                <div className="cookie-detail-item">
                  <strong>Control:</strong> Puede desactivarlas
                </div>
                <div className="cookie-detail-item">
                  <strong>Ejemplos:</strong> Remarketing, redes sociales
                </div>
              </div>
            </div>
          </div>

          <div className="cookie-answer-warning">
            <p className="cookie-answer-warning-text">
              ⚠️ <strong>Cookies de Terceros:</strong> Algunas cookies son establecidas por servicios de terceros (como Google Analytics). Estas cookies están sujetas a las políticas de privacidad de esos terceros.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'control',
      title: "3. Cómo Controlar las Cookies",
      content: (
        <>
          <p>Puede controlar y/o eliminar las cookies según desee. Puede eliminar todas las cookies que ya están en su dispositivo y puede configurar la mayoría de los navegadores para evitar que se coloquen.</p>
          
          <div className="cookie-answer-table">
            <table>
              <thead>
                <tr>
                  <th>Método</th>
                  <th>Descripción</th>
                  <th>Impacto</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>🔧 Configuración del Navegador</td>
                  <td>Opciones de privacidad y seguridad</td>
                  <td>Control por tipo de cookie</td>
                </tr>
                <tr>
                  <td>🗑️ Eliminación Manual</td>
                  <td>Borrado de cookies existentes</td>
                  <td>Pérdida de preferencias guardadas</td>
                </tr>
                <tr>
                  <td>🚫 Modo Incógnito</td>
                  <td>Navegación sin almacenar cookies</td>
                  <td>Sin persistencia de sesión</td>
                </tr>
                <tr>
                  <td>🔔 Gestor de Consentimiento</td>
                  <td>Panel de control de cookies</td>
                  <td>Selección por categoría</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="cookie-browser-guide">
            <h4 className="cookie-browser-title">Guías por navegador:</h4>
            <div className="cookie-browser-grid">
              <a 
                href="https://support.google.com/chrome/answer/95647" 
                target="_blank" 
                rel="noopener noreferrer"
                className="cookie-browser-link chrome"
              >
                <span className="browser-icon">🦊</span>
                <span className="browser-name">Chrome</span>
                <span className="browser-arrow">→</span>
              </a>
              <a 
                href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" 
                target="_blank" 
                rel="noopener noreferrer"
                className="cookie-browser-link firefox"
              >
                <span className="browser-icon">🦊</span>
                <span className="browser-name">Firefox</span>
                <span className="browser-arrow">→</span>
              </a>
              <a 
                href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" 
                target="_blank" 
                rel="noopener noreferrer"
                className="cookie-browser-link safari"
              >
                <span className="browser-icon">🦁</span>
                <span className="browser-name">Safari</span>
                <span className="browser-arrow">→</span>
              </a>
              <a 
                href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" 
                target="_blank" 
                rel="noopener noreferrer"
                className="cookie-browser-link edge"
              >
                <span className="browser-icon">🧭</span>
                <span className="browser-name">Edge</span>
                <span className="browser-arrow">→</span>
              </a>
            </div>
          </div>

          <div className="cookie-answer-highlight">
            <p className="cookie-answer-highlight-text">
              🔍 <strong>Para obtener más información:</strong> Consulte la sección de ayuda de su navegador o visite sitios especializados como <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer">AllAboutCookies.org</a> para obtener guías detalladas.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'consecuencias',
      title: "4. Consecuencias de Deshabilitar Cookies",
      content: (
        <>
          <p>Si decide deshabilitar algunas o todas las cookies, es importante comprender las posibles consecuencias:</p>
          
          <div className="cookie-answer-table">
            <table>
              <thead>
                <tr>
                  <th>Tipo de Cookie</th>
                  <th>Función</th>
                  <th>Consecuencia si se Deshabilita</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>🔐 Esenciales</td>
                  <td>Funcionalidad básica del sitio</td>
                  <td>El sitio puede no funcionar correctamente</td>
                </tr>
                <tr>
                  <td>📊 Analíticas</td>
                  <td>Análisis de uso y rendimiento</td>
                  <td>No podremos mejorar su experiencia</td>
                </tr>
                <tr>
                  <td>🎯 Marketing</td>
                  <td>Publicidad personalizada</td>
                  <td>Anuncios no personalizados</td>
                </tr>
                <tr>
                  <td>💾 Preferencias</td>
                  <td>Configuraciones guardadas</td>
                  <td>Pérdida de preferencias en cada visita</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="cookie-answer-warning">
            <p className="cookie-answer-warning-text">
              ⚠️ <strong>Atención:</strong> La deshabilitación de cookies esenciales puede hacer que algunas funcionalidades del sitio web no estén disponibles, como el carrito de compras, inicio de sesión o procesos de pago.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'cambios',
      title: "5. Cambios en esta Política",
      content: (
        <>
          <p>Podemos actualizar esta Política de Cookies de vez en cuando para reflejar cambios en nuestras prácticas o por otros motivos operativos, legales o reglamentarios.</p>
          
          <div className="cookie-answer-list">
            <div className="cookie-answer-item">
              <strong>Notificación de Cambios:</strong> Le notificaremos sobre cambios significativos publicando la nueva política en este sitio con una fecha de actualización destacada.
            </div>
            <div className="cookie-answer-item">
              <strong>Historial de Versiones:</strong> Mantenemos un registro de todas las versiones anteriores de esta política disponible a solicitud.
            </div>
            <div className="cookie-answer-item">
              <strong>Aceptación Continua:</strong> El uso continuado de nuestro sitio después de los cambios constituye aceptación de la política actualizada.
            </div>
            <div className="cookie-answer-item">
              <strong>Periodo de Transición:</strong> Para cambios importantes, proporcionaremos un período de transición razonable antes de que sean efectivos.
            </div>
          </div>

          <div className="cookie-answer-code">
            🔄 <strong>Proceso de Actualización:</strong> Las actualizaciones de esta política siguen un proceso formal que incluye revisión legal, evaluación de impacto y notificación adecuada a los usuarios.
          </div>
        </>
      )
    },
    {
      id: 'contacto',
      title: "6. Contacto y Ejercicio de Derechos",
      content: (
        <>
          <p>Si tiene preguntas sobre nuestra Política de Cookies o desea ejercer sus derechos relacionados con cookies, puede contactarnos en:</p>
          
          <div className="cookie-answer-list">
            <div className="cookie-answer-item">
              <strong>📧 Correo Electrónico:</strong> atenciónclientes@lucesademexico.com
            </div>
            <div className="cookie-answer-item">
              <strong>📞 Teléfono:</strong> +52 (56) 1017 7596 / +52 (56) 2739 1455
            </div>
            <div className="cookie-answer-item">
              <strong>🏢 Departamento:</strong> Protección de Datos y Privacidad
            </div>
            <div className="cookie-answer-item">
              <strong>👨‍💼 Responsable:</strong> Luis Lucio
            </div>
            <div className="cookie-answer-item">
              <strong>📋 Asunto:</strong> Consulta sobre Política de Cookies
            </div>
          </div>

          <div className="cookie-answer-code">
            ⏰ <strong>Tiempo de Respuesta:</strong> Nos esforzamos por responder a todas las consultas sobre cookies dentro de los 10 días hábiles siguientes a la recepción.
          </div>

          <div className="cookie-answer-cta">
            <a href="mailto: atenciónclientes@lucesademexico.com" className="cookie-answer-btn">
              <span>Contactar sobre Cookies</span>
              <span>🍪</span>
            </a>
            <button className="cookie-answer-btn secondary" onClick={() => window.print()}>
              <span>Imprimir Política</span>
              <span>🖨️</span>
            </button>
          </div>
        </>
      )
    }
  ];

  const toggleSection = (index) => {
    setActiveSection(activeSection === index ? null : index);
  };

  return (
    <div 
      className="cookie-container"
      style={{ 
        paddingTop: headerHeight,
        minHeight: `calc(100vh - ${headerHeight})`
      }}
    >
      <div className="cookie-wrapper">
        <div className="cookie-main-card">
          <div className="cookie-header">
            <h1 className="cookie-title">Política de Cookies</h1>
            <p className="cookie-subtitle">Gestión transparente de cookies para una mejor experiencia</p>
          </div>

          <div className="cookie-content">
            <h2 className="cookie-category-title">Gestión y Control de Cookies</h2>
            
            <div className="cookie-accordion">
              {cookieSections.map((section, index) => (
                <div key={section.id} className={`cookie-item ${section.id}`}>
                  <button
                    className={`cookie-question ${activeSection === index ? 'active' : ''}`}
                    onClick={() => toggleSection(index)}
                  >
                    <span className="cookie-question-text">{section.title}</span>
                    <span className="cookie-icon">
                      {activeSection === index ? '−' : '+'}
                    </span>
                  </button>
                  <div className={`cookie-answer ${activeSection === index ? 'show' : ''}`}>
                    <div className="cookie-answer-content">
                      <div className="cookie-answer-text">
                        {section.content}
                      </div>
                      <div className="cookie-answer-icon">
                        {section.id === 'definicion' && '📖'}
                        {section.id === 'tipos' && '🍪'}
                        {section.id === 'control' && '⚙️'}
                        {section.id === 'consecuencias' && '⚠️'}
                        {section.id === 'cambios' && '🔄'}
                        {section.id === 'contacto' && '📞'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cookie-footer">
            <div className="cookie-footer-content">
              <div className="cookie-consent-reminder">
                <h3 className="cookie-consent-title">Recordatorio de Consentimiento</h3>
                <p className="cookie-consent-text">
                  Al continuar utilizando nuestro sitio web, usted acepta el uso de cookies de acuerdo con esta política. 
                  Puede cambiar sus preferencias en cualquier momento a través de la configuración de su navegador o nuestro panel de control de cookies.
                </p>
              </div>
              
              <p className="cookie-footer-text">
                <strong>📅 Última actualización:</strong> {new Date().toLocaleDateString()}<br />
                <strong>🔄 Próxima revisión:</strong> {new Date(new Date().setMonth(new Date().getMonth() + 6)).toLocaleDateString()}<br />
                <strong>🍪 Versión:</strong> 3.0.1
              </p>
              
              <p className="cookie-footer-disclaimer">
                Esta política se aplica únicamente a cookies utilizadas en nuestro sitio web. Los sitios de terceros a los que podamos enlazar pueden tener sus propias políticas de cookies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;