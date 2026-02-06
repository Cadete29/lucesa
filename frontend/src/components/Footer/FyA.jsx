// components/FAQWithCategories.jsx
import React, { useState } from 'react';
import './FAQ.css';

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [activeIndex, setActiveIndex] = useState(null);

  const faqsByCategory = {
    general: [
      {
        pregunta: "¿Cómo puedo crear una cuenta?",
        respuesta: (
          <>
            <p>Para crear una cuenta en nuestra plataforma, sigue estos sencillos pasos:</p>
            <ul className="faq-answer-list">
              <li className="faq-answer-item">Haz clic en el botón <strong>"Iniciar Sesión"</strong> en la esquina superior derecha</li>
              <li className="faq-answer-item">Selecciona la opción <strong>"Registrarse"</strong> en la ventana emergente</li>
              <li className="faq-answer-item">Completa el formulario con tus datos personales</li>
              <li className="faq-answer-item">Verifica tu correo electrónico haciendo clic en el enlace que te enviamos</li>
              <li className="faq-answer-item">¡Listo! Ya puedes acceder a tu cuenta</li>
            </ul>
            <div className="faq-answer-highlight">
              <p className="faq-answer-highlight-text">
                <strong>Importante:</strong> Asegúrate de usar un correo electrónico válido ya que lo necesitarás para la verificación y recuperación de contraseña.
              </p>
            </div>
            <div className="faq-answer-cta">
              <a href="/registro" className="faq-answer-btn">
                <span>Crear Cuenta Ahora</span>
                <span>→</span>
              </a>
            </div>
          </>
        )
      },
      {
        pregunta: "¿Cómo puedo contactar al soporte técnico?",
        respuesta: (
          <>
            <p>Nuestro equipo de soporte está disponible para ayudarte de varias formas:</p>
            
            <div className="faq-answer-table">
              <table>
                <thead>
                  <tr>
                    <th>Método</th>
                    <th>Horario</th>
                    <th>Tiempo de Respuesta</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>📧 Correo Electrónico</td>
                    <td>24/7</td>
                    <td>1-3 horas</td>
                  </tr>
                  <tr>
                    <td>📞 Teléfono</td>
                    <td>Lun-Vie 9:00-18:00</td>
                    <td>Inmediato</td>
                  </tr>
                  {/* <tr>
                    <td>💬 Chat en vivo</td>
                    <td>Lun-Vie 9:00-22:00</td>
                    <td>5-15 minutos</td>
                  </tr> */}
                </tbody>
              </table>
            </div>
            
            <div className="faq-answer-code">
              Correo: atenciónclientes@lucesademexico.com<br />
              Teléfono: +52 (56) 1017 7596 / +52 (56) 2739 14557<br />
              
            </div>
          </>
        )
      }
    ],
    pagos: [
      {
        pregunta: "¿Cuáles son los métodos de pago aceptados?",
        respuesta: (
          <>
            <p>Aceptamos una amplia variedad de métodos de pago para tu comodidad:</p>
            <ul className="faq-answer-list">
              <li className="faq-answer-item">
                <strong>Tarjetas de crédito:</strong> Visa, MasterCard
              </li>
              <li className="faq-answer-item">
                <strong>Tarjetas de débito:</strong> Todas las principales redes
              </li>
              <li className="faq-answer-item">
                <strong>Pagos en línea:</strong> Mercado Pago
              </li>
              {/* <li className="faq-answer-item">
                <strong>Transferencias bancarias:</strong> Disponible para pedidos mayores a $500
              </li> */}
            </ul>
            
            <div className="faq-answer-highlight">
              <p className="faq-answer-highlight-text">
                💳 <strong>Proceso seguro:</strong> Todos los pagos se procesan a través de pasarelas con encriptación SSL de 256-bit. Nunca almacenamos información sensible de tarjetas.
              </p>
            </div>
          </>
        )
      },
      {
        pregunta: "¿Es seguro pagar en el sitio?",
        respuesta: (
          <>
            <p><strong>Totalmente seguro.</strong> Implementamos múltiples capas de seguridad:</p>
            
            <div className="faq-answer-table">
              <table>
                <thead>
                  <tr>
                    <th>Característica</th>
                    <th>Beneficio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>🔒 Encriptación SSL</td>
                    <td>Protección de datos en tránsito</td>
                  </tr>
                  <tr>
                    <td>🛡️ Tokenización</td>
                    <td>Información de tarjetas convertida en tokens</td>
                  </tr>
                  <tr>
                    <td>👁️ Monitoreo 24/7</td>
                    <td>Detección de actividad sospechosa</td>
                  </tr>
                  <tr>
                    <td>✅ Certificación PCI DSS</td>
                    <td>Estándar internacional de seguridad</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p>Además, trabajamos con proveedores de pago certificados como Mercado Pago, quienes procesan directamente las transacciones.</p>
            
            <div className="faq-answer-cta">
              {/* <button className="faq-answer-btn secondary">
                <span>Ver Certificados de Seguridad</span>
              </button> */}
            </div>
          </>
        )
      }
    ],
    envios: [
      {
        pregunta: "¿Cuál es el tiempo de entrega?",
        respuesta: (
          <>
            <p>Los tiempos de entrega varían según tu ubicación:</p>
            
            <div className="faq-answer-table">
              <table>
                <thead>
                  <tr>
                    <th>Zona</th>
                    <th>Tiempo Estimado</th>
                    <th>Costo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>🏙️ Ciudad Capital</td>
                    <td>1-2 días hábiles</td>
                    <td>Gratis</td>
                  </tr>
                  <tr>
                    <td>📍 Áreas Metropolitanas</td>
                    <td>3-5 días hábiles</td>
                    <td>Gratis</td>
                  </tr>
                  <tr>
                    <td>🌄 Zonas Rurales</td>
                    <td>5-9 días hábiles</td>
                    <td>Gratis</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="faq-answer-highlight">
              <p className="faq-answer-highlight-text">
                🚚 <strong>Envio Gratis:</strong> Compra minima de $1,000
              </p>
            </div>
            
            {/* <div className="faq-answer-cta">
              <button className="faq-answer-btn">
                <span>Calcular Costo de Envío</span>
                <span>📦</span>
              </button>
              <button className="faq-answer-btn secondary">
                <span>Seguir Mi Pedido</span>
                <span>🔍</span>
              </button>
            </div> */}
          </>
        )
      }
    ]
  };

  const categories = [
    { id: 'general', label: 'General' },
    { id: 'pagos', label: 'Pagos' },
    { id: 'envios', label: 'Envíos' },
    /* { id: 'devoluciones', label: 'Devoluciones' },
    { id: 'garantias', label: 'Garantías' } */
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-container">
      <div className="faq-wrapper">
        <div className="faq-main-card">
          <div className="faq-header">
            <h1 className="faq-title">Preguntas Frecuentes</h1>
            <p className="faq-subtitle">Respuestas detalladas a todas tus consultas</p>
          </div>

          <div className="faq-categories">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(category.id);
                  setActiveIndex(null);
                }}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="faq-content">
            <h2 className="category-title">
              {categories.find(c => c.id === activeCategory)?.label}
            </h2>
            
            <div className="faq-accordion">
              {faqsByCategory[activeCategory].map((faq, index) => (
                <div key={index} className={`faq-item ${activeCategory}`}>
                  <button
                    className={`faq-question ${activeIndex === index ? 'active' : ''}`}
                    onClick={() => toggleFAQ(index)}
                  >
                    <span>{faq.pregunta}</span>
                    <span className="faq-icon">
                      {activeIndex === index ? '−' : '+'}
                    </span>
                  </button>
                  <div className={`faq-answer ${activeIndex === index ? 'show' : ''}`}>
                    <div className="faq-answer-content">
                      <div className="faq-answer-text">
                        {faq.respuesta}
                      </div>
                      {/* Icono decorativo */}
                      <div className="faq-answer-icon">
                        {activeCategory === 'general' && '❓'}
                        {activeCategory === 'pagos' && '💰'}
                        {activeCategory === 'envios' && '🚚'}
                        {activeCategory === 'devoluciones' && '🔄'}
                        {activeCategory === 'garantias' && '🛡️'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;