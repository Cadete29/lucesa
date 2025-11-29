// src/components/auth/ForgotPassword.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    console.log('🔄 Enviando solicitud de recuperación para:', email);

    const result = await forgotPassword(email);
    
    console.log('📨 Respuesta recibida:', result);
    
    if (result.success) {
      setMessage(result.message || 'Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada y la carpeta de spam.');
    } else {
      setError(result.error || 'Error al enviar el correo de recuperación. Por favor, intenta nuevamente.');
    }
    setLoading(false);
  };

  // Llenar email demo automáticamente
  const fillDemoEmail = () => {
    setEmail('demo@lucesa.com');
  };

  return (
    <main className="auth-main">
      <section className="auth-section">
        <div className="container">
          <div className="auth-card-compact">
            <div className="auth-header">
              <div className="auth-icon">🔑</div>
              <h2 className="auth-title">Recuperar Contraseña</h2>
              <p className="auth-subtitle">Te enviaremos un enlace de recuperación a tu email</p>
            </div>

            {error && (
              <div className="auth-error-compact">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="auth-success-compact">
                <span className="success-icon">✅</span>
                <div className="success-content">
                  <p className="success-message">{message}</p>
                  <div className="email-sent-info">
                    <p><strong>📧 Correo enviado a:</strong> {email}</p>
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

            <form onSubmit={handleSubmit} className="auth-form">
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

            <div className="recovery-info">
              <p className="info-text">
                <strong>⚠️ Importante:</strong> El enlace de recuperación expirará en <strong>1 hora</strong> por seguridad.
              </p>
            </div>

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