import React from 'react';
import { Link } from 'react-router-dom';
import './PagoError.css';

/**
 * PAGO ERROR COMPONENT
 * 
 * Página de error especializada para problemas en el proceso de pago.
 * Proporciona una experiencia de usuario informativa y útil cuando ocurren errores
 * durante el procesamiento de pagos en el e-commerce.
 * 
 * Características principales:
 * - Diseño amigable y no intimidante para situaciones de error
 * - Explicación clara de posibles causas del error
 * - Soluciones prácticas paso a paso
 * - Navegación intuitiva para acciones posteriores
 * - Información de contacto para soporte
 * - Elementos visuales que reducen la frustración del usuario
 * 
 * @component
 * @example
 * // Uso en rutas de React Router para manejo de errores de pago
 * <Route path="/payment-error" element={<PagoError />} />
 * 
 * // Redirección desde el componente de checkout al detectar error
 * if (paymentFailed) {
 *   navigate('/payment-error');
 */

/**
 * Componente PagoError - Página de error para fallos en el proceso de pago
 * 
 * Este componente se muestra cuando:
 * 1. Una transacción de pago falla en el procesador de pagos
 * 2. Hay errores de validación de tarjeta o datos de pago
 * 3. Ocurren problemas de conectividad con las APIs de pago
 * 4. La sesión de pago expira por inactividad
 * 
 * Objetivos del componente:
 * - Reducir la frustración del usuario al explicar claramente el problema
 * - Proporcionar soluciones prácticas y accionables
 * - Mantener al usuario dentro del flujo de compra cuando sea posible
 * - Ofrecer alternativas y opciones de ayuda
 * - Mejorar la retención de clientes después de un error
 * 
 * @returns {JSX.Element} Página completa de error de pago
 */
const PagoError = () => {
  return (
    /**
     * Contenedor principal de la página de error
     * @element div.pe-page
     * @class pe-page - Clase CSS principal del componente
     */
    <div className="pe-page">
      {/* ==================================================================== */}
      {/* FONDO ANIMADO (WAVE BACKGROUND) */}
      {/* ==================================================================== */}
      <div className="pe-wave-bg"></div>
      
      {/* ==================================================================== */}
      {/* CONTENEDOR PRINCIPAL */}
      {/* ==================================================================== */}
      <div className="pe-container">
        <div className="pe-card">
          
          {/* ================================================================ */}
          {/* ENCABEZADO CON ICONO DE ERROR */}
          {/* ================================================================ */}
          <div className="pe-header">
            {/* Icono de error grande y visible */}
            <div className="pe-error-icon" aria-hidden="true">❌</div>
            
            {/* Título principal de la página */}
            <h1 className="pe-title">Error en el Proceso de Pago</h1>
            
            {/* Descripción amigable del problema */}
            <p className="pe-description">
              <strong>Lo sentimos</strong>, hubo un problema al procesar tu pago. 
              Por favor, revisa la información e intenta nuevamente.
            </p>
          </div>

          {/* ================================================================ */}
          {/* CONTENIDO PRINCIPAL */}
          {/* ================================================================ */}
          <div className="pe-content">
            
            {/* ------------------------------------------------------------ */}
            {/* SECCIÓN: POSIBLES CAUSAS */}
            {/* ------------------------------------------------------------ */}
            <div className="pe-causes-section">
              <h2 className="pe-section-title">Posibles Causas</h2>
              
              <div className="pe-causes-list">
                {/* Causa 1: Problemas con la tarjeta */}
                <div className="pe-cause-item">
                  <div className="pe-cause-icon" aria-hidden="true">💳</div>
                  <div className="pe-cause-content">
                    <h3 className="pe-cause-title">Problemas con la tarjeta</h3>
                    <p className="pe-cause-description">
                      Fondos insuficientes, tarjeta bloqueada o datos incorrectos.
                    </p>
                  </div>
                </div>
                
                {/* Causa 2: Problemas de seguridad bancaria */}
                <div className="pe-cause-item">
                  <div className="pe-cause-icon" aria-hidden="true">🔒</div>
                  <div className="pe-cause-content">
                    <h3 className="pe-cause-title">Problemas de seguridad</h3>
                    <p className="pe-cause-description">
                      Tu banco puede haber bloqueado la transacción por seguridad.
                    </p>
                  </div>
                </div>
                
                {/* Causa 3: Errores de conectividad */}
                <div className="pe-cause-item">
                  <div className="pe-cause-icon" aria-hidden="true">🌐</div>
                  <div className="pe-cause-content">
                    <h3 className="pe-cause-title">Error de conexión</h3>
                    <p className="pe-cause-description">
                      Problemas temporales con el procesador de pagos o internet.
                    </p>
                  </div>
                </div>
                
                {/* Causa 4: Expiración de sesión */}
                <div className="pe-cause-item">
                  <div className="pe-cause-icon" aria-hidden="true">⏱️</div>
                  <div className="pe-cause-content">
                    <h3 className="pe-cause-title">Tiempo agotado</h3>
                    <p className="pe-cause-description">
                      La sesión de pago expiró por inactividad.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* SECCIÓN: SOLUCIONES PRÁCTICAS */}
            {/* ------------------------------------------------------------ */}
            <div className="pe-solutions-section">
              <h2 className="pe-section-title">¿Qué puedes hacer?</h2>
              
              <div className="pe-solutions-list">
                {/* Solución 1: Verificar datos de tarjeta */}
                <div className="pe-solution-item">
                  <div className="pe-solution-number" aria-hidden="true">1</div>
                  <div className="pe-solution-text">
                    Verifica los datos de tu tarjeta de crédito/débito
                  </div>
                </div>
                
                {/* Solución 2: Contactar al banco */}
                <div className="pe-solution-item">
                  <div className="pe-solution-number" aria-hidden="true">2</div>
                  <div className="pe-solution-text">
                    Contacta a tu banco para verificar restricciones
                  </div>
                </div>
                
                {/* Solución 3: Método de pago alternativo */}
                <div className="pe-solution-item">
                  <div className="pe-solution-number" aria-hidden="true">3</div>
                  <div className="pe-solution-text">
                    Intenta con otro método de pago si es posible
                  </div>
                </div>
                
                {/* Solución 4: Reintentar después */}
                <div className="pe-solution-item">
                  <div className="pe-solution-number" aria-hidden="true">4</div>
                  <div className="pe-solution-text">
                    Reintenta el pago en unos minutos
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* SECCIÓN: ACCIONES PRINCIPALES */}
            {/* ------------------------------------------------------------ */}
            <div className="pe-actions">
              {/* Botón primario: Reintentar pago */}
              <Link 
                to="/checkout" 
                className="pe-btn pe-btn-primary"
                role="button"
                aria-label="Reintentar el proceso de pago"
              >
                <span className="pe-btn-icon" aria-hidden="true">🔄</span>
                Reintentar Pago
              </Link>
              
              {/* Botón secundario: Volver al inicio */}
              <Link 
                to="/" 
                className="pe-btn pe-btn-secondary"
                role="button"
                aria-label="Volver a la página de inicio"
              >
                <span className="pe-btn-icon" aria-hidden="true">🏠</span>
                Volver al Inicio
              </Link>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* SECCIÓN: ACCESO RÁPIDO */}
            {/* ------------------------------------------------------------ */}
            <div className="pe-quick-access">
              {/* Enlace rápido al carrito */}
              <Link 
                to="/cart" 
                className="pe-quick-item"
                aria-label="Ir al carrito de compras"
              >
                <span className="pe-quick-icon" aria-hidden="true">🛒</span>
                Ver Carrito
              </Link>
              
              {/* Enlace rápido a pedidos */}
              <Link 
                to="/my-account" 
                className="pe-quick-item"
                aria-label="Ver mis pedidos en mi cuenta"
              >
                <span className="pe-quick-icon" aria-hidden="true">📦</span>
                Mis Pedidos
              </Link>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* SECCIÓN: INFORMACIÓN DE CONTACTO */}
            {/* ------------------------------------------------------------ */}
            <div className="pe-contact-info">
              <h3 className="pe-contact-title">¿Necesitas ayuda?</h3>
              
              <p className="pe-contact-text">
                Si el problema persiste, contáctanos para asistencia inmediata.
              </p>
              
              {/* Enlace de correo electrónico */}
              <a 
                href="mailto:soporte@lucesa.com" 
                className="pe-contact-email"
                aria-label="Enviar correo electrónico a soporte de Lucesa"
              >
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