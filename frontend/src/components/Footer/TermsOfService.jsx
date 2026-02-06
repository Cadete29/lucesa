import React, { useState, useEffect } from 'react';
import './Terms.css';

const TermsOfService = () => {
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

  const termsSections = [
    {
      id: 'aceptacion',
      title: "1. Aceptación de los Términos",
      content: (
        <>
          <p>Al acceder y utilizar nuestros servicios, usted acepta cumplir con estos Términos de Servicio y todas las leyes y regulaciones aplicables.</p>
          
          <div className="terms-answer-highlight">
            <p className="terms-answer-highlight-text">
              ⚖️ <strong>Consentimiento Obligatorio:</strong> Si no está de acuerdo con alguno de estos términos, tiene prohibido usar o acceder a nuestros servicios. El uso continuado constituye aceptación expresa.
            </p>
          </div>

          <div className="terms-answer-list">
            <div className="terms-answer-item">
              <strong>Contrato Vinculante:</strong> Estos términos constituyen un contrato legal entre usted y Lucesa Distribución
            </div>
            <div className="terms-answer-item">
              <strong>Capacidad Legal:</strong> Debe tener capacidad legal para celebrar contratos (mayor de edad según su jurisdicción)
            </div>
            <div className="terms-answer-item">
              <strong>Responsabilidad:</strong> Es responsable de revisar periódicamente estos términos para estar al tanto de cambios
            </div>
          </div>
        </>
      )
    },
    {
      id: 'descripcion',
      title: "2. Descripción del Servicio",
      content: (
        <>
          <p>Nuestro servicio proporciona una plataforma de comercio electrónico para la compra de productos de iluminación y eléctricos.</p>
          
          <div className="terms-answer-table">
            <table>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Descripción</th>
                  <th>Disponibilidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>🛒 Catálogo de Productos</td>
                  <td>Amplia variedad de productos de iluminación</td>
                  <td>24/7</td>
                </tr>
                <tr>
                  <td>💳 Sistema de Pagos</td>
                  <td>Múltiples métodos de pago seguros</td>
                  <td>24/7</td>
                </tr>
                <tr>
                  <td>🚚 Logística y Envíos</td>
                  <td>Gestión de entregas y seguimiento</td>
                  <td>Horario comercial</td>
                </tr>
                <tr>
                  <td>👤 Gestión de Cuenta</td>
                  <td>Perfil personal, historial de compras</td>
                  <td>24/7</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="terms-answer-code">
            🔄 <strong>Modificaciones del Servicio:</strong> Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto de nuestros servicios en cualquier momento, previa notificación cuando sea requerida por ley.
          </div>
        </>
      )
    },
    {
      id: 'registro',
      title: "3. Registro de Cuenta",
      content: (
        <>
          <p>Para utilizar ciertas funciones de nuestros servicios, es necesario registrarse para obtener una cuenta.</p>
          
          <div className="terms-answer-list">
            <div className="terms-answer-item">
              <strong>Información Veraz:</strong> Debe proporcionar información precisa, completa y actualizada durante el registro
            </div>
            <div className="terms-answer-item">
              <strong>Confidencialidad:</strong> Es responsable de mantener la confidencialidad de su contraseña y cuenta
            </div>
            <div className="terms-answer-item">
              <strong>Actividad Responsable:</strong> Es responsable de toda la actividad que ocurra bajo su cuenta
            </div>
            <div className="terms-answer-item">
              <strong>Notificación:</strong> Debe notificarnos inmediatamente cualquier uso no autorizado de su cuenta
            </div>
            <div className="terms-answer-item">
              <strong>Cuentas Individuales:</strong> Cada cuenta es personal e intransferible
            </div>
          </div>

          <div className="terms-answer-highlight">
            <p className="terms-answer-highlight-text">
              🔒 <strong>Seguridad de Cuenta:</strong> Recomendamos usar contraseñas seguras (mínimo 8 caracteres, combinando mayúsculas, minúsculas, números y símbolos) y no reutilizar contraseñas de otros servicios.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'conducta',
      title: "4. Conducta del Usuario",
      content: (
        <>
          <p>Usted acepta no utilizar nuestros servicios para las siguientes actividades prohibidas:</p>
          
          <div className="terms-answer-table">
            <table>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Actividad Prohibida</th>
                  <th>Consecuencia</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>⚖️ Legal</td>
                  <td>Violar leyes locales, estatales, nacionales o internacionales</td>
                  <td>Suspensión inmediata + reporte legal</td>
                </tr>
                <tr>
                  <td>📝 Propiedad</td>
                  <td>Infringir derechos de propiedad intelectual o de privacidad</td>
                  <td>Suspensión + acciones legales</td>
                </tr>
                <tr>
                  <td>🛡️ Seguridad</td>
                  <td>Transmitir virus, malware o código dañino</td>
                  <td>Baneo permanente + acciones legales</td>
                </tr>
                <tr>
                  <td>👥 Social</td>
                  <td>Acosar, abusar o dañar a otros usuarios</td>
                  <td>Suspensión + posible baneo</td>
                </tr>
                <tr>
                  <td>🎭 Fraude</td>
                  <td>Actividades fraudulentas o engañosas</td>
                  <td>Baneo permanente + reporte legal</td>
                </tr>
                <tr>
                  <td>🔄 Abuso</td>
                  <td>Acceso no autorizado o intentos de vulnerar seguridad</td>
                  <td>Baneo IP + acciones legales</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="terms-answer-warning">
            <p className="terms-answer-warning-text">
              ⚠️ <strong>Consecuencias Graves:</strong> El incumplimiento de estas reglas puede resultar en suspensión inmediata, terminación de cuenta y acciones legales cuando corresponda.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'propiedad',
      title: "5. Propiedad Intelectual",
      content: (
        <>
          <p>Todos los derechos de propiedad intelectual relacionados con nuestros servicios son propiedad exclusiva de Lucesa Distribución o sus licenciantes.</p>
          
          <div className="terms-answer-list">
            <div className="terms-answer-item">
              <strong>Contenido Protegido:</strong> Texto, gráficos, logotipos, imágenes, software, diseño y compilaciones
            </div>
            <div className="terms-answer-item">
              <strong>Marcas Registradas:</strong> Nombre "Lucesa", logo y todas las marcas relacionadas
            </div>
            <div className="terms-answer-item">
              <strong>Base de Datos:</strong> Catálogo de productos, descripciones, precios y disponibilidad
            </div>
            <div className="terms-answer-item">
              <strong>Diseño y UX:</strong> Interfaz de usuario, experiencia de navegación y flujos de compra
            </div>
          </div>

          <div className="terms-answer-code">
            📄 <strong>Licencia Limitada:</strong> Se le otorga una licencia limitada, no exclusiva, intransferible y revocable para acceder y usar nuestros servicios únicamente para fines personales y comerciales legítimos.
          </div>

          <div className="terms-answer-cta">
            <button className="terms-answer-btn secondary" onClick={() => window.print()}>
              <span>Imprimir Términos</span>
              <span>🖨️</span>
            </button>
          </div>
        </>
      )
    },
    {
      id: 'responsabilidad',
      title: "6. Limitación de Responsabilidad",
      content: (
        <>
          <p>En la máxima medida permitida por la ley aplicable, Lucesa Distribución limita su responsabilidad de la siguiente manera:</p>
          
          <div className="terms-answer-table">
            <table>
              <thead>
                <tr>
                  <th>Tipo de Daño</th>
                  <th>Cobertura</th>
                  <th>Exclusión</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>💸 Daños Directos</td>
                  <td>Limitado al monto pagado por los servicios</td>
                  <td>Máximo 6 meses de servicio</td>
                </tr>
                <tr>
                  <td>🔄 Daños Indirectos</td>
                  <td>No cubiertos</td>
                  <td>Pérdida de ganancias, datos</td>
                </tr>
                <tr>
                  <td>⚡ Daños Incidentales</td>
                  <td>No cubiertos</td>
                  <td>Interrupción de negocio</td>
                </tr>
                <tr>
                  <td>🔗 Daños Consecuentes</td>
                  <td>No cubiertos</td>
                  <td>Daños a terceros</td>
                </tr>
                <tr>
                  <td>🌐 Fuerza Mayor</td>
                  <td>Exento de responsabilidad</td>
                  <td>Desastres naturales, guerra</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="terms-answer-warning">
            <p className="terms-answer-warning-text">
              ⚠️ <strong>Exención de Garantías:</strong> Los servicios se proporcionan "TAL CUAL" y "SEGÚN DISPONIBILIDAD" sin garantías de ningún tipo, expresas o implícitas.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'modificaciones',
      title: "7. Modificaciones a los Términos",
      content: (
        <>
          <p>Nos reservamos el derecho de modificar estos términos en cualquier momento para reflejar:</p>
          
          <div className="terms-answer-list">
            <div className="terms-answer-item">
              <strong>Cambios Legales:</strong> Nuevas leyes o regulaciones aplicables
            </div>
            <div className="terms-answer-item">
              <strong>Mejoras de Servicio:</strong> Nuevas funcionalidades o características
            </div>
            <div className="terms-answer-item">
              <strong>Correcciones:</strong> Errores o ambigüedades en los términos actuales
            </div>
            <div className="terms-answer-item">
              <strong>Cambios Operativos:</strong> Modificaciones en nuestros procesos comerciales
            </div>
          </div>

          <div className="terms-answer-highlight">
            <p className="terms-answer-highlight-text">
              📢 <strong>Proceso de Notificación:</strong> Para cambios significativos, le notificaremos mediante: (1) publicación destacada en nuestro sitio, (2) correo electrónico registrado, y (3) banner de notificación en la plataforma.
            </p>
          </div>

          <div className="terms-answer-code">
            🔄 <strong>Vigencia de Cambios:</strong> Los cambios entrarán en vigencia 30 días después de su publicación, excepto cambios urgentes requeridos por ley, que serán efectivos inmediatamente.
          </div>
        </>
      )
    },
    {
      id: 'ley',
      title: "8. Ley Aplicable y Jurisdicción",
      content: (
        <>
          <p>Estos términos se regirán e interpretarán de acuerdo con las leyes aplicables en México.</p>
          
          <div className="terms-answer-table">
            <table>
              <thead>
                <tr>
                  <th>Aspecto</th>
                  <th>Detalle</th>
                  <th>Aplicación</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>🏛️ Jurisdicción</td>
                  <td>Ciudad de México, México</td>
                  <td>Foro exclusivo para disputas</td>
                </tr>
                <tr>
                  <td>📚 Ley Aplicable</td>
                  <td>Leyes federales mexicanas</td>
                  <td>Interpretación de términos</td>
                </tr>
                <tr>
                  <td>⚖️ Resolución</td>
                  <td>Mediación obligatoria primero</td>
                  <td>30 días antes de juicio</td>
                </tr>
                <tr>
                  <td>🌍 Usuarios Internacionales</td>
                  <td>Sujetos a leyes mexicanas</td>
                  <td>Conforme a tratados</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="terms-answer-warning">
            <p className="terms-answer-warning-text">
              ⚠️ <strong>Renuncia a Juicio por Jurado:</strong> Al usar nuestros servicios, renuncia expresamente al derecho a un juicio por jurado en cualquier acción o procedimiento que surja de estos términos.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'contacto',
      title: "9. Contacto e Información Legal",
      content: (
        <>
          <p>Para preguntas, consultas o notificaciones legales relacionadas con estos Términos de Servicio:</p>
          
          <div className="terms-answer-list">
            <div className="terms-answer-item">
              <strong>📧 Correo Electrónico Oficial:</strong> atenciónclientes@lucesademexico.com
            </div>
            <div className="terms-answer-item">
              <strong>📞 Teléfono Corporativo:</strong> +52 (56) 1017 7596 / +52 (56) 2739 1455
            </div>
          </div>

          <div className="terms-answer-code">
            📅 <strong>Horario de Atención Legal:</strong> Lunes a Viernes de 9:00 a 18:00 horas (Hora Centro de México)<br />
            ⏰ <strong>Tiempo de Respuesta:</strong> Notificaciones legales: 10 días hábiles | Consultas generales: 48-72 horas
          </div>

          <div className="terms-answer-highlight">
            <p className="terms-answer-highlight-text">
              📄 <strong>Notificaciones Formales:</strong> Las notificaciones legales deben enviarse por correo certificado con acuse de recibo a nuestro domicilio legal. Las notificaciones por correo electrónico no constituyen notificación formal para fines legales.
            </p>
          </div>

          <div className="terms-answer-cta">
            <a href="mailto: atenciónclientes@lucesademexico.com" className="terms-answer-btn">
              <span>Contactar Departamento Legal</span>
              <span>⚖️</span>
            </a>
            <a href="/privacy" className="terms-answer-btn secondary">
              <span>Ver Política de Privacidad</span>
              <span>🔒</span>
            </a>
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
      className="terms-container"
      style={{ 
        paddingTop: headerHeight,
        minHeight: `calc(100vh - ${headerHeight})`
      }}
    >
      <div className="terms-wrapper">
        <div className="terms-main-card">
          <div className="terms-header">
            <h1 className="terms-title">Términos de Servicio</h1>
            <p className="terms-subtitle">Condiciones legales que rigen el uso de nuestros servicios</p>
          </div>

          <div className="terms-content">
            <h2 className="terms-category-title">Condiciones Legales y Contrato</h2>
            
            <div className="terms-accordion">
              {termsSections.map((section, index) => (
                <div key={section.id} className={`terms-item ${section.id}`}>
                  <button
                    className={`terms-question ${activeSection === index ? 'active' : ''}`}
                    onClick={() => toggleSection(index)}
                  >
                    <span className="terms-question-text">{section.title}</span>
                    <span className="terms-icon">
                      {activeSection === index ? '−' : '+'}
                    </span>
                  </button>
                  <div className={`terms-answer ${activeSection === index ? 'show' : ''}`}>
                    <div className="terms-answer-content">
                      <div className="terms-answer-text">
                        {section.content}
                      </div>
                      <div className="terms-answer-icon">
                        {section.id === 'aceptacion' && '🤝'}
                        {section.id === 'descripcion' && '📱'}
                        {section.id === 'registro' && '👤'}
                        {section.id === 'conducta' && '🚫'}
                        {section.id === 'propiedad' && '©️'}
                        {section.id === 'responsabilidad' && '⚖️'}
                        {section.id === 'modificaciones' && '🔄'}
                        {section.id === 'ley' && '🏛️'}
                        {section.id === 'contacto' && '📞'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="terms-footer">
            <div className="terms-footer-content">
              <div className="terms-important">
                <h3 className="terms-important-title">Declaración de Aceptación</h3>
                <p className="terms-important-text">
                  Al utilizar nuestros servicios, usted reconoce haber leído, comprendido y aceptado estos Términos de Servicio en su totalidad. 
                  Estos términos constituyen el acuerdo completo entre usted y Lucesa Distribución y reemplazan cualquier acuerdo previo.
                </p>
              </div>
              
              <p className="terms-footer-text">
                <strong>📅 Última actualización:</strong> {new Date().toLocaleDateString()}<br />
                <strong>🔄 Próxima revisión:</strong> {new Date(new Date().setMonth(new Date().getMonth() + 6)).toLocaleDateString()}<br />
                <strong>📄 Versión:</strong> 2.1.0
              </p>
              
              <p className="terms-footer-disclaimer">
                Estos términos están disponibles en español únicamente. Cualquier traducción se proporciona solo como cortesía y no tiene validez legal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;