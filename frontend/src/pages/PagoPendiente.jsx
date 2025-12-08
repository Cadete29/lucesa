import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './PagoPendiente.css';

const PagoPendiente = () => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [checkInterval, setCheckInterval] = useState(null);

  // Simular paso del tiempo
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Simular verificación periódica del estado
    const checkStatusInterval = setInterval(() => {
      console.log('🔄 Verificando estado del pago...');
    }, 30000);
    
    setCheckInterval(checkStatusInterval);

    return () => {
      clearInterval(timer);
      clearInterval(checkStatusInterval);
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const createParticles = () => {
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        id: i,
        size: Math.random() * 20 + 10,
        left: Math.random() * 100,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5
      });
    }
    return particles;
  };

  const particles = createParticles();

  return (
    <div className="pp-page">
      {/* Partículas animadas de fondo */}
      <div className="pp-particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="pp-particle"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.left}%`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      <div className="pp-container">
        <div className="pp-card">
          {/* Header con icono animado */}
          <div className="pp-header">
            <div className="pp-pending-icon">⏳</div>
            <h1 className="pp-title">Pago en Proceso</h1>
            <p className="pp-description">
              <strong>Tu pago está siendo procesado.</strong> Recibirás una confirmación 
              por correo electrónico cuando se complete la transacción.
            </p>
          </div>

          {/* Contenido principal */}
          <div className="pp-content">
            {/* Progreso del proceso */}
            <div className="pp-progress-section">
              <h2 className="pp-progress-title">Estado del Proceso</h2>
              
              <div className="pp-timeline">
                <div className="pp-timeline-step">
                  <div className="pp-step-icon completed">✓</div>
                  <div className="pp-step-label">Inicio de pago</div>
                </div>
                
                <div className="pp-timeline-step">
                  <div className="pp-step-icon active">💳</div>
                  <div className="pp-step-label active">Procesando pago</div>
                </div>
                
                <div className="pp-timeline-step">
                  <div className="pp-step-icon pending">✅</div>
                  <div className="pp-step-label">Confirmación</div>
                </div>
              </div>
            </div>

            {/* Estimación de tiempo */}
            <div className="pp-estimation-section">
              <h2 className="pp-estimation-title">Tiempo Transcurrido</h2>
              <div className="pp-estimation-content">
                <div className="pp-estimation-item">
                  <div className="pp-estimation-icon">⏱️</div>
                  <div className="pp-estimation-text">{formatTime(timeElapsed)}</div>
                  <p className="pp-estimation-note">Tiempo desde el inicio del pago</p>
                </div>
                
                <div className="pp-estimation-item">
                  <div className="pp-estimation-icon">📧</div>
                  <div className="pp-estimation-text">1-3 minutos</div>
                  <p className="pp-estimation-note">Tiempo estimado para confirmación</p>
                </div>
                
                <div className="pp-estimation-item">
                  <div className="pp-estimation-icon">🔄</div>
                  <div className="pp-estimation-text">Auto-verificación</div>
                  <p className="pp-estimation-note">Verificando estado cada 30 segundos</p>
                </div>
              </div>
            </div>

            {/* Acciones recomendadas */}
            <div className="pp-actions-section">
              <h2 className="pp-actions-title">¿Qué puedes hacer mientras tanto?</h2>
              
              <div className="pp-actions-grid">
                <div className="pp-action-item">
                  <div className="pp-action-icon">📱</div>
                  <h3 className="pp-action-title">Revisa tu correo</h3>
                  <p className="pp-action-description">
                    La confirmación será enviada a tu email. Revisa también la carpeta de spam.
                  </p>
                </div>
                
                <div className="pp-action-item">
                  <div className="pp-action-icon">📋</div>
                  <h3 className="pp-action-title">Consulta tu historial</h3>
                  <p className="pp-action-description">
                    Puedes revisar el estado de esta compra en tu historial de pedidos.
                  </p>
                </div>
                
                <div className="pp-action-item">
                  <div className="pp-action-icon">🛒</div>
                  <h3 className="pp-action-title">Continúa explorando</h3>
                  <p className="pp-action-description">
                    Mientras esperas, puedes seguir viendo otros productos.
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="pp-actions">
              <Link to="/my-account" className="pp-btn pp-btn-primary">
                <span className="pp-btn-icon">📋</span>
                Ver Mis Pedidos
              </Link>
              <Link to="/" className="pp-btn pp-btn-secondary">
                <span className="pp-btn-icon">🏠</span>
                Volver al Inicio
              </Link>
            </div>

            {/* Información adicional */}
            <div className="pp-info-section">
              <h3 className="pp-info-title">Información importante</h3>
              
              <div className="pp-info-list">
                <div className="pp-info-item">
                  <div className="pp-info-icon">ℹ️</div>
                  <div className="pp-info-content">
                    <p className="pp-info-text">
                      <strong>No cierres esta página:</strong> Puedes dejarla abierta en segundo plano.
                    </p>
                  </div>
                </div>
                
                <div className="pp-info-item">
                  <div className="pp-info-icon">📧</div>
                  <div className="pp-info-content">
                    <p className="pp-info-text">
                      <strong>Recibirás un correo</strong> con los detalles del pedido.
                    </p>
                  </div>
                </div>
                
                <div className="pp-info-item">
                  <div className="pp-info-icon">⏰</div>
                  <div className="pp-info-content">
                    <p className="pp-info-text">
                      <strong>Si el pago falla:</strong> Te notificaremos y podrás reintentarlo desde tu historial.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PagoPendiente;