// src/components/auth/ForgotPassword.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

/**
 * FORGOT PASSWORD COMPONENT
 * 
 * Componente para recuperación de contraseña mediante email.
 * Permite a los usuarios solicitar un enlace de restablecimiento
 * que se envía a su correo electrónico registrado.
 * 
 * Características principales:
 * - Formulario simple para ingresar email
 * - Validación de email en tiempo real
 * - Manejo de estados de envío, éxito y error
 * - Mensajes informativos detallados
 * - Información sobre expiración del enlace
 * - Consejos para encontrar el correo
 * - Enlace para volver al login
 * 
 * @component
 * @example
 * // Uso en rutas públicas
 * <Route path="/forgot-password" element={<ForgotPassword />} />
 */

/**
 * Componente ForgotPassword - Recuperación de contraseña
 * 
 * Este componente maneja:
 * 1. Solicitud de restablecimiento de contraseña por email
 * 2. Validación del formato de email
 * 3. Comunicación con el backend para envío de enlace
 * 4. Feedback al usuario sobre el estado del proceso
 * 5. Información adicional para casos comunes
 * 
 * @returns {JSX.Element} Componente de recuperación de contraseña
 */
const ForgotPassword = () => {
  // ==========================================================================
  // ESTADOS DEL COMPONENTE
  // ==========================================================================
  
  /**
   * @state {string} email - Email ingresado por el usuario
   */
  const [email, setEmail] = useState('');
  
  /**
   * @state {string} message - Mensaje de éxito después de enviar solicitud
   */
  const [message, setMessage] = useState('');
  
  /**
   * @state {string} error - Mensaje de error si falla el envío
   */
  const [error, setError] = useState('');
  
  /**
   * @state {boolean} loading - Estado de carga durante el envío
   */
  const [loading, setLoading] = useState(false);

  // ==========================================================================
  // CONTEXTO DE AUTENTICACIÓN
  // ==========================================================================
  
  /**
   * Contexto de autenticación para función de recuperación
   * @const {Object} authContext - Contexto de autenticación
   * @const {function} forgotPassword - Función para solicitar recuperación
   */
  const { forgotPassword } = useAuth();

  // ==========================================================================
  // MANEJADORES DE EVENTOS
  // ==========================================================================
  
  /**
   * Maneja el envío del formulario de recuperación
   * Valida email, envía solicitud y maneja respuesta
   * 
   * @async
   * @function handleSubmit
   * @param {Object} e - Evento del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Log para debugging
    console.log('🔄 Enviando solicitud de recuperación para:', email);

    // Llamar a la función de recuperación del contexto
    const result = await forgotPassword(email);
    
    // Log para debugging de respuesta
    console.log('📨 Respuesta recibida:', result);
    
    if (result.success) {
      // Mostrar mensaje de éxito (con mensaje del servidor o por defecto)
      setMessage(result.message || 'Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada y la carpeta de spam.');
    } else {
      // Mostrar error (del servidor o por defecto)
      setError(result.error || 'Error al enviar el correo de recuperación. Por favor, intenta nuevamente.');
    }
    setLoading(false);
  };

  // ==========================================================================
  // FUNCIONES AUXILIARES
  // ==========================================================================
  
  /**
   * Llenar automáticamente el campo email con datos de demo
   * Útil para desarrollo y pruebas
   * @function fillDemoEmail
   */
  const fillDemoEmail = () => {
    setEmail('demo@lucesa.com');
  };

  // ==========================================================================
  // RENDERIZADO PRINCIPAL
  // ==========================================================================
  
  return (
    <main className="auth-main">
      <section className="auth-section">
        <div className="container">
          {/* Tarjeta principal de recuperación */}
          <div className="auth-card-compact">
            
            {/* Header con icono y título */}
            <div className="auth-header">
              <div className="auth-icon">🔑</div>
              <h2 className="auth-title">Recuperar Contraseña</h2>
              <p className="auth-subtitle">Te enviaremos un enlace de recuperación a tu email</p>
            </div>

            {/* Mostrar mensaje de error si existe */}
            {error && (
              <div className="auth-error-compact">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Mostrar mensaje de éxito si existe */}
            {message && (
              <div className="auth-success-compact">
                <span className="success-icon">✅</span>
                <div className="success-content">
                  <p className="success-message">{message}</p>
                  <div className="email-sent-info">
                    {/* Confirmación del email al que se envió */}
                    <p><strong>📧 Correo enviado a:</strong> {email}</p>
                    {/* Consejos para encontrar el correo */}
                    <div className="check-email-tips">
                      <p><strong>💡 Si no encuentras el correo:</strong></p>
                      <ul>
                        <li>Revisa tu carpeta de <strong>spam</strong> o <strong>correo no deseado</strong></li>
                        <li>Verifica que el email esté escrito correctamente</li>
                        <li>Espera unos minutos, puede tardar en llegar</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Formulario de recuperación (solo se muestra si no hay mensaje de éxito) */}
            {!message && (
              <form onSubmit={handleSubmit} className="auth-form">
                {/* Campo de email */}
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="tu.email@ejemplo.com"
                    className="auth-input"
                    disabled={loading}
                  />
                </div>

                {/* Botón de envío */}
                <button 
                  type="submit" 
                  className="btn-auth-primary"
                  disabled={loading || !email}
                >
                  {loading ? (
                    <>
                      <div className="btn-spinner"></div>
                      Enviando Enlace...
                    </>
                  ) : (
                    '📧 Enviar Enlace de Recuperación'
                  )}
                </button>
              </form>
            )}

            {/* Información adicional sobre recuperación */}
            <div className="recovery-info">
              <p className="info-text">
                <strong>⚠️ Importante:</strong> El enlace de recuperación expirará en <strong>1 hora</strong> por seguridad.
              </p>
            </div>

            {/* Pie de página con enlace para volver al login */}
            <div className="auth-footer">
              <p>
                <Link to="/login" className="auth-link">
                  ← Volver al inicio de sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;