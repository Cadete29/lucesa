import React from 'react';
import { Link } from 'react-router-dom';
import './PagoError.css';

const PagoError = () => {
  return (
    <div className="pe-page">
      <div className="pe-wave-bg"></div>
      <div className="pe-container">
        <div className="pe-card">
          {/* Header con icono de error */}
          <div className="pe-header">
            <div className="pe-error-icon">❌</div>
            <h1 className="pe-title">Error en el Proceso de Pago</h1>
            <p className="pe-description">
              <strong>Lo sentimos</strong>, hubo un problema al procesar tu pago. 
              Por favor, revisa la información e intenta nuevamente.
            </p>
          </div>

          {/* Contenido principal */}
          <div className="pe-content">
            {/* Posibles causas */}
            <div className="pe-causes-section">
              <h2 className="pe-section-title">Posibles Causas</h2>
              <div className="pe-causes-list">
                <div className="pe-cause-item">
                  <div className="pe-cause-icon">💳</div>
                  <div className="pe-cause-content">
                    <h3 className="pe-cause-title">Problemas con la tarjeta</h3>
                    <p className="pe-cause-description">
                      Fondos insuficientes, tarjeta bloqueada o datos incorrectos.
                    </p>
                  </div>
                </div>
                
                <div className="pe-cause-item">
                  <div className="pe-cause-icon">🔒</div>
                  <div className="pe-cause-content">
                    <h3 className="pe-cause-title">Problemas de seguridad</h3>
                    <p className="pe-cause-description">
                      Tu banco puede haber bloqueado la transacción por seguridad.
                    </p>
                  </div>
                </div>
                
                <div className="pe-cause-item">
                  <div className="pe-cause-icon">🌐</div>
                  <div className="pe-cause-content">
                    <h3 className="pe-cause-title">Error de conexión</h3>
                    <p className="pe-cause-description">
                      Problemas temporales con el procesador de pagos o internet.
                    </p>
                  </div>
                </div>
                
                <div className="pe-cause-item">
                  <div className="pe-cause-icon">⏱️</div>
                  <div className="pe-cause-content">
                    <h3 className="pe-cause-title">Tiempo agotado</h3>
                    <p className="pe-cause-description">
                      La sesión de pago expiró por inactividad.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Soluciones */}
            <div className="pe-solutions-section">
              <h2 className="pe-section-title">¿Qué puedes hacer?</h2>
              <div className="pe-solutions-list">
                <div className="pe-solution-item">
                  <div className="pe-solution-number">1</div>
                  <div className="pe-solution-text">Verifica los datos de tu tarjeta de crédito/débito</div>
                </div>
                <div className="pe-solution-item">
                  <div className="pe-solution-number">2</div>
                  <div className="pe-solution-text">Contacta a tu banco para verificar restricciones</div>
                </div>
                <div className="pe-solution-item">
                  <div className="pe-solution-number">3</div>
                  <div className="pe-solution-text">Intenta con otro método de pago si es posible</div>
                </div>
                <div className="pe-solution-item">
                  <div className="pe-solution-number">4</div>
                  <div className="pe-solution-text">Reintenta el pago en unos minutos</div>
                </div>
              </div>
            </div>

            {/* Acciones principales */}
            <div className="pe-actions">
              <Link to="/checkout" className="pe-btn pe-btn-primary">
                <span className="pe-btn-icon">🔄</span>
                Reintentar Pago
              </Link>
              <Link to="/" className="pe-btn pe-btn-secondary">
                <span className="pe-btn-icon">🏠</span>
                Volver al Inicio
              </Link>
            </div>

            {/* Acceso rápido */}
            <div className="pe-quick-access">
              <Link to="/cart" className="pe-quick-item">
                <span className="pe-quick-icon">🛒</span>
                Ver Carrito
              </Link>
              <Link to="/my-account" className="pe-quick-item">
                <span className="pe-quick-icon">📦</span>
                Mis Pedidos
              </Link>
            </div>

            {/* Información de contacto */}
            <div className="pe-contact-info">
              <h3 className="pe-contact-title">¿Necesitas ayuda?</h3>
              <p className="pe-contact-text">
                Si el problema persiste, contáctanos para asistencia inmediata.
              </p>
              <a href="mailto:soporte@lucesa.com" className="pe-contact-email">
                soporte@lucesa.com
              </a>
              <p className="pe-contact-text">
                Horario de atención: Lunes a Viernes 9:00 - 18:00 hrs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagoError;