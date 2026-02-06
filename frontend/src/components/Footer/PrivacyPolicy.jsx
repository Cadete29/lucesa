import React, { useState, useEffect } from 'react';
import './Privacy.css';

const PrivacyPolicy = () => {
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

  const privacySections = [
    {
      id: 'informacion',
      title: "1. Información que Recopilamos",
      content: (
        <>
          <p>Recopilamos información que usted nos proporciona directamente, como cuando crea una cuenta, completa un formulario o se contacta con nuestro equipo de soporte.</p>
          
          <div className="privacy-answer-table">
            <table>
              <thead>
                <tr>
                  <th>Tipo de Información</th>
                  <th>Ejemplos</th>
                  <th>Uso Principal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>📝 Información de Contacto</td>
                  <td>Nombre, correo electrónico, teléfono</td>
                  <td>Comunicación y soporte</td>
                </tr>
                <tr>
                  <td>👤 Información de Perfil</td>
                  <td>Nombre de usuario, foto de perfil</td>
                  <td>Personalización de cuenta</td>
                </tr>
                <tr>
                  <td>💬 Comunicaciones</td>
                  <td>Mensajes, consultas, feedback</td>
                  <td>Mejora del servicio</td>
                </tr>
                <tr>
                  <td>🛒 Datos de Transacciones</td>
                  <td>Historial de compras, preferencias</td>
                  <td>Recomendaciones personalizadas</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="privacy-answer-highlight">
            <p className="privacy-answer-highlight-text">
              🔒 <strong>Privacidad Protegida:</strong> Solo recopilamos información necesaria para proporcionar nuestros servicios. Nunca compartimos tus datos sin tu consentimiento explícito.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'uso',
      title: "2. Cómo Utilizamos su Información",
      content: (
        <>
          <p>Utilizamos la información que recopilamos para proporcionar, mantener y mejorar nuestros servicios.</p>
          
          <div className="privacy-answer-list">
            <div className="privacy-answer-item">
              <strong>Procesamiento de transacciones:</strong> Gestión de pagos y envío de notificaciones relacionadas
            </div>
            <div className="privacy-answer-item">
              <strong>Personalización:</strong> Adaptamos tu experiencia en nuestros servicios según tus preferencias
            </div>
            <div className="privacy-answer-item">
              <strong>Comunicaciones:</strong> Enviamos información sobre actualizaciones, nuevos productos y promociones
            </div>
            <div className="privacy-answer-item">
              <strong>Seguridad:</strong> Detección y prevención de actividades fraudulentas
            </div>
            <div className="privacy-answer-item">
              <strong>Análisis:</strong> Mejora continua de nuestros servicios basada en datos
            </div>
          </div>

          <div className="privacy-answer-code">
            📊 <strong>Uso de Datos Anónimos:</strong> Utilizamos información agregada y anónima para análisis estadísticos y mejora de funcionalidades, sin identificar usuarios individuales.
          </div>
        </>
      )
    },
    {
      id: 'comparticion',
      title: "3. Compartición de Información",
      content: (
        <>
          <p>No vendemos su información personal a terceros. Solo compartimos información en las siguientes circunstancias:</p>
          
          <div className="privacy-answer-table">
            <table>
              <thead>
                <tr>
                  <th>Situación</th>
                  <th>Destinatario</th>
                  <th>Finalidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>✅ Con tu consentimiento</td>
                  <td>Terceros específicos</td>
                  <td>Servicios adicionales solicitados</td>
                </tr>
                <tr>
                  <td>🤝 Proveedores de servicios</td>
                  <td>Socios comerciales</td>
                  <td>Operación del negocio (hosting, pagos)</td>
                </tr>
                <tr>
                  <td>⚖️ Obligaciones legales</td>
                  <td>Autoridades competentes</td>
                  <td>Cumplimiento de leyes y regulaciones</td>
                </tr>
                <tr>
                  <td>🛡️ Protección de derechos</td>
                  <td>Partes afectadas</td>
                  <td>Prevención de fraudes y seguridad</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="privacy-answer-highlight">
            <p className="privacy-answer-highlight-text">
              🔐 <strong>Acuerdos de Confidencialidad:</strong> Todos nuestros proveedores firman acuerdos de protección de datos y cumplen con estándares internacionales de seguridad.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'seguridad',
      title: "4. Seguridad de Datos",
      content: (
        <>
          <p>Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal contra acceso no autorizado, alteración, divulgación o destrucción.</p>
          
          <div className="privacy-answer-list">
            <div className="privacy-answer-item">
              <strong>Encriptación SSL/TLS:</strong> Todos los datos se transmiten mediante conexiones seguras encriptadas
            </div>
            <div className="privacy-answer-item">
              <strong>Almacenamiento seguro:</strong> Información sensible almacenada en servidores con múltiples capas de seguridad
            </div>
            <div className="privacy-answer-item">
              <strong>Control de acceso:</strong> Acceso restringido solo a personal autorizado con autenticación de múltiples factores
            </div>
            <div className="privacy-answer-item">
              <strong>Monitoreo continuo:</strong> Sistemas de detección y prevención de intrusiones 24/7
            </div>
            <div className="privacy-answer-item">
              <strong>Copias de seguridad:</strong> Respaldo regular de datos en ubicaciones seguras
            </div>
            <div className="privacy-answer-item">
              <strong>Capacitación:</strong> Personal entrenado en protección de datos y privacidad
            </div>
          </div>

          <div className="privacy-answer-code">
            🛡️ <strong>Cumplimiento Normativo:</strong> Cumplimos con las regulaciones de protección de datos aplicables, incluyendo principios de privacidad por diseño y por defecto.
          </div>

          <div className="privacy-answer-cta">
            {/* <button className="privacy-answer-btn">
              <span>Ver Informe de Seguridad</span>
              <span>📊</span>
            </button>
            <button className="privacy-answer-btn secondary">
              <span>Política de Retención de Datos</span>
              <span>📄</span>
            </button> */}
          </div>
        </>
      )
    },
    {
      id: 'derechos',
      title: "5. Sus Derechos",
      content: (
        <>
          <p>Dependiendo de su ubicación, puede tener ciertos derechos respecto a su información personal, como:</p>
          
          <div className="privacy-answer-table">
            <table>
              <thead>
                <tr>
                  <th>Derecho</th>
                  <th>Descripción</th>
                  <th>Ejercicio</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>👁️ Acceso</td>
                  <td>Obtener copia de tu información personal</td>
                  <td>Solicitud por correo electrónico</td>
                </tr>
                <tr>
                  <td>✏️ Rectificación</td>
                  <td>Corregir información inexacta</td>
                  <td>Actualización en tu perfil o solicitud</td>
                </tr>
                <tr>
                  <td>🗑️ Supresión</td>
                  <td>Eliminar tu información personal</td>
                  <td>Solicitud por correo electrónico</td>
                </tr>
                <tr>
                  <td>⛔ Oposición</td>
                  <td>Oponerse al procesamiento de datos</td>
                  <td>Configuración de preferencias</td>
                </tr>
                <tr>
                  <td>📤 Portabilidad</td>
                  <td>Recibir tus datos en formato estructurado</td>
                  <td>Solicitud por correo electrónico</td>
                </tr>
                <tr>
                  <td>⏸️ Limitación</td>
                  <td>Restringir el procesamiento de datos</td>
                  <td>Solicitud por correo electrónico</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="privacy-answer-highlight">
            <p className="privacy-answer-highlight-text">
              ⚖️ <strong>Ejercicio de Derechos:</strong> Para ejercer cualquiera de estos derechos, contacta a nuestro Oficial de Privacidad. Respondemos a todas las solicitudes dentro de los plazos legales establecidos.
            </p>
          </div>
        </>
      )
    },
    {
      id: 'contacto',
      title: "6. Contacto",
      content: (
        <>
          <p>Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos, puede contactarnos en:</p>
          
          <div className="privacy-answer-list">
            <div className="privacy-answer-item">
              <strong>📧 Correo Electrónico:</strong> atenciónclientes@lucesademexico.com
            </div>
            <div className="privacy-answer-item">
              <strong>📞 Teléfono:</strong> +52 (56) 1017 7596 / +52 (56) 2739 1455
            </div>
            <div className="privacy-answer-item">
              <strong>👨‍💼 Oficial de Privacidad:</strong> Luis Lucio
            </div>
          </div>

          <div className="privacy-answer-code">
            📅 <strong>Horario de Atención:</strong> Lunes a Viernes de 9:00 a 18:00 horas (Hora local)<br />
            ⏰ <strong>Tiempo de Respuesta:</strong> 24-48 horas hábiles
          </div>

          <div className="privacy-answer-cta">
            <a href="mailto: atenciónclientes@lucesademexico.com" className="privacy-answer-btn">
              <span>Contactar por Correo</span>
              <span>✉️</span>
            </a>
            <button className="privacy-answer-btn secondary" onClick={() => window.print()}>
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
      className="privacy-container"
      style={{ 
        paddingTop: headerHeight,
        minHeight: `calc(100vh - ${headerHeight})`
      }}
    >
      <div className="privacy-wrapper">
        <div className="privacy-main-card">
          <div className="privacy-header">
            <h1 className="privacy-title">Política de Privacidad</h1>
            <p className="privacy-subtitle">Protegemos tus datos con los más altos estándares de seguridad y transparencia</p>
          </div>

          <div className="privacy-content">
            <h2 className="privacy-category-title">Nuestros Compromisos de Privacidad</h2>
            
            <div className="privacy-accordion">
              {privacySections.map((section, index) => (
                <div key={section.id} className={`privacy-item ${section.id}`}>
                  <button
                    className={`privacy-question ${activeSection === index ? 'active' : ''}`}
                    onClick={() => toggleSection(index)}
                  >
                    <span className="privacy-question-text">{section.title}</span>
                    <span className="privacy-icon">
                      {activeSection === index ? '−' : '+'}
                    </span>
                  </button>
                  <div className={`privacy-answer ${activeSection === index ? 'show' : ''}`}>
                    <div className="privacy-answer-content">
                      <div className="privacy-answer-text">
                        {section.content}
                      </div>
                      <div className="privacy-answer-icon">
                        {section.id === 'informacion' && '📝'}
                        {section.id === 'uso' && '⚙️'}
                        {section.id === 'comparticion' && '🤝'}
                        {section.id === 'seguridad' && '🔐'}
                        {section.id === 'derechos' && '⚖️'}
                        {section.id === 'contacto' && '📞'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="privacy-footer">
            <div className="privacy-footer-content">
              <p className="privacy-footer-text">
                <strong>📅 Última actualización:</strong> {new Date().toLocaleDateString()}<br />
                <strong>🔄 Próxima revisión:</strong> {new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString()}
              </p>
              <p className="privacy-footer-disclaimer">
                Esta política puede actualizarse periódicamente. Le notificaremos sobre cambios significativos 
                publicando la nueva política en este sitio. Se recomienda revisar esta página regularmente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;