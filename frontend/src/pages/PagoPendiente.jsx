import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './PagoPendiente.css';

/**
 * PAGO PENDIENTE COMPONENT
 * 
 * Página de estado intermedio que se muestra cuando un pago está siendo procesado.
 * Proporciona retroalimentación visual y tranquilidad al usuario mientras espera
 * la confirmación del procesador de pagos.
 * 
 * Características principales:
 * - Animaciones visuales para indicar procesamiento activo
 * - Timeline del proceso de pago con estados claros
 * - Contador de tiempo transcurrido
 * - Recomendaciones de acciones mientras espera
 * - Sistema de auto-verificación periódica
 * - Diseño tranquilizador que reduce la ansiedad del usuario
 * 
 * @component
 * @example
 * // Uso como página de espera durante procesamiento de pago
 * <Route path="/payment-pending" element={<PagoPendiente />} />
 * 
 * // Redirección desde checkout mientras se procesa pago
 * if (paymentStatus === 'processing') {
 *   navigate('/payment-pending');
 * }
 */

/**
 * Componente PagoPendiente - Página de espera durante procesamiento de pago
 * 
 * Este componente se muestra cuando:
 * 1. El pago ha sido iniciado pero aún no está confirmado
 * 2. Mercado Pago u otro procesador está verificando la transacción
 * 3. Hay un retraso en la confirmación del banco
 * 4. Se necesita tiempo adicional para procesar el pago
 * 
 * Objetivos del componente:
 * - Proporcionar transparencia sobre el estado del proceso
 * - Reducir la ansiedad del usuario durante la espera
 * - Ofrecer alternativas mientras se completa el proceso
 * - Mantener al usuario informado y comprometido
 * - Facilitar la recuperación si el pago falla
 * 
 * @returns {JSX.Element} Página completa de estado de pago pendiente
 */
const PagoPendiente = () => {
  /**
   * Tiempo transcurrido en segundos desde que se cargó la página
   * @state {number} timeElapsed - Segundos transcurridos
   */
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  /**
   * Referencia al intervalo de verificación de estado
   * @state {number|null} checkInterval - ID del intervalo de verificación
   */
  const [checkInterval, setCheckInterval] = useState(null);

  /**
   * Efecto para manejar temporizadores y verificaciones
   * Inicia dos intervalos:
   * 1. Contador de tiempo transcurrido (cada segundo)
   * 2. Verificación periódica del estado (cada 30 segundos)
   * 
   * @effect
   * @dependencies [] - Se ejecuta solo al montar
   * @fires setInterval - Para temporizadores
   * @returns {Function} Cleanup function para limpiar intervalos
   */
  useEffect(() => {
    // Contador de tiempo transcurrido (1 segundo)
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Simulación de verificación periódica del estado del pago
    const checkStatusInterval = setInterval(() => {
      console.log('🔄 Verificando estado del pago...');
      // En una implementación real, aquí se haría una llamada a la API
      // para verificar el estado actual del pago
    }, 30000); // Cada 30 segundos
    
    setCheckInterval(checkStatusInterval);

    // Cleanup function: limpiar intervalos al desmontar
    return () => {
      clearInterval(timer);
      clearInterval(checkStatusInterval);
    };
  }, []); // Array de dependencias vacío = solo al montar

  /**
   * Formatea segundos a un string MM:SS
   * 
   * @function formatTime
   * @param {number} seconds - Segundos a formatear
   * @returns {string} Tiempo formateado como "MM:SS"
   * @example
   * formatTime(125) // Devuelve "02:05"
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Genera partículas animadas para el fondo
   * Crea un array de objetos con propiedades aleatorias para animación
   * 
   * @function createParticles
   * @returns {Array} Array de objetos de partículas
   * @property {number} id - ID único de la partícula
   * @property {number} size - Tamaño en px (10-30px)
   * @property {number} left - Posición horizontal en porcentaje
   * @property {number} duration - Duración de animación en segundos (10-30s)
   * @property {number} delay - Retardo inicial de animación en segundos (0-5s)
   */
  const createParticles = () => {
    const particles = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        id: i,
        size: Math.random() * 20 + 10,          // 10-30px
        left: Math.random() * 100,              // 0-100%
        duration: Math.random() * 20 + 10,      // 10-30 segundos
        delay: Math.random() * 5                // 0-5 segundos de retardo
      });
    }
    return particles;
  };

  // Generar partículas para el fondo animado
  const particles = createParticles();

  return (
    /**
     * Contenedor principal de la página
     * @element div.pp-page
     * @class pp-page - Clase CSS principal del componente (prefijo "pp" = Pago Pendiente)
     */
    <div className="pp-page">
      
      {/* ==================================================================== */}
      {/* PARTÍCULAS ANIMADAS DE FONDO */}
      {/* ==================================================================== */}
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
            aria-hidden="true" // Elementos decorativos, ocultos para screen readers
          />
        ))}
      </div>

      {/* ==================================================================== */}
      {/* CONTENEDOR PRINCIPAL */}
      {/* ==================================================================== */}
      <div className="pp-container">
        <div className="pp-card">
          
          {/* ================================================================ */}
          {/* ENCABEZADO CON ICONO ANIMADO */}
          {/* ================================================================ */}
          <div className="pp-header">
            {/* Icono de reloj de arena animado */}
            <div className="pp-pending-icon" aria-hidden="true">⏳</div>
            
            {/* Título principal */}
            <h1 className="pp-title">Pago en Proceso</h1>
            
            {/* Descripción tranquilizadora */}
            <p className="pp-description">
              <strong>Tu pago está siendo procesado.</strong> Recibirás una confirmación 
              por correo electrónico cuando se complete la transacción.
            </p>
          </div>

          {/* ================================================================ */}
          {/* CONTENIDO PRINCIPAL */}
          {/* ================================================================ */}
          <div className="pp-content">
            
            {/* ------------------------------------------------------------ */}
            {/* SECCIÓN: PROGRESO DEL PROCESO */}
            {/* ------------------------------------------------------------ */}
            <div className="pp-progress-section">
              <h2 className="pp-progress-title">Estado del Proceso</h2>
              
              {/* Timeline visual de 3 pasos */}
              <div className="pp-timeline">
                {/* Paso 1: Inicio de pago (completado) */}
                <div className="pp-timeline-step">
                  <div className="pp-step-icon completed">✓</div>
                  <div className="pp-step-label">Inicio de pago</div>
                </div>
                
                {/* Paso 2: Procesando pago (activo) */}
                <div className="pp-timeline-step">
                  <div className="pp-step-icon active">💳</div>
                  <div className="pp-step-label active">Procesando pago</div>
                </div>
                
                {/* Paso 3: Confirmación (pendiente) */}
                <div className="pp-timeline-step">
                  <div className="pp-step-icon pending">✅</div>
                  <div className="pp-step-label">Confirmación</div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* SECCIÓN: ESTIMACIÓN DE TIEMPO */}
            {/* ------------------------------------------------------------ */}
            <div className="pp-estimation-section">
              <h2 className="pp-estimation-title">Tiempo Transcurrido</h2>
              
              <div className="pp-estimation-content">
                {/* Item 1: Tiempo real transcurrido */}
                <div className="pp-estimation-item">
                  <div className="pp-estimation-icon" aria-hidden="true">⏱️</div>
                  <div className="pp-estimation-text">{formatTime(timeElapsed)}</div>
                  <p className="pp-estimation-note">Tiempo desde el inicio del pago</p>
                </div>
                
                {/* Item 2: Tiempo estimado para confirmación */}
                <div className="pp-estimation-item">
                  <div className="pp-estimation-icon" aria-hidden="true">📧</div>
                  <div className="pp-estimation-text">1-3 minutos</div>
                  <p className="pp-estimation-note">Tiempo estimado para confirmación</p>
                </div>
                
                {/* Item 3: Sistema de verificación automática */}
                <div className="pp-estimation-item">
                  <div className="pp-estimation-icon" aria-hidden="true">🔄</div>
                  <div className="pp-estimation-text">Auto-verificación</div>
                  <p className="pp-estimation-note">Verificando estado cada 30 segundos</p>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* SECCIÓN: ACCIONES RECOMENDADAS */}
            {/* ------------------------------------------------------------ */}
            <div className="pp-actions-section">
              <h2 className="pp-actions-title">¿Qué puedes hacer mientras tanto?</h2>
              
              <div className="pp-actions-grid">
                {/* Acción 1: Revisar correo */}
                <div className="pp-action-item">
                  <div className="pp-action-icon" aria-hidden="true">📱</div>
                  <h3 className="pp-action-title">Revisa tu correo</h3>
                  <p className="pp-action-description">
                    La confirmación será enviada a tu email. Revisa también la carpeta de spam.
                  </p>
                </div>
                
                {/* Acción 2: Consultar historial */}
                <div className="pp-action-item">
                  <div className="pp-action-icon" aria-hidden="true">📋</div>
                  <h3 className="pp-action-title">Consulta tu historial</h3>
                  <p className="pp-action-description">
                    Puedes revisar el estado de esta compra en tu historial de pedidos.
                  </p>
                </div>
                
                {/* Acción 3: Continuar explorando */}
                <div className="pp-action-item">
                  <div className="pp-action-icon" aria-hidden="true">🛒</div>
                  <h3 className="pp-action-title">Continúa explorando</h3>
                  <p className="pp-action-description">
                    Mientras esperas, puedes seguir viendo otros productos.
                  </p>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* SECCIÓN: BOTONES DE ACCIÓN PRINCIPALES */}
            {/* ------------------------------------------------------------ */}
            <div className="pp-actions">
              {/* Botón primario: Ver mis pedidos */}
              <Link 
                to="/my-account" 
                className="pp-btn pp-btn-primary"
                role="button"
                aria-label="Ver mis pedidos en mi cuenta"
              >
                <span className="pp-btn-icon" aria-hidden="true">📋</span>
                Ver Mis Pedidos
              </Link>
              
              {/* Botón secundario: Volver al inicio */}
              <Link 
                to="/" 
                className="pp-btn pp-btn-secondary"
                role="button"
                aria-label="Volver a la página de inicio"
              >
                <span className="pp-btn-icon" aria-hidden="true">🏠</span>
                Volver al Inicio
              </Link>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* SECCIÓN: INFORMACIÓN ADICIONAL */}
            {/* ------------------------------------------------------------ */}
            <div className="pp-info-section">
              <h3 className="pp-info-title">Información importante</h3>
              
              <div className="pp-info-list">
                {/* Info 1: No cerrar página */}
                <div className="pp-info-item">
                  <div className="pp-info-icon" aria-hidden="true">ℹ️</div>
                  <div className="pp-info-content">
                    <p className="pp-info-text">
                      <strong>No cierres esta página:</strong> Puedes dejarla abierta en segundo plano.
                    </p>
                  </div>
                </div>
                
                {/* Info 2: Correo de confirmación */}
                <div className="pp-info-item">
                  <div className="pp-info-icon" aria-hidden="true">📧</div>
                  <div className="pp-info-content">
                    <p className="pp-info-text">
                      <strong>Recibirás un correo</strong> con los detalles del pedido.
                    </p>
                  </div>
                </div>
                
                {/* Info 3: Manejo de fallos */}
                <div className="pp-info-item">
                  <div className="pp-info-icon" aria-hidden="true">⏰</div>
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